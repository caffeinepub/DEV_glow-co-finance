import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { FileDown, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useState } from "react";
import { useProfitAndLoss } from "../hooks/useBackend";
import {
  BILL_CATEGORY_LABELS,
  dateToTimestamp,
  formatGBP,
  formatPercent,
} from "../lib/format";
import type { ProfitAndLossReport } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthStart(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function calcChange(current: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

// ─── Trend chip ───────────────────────────────────────────────────────────────

interface CompareChipProps {
  current: number;
  prev: number;
  invertSign?: boolean; // for costs: decrease is good
}
function CompareChip({ current, prev, invertSign = false }: CompareChipProps) {
  const change = calcChange(current, prev);
  if (change === null)
    return <span className="text-xs text-muted-foreground">N/A</span>;
  const improved = invertSign ? change <= 0 : change >= 0;
  const Icon = change === 0 ? Minus : improved ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded ${
        improved
          ? "text-success bg-success/10"
          : "text-destructive bg-destructive/10"
      }`}
    >
      <Icon className="w-3 h-3" />
      {change >= 0 ? "+" : ""}
      {formatPercent(change)}
    </span>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

interface PLRowProps {
  label: string;
  value: number;
  prevValue?: number;
  indent?: boolean;
  bold?: boolean;
  showCompare?: boolean;
  invertSign?: boolean;
  isProfit?: boolean;
}
function PLRow({
  label,
  value,
  prevValue,
  indent,
  bold,
  showCompare,
  invertSign,
  isProfit,
}: PLRowProps) {
  return (
    <div
      className={`grid gap-4 py-2.5 border-b border-border/40 last:border-0 ${
        indent ? "pl-6" : ""
      }`}
      style={{ gridTemplateColumns: showCompare ? "1fr 1fr 1fr" : "1fr 1fr" }}
    >
      <span
        className={`text-sm min-w-0 truncate ${
          bold ? "font-semibold text-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-sm text-right font-mono ${
          bold ? "font-bold" : "font-medium"
        } ${
          isProfit
            ? value >= 0
              ? "text-success"
              : "text-destructive"
            : "text-foreground"
        }`}
      >
        {formatGBP(value)}
      </span>
      {showCompare && (
        <div className="flex items-center justify-end gap-2">
          {prevValue !== undefined && (
            <>
              <span className="text-xs text-muted-foreground font-mono">
                {formatGBP(prevValue)}
              </span>
              <CompareChip
                current={value}
                prev={prevValue}
                invertSign={invertSign}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section header row ───────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  showCompare: boolean;
}
function SectionHeader({ title, showCompare }: SectionHeaderProps) {
  return (
    <div
      className="grid gap-4 py-2 border-b border-border bg-muted/20 rounded-sm px-1"
      style={{ gridTemplateColumns: showCompare ? "1fr 1fr 1fr" : "1fr 1fr" }}
    >
      <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
        {title}
      </span>
      <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground text-right">
        Current Period
      </span>
      {showCompare && (
        <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground text-right">
          Prior / Change
        </span>
      )}
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number;
  prev?: number;
  subtitle?: string;
  valueClass: string;
  large?: boolean;
}
function KpiCard({
  label,
  value,
  prev,
  subtitle,
  valueClass,
  large,
}: KpiCardProps) {
  return (
    <Card className="card-elevated">
      <CardContent className="p-5">
        <p className="text-label text-muted-foreground mb-2">{label}</p>
        <p
          className={`font-display font-bold tracking-tight ${
            large ? "text-4xl" : "text-2xl"
          } ${valueClass}`}
        >
          {formatGBP(value)}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {prev !== undefined && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Prior: {formatGBP(prev)}
            </span>
            <CompareChip current={value} prev={prev} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PLSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["revenue", "gross", "net"] as const).map((k) => (
          <Card key={k} className="card-elevated">
            <CardContent className="p-5 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="card-elevated">
        <CardContent className="p-6 space-y-3">
          {(
            [
              "s1",
              "s2",
              "s3",
              "s4",
              "s5",
              "s6",
              "s7",
              "s8",
              "s9",
              "s10",
              "s11",
              "s12",
            ] as const
          ).map((k) => (
            <Skeleton key={k} className="h-9 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Print stylesheet injected on demand ─────────────────────────────────────

const PRINT_STYLES = `
  @media print {
    body * { visibility: hidden !important; }
    #pl-printable, #pl-printable * { visibility: visible !important; }
    #pl-printable { position: absolute; top: 0; left: 0; width: 100%; padding: 24px; background: white; color: black; }
    .no-print { display: none !important; }
  }
`;

// ─── P&L Statement ────────────────────────────────────────────────────────────

interface PLStatementProps {
  report: ProfitAndLossReport;
  showCompare: boolean;
  startDate: Date;
  endDate: Date;
}

function PLStatement({
  report,
  showCompare,
  startDate,
  endDate,
}: PLStatementProps) {
  const grossMargin =
    report.revenue > 0 ? (report.grossProfit / report.revenue) * 100 : 0;
  const netMargin =
    report.revenue > 0 ? (report.netProfit / report.revenue) * 100 : 0;

  const dateLabel = `${startDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} – ${endDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <div id="pl-printable" className="space-y-6">
      {/* Print-only header */}
      <div className="hidden print:block mb-6">
        <h2 className="text-2xl font-bold font-display">Glow &amp; Co.</h2>
        <p className="text-sm">Profit &amp; Loss Statement</p>
        <p className="text-sm">{dateLabel}</p>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Total Revenue"
          value={report.revenue}
          prev={showCompare ? report.prevRevenue : undefined}
          valueClass="text-foreground"
        />
        <KpiCard
          label="Gross Profit"
          value={report.grossProfit}
          prev={showCompare ? report.prevGrossProfit : undefined}
          subtitle={`${formatPercent(grossMargin)} gross margin`}
          valueClass={
            report.grossProfit >= 0 ? "text-success" : "text-destructive"
          }
        />
        <KpiCard
          label="Net Profit"
          value={report.netProfit}
          prev={showCompare ? report.prevNetProfit : undefined}
          subtitle={`${formatPercent(netMargin)} net margin`}
          valueClass={
            report.netProfit >= 0 ? "text-success" : "text-destructive"
          }
          large
        />
      </div>

      {/* Full statement table */}
      <Card className="card-elevated">
        <CardHeader className="pb-0 px-6 pt-5">
          <CardTitle className="text-base font-semibold">
            Statement of Profit &amp; Loss
          </CardTitle>
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
        </CardHeader>
        <CardContent className="p-6 pt-4 space-y-6">
          {/* Revenue section */}
          <section>
            <SectionHeader title="Revenue" showCompare={showCompare} />
            <PLRow
              label="Total Revenue"
              value={report.revenue}
              prevValue={showCompare ? report.prevRevenue : undefined}
              bold
              showCompare={showCompare}
            />
          </section>

          {/* COGS section */}
          <section>
            <SectionHeader
              title="Cost of Goods Sold"
              showCompare={showCompare}
            />
            <PLRow
              label="Cost of Goods Sold"
              value={report.cogs}
              prevValue={showCompare ? report.prevCogs : undefined}
              showCompare={showCompare}
              indent
              invertSign
            />
            <PLRow
              label="Gross Profit"
              value={report.grossProfit}
              prevValue={showCompare ? report.prevGrossProfit : undefined}
              bold
              showCompare={showCompare}
              isProfit
            />
          </section>

          {/* Expenses section */}
          <section>
            <SectionHeader
              title="Operating Expenses"
              showCompare={showCompare}
            />
            {report.expensesByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3 pl-6">
                No expenses recorded for this period.
              </p>
            ) : (
              report.expensesByCategory.map(([cat, amount]) => (
                <PLRow
                  key={cat}
                  label={BILL_CATEGORY_LABELS[cat] ?? cat}
                  value={amount}
                  showCompare={showCompare}
                  indent
                  invertSign
                />
              ))
            )}
            <PLRow
              label="Total Operating Expenses"
              value={report.totalExpenses}
              bold
              showCompare={showCompare}
              invertSign
            />
          </section>

          {/* Net Profit footer */}
          <section className="pt-2 border-t-2 border-border">
            <div
              className="grid gap-4 py-3"
              style={{
                gridTemplateColumns: showCompare ? "1fr 1fr 1fr" : "1fr 1fr",
              }}
            >
              <span className="font-bold text-lg font-display">Net Profit</span>
              <span
                className={`text-right font-mono text-2xl font-bold ${
                  report.netProfit >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {formatGBP(report.netProfit)}
              </span>
              {showCompare && (
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm text-muted-foreground font-mono">
                    {formatGBP(report.prevNetProfit)}
                  </span>
                  <CompareChip
                    current={report.netProfit}
                    prev={report.prevNetProfit}
                  />
                </div>
              )}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProfitLoss() {
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(getMonthStart());
  const [endDate, setEndDate] = useState<Date>(today);
  const [showCompare, setShowCompare] = useState(false);

  const startTs = dateToTimestamp(startDate);
  const endTs = dateToTimestamp(endDate);

  const { data, isLoading, isError } = useProfitAndLoss(startTs, endTs);

  const handlePrint = useCallback(() => {
    const style = document.createElement("style");
    style.textContent = PRINT_STYLES;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  }, []);

  const fmtInput = (d: Date) => d.toISOString().split("T")[0];

  return (
    <div className="space-y-6" data-ocid="pl-page">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-section-heading">Profit &amp; Loss</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Full income statement for your selected period
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 self-start sm:self-auto"
          onClick={handlePrint}
          data-ocid="pl-export-btn"
        >
          <FileDown className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Filter bar */}
      <Card className="card-elevated no-print">
        <CardContent className="p-4">
          <div
            className="flex flex-wrap items-end gap-4"
            data-ocid="pl-filters"
          >
            <div className="space-y-1">
              <Label className="text-label">Start Date</Label>
              <input
                type="date"
                value={fmtInput(startDate)}
                max={fmtInput(endDate)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) setStartDate(new Date(`${v}T00:00:00`));
                }}
                className="block h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                data-ocid="pl-start-date"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-label">End Date</Label>
              <input
                type="date"
                value={fmtInput(endDate)}
                min={fmtInput(startDate)}
                max={fmtInput(today)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) setEndDate(new Date(`${v}T23:59:59`));
                }}
                className="block h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                data-ocid="pl-end-date"
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Switch
                id="compare-toggle"
                checked={showCompare}
                onCheckedChange={setShowCompare}
                data-ocid="pl-compare-toggle"
              />
              <Label
                htmlFor="compare-toggle"
                className="text-sm cursor-pointer"
              >
                Compare to prior period
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* States */}
      {isLoading && <PLSkeleton />}

      {isError && (
        <Card className="card-elevated border-destructive/40">
          <CardContent className="p-8 text-center">
            <p className="text-destructive font-medium">
              Failed to load P&amp;L data. Please refresh and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {data && !isLoading && (
        <PLStatement
          report={data}
          showCompare={showCompare}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
}
