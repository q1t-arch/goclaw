import {
  ListTodo,
  MessageCircle,
  Bot,
  Settings,
  Link,
  type LucideIcon,
} from "lucide-react";

export interface EventCategoryConfig {
  label: string;
  icon: LucideIcon;
  borderColor: string;
  iconColor: string;
}

const teamTask: EventCategoryConfig = {
  label: "Task",
  icon: ListTodo,
  borderColor: "border-l-warning",
  iconColor: "text-warning",
};

const teamMessage: EventCategoryConfig = {
  label: "Message",
  icon: MessageCircle,
  borderColor: "border-l-success",
  iconColor: "text-success",
};

const agent: EventCategoryConfig = {
  label: "Agent",
  icon: Bot,
  borderColor: "border-l-warning",
  iconColor: "text-warning",
};

const teamCrud: EventCategoryConfig = {
  label: "Team",
  icon: Settings,
  borderColor: "border-l-muted-foreground",
  iconColor: "text-muted-foreground",
};

const agentLink: EventCategoryConfig = {
  label: "Link",
  icon: Link,
  borderColor: "border-l-info",
  iconColor: "text-info",
};

export function getCategoryConfig(event: string): EventCategoryConfig {
  if (event.startsWith("team.task.")) return teamTask;
  if (event === "team.message.sent") return teamMessage;
  if (event === "agent") return agent;
  if (event.startsWith("agent_link.")) return agentLink;
  if (
    event.startsWith("team.created") ||
    event.startsWith("team.updated") ||
    event.startsWith("team.deleted") ||
    event.startsWith("team.member.")
  ) {
    return teamCrud;
  }
  return teamCrud;
}
