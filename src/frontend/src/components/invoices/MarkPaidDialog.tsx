import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatGBP } from "@/lib/format";
import type { InvoiceShared } from "@/types";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

interface Props {
  invoice: InvoiceShared;
  onClose: () => void;
  onConfirm: (paidDate: Date) => Promise<void>;
}

export function MarkPaidDialog({ invoice, onClose, onConfirm }: Props) {
  const [paidDate, setPaidDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm(new Date(paidDate));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            Mark as Paid
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <div className="rounded-lg bg-muted/30 border border-border p-3 text-sm">
            <div className="text-muted-foreground">Invoice</div>
            <div className="font-semibold text-foreground mt-0.5">
              {invoice.invoiceNumber}
            </div>
            <div className="text-muted-foreground mt-1">
              {invoice.customerName}
            </div>
            <div className="font-mono font-bold text-foreground text-base mt-1">
              {formatGBP(invoice.grandTotal)}
            </div>
            <div className="text-muted-foreground text-xs mt-1">
              Due {formatDate(invoice.dueDate)}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="paid-date"
              className="text-sm font-medium text-foreground"
            >
              Payment Date
            </Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="paid-date"
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="pl-9"
                data-ocid="mark-paid-date-input"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !paidDate}
            className="bg-success text-background hover:bg-success/90"
            data-ocid="mark-paid-confirm-btn"
          >
            {loading ? "Saving…" : "Confirm Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
