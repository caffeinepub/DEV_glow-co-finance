/** GBP currency formatter */
export const formatGBP = (value: number, compact = false): string => {
  if (compact && Math.abs(value) >= 1000) {
    const formatter = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      notation: "compact",
      maximumFractionDigits: 1,
    });
    return formatter.format(value);
  }
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/** Format a nanosecond timestamp (bigint) to a readable date string */
export const formatDate = (timestamp: bigint | number | undefined): string => {
  if (timestamp === undefined || timestamp === null) return "—";
  const ms =
    typeof timestamp === "bigint"
      ? Number(timestamp) / 1_000_000
      : Number(timestamp);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(ms));
};

/** Format timestamp as short date dd/mm/yyyy */
export const formatDateShort = (
  timestamp: bigint | number | undefined,
): string => {
  if (timestamp === undefined || timestamp === null) return "—";
  const ms =
    typeof timestamp === "bigint"
      ? Number(timestamp) / 1_000_000
      : Number(timestamp);
  return new Intl.DateTimeFormat("en-GB").format(new Date(ms));
};

/** Convert a JS Date to nanosecond bigint timestamp */
export const dateToTimestamp = (date: Date): bigint => {
  return BigInt(date.getTime()) * 1_000_000n;
};

/** Convert nanosecond bigint to JS Date */
export const timestampToDate = (ts: bigint): Date => {
  return new Date(Number(ts) / 1_000_000);
};

/** Format a percentage with sign */
export const formatPercent = (value: number, showSign = false): string => {
  const sign = showSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

/** Format change percentage for trend display */
export const formatTrend = (
  current: number,
  previous: number,
): { value: string; positive: boolean } => {
  if (previous === 0) return { value: "N/A", positive: true };
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const positive = pct >= 0;
  return {
    value: `${positive ? "+" : ""}${pct.toFixed(1)}%`,
    positive,
  };
};

/** Month names */
export const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const getMonthLabel = (month: bigint | number): string => {
  const m = typeof month === "bigint" ? Number(month) : month;
  return MONTH_NAMES[m - 1] ?? String(m);
};

/** VAT rate as percentage number */
export const vatRateToNumber = (rate: string): number => {
  if (rate === "Twenty") return 20;
  if (rate === "Five") return 5;
  return 0;
};

/** Bill category display labels */
export const BILL_CATEGORY_LABELS: Record<string, string> = {
  Ingredients: "Ingredients",
  Packaging: "Packaging",
  Shipping: "Shipping",
  Marketing: "Marketing",
  Rent: "Rent",
  Software: "Software",
  ProfessionalServices: "Professional Services",
  Other: "Other",
};
