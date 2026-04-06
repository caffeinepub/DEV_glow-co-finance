import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Minus,
  Printer,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCallback, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useAgedPayables,
  useAgedReceivables,
  useCashFlow,
  useMonthlySummary,
} from "../hooks/useBackend";
import { MONTH_NAMES, formatGBP } from "../lib/format";
import type { AgedBucket, MonthlyCashFlow, MonthlySummary } from "../types";

// ─── Helpers ────────────────────────────────────────────────────────────────

const BUCKET_COLORS: Record<string, string> = {
  "0-30 days": "text-foreground",
  "31-60 days": "text-warning",
  "61-90 days": "text-destructive",
  "90+ days": "text-destructive",
};

const BUCKET_BADGE: Record<string, string> = {
  "0-30 days": "badge-success",
  "31-60 days": "badge-warning",
  "61-90 days": "badge-destructive",
  "90+ days": "badge-destructive",
};

function getBucketColor(title: string) {
  return BUCKET_COLORS[title] ?? "text-foreground";
}
function getBucketBadge(title: string) {
  return BUCKET_BADGE[title] ?? "";
}

function handlePrint() {
  window.print();
}

// ─── Aged Report Tab ─────────────────────────────────────────────────────────

interface AgedReportTabProps {
  title: string;
  subtitle: string;
  entityLabel: string;
  buckets: AgedBucket[] | undefined;
  grandTotal: number | undefined;
  isLoading: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

function AgedReportTab({
  title,
  subtitle,
  entityLabel,
  buckets,
  grandTotal,
  isLoading,
  isError,
  error,
  onRetry,
}: AgedReportTabProps) {
  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center mt-6"
        data-ocid={`aged-error-${title.toLowerCase().replace(/\s/g, "-")}`}
      >
        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
          <RefreshCw className="w-4 h-4 text-destructive" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">
          Unable to load {title.toLowerCase()}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "Something went wrong."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-xs"
            data-ocid={`aged-retry-${title.toLowerCase().replace(/\s/g, "-")}`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div
      className="space-y-6 mt-6 print:mt-0"
      data-ocid={`aged-${title.toLowerCase().replace(/\s/g, "-")}-content`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-section-heading text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="gap-2 print:hidden"
          data-ocid="btn-print-aged"
        >
          <Printer className="h-4 w-4" />
          Print / Export PDF
        </Button>
      </div>

      {/* Bucket cards */}
      {buckets && buckets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {buckets.map((bucket) => (
            <Card key={bucket.title} className="bg-card border border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-label ${getBucketColor(bucket.title)}`}
                  >
                    {bucket.title}
                  </span>
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 ${getBucketBadge(bucket.title)}`}
                  >
                    {Number(bucket.count)}{" "}
                    {Number(bucket.count) === 1
                      ? entityLabel
                      : `${entityLabel}s`}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-2xl font-bold font-display ${getBucketColor(bucket.title)}`}
                >
                  {formatGBP(bucket.total)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Detailed table */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-semibold text-foreground">
            Breakdown by Age Bucket
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left py-3 px-4 text-label text-muted-foreground">
                    Bucket
                  </th>
                  <th className="text-right py-3 px-4 text-label text-muted-foreground">
                    Count
                  </th>
                  <th className="text-right py-3 px-4 text-label text-muted-foreground">
                    Total
                  </th>
                  <th className="text-right py-3 px-4 text-label text-muted-foreground">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {buckets?.map((bucket, idx) => {
                  const pct =
                    grandTotal && grandTotal > 0
                      ? ((bucket.total / grandTotal) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <tr
                      key={bucket.title}
                      className={`border-b border-border/50 transition-colors hover:bg-muted/20 ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`font-medium ${getBucketColor(bucket.title)}`}
                        >
                          {bucket.title}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground tabular-nums">
                        {Number(bucket.count)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-semibold tabular-nums ${getBucketColor(bucket.title)}`}
                      >
                        {formatGBP(bucket.total)}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground tabular-nums">
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/30">
                  <td
                    className="py-3 px-4 font-bold text-foreground"
                    colSpan={2}
                  >
                    Grand Total
                  </td>
                  <td
                    className="py-3 px-4 text-right font-bold text-foreground tabular-nums"
                    colSpan={2}
                  >
                    {formatGBP(grandTotal ?? 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Cash Flow Tab ────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - i);

interface CashFlowTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CashFlowTooltip({ active, payload, label }: CashFlowTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono tabular-nums">{formatGBP(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function CashFlowTab() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const {
    data: cashFlowData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCashFlow(BigInt(selectedYear));

  const chartData =
    cashFlowData?.map((row: MonthlyCashFlow) => ({
      month: MONTH_NAMES[Number(row.month) - 1] ?? String(row.month),
      "Cash In": row.inflow,
      "Cash Out": row.outflow,
      "Running Balance": row.runningBalance,
    })) ?? [];

  const totalIn = cashFlowData?.reduce((s, r) => s + r.inflow, 0) ?? 0;
  const totalOut = cashFlowData?.reduce((s, r) => s + r.outflow, 0) ?? 0;
  const netFlow = totalIn - totalOut;

  return (
    <div className="space-y-6 mt-6 print:mt-0" data-ocid="cash-flow-content">
      {isError && (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="cashflow-error-state"
        >
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <RefreshCw className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            Unable to load cash flow
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Something went wrong."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-xs"
            data-ocid="cashflow-retry-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}
      {!isError && (
        <>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-section-heading text-foreground">
                Cash Flow
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Monthly inflows, outflows and running balance
              </p>
            </div>
            <div className="flex items-center gap-3 print:hidden">
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger
                  className="w-28"
                  data-ocid="select-cash-flow-year"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2"
                data-ocid="btn-print-cashflow"
              >
                <Printer className="h-4 w-4" />
                Print / Export PDF
              </Button>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Cash In", value: totalIn, color: "text-success" },
              {
                label: "Total Cash Out",
                value: totalOut,
                color: "text-destructive",
              },
              {
                label: "Net Flow",
                value: netFlow,
                color: netFlow >= 0 ? "text-success" : "text-destructive",
              },
            ].map((kpi) => (
              <Card key={kpi.label} className="bg-card border border-border">
                <CardContent className="pt-4 pb-4">
                  <p className="text-label text-muted-foreground">
                    {kpi.label}
                  </p>
                  <p
                    className={`text-xl font-bold font-display tabular-nums mt-1 ${kpi.color}`}
                  >
                    {formatGBP(kpi.value)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          <Card className="bg-card border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                {selectedYear} — Monthly Cash Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#8C8C8C", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="bars"
                      tick={{ fill: "#8C8C8C", fontSize: 11 }}
                      tickFormatter={(v: number) =>
                        `£${(v / 1000).toFixed(0)}k`
                      }
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="line"
                      orientation="right"
                      tick={{ fill: "#8C8C8C", fontSize: 11 }}
                      tickFormatter={(v: number) =>
                        `£${(v / 1000).toFixed(0)}k`
                      }
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CashFlowTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#8C8C8C" }} />
                    <Bar
                      yAxisId="bars"
                      dataKey="Cash In"
                      fill="#13B5EA"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="bars"
                      dataKey="Cash Out"
                      fill="#8C8C8C"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="line"
                      type="monotone"
                      dataKey="Running Balance"
                      stroke="#3DCD7B"
                      strokeWidth={2}
                      dot={{ fill: "#3DCD7B", r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="bg-card border border-border">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold text-foreground">
                Monthly Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left py-3 px-4 text-label text-muted-foreground">
                        Month
                      </th>
                      <th className="text-right py-3 px-4 text-label text-muted-foreground">
                        Cash In
                      </th>
                      <th className="text-right py-3 px-4 text-label text-muted-foreground">
                        Cash Out
                      </th>
                      <th className="text-right py-3 px-4 text-label text-muted-foreground">
                        Net Flow
                      </th>
                      <th className="text-right py-3 px-4 text-label text-muted-foreground">
                        Running Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading
                      ? ["s1", "s2", "s3", "s4", "s5", "s6"].map((sk) => (
                          <tr key={sk} className="border-b border-border/50">
                            {["c1", "c2", "c3", "c4", "c5"].map((ck) => (
                              <td key={ck} className="py-3 px-4">
                                <Skeleton className="h-4 w-full" />
                              </td>
                            ))}
                          </tr>
                        ))
                      : cashFlowData?.map(
                          (row: MonthlyCashFlow, idx: number) => {
                            const net = row.netFlow;
                            return (
                              <tr
                                key={`${row.year}-${row.month}`}
                                className={`border-b border-border/50 transition-colors hover:bg-muted/20 ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                              >
                                <td className="py-3 px-4 font-medium text-foreground">
                                  {MONTH_NAMES[Number(row.month) - 1]}{" "}
                                  {String(row.year)}
                                </td>
                                <td className="py-3 px-4 text-right text-success tabular-nums font-mono">
                                  {formatGBP(row.inflow)}
                                </td>
                                <td className="py-3 px-4 text-right text-destructive tabular-nums font-mono">
                                  {formatGBP(row.outflow)}
                                </td>
                                <td
                                  className={`py-3 px-4 text-right tabular-nums font-mono font-semibold ${net >= 0 ? "text-success" : "text-destructive"}`}
                                >
                                  {net >= 0 ? "+" : ""}
                                  {formatGBP(net)}
                                </td>
                                <td className="py-3 px-4 text-right text-foreground tabular-nums font-mono">
                                  {formatGBP(row.runningBalance)}
                                </td>
                              </tr>
                            );
                          },
                        )}
                  </tbody>
                </table>
                {!isLoading && (!cashFlowData || cashFlowData.length === 0) && (
                  <div className="py-12 text-center text-muted-foreground">
                    No cash flow data for {selectedYear}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Monthly Summary Tab ──────────────────────────────────────────────────────

const MONTH_OPTIONS = MONTH_NAMES.map((name, i) => ({
  label: name,
  value: i + 1,
}));

function ProfitIndicator({ value }: { value: number }) {
  if (value > 0)
    return <TrendingUp className="h-4 w-4 text-success inline mr-1" />;
  if (value < 0)
    return <TrendingDown className="h-4 w-4 text-destructive inline mr-1" />;
  return <Minus className="h-4 w-4 text-muted-foreground inline mr-1" />;
}

function MonthlySummaryTab() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
  } = useMonthlySummary(BigInt(selectedMonth), BigInt(selectedYear));

  const grossProfit = summary ? summary.revenue - summary.revenue * 0.35 : 0;
  const cogs = summary ? summary.revenue - grossProfit : 0;

  return (
    <div
      className="space-y-6 mt-6 print:mt-0"
      data-ocid="monthly-summary-content"
    >
      {isError && (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="summary-error-state"
        >
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <RefreshCw className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            Unable to load monthly summary
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Something went wrong."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-xs"
            data-ocid="summary-retry-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}
      {!isError && (
        <>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-section-heading text-foreground">
                Monthly Summary
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Revenue, profit and top performers
              </p>
            </div>
            <div className="flex items-center gap-3 print:hidden">
              <Select
                value={String(selectedMonth)}
                onValueChange={(v) => setSelectedMonth(Number(v))}
              >
                <SelectTrigger
                  className="w-24"
                  data-ocid="select-summary-month"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-24" data-ocid="select-summary-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2"
                data-ocid="btn-print-summary"
              >
                <Printer className="h-4 w-4" />
                Print / Export PDF
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : !summary ? (
            <Card className="bg-card border border-border">
              <CardContent className="py-16 text-center text-muted-foreground">
                No summary data available for {MONTH_NAMES[selectedMonth - 1]}{" "}
                {selectedYear}
              </CardContent>
            </Card>
          ) : (
            <SummaryContent
              summary={summary}
              cogs={cogs}
              grossProfit={grossProfit}
            />
          )}
        </>
      )}
    </div>
  );
}

interface SummaryContentProps {
  summary: MonthlySummary;
  cogs: number;
  grossProfit: number;
}

function SummaryContent({ summary, cogs, grossProfit }: SummaryContentProps) {
  const plRows = [
    { label: "Revenue", value: summary.revenue, highlight: false },
    { label: "Cost of Goods Sold (est.)", value: -cogs, highlight: false },
    { label: "Gross Profit", value: grossProfit, highlight: true },
    { label: "Total Expenses", value: -summary.expenses, highlight: false },
    {
      label: "Net Profit",
      value: summary.profit,
      highlight: true,
      large: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* P&L Statement */}
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-semibold text-foreground">
            Profit & Loss
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <tbody>
              {plRows.map((row) => (
                <tr
                  key={row.label}
                  className={`border-b border-border/50 ${row.highlight ? "bg-muted/20" : ""}`}
                >
                  <td
                    className={`py-3 px-4 ${row.large ? "font-bold text-foreground" : row.highlight ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    {row.label}
                  </td>
                  <td
                    className={`py-3 px-4 text-right tabular-nums font-mono ${row.large ? "font-bold text-lg" : "font-medium"} ${row.value >= 0 ? "text-success" : "text-destructive"}`}
                  >
                    <ProfitIndicator value={row.value} />
                    {formatGBP(Math.abs(row.value))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Top Customers */}
        <Card className="bg-card border border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold text-foreground">
              Top Customers by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {summary.topCustomers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No customer data
              </p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {summary.topCustomers
                    .slice(0, 3)
                    .map(([name, amount], rank) => (
                      <tr
                        key={name}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-3 px-4 flex items-center gap-3">
                          <span className="h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {rank + 1}
                          </span>
                          <span className="text-foreground font-medium truncate min-w-0">
                            {name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-success font-mono tabular-nums font-semibold">
                          {formatGBP(amount)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Top Expense Categories */}
        <Card className="bg-card border border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold text-foreground">
              Top Expense Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {summary.topExpenseCategories.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No expense data
              </p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {summary.topExpenseCategories
                    .slice(0, 3)
                    .map(([cat, amount], i) => {
                      const pct =
                        summary.expenses > 0
                          ? (amount / summary.expenses) * 100
                          : 0;
                      return (
                        <tr
                          key={cat}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <span className="h-6 w-6 rounded-full bg-destructive/20 text-destructive text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {i + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-foreground font-medium truncate">
                                  {cat}
                                </p>
                                <div className="mt-1 h-1.5 bg-muted rounded-full w-full max-w-[120px]">
                                  <div
                                    className="h-full bg-destructive/60 rounded-full"
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-destructive font-mono tabular-nums font-semibold">
                            {formatGBP(amount)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Reports Page ────────────────────────────────────────────────────────

export function Reports() {
  const {
    data: receivables,
    isLoading: loadingReceivables,
    isError: receivablesError,
    error: receivablesErr,
    refetch: refetchReceivables,
  } = useAgedReceivables();
  const {
    data: payables,
    isLoading: loadingPayables,
    isError: payablesError,
    error: payablesErr,
    refetch: refetchPayables,
  } = useAgedPayables();

  const [activeTab, setActiveTab] = useState("receivables");
  const handleTabChange = useCallback((v: string) => setActiveTab(v), []);

  return (
    <div className="p-6 space-y-2 max-w-screen-xl" data-ocid="reports-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-section-heading text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Aged receivables, payables, cash flow and monthly summaries
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-2">
        <TabsList
          className="bg-muted/40 border border-border h-auto p-1 gap-1 flex-wrap print:hidden"
          data-ocid="reports-tabs"
        >
          <TabsTrigger
            value="receivables"
            className="text-sm"
            data-ocid="tab-aged-receivables"
          >
            Aged Receivables
          </TabsTrigger>
          <TabsTrigger
            value="payables"
            className="text-sm"
            data-ocid="tab-aged-payables"
          >
            Aged Payables
          </TabsTrigger>
          <TabsTrigger
            value="cashflow"
            className="text-sm"
            data-ocid="tab-cash-flow"
          >
            Cash Flow
          </TabsTrigger>
          <TabsTrigger
            value="summary"
            className="text-sm"
            data-ocid="tab-monthly-summary"
          >
            Monthly Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receivables" className="mt-0">
          <AgedReportTab
            title="Aged Receivables"
            subtitle="Unpaid and overdue invoices grouped by age"
            entityLabel="invoice"
            buckets={receivables?.buckets}
            grandTotal={receivables?.grandTotal}
            isLoading={loadingReceivables}
            isError={receivablesError}
            error={receivablesErr instanceof Error ? receivablesErr : null}
            onRetry={() => refetchReceivables()}
          />
        </TabsContent>

        <TabsContent value="payables" className="mt-0">
          <AgedReportTab
            title="Aged Payables"
            subtitle="Unpaid and overdue bills grouped by age"
            entityLabel="bill"
            buckets={payables?.buckets}
            grandTotal={payables?.grandTotal}
            isLoading={loadingPayables}
            isError={payablesError}
            error={payablesErr instanceof Error ? payablesErr : null}
            onRetry={() => refetchPayables()}
          />
        </TabsContent>

        <TabsContent value="cashflow" className="mt-0">
          <CashFlowTab />
        </TabsContent>

        <TabsContent value="summary" className="mt-0">
          <MonthlySummaryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
