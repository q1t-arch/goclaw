package agent

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/nextlevelbuilder/goclaw/internal/config"
	"github.com/nextlevelbuilder/goclaw/internal/providers"
	"github.com/nextlevelbuilder/goclaw/internal/store"
)

// DefaultMemoryFlushSystemPrompt is the system prompt for structured extraction.
const DefaultMemoryFlushSystemPrompt = "You are extracting facts from a technical conversation for permanent storage. Be exhaustive."

// structuredExtractionPrompt is the user prompt for Go-controlled compact extraction.
const structuredExtractionPrompt = `Extract all important information from this conversation into the following categories.
Be exhaustive — include every specific detail, value, and decision.

DECISIONS: every decision made and its rationale
CONFIGS: every configuration value, path, file name, setting, ID, URL, port mentioned
TASKS: what was completed, what is pending, what is blocked and why
FACTS: specific data points — commands, error messages, values, versions
ERRORS: problems encountered and their solutions
OPEN QUESTIONS: unresolved items, things to check later

Respond with the full structured document. If a category is empty, write "none".`


// MemoryFlushSettings holds resolved flush config with defaults applied.
type MemoryFlushSettings struct {
	Enabled      bool
	SystemPrompt string
}

// ResolveMemoryFlushSettings resolves flush settings from config, applying defaults.
// Returns nil if disabled.
func ResolveMemoryFlushSettings(compaction *config.CompactionConfig) *MemoryFlushSettings {
	if compaction == nil || compaction.MemoryFlush == nil {
		// Default: enabled
		return &MemoryFlushSettings{
			Enabled:      true,
			SystemPrompt: DefaultMemoryFlushSystemPrompt,
		}
	}

	mf := compaction.MemoryFlush
	if mf.Enabled != nil && !*mf.Enabled {
		return nil
	}

	settings := &MemoryFlushSettings{
		Enabled:      true,
		SystemPrompt: DefaultMemoryFlushSystemPrompt,
	}

	if mf.SystemPrompt != "" {
		settings.SystemPrompt = mf.SystemPrompt
	}

	return settings
}

// shouldRunMemoryFlush checks whether a memory flush should run before compaction.
// Flush always runs when compaction triggers (called inside maybeSummarize),
// gated only by enabled/memory checks and a dedup guard per compaction cycle.
func (l *Loop) shouldRunMemoryFlush(sessionKey string, totalTokens int, settings *MemoryFlushSettings) bool {
	if settings == nil || !settings.Enabled || !l.hasMemory {
		return false
	}

	if totalTokens <= 0 {
		return false
	}

	// Deduplication: skip if already flushed in this compaction cycle.
	compactionCount := l.sessions.GetCompactionCount(sessionKey)
	lastFlushAt := l.sessions.GetMemoryFlushCompactionCount(sessionKey)
	if lastFlushAt >= 0 && lastFlushAt == compactionCount {
		return false
	}

	return true
}

// runMemoryFlush performs structured extraction of the conversation into a compact document.
// Instead of asking the agent to decide what to write (tool-call loop), this is fully
// Go-controlled: LLM extracts structured facts → Go writes to memory/compact_N.md via
// the same write_file → interceptor → embedding pipeline. Agent cannot skip the write.
func (l *Loop) runMemoryFlush(ctx context.Context, sessionKey string, settings *MemoryFlushSettings) {
	slog.Info("memory flush: starting structured extraction", "session", sessionKey)

	flushCtx, cancel := context.WithTimeout(ctx, 90*time.Second)
	defer cancel()

	history := l.sessions.GetHistory(sessionKey)
	summary := l.sessions.GetSummary(sessionKey)

	// Build messages for extraction LLM call
	var messages []providers.Message
	messages = append(messages, providers.Message{
		Role:    "system",
		Content: settings.SystemPrompt,
	})

	if summary != "" {
		messages = append(messages, providers.Message{
			Role:    "user",
			Content: "[Previous conversation summary]\n" + summary,
		})
		messages = append(messages, providers.Message{
			Role:    "assistant",
			Content: "Understood.",
		})
	}

	// Include full history for extraction
	sanitized, _ := sanitizeHistory(history)
	messages = append(messages, sanitized...)

	messages = append(messages, providers.Message{
		Role:    "user",
		Content: structuredExtractionPrompt,
	})

	resp, err := l.provider.Chat(flushCtx, providers.ChatRequest{
		Messages: messages,
		Model:    l.model,
		Options: map[string]any{
			"max_tokens":  5000,
			"temperature": 0.2,
		},
	})
	if err != nil {
		slog.Warn("memory flush: extraction LLM call failed", "error", err)
		l.sessions.SetMemoryFlushDone(sessionKey)
		l.sessions.Save(sessionKey)
		return
	}

	extracted := SanitizeAssistantContent(resp.Content)
	if extracted == "" || IsSilentReply(extracted) {
		slog.Info("memory flush: nothing to extract")
		l.sessions.SetMemoryFlushDone(sessionKey)
		l.sessions.Save(sessionKey)
		return
	}

	// Compact number = current count + 1 (IncrementCompaction runs after TruncateHistory)
	compactNum := l.sessions.GetCompactionCount(sessionKey) + 1
	numericID := l.sessions.GetNumericID(sessionKey)
	var path string
	if numericID > 0 {
		path = fmt.Sprintf("memory/sessions/%d/compact_%d.md", numericID, compactNum)
	} else {
		path = fmt.Sprintf("memory/compact_%d.md", compactNum)
	}

	// Enrich context with compact metadata so PutDocument can tag memory_documents
	writeCtx := store.WithCompactSessionKey(flushCtx, sessionKey)
	writeCtx = store.WithCompactNumber(writeCtx, compactNum)

	// Write via the same write_file → memory interceptor → embedding pipeline
	result := l.tools.ExecuteWithContext(writeCtx, "write_file",
		map[string]any{"path": path, "content": extracted},
		"", "", "", sessionKey, nil,
	)

	if result != nil && result.IsError {
		slog.Warn("memory flush: write_file failed", "path", path, "error", result.ForLLM)
	} else {
		slog.Info("memory flush: compact written", "session", sessionKey, "compact", compactNum, "path", path, "chars", len(extracted))
	}

	l.sessions.SetMemoryFlushDone(sessionKey)
	l.sessions.Save(sessionKey)
}
