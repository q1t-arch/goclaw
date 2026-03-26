import { Eye, MessageSquareText, Brain } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FeatureSwitchGroup } from "@/components/shared/feature-switch-group";
import type { FeatureSwitchItem } from "@/components/shared/feature-switch-group";

interface UxValues {
  tool_status: boolean;
  block_reply: boolean;
  intent_classify: boolean;
}

interface Props {
  value: UxValues;
  onChange: (v: UxValues) => void;
}

/** High-impact UX toggles with icon, hint, and contextual info. */
export function BehaviorUxCard({ value, onChange }: Props) {
  const { t } = useTranslation("config");

  const items: FeatureSwitchItem[] = [
    {
      icon: Eye,
      iconClass: "text-info",
      label: t("gateway.toolStatus"),
      hint: t("behavior.toolStatusHint"),
      checked: value.tool_status !== false,
      onCheckedChange: (v) => onChange({ ...value, tool_status: v }),
      infoWhenOn: t("behavior.toolStatusInfo"),
      infoClass: "border-info/25 bg-info/10 text-info",
    },
    {
      icon: MessageSquareText,
      iconClass: "text-success",
      label: t("gateway.blockReply"),
      hint: t("behavior.blockReplyHint"),
      checked: value.block_reply ?? false,
      onCheckedChange: (v) => onChange({ ...value, block_reply: v }),
      infoWhenOn: t("behavior.blockReplyInfo"),
      infoClass: "border-success/25 bg-success/10 text-success",
    },
    {
      icon: Brain,
      iconClass: "text-warning",
      label: t("agents.intentClassify"),
      hint: t("behavior.intentClassifyHint"),
      checked: value.intent_classify !== false,
      onCheckedChange: (v) => onChange({ ...value, intent_classify: v }),
      infoWhenOn: t("behavior.intentClassifyInfo"),
      infoClass: "border-warning/30 bg-warning/5 text-warning",
    },
  ];

  return (
    <FeatureSwitchGroup
      title={t("behavior.uxTitle")}
      description={t("behavior.uxDescription")}
      items={items}
      highlight
    />
  );
}
