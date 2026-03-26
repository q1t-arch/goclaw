import { cn } from "@/lib/utils";

type Status = "success" | "warning" | "error" | "info" | "default";

const dotColors: Record<Status, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  info: "bg-info",
  default: "bg-muted-foreground",
};

const bgColors: Record<Status, string> = {
  success: "bg-success/15 text-success dark:text-success",
  warning: "bg-warning/15 text-warning dark:text-warning",
  error: "bg-destructive/15 text-destructive dark:text-destructive",
  info: "bg-info/15 text-info",
  default: "bg-muted text-muted-foreground",
};

interface StatusBadgeProps {
  status: Status;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        bgColors[status],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[status])} />
      {label}
    </span>
  );
}
