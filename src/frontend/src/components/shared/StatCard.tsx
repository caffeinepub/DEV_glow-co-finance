import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
  subtext?: string;
  className?: string;
  "data-ocid"?: string;
}

export function StatCard({
  label,
  value,
  trend,
  trendPositive,
  subtext,
  className,
  "data-ocid": dataOcid,
}: StatCardProps) {
  return (
    <div
      data-ocid={dataOcid}
      className={cn(
        "card-elevated rounded-lg p-5 flex flex-col gap-2 transition-smooth hover:shadow-elevated",
        className,
      )}
    >
      <p className="text-label text-muted-foreground">{label}</p>
      <p className="text-kpi-lg leading-none truncate">{value}</p>
      {(trend !== undefined || subtext) && (
        <div className="flex items-center gap-2 mt-1">
          {trend !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold",
                trendPositive
                  ? "text-[oklch(var(--success))]"
                  : "text-destructive",
              )}
            >
              {trendPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend}
            </span>
          )}
          {subtext && (
            <span className="text-xs text-muted-foreground">{subtext}</span>
          )}
        </div>
      )}
    </div>
  );
}
