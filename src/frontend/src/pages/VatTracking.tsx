import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBills, useInvoices, useVatSummary } from "@/hooks/useBackend";
import { formatDate, formatGBP, vatRateToNumber } from "@/lib/format";
import { VatRate } from "@/types";
import type { BillShared, InvoiceShared } from "@/types";
import {
  AlertCircle,
  FileText,
  Printer,
  Receipt,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentQuarter(): { quarter: number; year: number } {
  const now = new Date();
  const month = now.getMonth(); // 0-based
  const quarter = Math.floor(month / 3) + 1;
  return { quarter, year: now.getFullYear() };
}

function getQuarterDateRange(
  quarter: number,
  year: number,
): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3;
  return {
    start: new Date(year, startMonth, 1),
    end: new Date(year, startMonth + 3, 0, 23, 59, 59, 999),
  };
}

function isInQuarter(
  timestampNs: bigint,
  quarter: number,
  year: number,
): boolean {
  const { start, end } = getQuarterDateRange(quarter, year);
  const ms = Number(timestampNs) / 1_000_000;
  return ms >= start.getTime() && ms <= end.getTime();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  variant = "default",
  isLoading,
}: {
  label: string;
  value: number;
  variant?: "default" | "positive" | "negative";
  isLoading?: boolean;
}) {
  const valueClass =
    variant === "positive"
      ? "text-success"
      : variant === "negative"
        ? "text-destructive"
        : "text-foreground";

  return (
    <div className="card-elevated rounded-xl p-5 flex flex-col gap-2">
      <p className="text-label text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className="h-9 w-32" />
      ) : (
        <p
          className={`text-3xl font-bold font-display tracking-tight ${valueClass}`}
        >
          {formatGBP(value)}
        </p>
      )}
    </div>
  );
}

const VAT_RATES = [VatRate.Zero, VatRate.Five, VatRate.Twenty] as const;

function vatRateLabel(rate: VatRate): string {
  return `${vatRateToNumber(rate)}%`;
}

function VatBreakdownTable({
  invoices,
  bills,
}: {
  invoices: InvoiceShared[];
  bills: BillShared[];
}) {
  const rows = VAT_RATES.map((rate) => {
    const invoiceVat = invoices.reduce((sum, inv) => {
      const rateVat = inv.lineItems
        .filter((li) => li.vatRate === rate)
        .reduce((s, li) => s + li.vatAmount, 0);
      return sum + rateVat;
    }, 0);

    const billVat = bills
      .filter((b) => b.vatRate === rate)
      .reduce((sum, b) => sum + b.vatAmount, 0);

    return { rate, invoiceVat, billVat, net: invoiceVat - billVat };
  });

  return (
    <div className="card-elevated rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold font-display text-foreground">
          VAT by Rate
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Collected vs paid split by rate band
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rate</TableHead>
            <TableHead className="text-right">Collected</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Net</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ rate, invoiceVat, billVat, net }) => (
            <TableRow key={rate}>
              <TableCell>
                <Badge variant="outline" className="font-mono text-xs">
                  {vatRateLabel(rate)}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatGBP(invoiceVat)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatGBP(billVat)}
              </TableCell>
              <TableCell
                className={`text-right font-mono text-sm font-semibold ${
                  net > 0
                    ? "text-destructive"
                    : net < 0
                      ? "text-success"
                      : "text-muted-foreground"
                }`}
              >
                {formatGBP(net)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InvoiceVatTable({
  invoices,
  searchQuery,
}: {
  invoices: InvoiceShared[];
  searchQuery: string;
}) {
  const filtered = useMemo(() => {
    if (!searchQuery) return invoices;
    const q = searchQuery.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q),
    );
  }, [invoices, searchQuery]);

  if (filtered.length === 0) {
    return (
      <div
        className="py-10 text-center text-muted-foreground text-sm"
        data-ocid="invoice-vat-empty"
      >
        No invoices found for this period.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice #</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Net</TableHead>
          <TableHead className="text-right">VAT Rate</TableHead>
          <TableHead className="text-right">VAT Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((inv) => (
          <TableRow key={inv.id.toString()} data-ocid="invoice-vat-row">
            <TableCell className="font-mono text-sm text-primary">
              {inv.invoiceNumber}
            </TableCell>
            <TableCell className="text-sm max-w-[160px] truncate">
              {inv.customerName}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(inv.issueDate)}
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {formatGBP(inv.subtotal)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex flex-wrap gap-1 justify-end">
                {Array.from(new Set(inv.lineItems.map((li) => li.vatRate))).map(
                  (rate) => (
                    <Badge
                      key={rate}
                      variant="outline"
                      className="font-mono text-xs"
                    >
                      {vatRateLabel(rate)}
                    </Badge>
                  ),
                )}
              </div>
            </TableCell>
            <TableCell className="text-right font-mono text-sm font-semibold text-destructive">
              {formatGBP(inv.totalVat)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function BillVatTable({
  bills,
  searchQuery,
}: {
  bills: BillShared[];
  searchQuery: string;
}) {
  const filtered = useMemo(() => {
    if (!searchQuery) return bills;
    const q = searchQuery.toLowerCase();
    return bills.filter(
      (b) =>
        b.supplierName.toLowerCase().includes(q) ||
        b.billNumber.toLowerCase().includes(q),
    );
  }, [bills, searchQuery]);

  if (filtered.length === 0) {
    return (
      <div
        className="py-10 text-center text-muted-foreground text-sm"
        data-ocid="bill-vat-empty"
      >
        No bills found for this period.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bill #</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Net</TableHead>
          <TableHead className="text-right">VAT Rate</TableHead>
          <TableHead className="text-right">VAT Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((bill) => (
          <TableRow key={bill.id.toString()} data-ocid="bill-vat-row">
            <TableCell className="font-mono text-sm text-primary">
              {bill.billNumber}
            </TableCell>
            <TableCell className="text-sm max-w-[140px] truncate">
              {bill.supplierName}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {bill.category}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(bill.date)}
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {formatGBP(bill.amount - bill.vatAmount)}
            </TableCell>
            <TableCell className="text-right">
              <Badge variant="outline" className="font-mono text-xs">
                {vatRateLabel(bill.vatRate)}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-mono text-sm font-semibold text-success">
              {formatGBP(bill.vatAmount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function VatTracking() {
  const { quarter: defaultQ, year: defaultY } = getCurrentQuarter();
  const [quarter, setQuarter] = useState(defaultQ);
  const [year, setYear] = useState(defaultY);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [billSearch, setBillSearch] = useState("");

  const years = Array.from({ length: 4 }, (_, i) => defaultY - i);

  const {
    data: vatSummary,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErr,
    refetch: refetchSummary,
  } = useVatSummary(BigInt(quarter), BigInt(year));
  const {
    data: allInvoices = [],
    isLoading: invoicesLoading,
    isError: invoicesError,
    refetch: refetchInvoices,
  } = useInvoices();
  const {
    data: allBills = [],
    isLoading: billsLoading,
    isError: billsError,
    refetch: refetchBills,
  } = useBills();

  const periodInvoices = useMemo(
    () =>
      allInvoices.filter((inv) => isInQuarter(inv.issueDate, quarter, year)),
    [allInvoices, quarter, year],
  );

  const periodBills = useMemo(
    () => allBills.filter((b) => isInQuarter(b.date, quarter, year)),
    [allBills, quarter, year],
  );

  const netOwed = vatSummary?.netVatOwed ?? 0;
  const netVariant =
    netOwed > 0 ? "negative" : netOwed < 0 ? "positive" : "default";

  const anyError = summaryError || invoicesError || billsError;
  const firstErr = summaryErr ?? null;

  return (
    <>
      {/* ── Header ── */}
      <div className="border-b border-border bg-card px-6 py-5 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-section-heading text-foreground">
              VAT Tracking
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              VAT collected, paid and net owed to HMRC by quarter
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quarter selector */}
            <Select
              value={String(quarter)}
              onValueChange={(v) => setQuarter(Number(v))}
            >
              <SelectTrigger className="w-24" data-ocid="vat-quarter-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((q) => (
                  <SelectItem key={q} value={String(q)}>
                    Q{q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year selector */}
            <Select
              value={String(year)}
              onValueChange={(v) => setYear(Number(v))}
            >
              <SelectTrigger className="w-24" data-ocid="vat-year-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              data-ocid="vat-export-btn"
            >
              <Printer className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* ── Print header (hidden on screen) ── */}
      <div className="hidden print:block px-6 py-4 border-b border-border">
        <h1 className="text-2xl font-bold font-display">
          Glow & Co. — VAT Summary
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Q{quarter} {year} · For reference only — consult an accountant for
          HMRC filing
        </p>
      </div>

      <div className="p-6 space-y-6" data-ocid="vat-page">
        {anyError && (
          <div
            className="flex flex-col items-center justify-center py-16 text-center"
            data-ocid="vat-error-state"
          >
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
              <RefreshCw className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              Unable to load VAT data
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {firstErr instanceof Error
                ? firstErr.message
                : "Something went wrong."}
            </p>
            <button
              type="button"
              onClick={() => {
                refetchSummary();
                refetchInvoices();
                refetchBills();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-xs"
              data-ocid="vat-retry-btn"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}
        {/* ── Summary Cards ── */}
        {!anyError && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard
                label="VAT Collected"
                value={vatSummary?.vatCollected ?? 0}
                isLoading={summaryLoading}
                data-ocid="vat-collected-card"
              />
              <SummaryCard
                label="VAT Paid on Bills"
                value={vatSummary?.vatPaid ?? 0}
                variant="positive"
                isLoading={summaryLoading}
                data-ocid="vat-paid-card"
              />
              <SummaryCard
                label="Net VAT Owed to HMRC"
                value={netOwed}
                variant={netVariant}
                isLoading={summaryLoading}
                data-ocid="vat-net-owed-card"
              />
            </div>

            {/* ── VAT by Rate Breakdown ── */}
            {invoicesLoading || billsLoading ? (
              <div className="card-elevated rounded-xl p-5 space-y-3">
                <Skeleton className="h-5 w-40" />
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <VatBreakdownTable
                invoices={periodInvoices}
                bills={periodBills}
              />
            )}

            {/* ── Invoice VAT Detail ── */}
            <div className="card-elevated rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-semibold font-display text-foreground">
                    Invoice VAT
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {periodInvoices.length}
                  </Badge>
                </div>
                <input
                  type="search"
                  placeholder="Search invoices…"
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="border border-input bg-background rounded-md px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-56"
                  data-ocid="invoice-vat-search"
                />
              </div>
              <div className="overflow-x-auto">
                {invoicesLoading ? (
                  <div className="p-5 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <InvoiceVatTable
                    invoices={periodInvoices}
                    searchQuery={invoiceSearch}
                  />
                )}
              </div>
            </div>

            {/* ── Bill VAT Detail ── */}
            <div className="card-elevated rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-semibold font-display text-foreground">
                    Bill VAT
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {periodBills.length}
                  </Badge>
                </div>
                <input
                  type="search"
                  placeholder="Search bills…"
                  value={billSearch}
                  onChange={(e) => setBillSearch(e.target.value)}
                  className="border border-input bg-background rounded-md px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-56"
                  data-ocid="bill-vat-search"
                />
              </div>
              <div className="overflow-x-auto">
                {billsLoading ? (
                  <div className="p-5 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <BillVatTable bills={periodBills} searchQuery={billSearch} />
                )}
              </div>
            </div>

            {/* ── Disclaimer ── */}
            <div className="flex gap-3 items-start rounded-xl border border-warning/30 bg-warning/5 p-4">
              <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">
                  For reference only.
                </span>{" "}
                This summary is based on the data entered in Glow &amp; Co. and
                is not a substitute for professional advice. Please consult a
                qualified accountant before submitting your VAT return to HMRC.
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
