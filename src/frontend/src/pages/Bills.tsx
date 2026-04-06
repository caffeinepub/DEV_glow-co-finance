import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpDown, CheckCircle2, Pencil, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/shared/StatusBadge";
import {
  useBills,
  useCreateBill,
  useMarkBillPaid,
  useProducts,
  useSuppliers,
  useUpdateBill,
} from "../hooks/useBackend";
import {
  BILL_CATEGORY_LABELS,
  dateToTimestamp,
  formatDate,
  formatGBP,
  timestampToDate,
  vatRateToNumber,
} from "../lib/format";
import { BillCategory, BillStatus, VatRate } from "../types";
import type {
  BillShared,
  CreateBillData,
  ProductShared,
  Supplier,
} from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

type SortField = "date" | "dueDate" | "amount" | "supplierName";
type SortDir = "asc" | "desc";

interface FormState {
  supplierId: string;
  supplierName: string;
  date: string;
  dueDate: string;
  amount: string;
  vatRate: VatRate;
  category: BillCategory;
  notes: string;
  linkedProductIds: string[];
}

const EMPTY_FORM: FormState = {
  supplierId: "",
  supplierName: "",
  date: new Date().toISOString().slice(0, 10),
  dueDate: "",
  amount: "",
  vatRate: VatRate.Twenty,
  category: BillCategory.Ingredients,
  notes: "",
  linkedProductIds: [],
};

const BILL_STATUSES = ["All", "Unpaid", "Paid", "Overdue"] as const;
const CATEGORY_OPTIONS = Object.entries(BILL_CATEGORY_LABELS) as [
  string,
  string,
][];

const VAT_OPTIONS: { label: string; value: VatRate }[] = [
  { label: "20%", value: VatRate.Twenty },
  { label: "5%", value: VatRate.Five },
  { label: "0%", value: VatRate.Zero },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcVatAmount(amount: number, rate: VatRate): number {
  return +Number(amount * (vatRateToNumber(rate) / 100)).toFixed(2);
}

function toDateInput(ts: bigint): string {
  try {
    return timestampToDate(ts).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

// ─── Bill Form ────────────────────────────────────────────────────────────────

interface BillFormProps {
  suppliers: Supplier[];
  products: ProductShared[];
  initial?: FormState;
  onSubmit: (data: FormState) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  title: string;
}

function BillForm({
  suppliers,
  products,
  initial = EMPTY_FORM,
  onSubmit,
  onCancel,
  isSubmitting,
  title,
}: BillFormProps) {
  const [form, setForm] = useState<FormState>(initial);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const amountNum = Number.parseFloat(form.amount) || 0;
  const vatPreview = calcVatAmount(amountNum, form.vatRate);

  const handleSupplierChange = (id: string) => {
    const supplier = suppliers.find((s) => s.id.toString() === id);
    set("supplierId", id);
    set("supplierName", supplier?.name ?? "");
    if (supplier?.category) set("category", supplier.category);
  };

  const toggleProduct = (pid: string) => {
    set(
      "linkedProductIds",
      form.linkedProductIds.includes(pid)
        ? form.linkedProductIds.filter((p) => p !== pid)
        : [...form.linkedProductIds, pid],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierId || !form.amount || !form.date || !form.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle className="font-display text-lg">{title}</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Supplier */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="bill-supplier">Supplier *</Label>
          <Select value={form.supplierId} onValueChange={handleSupplierChange}>
            <SelectTrigger id="bill-supplier" data-ocid="bill-supplier-select">
              <SelectValue placeholder="Select supplier…" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s.id.toString()} value={s.id.toString()}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label htmlFor="bill-date">Bill Date *</Label>
          <Input
            id="bill-date"
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            data-ocid="bill-date-input"
            required
          />
        </div>

        {/* Due Date */}
        <div className="space-y-1.5">
          <Label htmlFor="bill-due">Due Date *</Label>
          <Input
            id="bill-due"
            type="date"
            value={form.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
            data-ocid="bill-due-date-input"
            required
          />
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <Label htmlFor="bill-amount">Amount (ex. VAT) *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              £
            </span>
            <Input
              id="bill-amount"
              type="number"
              min="0"
              step="0.01"
              className="pl-7"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              data-ocid="bill-amount-input"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* VAT Rate */}
        <div className="space-y-1.5">
          <Label htmlFor="bill-vat">
            VAT Rate{" "}
            {form.amount && (
              <span className="text-muted-foreground font-normal">
                (= {formatGBP(vatPreview)})
              </span>
            )}
          </Label>
          <Select
            value={form.vatRate}
            onValueChange={(v) => set("vatRate", v as VatRate)}
          >
            <SelectTrigger id="bill-vat" data-ocid="bill-vat-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VAT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="bill-category">Category</Label>
          <Select
            value={form.category}
            onValueChange={(v) => set("category", v as BillCategory)}
          >
            <SelectTrigger id="bill-category" data-ocid="bill-category-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="bill-notes">Notes</Label>
          <Textarea
            id="bill-notes"
            rows={2}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Optional notes…"
            data-ocid="bill-notes-input"
          />
        </div>

        {/* Linked Products */}
        {products.length > 0 && (
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Linked Products (optional)</Label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 bg-background border border-border rounded-md">
              {products.map((p) => {
                const id = p.id.toString();
                const active = form.linkedProductIds.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleProduct(id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-smooth ${
                      active
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "bg-muted border-border text-muted-foreground hover:border-primary/40"
                    }`}
                    data-ocid={`bill-product-${id}`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          data-ocid="bill-submit-btn"
        >
          {isSubmitting ? "Saving…" : "Save Bill"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Mark Paid Dialog ─────────────────────────────────────────────────────────

interface MarkPaidDialogProps {
  bill: BillShared;
  onConfirm: (paidDate: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function MarkPaidDialog({
  bill,
  onConfirm,
  onCancel,
  isSubmitting,
}: MarkPaidDialogProps) {
  const [paidDate, setPaidDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="font-display">Mark Bill as Paid</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">
        Bill{" "}
        <span className="font-medium text-foreground">{bill.billNumber}</span>{" "}
        from{" "}
        <span className="font-medium text-foreground">{bill.supplierName}</span>{" "}
        — {formatGBP(bill.amount + bill.vatAmount)}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="paid-date">Payment Date</Label>
        <Input
          id="paid-date"
          type="date"
          value={paidDate}
          onChange={(e) => setPaidDate(e.target.value)}
          data-ocid="bill-paid-date-input"
        />
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="bg-success/20 text-success border border-success/30 hover:bg-success/30"
          onClick={() => onConfirm(paidDate)}
          disabled={isSubmitting || !paidDate}
          data-ocid="bill-mark-paid-confirm"
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          {isSubmitting ? "Saving…" : "Confirm Payment"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Sort Button ──────────────────────────────────────────────────────────────

function SortButton({
  field,
  current,
  dir,
  onSort,
  children,
}: {
  field: SortField;
  current: SortField;
  dir: SortDir;
  onSort: (f: SortField) => void;
  children: React.ReactNode;
}) {
  const active = field === current;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 hover:text-foreground transition-colors duration-150 ${
        active ? "text-foreground font-semibold" : "text-muted-foreground"
      }`}
    >
      {children}
      <ArrowUpDown
        className={`w-3 h-3 ${active ? (dir === "asc" ? "rotate-180" : "") : "opacity-40"}`}
      />
    </button>
  );
}

// ─── Bills Page ───────────────────────────────────────────────────────────────

type ModalMode = "none" | "create" | "edit" | "pay";

export function Bills() {
  const { data: bills = [], isLoading } = useBills();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();

  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const markPaid = useMarkBillPaid();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  // Sort
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Modals
  const [modal, setModal] = useState<ModalMode>("none");
  const [editingBill, setEditingBill] = useState<BillShared | null>(null);
  const [payingBill, setPayingBill] = useState<BillShared | null>(null);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = [...bills];

    if (statusFilter !== "All")
      result = result.filter((b) => b.status === statusFilter);
    if (categoryFilter !== "All")
      result = result.filter((b) => b.category === categoryFilter);
    if (search.trim())
      result = result.filter(
        (b) =>
          b.supplierName.toLowerCase().includes(search.toLowerCase()) ||
          b.billNumber.toLowerCase().includes(search.toLowerCase()),
      );
    if (dateFrom)
      result = result.filter(
        (b) => Number(b.date) / 1_000_000 >= new Date(dateFrom).getTime(),
      );
    if (dateTo)
      result = result.filter(
        (b) =>
          Number(b.date) / 1_000_000 <=
          new Date(`${dateTo}T23:59:59`).getTime(),
      );

    result.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortField === "date") {
        av = Number(a.date);
        bv = Number(b.date);
      } else if (sortField === "dueDate") {
        av = Number(a.dueDate);
        bv = Number(b.dueDate);
      } else if (sortField === "amount") {
        av = a.amount;
        bv = b.amount;
      } else {
        av = a.supplierName.toLowerCase();
        bv = b.supplierName.toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    bills,
    statusFilter,
    categoryFilter,
    search,
    dateFrom,
    dateTo,
    sortField,
    sortDir,
  ]);

  const totalAmount = filtered.reduce((s, b) => s + b.amount, 0);
  const totalVat = filtered.reduce((s, b) => s + b.vatAmount, 0);

  const buildCreateBillData = (form: FormState): CreateBillData => {
    const amount = Number.parseFloat(form.amount) || 0;
    return {
      supplierId: BigInt(form.supplierId),
      supplierName: form.supplierName,
      date: dateToTimestamp(new Date(form.date)),
      dueDate: dateToTimestamp(new Date(form.dueDate)),
      amount,
      vatRate: form.vatRate,
      vatAmount: calcVatAmount(amount, form.vatRate),
      category: form.category,
      notes: form.notes,
      linkedProductIds: form.linkedProductIds.map(BigInt),
    };
  };

  const handleCreate = (form: FormState) => {
    createBill.mutate(buildCreateBillData(form), {
      onSuccess: () => {
        toast.success("Bill created");
        setModal("none");
      },
      onError: () => toast.error("Failed to create bill"),
    });
  };

  const handleEdit = (form: FormState) => {
    if (!editingBill) return;
    updateBill.mutate(
      { id: editingBill.id, data: buildCreateBillData(form) },
      {
        onSuccess: () => {
          toast.success("Bill updated");
          setModal("none");
          setEditingBill(null);
        },
        onError: () => toast.error("Failed to update bill"),
      },
    );
  };

  const handleMarkPaid = (paidDate: string) => {
    if (!payingBill) return;
    markPaid.mutate(
      { id: payingBill.id, paidDate: dateToTimestamp(new Date(paidDate)) },
      {
        onSuccess: () => {
          toast.success("Bill marked as paid");
          setModal("none");
          setPayingBill(null);
        },
        onError: () => toast.error("Failed to mark bill as paid"),
      },
    );
  };

  const openEdit = (bill: BillShared) => {
    setEditingBill(bill);
    setModal("edit");
  };

  const openPay = (bill: BillShared) => {
    setPayingBill(bill);
    setModal("pay");
  };

  const closeModal = () => {
    setModal("none");
    setEditingBill(null);
    setPayingBill(null);
  };

  const editInitial: FormState | undefined = editingBill
    ? {
        supplierId: editingBill.supplierId.toString(),
        supplierName: editingBill.supplierName,
        date: toDateInput(editingBill.date),
        dueDate: toDateInput(editingBill.dueDate),
        amount: editingBill.amount.toString(),
        vatRate: editingBill.vatRate,
        category: editingBill.category,
        notes: editingBill.notes,
        linkedProductIds: editingBill.linkedProductIds.map((id) =>
          id.toString(),
        ),
      }
    : undefined;

  return (
    <div className="p-4 md:p-6 space-y-5" data-ocid="bills-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-section-heading text-foreground">
            Bills &amp; Receipts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track supplier bills and outgoing payments
          </p>
        </div>
        <Button
          onClick={() => setModal("create")}
          className="gap-1.5 shrink-0"
          data-ocid="new-bill-btn"
        >
          <Plus className="w-4 h-4" />
          New Bill
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="lg:col-span-1">
            <Input
              placeholder="Search supplier or bill #…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-sm"
              data-ocid="bills-search-input"
            />
          </div>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="h-9 text-sm"
              data-ocid="bills-status-filter"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {BILL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger
              className="h-9 text-sm"
              data-ocid="bills-category-filter"
            >
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORY_OPTIONS.map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range */}
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 text-sm"
              data-ocid="bills-date-from"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 text-sm"
              data-ocid="bills-date-to"
            />
          </div>
        </div>

        {(statusFilter !== "All" ||
          categoryFilter !== "All" ||
          search ||
          dateFrom ||
          dateTo) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter("All");
              setCategoryFilter("All");
              setSearch("");
              setDateFrom("");
              setDateTo("");
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="bills-clear-filters"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Bill #
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton
                    field="supplierName"
                    current={sortField}
                    dir={sortDir}
                    onSort={handleSort}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Supplier
                    </span>
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton
                    field="date"
                    current={sortField}
                    dir={sortDir}
                    onSort={handleSort}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Date
                    </span>
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton
                    field="dueDate"
                    current={sortField}
                    dir={sortDir}
                    onSort={handleSort}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Due Date
                    </span>
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-right">
                  <SortButton
                    field="amount"
                    current={sortField}
                    dir={sortDir}
                    onSort={handleSort}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Amount
                    </span>
                  </SortButton>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  VAT
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                (["a", "b", "c", "d", "e"] as const).map((row) => (
                  <tr
                    key={`skel-row-${row}`}
                    className="border-b border-border/50"
                  >
                    {(
                      ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const
                    ).map((col) => (
                      <td key={`skel-${row}-${col}`} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-16 text-center"
                    data-ocid="bills-empty-state"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-2xl">
                        🧾
                      </div>
                      <p className="font-medium text-foreground">
                        No bills found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bills.length === 0
                          ? "Add your first supplier bill to get started"
                          : "Try adjusting your filters"}
                      </p>
                      {bills.length === 0 && (
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={() => setModal("create")}
                          data-ocid="bills-empty-create-btn"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          New Bill
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((bill) => (
                  <BillRow
                    key={bill.id.toString()}
                    bill={bill}
                    onEdit={() => openEdit(bill)}
                    onPay={() => openPay(bill)}
                  />
                ))
              )}
            </tbody>
            {/* Totals Row */}
            {!isLoading && filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/30">
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {filtered.length} bill{filtered.length !== 1 ? "s" : ""}{" "}
                    total
                  </td>
                  <td className="px-4 py-3 text-right font-semibold font-mono text-foreground">
                    {formatGBP(totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold font-mono text-muted-foreground">
                    {formatGBP(totalVat)}
                  </td>
                  <td
                    colSpan={3}
                    className="px-4 py-3 text-right text-xs text-muted-foreground"
                  >
                    Total incl. VAT:{" "}
                    <span className="font-semibold text-foreground font-mono">
                      {formatGBP(totalAmount + totalVat)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog
        open={modal === "create"}
        onOpenChange={(o) => !o && closeModal()}
      >
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="create-bill-dialog"
        >
          <BillForm
            suppliers={suppliers}
            products={products}
            onSubmit={handleCreate}
            onCancel={closeModal}
            isSubmitting={createBill.isPending}
            title="New Bill"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={modal === "edit" && !!editingBill}
        onOpenChange={(o) => !o && closeModal()}
      >
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="edit-bill-dialog"
        >
          {editingBill && editInitial && (
            <BillForm
              suppliers={suppliers}
              products={products}
              initial={editInitial}
              onSubmit={handleEdit}
              onCancel={closeModal}
              isSubmitting={updateBill.isPending}
              title={`Edit ${editingBill.billNumber}`}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Mark Paid Dialog */}
      <Dialog
        open={modal === "pay" && !!payingBill}
        onOpenChange={(o) => !o && closeModal()}
      >
        <DialogContent className="max-w-md" data-ocid="mark-paid-dialog">
          {payingBill && (
            <MarkPaidDialog
              bill={payingBill}
              onConfirm={handleMarkPaid}
              onCancel={closeModal}
              isSubmitting={markPaid.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Bill Row ─────────────────────────────────────────────────────────────────

interface BillRowProps {
  bill: BillShared;
  onEdit: () => void;
  onPay: () => void;
}

function BillRow({ bill, onEdit, onPay }: BillRowProps) {
  const canPay =
    bill.status === BillStatus.Unpaid || bill.status === BillStatus.Overdue;
  const isOverdue = bill.status === BillStatus.Overdue;

  return (
    <tr
      className="border-b border-border/50 hover:bg-muted/20 transition-colors duration-150"
      data-ocid={`bill-row-${bill.id}`}
    >
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
        {bill.billNumber}
      </td>
      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap max-w-[160px] truncate">
        {bill.supplierName}
      </td>
      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
        {formatDate(bill.date)}
      </td>
      <td
        className={`px-4 py-3 whitespace-nowrap ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}
      >
        {formatDate(bill.dueDate)}
      </td>
      <td className="px-4 py-3 text-right font-mono font-medium text-foreground whitespace-nowrap">
        {formatGBP(bill.amount)}
      </td>
      <td className="px-4 py-3 text-right font-mono text-muted-foreground whitespace-nowrap">
        {formatGBP(bill.vatAmount)}
      </td>
      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
        {BILL_CATEGORY_LABELS[bill.category] ?? bill.category}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={bill.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {canPay && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-success hover:bg-success/10 hover:text-success"
              onClick={onPay}
              data-ocid={`bill-pay-btn-${bill.id}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Pay
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
            aria-label="Edit bill"
            data-ocid={`bill-edit-btn-${bill.id}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
