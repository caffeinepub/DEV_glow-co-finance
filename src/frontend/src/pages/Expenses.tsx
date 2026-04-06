import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  ChevronUp,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBills, useExpenseSummary } from "../hooks/useBackend";
import {
  BILL_CATEGORY_LABELS,
  MONTH_NAMES,
  dateToTimestamp,
  formatDate,
  formatGBP,
} from "../lib/format";
import { BillCategory, BillStatus } from "../types";
import type { BillShared } from "../types";

// ─── Chart colors per category ───────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Ingredients: "oklch(0.6 0.16 150)",
  Packaging: "oklch(0.72 0.15 85)",
  Shipping: "oklch(0.7 0.17 195)",
  Marketing: "oklch(0.75 0.15 40)",
  Rent: "oklch(0.55 0.22 25)",
  Software: "oklch(0.65 0.18 280)",
  ProfessionalServices: "oklch(0.7 0.14 320)",
  Other: "oklch(0.5 0.01 260)",
};

// ─── Date range presets ───────────────────────────────────────────────────────
type DatePreset = "30d" | "90d" | "6m" | "1y" | "custom";

function getPresetRange(preset: Exclude<DatePreset, "custom">): {
  start: Date;
  end: Date;
} {
  const end = new Date();
  const start = new Date();
  if (preset === "30d") start.setDate(end.getDate() - 30);
  else if (preset === "90d") start.setDate(end.getDate() - 90);
  else if (preset === "6m") start.setMonth(end.getMonth() - 6);
  else if (preset === "1y") start.setFullYear(end.getFullYear() - 1);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ─── Donut tooltip ────────────────────────────────────────────────────────────
function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { pct: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-foreground">{d.name}</p>
      <p className="text-muted-foreground">
        {formatGBP(d.value)} · {d.payload.pct.toFixed(1)}%
      </p>
    </div>
  );
}

// ─── Bar tooltip ─────────────────────────────────────────────────────────────
function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-sm shadow-lg min-w-[160px]">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <div
          key={p.name}
          className="flex items-center gap-2 text-muted-foreground"
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: p.fill }}
          />
          <span className="flex-1 truncate">
            {BILL_CATEGORY_LABELS[p.name] ?? p.name}
          </span>
          <span className="font-mono text-foreground">
            {formatGBP(p.value, true)}
          </span>
        </div>
      ))}
      <div className="mt-1 pt-1 border-t border-border flex justify-between font-semibold text-foreground">
        <span>Total</span>
        <span className="font-mono">{formatGBP(total, true)}</span>
      </div>
    </div>
  );
}

// ─── Sort types ───────────────────────────────────────────────────────────────
type SortField = "date" | "supplier" | "category" | "amount" | "status";
type SortDir = "asc" | "desc";

// ─── Main component ───────────────────────────────────────────────────────────
export function Expenses() {
  const [preset, setPreset] = useState<DatePreset>("30d");
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(
    () => new Date().toISOString().split("T")[0],
  );
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const dateRange = useMemo(() => {
    if (preset === "custom") {
      return {
        start: new Date(`${customStart}T00:00:00`),
        end: new Date(`${customEnd}T23:59:59`),
      };
    }
    return getPresetRange(preset);
  }, [preset, customStart, customEnd]);

  const startTs = dateToTimestamp(dateRange.start);
  const endTs = dateToTimestamp(dateRange.end);

  const { data: summary, isLoading: summaryLoading } = useExpenseSummary(
    startTs,
    endTs,
  );
  const { data: bills, isLoading: billsLoading } = useBills();

  // Compute 12-month trend data from bills
  const trendData = useMemo(() => {
    if (!bills) return [];
    const now = new Date();
    const months: { month: string; [cat: string]: number | string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: MONTH_NAMES[d.getMonth()] });
    }
    for (const bill of bills) {
      const ms = Number(bill.date) / 1_000_000;
      const d = new Date(ms);
      const idx = months.findIndex((m) => {
        const target = new Date(
          now.getFullYear(),
          now.getMonth() - (11 - months.indexOf(m)),
          1,
        );
        return (
          d.getFullYear() === target.getFullYear() &&
          d.getMonth() === target.getMonth()
        );
      });
      if (idx >= 0) {
        const cat = bill.category as string;
        months[idx][cat] = ((months[idx][cat] as number) ?? 0) + bill.amount;
      }
    }
    return months;
  }, [bills]);

  const categories = Object.values(BillCategory);

  // Filter bills for list
  const filteredBills = useMemo<BillShared[]>(() => {
    if (!bills) return [];
    return bills
      .filter((b) => {
        const ms = Number(b.date) / 1_000_000;
        const inRange =
          ms >= dateRange.start.getTime() && ms <= dateRange.end.getTime();
        const catMatch =
          categoryFilter === "all" || b.category === categoryFilter;
        const statusMatch = statusFilter === "all" || b.status === statusFilter;
        return inRange && catMatch && statusMatch;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === "date") cmp = Number(a.date) - Number(b.date);
        else if (sortField === "supplier")
          cmp = a.supplierName.localeCompare(b.supplierName);
        else if (sortField === "category")
          cmp = a.category.localeCompare(b.category);
        else if (sortField === "amount") cmp = a.amount - b.amount;
        else if (sortField === "status") cmp = a.status.localeCompare(b.status);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [bills, dateRange, categoryFilter, statusFilter, sortField, sortDir]);

  // Summary stats
  const totalExpenses = summary?.total ?? 0;
  const topCategory = summary?.categories.reduce<{
    label: string;
    amount: number;
  }>(
    (max, c) =>
      c.amount > max.amount
        ? {
            label: BILL_CATEGORY_LABELS[c.category] ?? c.category,
            amount: c.amount,
          }
        : max,
    { label: "—", amount: 0 },
  ) ?? { label: "—", amount: 0 };
  const biggestIncrease =
    summary?.categories
      .filter((c) => c.prevAmount > 0)
      .reduce<{ label: string; pct: number } | null>((max, c) => {
        const pct = ((c.amount - c.prevAmount) / c.prevAmount) * 100;
        if (!max || pct > max.pct)
          return { label: BILL_CATEGORY_LABELS[c.category] ?? c.category, pct };
        return max;
      }, null) ?? null;

  // Donut data
  const donutData = useMemo(() => {
    if (!summary) return [];
    const total = summary.total || 1;
    return summary.categories
      .filter((c) => c.amount > 0)
      .map((c) => ({
        name: BILL_CATEGORY_LABELS[c.category] ?? c.category,
        value: c.amount,
        pct: (c.amount / total) * 100,
        color: CATEGORY_COLORS[c.category] ?? CATEGORY_COLORS.Other,
      }));
  }, [summary]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 text-primary" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-primary" />
    );
  }

  const PRESETS: { label: string; value: DatePreset }[] = [
    { label: "30 days", value: "30d" },
    { label: "90 days", value: "90d" },
    { label: "6 months", value: "6m" },
    { label: "1 year", value: "1y" },
    { label: "Custom", value: "custom" },
  ];

  return (
    <div className="p-6 space-y-6" data-ocid="expenses-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-section-heading text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Breakdown of spending by category and trend
          </p>
        </div>
        {/* Date range controls */}
        <div
          className="flex flex-wrap items-center gap-2"
          data-ocid="expenses-date-filter"
        >
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-smooth border ${
                preset === p.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
              }`}
            >
              {p.label}
            </button>
          ))}
          {preset === "custom" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-card border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                data-ocid="expenses-custom-start"
              />
              <span className="text-muted-foreground text-sm">—</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-card border border-border rounded-md px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                data-ocid="expenses-custom-end"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryLoading ? (
          ["kpi-total", "kpi-top", "kpi-increase"].map((id) => (
            <Skeleton key={id} className="h-24 rounded-xl" />
          ))
        ) : (
          <>
            <div
              className="card-elevated rounded-xl p-5 flex items-start gap-4"
              data-ocid="expenses-total"
            >
              <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive flex-shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-label text-muted-foreground">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold font-display text-foreground mt-0.5">
                  {formatGBP(totalExpenses)}
                </p>
              </div>
            </div>
            <div
              className="card-elevated rounded-xl p-5 flex items-start gap-4"
              data-ocid="expenses-top-category"
            >
              <div className="p-2.5 rounded-lg bg-warning/10 text-warning flex-shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-label text-muted-foreground">Top Category</p>
                <p className="text-2xl font-bold font-display text-foreground mt-0.5 truncate">
                  {topCategory.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatGBP(topCategory.amount)}
                </p>
              </div>
            </div>
            <div
              className="card-elevated rounded-xl p-5 flex items-start gap-4"
              data-ocid="expenses-biggest-increase"
            >
              <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-label text-muted-foreground">
                  Biggest MoM Rise
                </p>
                {biggestIncrease ? (
                  <>
                    <p className="text-2xl font-bold font-display text-foreground mt-0.5 truncate">
                      {biggestIncrease.label}
                    </p>
                    <p className="text-xs text-destructive font-semibold">
                      +{biggestIncrease.pct.toFixed(1)}% vs prev period
                    </p>
                  </>
                ) : (
                  <p className="text-2xl font-bold font-display text-muted-foreground mt-0.5">
                    —
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Donut chart */}
        <div
          className="lg:col-span-2 card-elevated rounded-xl p-5"
          data-ocid="expenses-donut"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Expenses by Category
          </h2>
          {summaryLoading ? (
            <Skeleton className="h-56 rounded-lg" />
          ) : donutData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
              No expense data for this period
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: d.color }}
                    />
                    <span className="flex-1 text-muted-foreground truncate">
                      {d.name}
                    </span>
                    <span className="font-mono text-foreground">
                      {formatGBP(d.value, true)}
                    </span>
                    <span className="text-muted-foreground w-10 text-right">
                      {d.pct.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stacked bar chart — 12-month trend */}
        <div
          className="lg:col-span-3 card-elevated rounded-xl p-5"
          data-ocid="expenses-trend"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Monthly Expense Trend (12 months)
          </h2>
          {billsLoading ? (
            <Skeleton className="h-64 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={trendData}
                barSize={12}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.28 0.02 260)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "oklch(0.55 0.01 260)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "oklch(0.55 0.01 260)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => formatGBP(v, true)}
                  width={56}
                />
                <Tooltip
                  content={<BarTooltip />}
                  cursor={{ fill: "oklch(0.22 0.02 260 / 0.6)" }}
                />
                <Legend
                  formatter={(value: string) => (
                    <span
                      style={{ fontSize: 11, color: "oklch(0.55 0.01 260)" }}
                    >
                      {BILL_CATEGORY_LABELS[value] ?? value}
                    </span>
                  )}
                />
                {categories.map((cat) => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    stackId="a"
                    fill={CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category breakdown table */}
      <div
        className="card-elevated rounded-xl overflow-hidden"
        data-ocid="expenses-category-table"
      >
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            Category Breakdown
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            This period vs previous period · flagged if &gt;20% increase
          </p>
        </div>
        {summaryLoading ? (
          <div className="p-5 space-y-2">
            {["c1", "c2", "c3", "c4", "c5", "c6"].map((id) => (
              <Skeleton key={id} className="h-10 rounded" />
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 text-left">
                <th className="px-5 py-3 text-label text-muted-foreground">
                  Category
                </th>
                <th className="px-5 py-3 text-label text-muted-foreground text-right">
                  This Period
                </th>
                <th className="px-5 py-3 text-label text-muted-foreground text-right hidden sm:table-cell">
                  Prev Period
                </th>
                <th className="px-5 py-3 text-label text-muted-foreground text-right">
                  Change
                </th>
                <th className="px-5 py-3 text-label text-muted-foreground text-center w-12">
                  Flag
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(summary?.categories ?? [])
                .filter((c) => c.amount > 0 || c.prevAmount > 0)
                .map((cat) => {
                  const label =
                    BILL_CATEGORY_LABELS[cat.category] ?? cat.category;
                  const changePct =
                    cat.prevAmount > 0
                      ? ((cat.amount - cat.prevAmount) / cat.prevAmount) * 100
                      : null;
                  const isIncrease = changePct !== null && changePct > 0;
                  return (
                    <tr
                      key={cat.category}
                      className="hover:bg-muted/20 transition-smooth"
                    >
                      <td className="px-5 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              background:
                                CATEGORY_COLORS[cat.category] ??
                                CATEGORY_COLORS.Other,
                            }}
                          />
                          {label}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-foreground">
                        {formatGBP(cat.amount)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-muted-foreground hidden sm:table-cell">
                        {formatGBP(cat.prevAmount)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {changePct !== null ? (
                          <span
                            className={`flex items-center justify-end gap-1 font-semibold text-sm ${isIncrease ? "text-destructive" : "text-success"}`}
                          >
                            {isIncrease ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                            {isIncrease ? "+" : ""}
                            {changePct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {cat.flagged && (
                          <AlertTriangle
                            className="w-4 h-4 text-destructive mx-auto"
                            aria-label="Over 20% increase"
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              {(summary?.categories ?? []).filter(
                (c) => c.amount > 0 || c.prevAmount > 0,
              ).length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-muted-foreground text-sm"
                  >
                    No expense categories for this period
                  </td>
                </tr>
              )}
            </tbody>
            {summary && summary.total > 0 && (
              <tfoot>
                <tr className="bg-muted/30 border-t border-border font-semibold">
                  <td className="px-5 py-3 text-foreground">Total</td>
                  <td className="px-5 py-3 text-right font-mono text-foreground">
                    {formatGBP(summary.total)}
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell" />
                  <td className="px-5 py-3" />
                  <td className="px-5 py-3" />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {/* Expense list */}
      <div
        className="card-elevated rounded-xl overflow-hidden"
        data-ocid="expenses-list"
      >
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Individual Bills
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filteredBills.length} bill{filteredBills.length !== 1 ? "s" : ""}{" "}
              in selected range
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              data-ocid="expenses-category-filter"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {BILL_CATEGORY_LABELS[c] ?? c}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              data-ocid="expenses-status-filter"
            >
              <option value="all">All statuses</option>
              {Object.values(BillStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 text-left">
                {(
                  [
                    { label: "Date", field: "date" as SortField },
                    { label: "Supplier", field: "supplier" as SortField },
                    { label: "Category", field: "category" as SortField },
                    { label: "Amount", field: "amount" as SortField },
                    { label: "Status", field: "status" as SortField },
                  ] as const
                ).map(({ label, field }) => (
                  <th key={field} className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort(field)}
                      className="flex items-center gap-1 text-label text-muted-foreground hover:text-foreground transition-smooth"
                      data-ocid={`expenses-sort-${field}`}
                    >
                      {label}
                      <SortIcon field={field} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {billsLoading ? (
                ["b1", "b2", "b3", "b4", "b5"].map((id) => (
                  <tr key={id}>
                    <td colSpan={5} className="px-5 py-3">
                      <Skeleton className="h-5 rounded" />
                    </td>
                  </tr>
                ))
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-muted-foreground text-sm"
                    data-ocid="expenses-empty"
                  >
                    No bills found for the selected filters
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr
                    key={bill.id.toString()}
                    className="hover:bg-muted/20 transition-smooth"
                    data-ocid={`expenses-bill-${bill.id}`}
                  >
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(bill.date)}
                    </td>
                    <td className="px-5 py-3 font-medium text-foreground max-w-[160px] truncate">
                      {bill.supplierName}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            background:
                              CATEGORY_COLORS[bill.category] ??
                              CATEGORY_COLORS.Other,
                          }}
                        />
                        {BILL_CATEGORY_LABELS[bill.category] ?? bill.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-foreground text-right whitespace-nowrap">
                      {formatGBP(bill.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        className={
                          bill.status === BillStatus.Paid
                            ? "badge-success"
                            : bill.status === BillStatus.Overdue
                              ? "badge-destructive"
                              : "badge-warning"
                        }
                        variant="outline"
                      >
                        {bill.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
