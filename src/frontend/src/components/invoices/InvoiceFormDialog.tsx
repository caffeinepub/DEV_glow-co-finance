import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  dateToTimestamp,
  formatGBP,
  timestampToDate,
  vatRateToNumber,
} from "@/lib/format";
import type {
  CreateInvoiceData,
  Customer,
  InvoiceShared,
  ProductShared,
} from "@/types";
import { RecurringFrequency, VatRate } from "@/types";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

interface LineItemDraft {
  id: string;
  productId: bigint;
  productName: string;
  quantity: string;
  unitPrice: string;
  vatRate: VatRate;
}

interface Props {
  invoice: InvoiceShared | null;
  customers: Customer[];
  products: ProductShared[];
  onClose: () => void;
  onCreate: (data: CreateInvoiceData) => Promise<void>;
  onUpdate: (id: bigint, data: CreateInvoiceData) => Promise<void>;
}

const vatRateOptions = [
  { label: "0% VAT", value: VatRate.Zero },
  { label: "5% VAT", value: VatRate.Five },
  { label: "20% VAT", value: VatRate.Twenty },
];

function tsToDateInput(ts: bigint): string {
  return timestampToDate(ts).toISOString().split("T")[0];
}

function makeEmptyLine(): LineItemDraft {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: 0n,
    productName: "",
    quantity: "1",
    unitPrice: "",
    vatRate: VatRate.Twenty,
  };
}

export function InvoiceFormDialog({
  invoice,
  customers,
  products,
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const isEditing = !!invoice;
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysOut = new Date(Date.now() + 30 * 86400_000)
    .toISOString()
    .split("T")[0];

  const [customerId, setCustomerId] = useState<string>(
    invoice ? invoice.customerId.toString() : "",
  );
  const [issueDate, setIssueDate] = useState(
    invoice ? tsToDateInput(invoice.issueDate) : today,
  );
  const [dueDate, setDueDate] = useState(
    invoice ? tsToDateInput(invoice.dueDate) : thirtyDaysOut,
  );
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [isRecurring, setIsRecurring] = useState(invoice?.isRecurring ?? false);
  const [frequency, setFrequency] = useState<RecurringFrequency>(
    invoice?.recurringFrequency ?? RecurringFrequency.Monthly,
  );
  const [lineItems, setLineItems] = useState<LineItemDraft[]>(() => {
    if (invoice?.lineItems.length) {
      return invoice.lineItems.map((li) => ({
        id: `line-${li.productId}-${Math.random().toString(36).slice(2)}`,
        productId: li.productId,
        productName: li.productName,
        quantity: li.quantity.toString(),
        unitPrice: li.unitPrice.toString(),
        vatRate: li.vatRate,
      }));
    }
    return [makeEmptyLine()];
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCustomer = customers.find(
    (c) => c.id.toString() === customerId,
  );

  const updateLine = useCallback(
    (
      id: string,
      field: keyof Omit<LineItemDraft, "id">,
      value: string | VatRate | bigint,
    ) => {
      setLineItems((prev) =>
        prev.map((li) => (li.id === id ? { ...li, [field]: value } : li)),
      );
    },
    [],
  );

  const addLine = useCallback(
    () => setLineItems((prev) => [...prev, makeEmptyLine()]),
    [],
  );
  const removeLine = useCallback(
    (id: string) => setLineItems((prev) => prev.filter((li) => li.id !== id)),
    [],
  );

  function handleProductSelect(lineId: string, productId: string) {
    const product = products.find((p) => p.id.toString() === productId);
    if (product) {
      setLineItems((prev) =>
        prev.map((li) =>
          li.id === lineId
            ? {
                ...li,
                productId: product.id,
                productName: product.name,
                unitPrice: product.salePrice.toString(),
              }
            : li,
        ),
      );
    }
  }

  // Compute totals from line items
  const lineCalcs = lineItems.map((li) => {
    const qty = Number(li.quantity) || 0;
    const price = Number(li.unitPrice) || 0;
    const net = qty * price;
    const vatPct = vatRateToNumber(li.vatRate);
    const vatAmt = net * (vatPct / 100);
    return { net, vatAmt, total: net + vatAmt };
  });
  const subtotal = lineCalcs.reduce((s, c) => s + c.net, 0);
  const totalVat = lineCalcs.reduce((s, c) => s + c.vatAmt, 0);
  const grandTotal = subtotal + totalVat;

  function validate() {
    const errs: Record<string, string> = {};
    if (!customerId) errs.customer = "Please select a customer";
    if (!issueDate) errs.issueDate = "Required";
    if (!dueDate) errs.dueDate = "Required";
    if (lineItems.length === 0) errs.lines = "Add at least one line item";
    lineItems.forEach((li, i) => {
      if (!li.productName.trim()) errs[`line_name_${i}`] = "Name required";
      if (!li.quantity || Number(li.quantity) <= 0)
        errs[`line_qty_${i}`] = "Invalid qty";
      if (!li.unitPrice || Number(li.unitPrice) < 0)
        errs[`line_price_${i}`] = "Invalid price";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const customerName = selectedCustomer?.name ?? "";
      const data: CreateInvoiceData = {
        customerId: BigInt(customerId),
        customerName,
        issueDate: dateToTimestamp(new Date(issueDate)),
        dueDate: dateToTimestamp(new Date(dueDate)),
        notes,
        isRecurring,
        recurringFrequency: isRecurring ? frequency : undefined,
        subtotal,
        totalVat,
        grandTotal,
        lineItems: lineItems.map((li, i) => ({
          productId: li.productId || 0n,
          productName: li.productName,
          quantity: BigInt(Number(li.quantity) || 0),
          unitPrice: Number(li.unitPrice) || 0,
          vatRate: li.vatRate,
          lineTotal: lineCalcs[i].net,
          vatAmount: lineCalcs[i].vatAmt,
        })),
      };
      if (isEditing && invoice) {
        await onUpdate(invoice.id, data);
      } else {
        await onCreate(data);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            {isEditing ? "Edit Invoice" : "New Invoice"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Customer + dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 space-y-1.5">
              <Label htmlFor="inv-customer">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger
                  id="inv-customer"
                  className={errors.customer ? "border-destructive" : ""}
                  data-ocid="inv-customer-select"
                >
                  <SelectValue placeholder="Select customer…" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id.toString()} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customer && (
                <p className="text-xs text-destructive">{errors.customer}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-issue-date">Issue Date *</Label>
              <Input
                id="inv-issue-date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className={errors.issueDate ? "border-destructive" : ""}
                data-ocid="inv-issue-date"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-due-date">Due Date *</Label>
              <Input
                id="inv-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={errors.dueDate ? "border-destructive" : ""}
                data-ocid="inv-due-date"
              />
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                Line Items
              </h3>
              {errors.lines && (
                <p className="text-xs text-destructive">{errors.lines}</p>
              )}
            </div>

            <div className="space-y-2">
              {/* Header row */}
              <div className="hidden sm:grid sm:grid-cols-[2fr_1.5fr_1fr_1fr_auto_auto] gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide px-1">
                <span>Product / Description</span>
                <span>Qty</span>
                <span>Unit Price</span>
                <span>VAT</span>
                <span>Total</span>
                <span />
              </div>

              {lineItems.map((li, idx) => (
                <div
                  key={li.id}
                  className="grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_1fr_1fr_auto_auto] gap-2 items-center bg-muted/20 rounded-lg p-2"
                  data-ocid={`line-item-${idx}`}
                >
                  {/* Product select or free text */}
                  <div className="space-y-1">
                    {products.length > 0 ? (
                      <Select
                        value={
                          li.productId > 0n ? li.productId.toString() : "custom"
                        }
                        onValueChange={(v) => {
                          if (v === "custom") {
                            updateLine(li.id, "productId", 0n);
                            updateLine(li.id, "productName", "");
                          } else {
                            handleProductSelect(li.id, v);
                          }
                        }}
                      >
                        <SelectTrigger
                          className={`text-sm ${errors[`line_name_${idx}`] ? "border-destructive" : ""}`}
                        >
                          <SelectValue placeholder="Select product…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom item…</SelectItem>
                          {products.map((p) => (
                            <SelectItem
                              key={p.id.toString()}
                              value={p.id.toString()}
                            >
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                    {(li.productId === 0n || products.length === 0) && (
                      <Input
                        placeholder="Item description"
                        value={li.productName}
                        onChange={(e) =>
                          updateLine(li.id, "productName", e.target.value)
                        }
                        className={`text-sm ${errors[`line_name_${idx}`] ? "border-destructive" : ""}`}
                        data-ocid={`line-name-${idx}`}
                      />
                    )}
                  </div>

                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={li.quantity}
                    onChange={(e) =>
                      updateLine(li.id, "quantity", e.target.value)
                    }
                    className={`text-sm ${errors[`line_qty_${idx}`] ? "border-destructive" : ""}`}
                    data-ocid={`line-qty-${idx}`}
                  />

                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                      £
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={li.unitPrice}
                      onChange={(e) =>
                        updateLine(li.id, "unitPrice", e.target.value)
                      }
                      className={`pl-6 text-sm ${errors[`line_price_${idx}`] ? "border-destructive" : ""}`}
                      data-ocid={`line-price-${idx}`}
                    />
                  </div>

                  <Select
                    value={li.vatRate}
                    onValueChange={(v) =>
                      updateLine(li.id, "vatRate", v as VatRate)
                    }
                  >
                    <SelectTrigger
                      className="text-sm"
                      data-ocid={`line-vat-${idx}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vatRateOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="font-mono text-sm text-foreground font-medium text-right min-w-[70px]">
                    {formatGBP(lineCalcs[idx].total)}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLine(li.id)}
                    disabled={lineItems.length === 1}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    aria-label="Remove line item"
                    data-ocid={`line-remove-${idx}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addLine}
              className="mt-3 text-muted-foreground hover:text-foreground"
              data-ocid="add-line-item-btn"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add line item
            </Button>
          </div>

          {/* Totals summary */}
          <div className="flex justify-end">
            <div className="w-56 space-y-1.5 text-sm bg-muted/30 rounded-lg p-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">{formatGBP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>VAT</span>
                <span className="font-mono">{formatGBP(totalVat)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-foreground">
                <span>Total</span>
                <span className="font-mono">{formatGBP(grandTotal)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes + Recurring */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-notes">Notes</Label>
              <Textarea
                id="inv-notes"
                placeholder="Payment terms, references, or special instructions…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                data-ocid="inv-notes"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                <RefreshCw className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    Recurring Invoice
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Auto-generate on a schedule
                  </div>
                </div>
                <Switch
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                  data-ocid="inv-recurring-toggle"
                />
              </div>

              {isRecurring && (
                <div className="space-y-1.5">
                  <Label htmlFor="inv-frequency">Frequency</Label>
                  <Select
                    value={frequency}
                    onValueChange={(v) => setFrequency(v as RecurringFrequency)}
                  >
                    <SelectTrigger
                      id="inv-frequency"
                      data-ocid="inv-frequency-select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={RecurringFrequency.Weekly}>
                        Weekly
                      </SelectItem>
                      <SelectItem value={RecurringFrequency.Monthly}>
                        Monthly
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            data-ocid="inv-submit-btn"
          >
            {loading
              ? isEditing
                ? "Saving…"
                : "Creating…"
              : isEditing
                ? "Save Changes"
                : "Create Invoice"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
