import { cn } from "@/lib/utils";

type StatusValue = string;

interface StatusBadgeProps {
  status: StatusValue;
  className?: string;
}

function getStatusStyle(status: string): string {
  switch (status) {
    case "Draft":
      return "bg-muted/60 text-muted-foreground border border-border";
    case "Sent":
      return "bg-[oklch(0.7_0.17_195/0.15)] text-[oklch(0.7_0.17_195)] border border-[oklch(0.7_0.17_195/0.3)]";
    case "Paid":
      return "badge-success";
    case "Overdue":
      return "badge-destructive";
    case "Unpaid":
      return "badge-warning";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold tracking-wide",
        getStatusStyle(status),
        className,
      )}
    >
      {status}
    </span>
  );
}
