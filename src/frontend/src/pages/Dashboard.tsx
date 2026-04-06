import type { BillShared, InvoiceShared, ProductShared } from "@/backend";
import { StatCard } from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCashFlow,
  useDashboardStats,
  useInitializeSampleData,
} from "@/hooks/useBackend";
import { MONTH_NAMES, formatDate, formatGBP } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, TrendingDown } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SEED_KEY = "glow_sample_data_seeded";

function daysOverdue(dueDate: bigint): number {
  const dueMs = Number(dueDate) / 1_000_000;
  const nowMs = Date.now();
  return Math.max(0, Math.floor((nowMs - dueMs) / 86_400_000));
}

function daysUntilDue(dueDate: bigint): number {
  const dueMs = Number(dueDate) / 1_000_000;
  const nowMs = Date.now();
  return Math.max(0, Math.ceil((dueMs - nowMs) / 86_400_000));
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function OverdueRow({ inv }: { inv: InvoiceShared }) {
  const days = daysOverdue(inv.dueDate);
  return (
    <div
      className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 gap-2"
      data-ocid="overdue-row"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {inv.customerName}
        </p>
        <p className="text-xs text-muted-foreground">{inv.invoiceNumber}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-bold text-foreground">
          {formatGBP(inv.grandTotal)}
        </span>
        <span className="badge-destructive text-xs font-semibold px-2 py-0.5 rounded-md">
          {days}d overdue
        </span>
      </div>
    </div>
  );
}

function BillDueRow({ bill }: { bill: BillShared }) {
  const days = daysUntilDue(bill.dueDate);
  return (
    <div
      className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 gap-2"
      data-ocid="bill-due-row"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {bill.supplierName}
        </p>
        <p className="text-xs text-muted-foreground">{bill.billNumber}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-bold text-foreground">
          {formatGBP(bill.amount)}
        </span>
        <span className="badge-warning text-xs font-semibold px-2 py-0.5 rounded-md">
          {days === 0 ? "Today" : `${days}d`}
        </span>
      </div>
    </div>
  );
}

function LowStockRow({ product }: { product: ProductShared }) {
  const critical = product.stockQuantity <= product.reorderPoint / 2n;
  return (
    <div
      className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 gap-2"
      data-ocid="low-stock-row"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {product.name}
        </p>
        <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-muted-foreground">
          {String(product.stockQuantity)} / {String(product.reorderPoint)}
        </span>
        <span
          className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-md",
            critical ? "badge-destructive" : "badge-warning",
          )}
        >
          {critical ? "Critical" : "Low"}
        </span>
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  emptyText: string;
  children: React.ReactNode;
  "data-ocid"?: string;
}

function SectionCard({
  title,
  icon,
  count,
  emptyText,
  children,
  "data-ocid": ocid,
}: SectionCardProps) {
  return (
    <div className="card-elevated rounded-xl flex flex-col" data-ocid={ocid}>
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/60">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="font-semibold text-sm text-foreground flex-1">
          {title}
        </h2>
        {count > 0 && (
          <span className="text-xs font-bold bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      <div className="px-5 py-1 flex-1 overflow-y-auto max-h-64">
        {count === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {emptyText}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatGBP(p.value, true)}
        </p>
      ))}
    </div>
  );
}

// ─── Skeleton States ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function Dashboard() {
  const currentYear = BigInt(new Date().getFullYear());
  const { data: stats, isLoading } = useDashboardStats();
  const { data: cashFlowData } = useCashFlow(currentYear);
  const initMutation = useInitializeSampleData();
  const seeded = useRef(false);

  const mutate = initMutation.mutate;
  useEffect(() => {
    if (seeded.current) return;
    const already = localStorage.getItem(SEED_KEY);
    if (!already) {
      seeded.current = true;
      mutate(undefined, {
        onSuccess: () => localStorage.setItem(SEED_KEY, "1"),
      });
    }
  }, [mutate]);

  const profit = stats?.netProfitThisMonth ?? 0;
  const profitPositive = profit >= 0;

  const chartData = cashFlowData
    ? cashFlowData.map((row) => ({
        month: MONTH_NAMES[Number(row.month) - 1] ?? String(row.month),
        revenue: row.inflow,
        expenses: row.outflow,
      }))
    : [];

  return (
    <div className="p-4 md:p-6 space-y-6" data-ocid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-section-heading text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Financial overview for Glow &amp; Co.
        </p>
      </div>

      {isLoading || !stats ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Cash Balance"
              value={formatGBP(stats.totalCashBalance, true)}
              subtext="All accounts"
              className="border-l-4 border-l-[oklch(0.7_0.17_195)]"
              data-ocid="kpi-cash-balance"
            />
            <StatCard
              label="Revenue This Month"
              value={formatGBP(stats.revenueThisMonth, true)}
              subtext="Paid invoices"
              className="border-l-4 border-l-[oklch(var(--success))]"
              data-ocid="kpi-revenue"
            />
            <StatCard
              label="Expenses This Month"
              value={formatGBP(stats.expensesThisMonth, true)}
              subtext="Paid bills"
              className="border-l-4 border-l-destructive"
              data-ocid="kpi-expenses"
            />
            <StatCard
              label="Net Profit This Month"
              value={formatGBP(Math.abs(profit), true)}
              subtext={profitPositive ? "Profit" : "Loss"}
              trendPositive={profitPositive}
              trend={profitPositive ? "Positive" : "Negative"}
              className={cn(
                "border-l-4",
                profitPositive
                  ? "border-l-[oklch(var(--success))]"
                  : "border-l-destructive",
              )}
              data-ocid="kpi-net-profit"
            />
          </div>

          {/* Revenue vs Expenses Chart */}
          <div
            className="card-elevated rounded-xl px-5 pt-5 pb-4"
            data-ocid="revenue-chart"
          >
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Revenue vs Expenses — Last 12 Months
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="oklch(0.6 0.16 150)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="oklch(0.6 0.16 150)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="oklch(0.55 0.22 25)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="oklch(0.55 0.22 25)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.28 0.02 260 / 0.5)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => formatGBP(v, true)}
                  tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                  formatter={(value) => (
                    <span style={{ color: "oklch(0.85 0.01 260)" }}>
                      {value}
                    </span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="oklch(0.6 0.16 150)"
                  strokeWidth={2}
                  fill="url(#gradRevenue)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="oklch(0.55 0.22 25)"
                  strokeWidth={2}
                  fill="url(#gradExpenses)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Alert Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overdue Invoices */}
            <SectionCard
              title="Overdue Invoices"
              icon={<TrendingDown className="w-4 h-4" />}
              count={stats.overdueInvoices.length}
              emptyText="No overdue invoices — great work!"
              data-ocid="overdue-invoices-panel"
            >
              {stats.overdueInvoices.map((inv) => (
                <OverdueRow key={inv.id.toString()} inv={inv} />
              ))}
            </SectionCard>

            {/* Bills Due in 14 Days */}
            <SectionCard
              title="Bills Due (14 Days)"
              icon={<Clock className="w-4 h-4" />}
              count={stats.billsDueIn14Days.length}
              emptyText="No bills due in the next 14 days."
              data-ocid="bills-due-panel"
            >
              {stats.billsDueIn14Days.map((bill) => (
                <BillDueRow key={bill.id.toString()} bill={bill} />
              ))}
            </SectionCard>

            {/* Low Stock Alerts */}
            <SectionCard
              title="Low Stock Alerts"
              icon={<AlertTriangle className="w-4 h-4" />}
              count={stats.lowStockProducts.length}
              emptyText="All products are well stocked."
              data-ocid="low-stock-panel"
            >
              {stats.lowStockProducts.map((product) => (
                <LowStockRow key={product.id.toString()} product={product} />
              ))}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
