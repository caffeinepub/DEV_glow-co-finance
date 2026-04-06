import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatGBP, vatRateToNumber } from "@/lib/format";
import type { InvoiceShared } from "@/types";
import { InvoiceStatus } from "@/types";
import { Printer } from "lucide-react";

interface Props {
  invoice: InvoiceShared;
  onClose: () => void;
  onMarkPaid: () => void;
  onEdit: () => void;
}

export function InvoiceDetailDialog({
  invoice,
  onClose,
  onMarkPaid,
  onEdit,
}: Props) {
  const canMarkPaid =
    invoice.status === InvoiceStatus.Sent ||
    invoice.status === InvoiceStatus.Overdue;
  const canEdit = invoice.status === InvoiceStatus.Draft;

  // Group VAT by rate for breakdown
  const vatBreakdown: Record<string, { net: number; vat: number }> = {};
  for (const item of invoice.lineItems) {
    const rate = `${vatRateToNumber(item.vatRate)}%`;
    if (!vatBreakdown[rate]) vatBreakdown[rate] = { net: 0, vat: 0 };
    vatBreakdown[rate].net += item.lineTotal;
    vatBreakdown[rate].vat += item.vatAmount;
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="pb-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="font-display text-lg text-foreground">
                Invoice {invoice.invoiceNumber}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Issued {formatDate(invoice.issueDate)}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={invoice.status} />
              {invoice.isRecurring && (
                <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded font-semibold uppercase tracking-wide">
                  {invoice.recurringFrequency} Recurring
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Branded invoice */}
        <div
          className="mt-4 rounded-lg border border-border bg-background p-6 print:shadow-none"
          data-ocid="invoice-detail-print-area"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <div className="text-xl font-display font-bold text-foreground tracking-tight">
                Glow & Co.
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed mt-1">
                123 Beauty Lane, London, W1A 1AA
                <br />
                VAT Reg: GB 123 4567 89
                <br />
                hello@glowandco.co.uk
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-display font-bold text-primary tracking-tight uppercase">
                Invoice
              </div>
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <div>
                  <span className="font-semibold text-foreground">No.</span>{" "}
                  {invoice.invoiceNumber}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Date:</span>{" "}
                  {formatDate(invoice.issueDate)}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Due:</span>{" "}
                  {formatDate(invoice.dueDate)}
                </div>
                {invoice.paidDate && (
                  <div className="text-success font-semibold">
                    Paid: {formatDate(invoice.paidDate)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-6 p-3 bg-muted/30 rounded-md">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">
              Bill To
            </div>
            <div className="text-sm font-semibold text-foreground">
              {invoice.customerName}
            </div>
          </div>

          {/* Line items */}
          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left pb-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                    Description
                  </th>
                  <th className="text-right pb-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                    Qty
                  </th>
                  <th className="text-right pb-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                    Unit Price
                  </th>
                  <th className="text-right pb-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                    VAT
                  </th>
                  <th className="text-right pb-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, i) => (
                  <tr
                    key={`${item.productId.toString()}-${i}`}
                    className="border-b border-border/40"
                  >
                    <td className="py-2.5 text-foreground">
                      {item.productName}
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">
                      {item.quantity.toString()}
                    </td>
                    <td className="py-2.5 text-right font-mono text-muted-foreground">
                      {formatGBP(item.unitPrice)}
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground text-xs">
                      {vatRateToNumber(item.vatRate)}%
                    </td>
                    <td className="py-2.5 text-right font-mono font-medium text-foreground">
                      {formatGBP(item.lineTotal + item.vatAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal (ex. VAT)</span>
                <span className="font-mono">{formatGBP(invoice.subtotal)}</span>
              </div>
              {Object.entries(vatBreakdown).map(([rate, { vat }]) => (
                <div
                  key={rate}
                  className="flex justify-between text-muted-foreground"
                >
                  <span>VAT @ {rate}</span>
                  <span className="font-mono">{formatGBP(vat)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold text-foreground text-base">
                <span>Total</span>
                <span className="font-mono">
                  {formatGBP(invoice.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-5 pt-4 border-t border-border/40">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                Notes
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {invoice.notes}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="text-muted-foreground"
            data-ocid="invoice-print-btn"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <div className="flex gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                data-ocid="invoice-detail-edit-btn"
              >
                Edit Invoice
              </Button>
            )}
            {canMarkPaid && (
              <Button
                size="sm"
                onClick={onMarkPaid}
                className="bg-success text-background hover:bg-success/90"
                data-ocid="invoice-detail-mark-paid-btn"
              >
                Mark as Paid
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
