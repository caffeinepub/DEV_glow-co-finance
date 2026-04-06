import { StatusBadge } from "@/components/shared/StatusBadge";
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useBills,
  useCreateCustomer,
  useCreateSupplier,
  useCustomers,
  useInvoices,
  useSuppliers,
  useUpdateCustomer,
  useUpdateSupplier,
} from "@/hooks/useBackend";
import { BILL_CATEGORY_LABELS, formatDate, formatGBP } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  CreateCustomerData,
  CreateSupplierData,
  Customer,
  Supplier,
} from "@/types";
import { BillCategory, CustomerType } from "@/types";
import {
  Building2,
  ChevronRight,
  FileText,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Customer Detail Sheet ──────────────────────────────────────────────────

function CustomerDetailSheet({
  customer,
  onClose,
  onEdit,
}: {
  customer: Customer;
  onClose: () => void;
  onEdit: (c: Customer) => void;
}) {
  const { data: invoices } = useInvoices();

  const customerInvoices = useMemo(
    () => (invoices ?? []).filter((inv) => inv.customerId === customer.id),
    [invoices, customer.id],
  );

  const totalRevenue = customerInvoices.reduce(
    (sum, inv) => sum + inv.grandTotal,
    0,
  );
  const outstanding = customerInvoices
    .filter((inv) => inv.status === "Overdue" || inv.status === "Sent")
    .reduce((sum, inv) => sum + inv.grandTotal, 0);

  return (
    <Sheet open onOpenChange={() => onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-card border-l border-border overflow-y-auto"
      >
        <SheetHeader className="flex flex-row items-start justify-between gap-2 pb-4">
          <div className="min-w-0">
            <SheetTitle className="font-display text-lg text-foreground truncate">
              {customer.name}
            </SheetTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {customer.email}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(customer)}
              data-ocid="customer-detail-edit-btn"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-background rounded-lg p-3 border border-border">
            <p className="text-label text-muted-foreground mb-1">
              Total Revenue
            </p>
            <p className="text-lg font-bold font-display text-foreground">
              {formatGBP(totalRevenue)}
            </p>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border">
            <p className="text-label text-muted-foreground mb-1">Outstanding</p>
            <p
              className={cn(
                "text-lg font-bold font-display",
                outstanding > 0 ? "text-destructive" : "text-success",
              )}
            >
              {formatGBP(outstanding)}
            </p>
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-background rounded-lg border border-border p-4 mb-5 space-y-2 text-sm">
          {customer.phone && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16 shrink-0">Phone</span>
              <span className="text-foreground">{customer.phone}</span>
            </div>
          )}
          {customer.address && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16 shrink-0">
                Address
              </span>
              <span className="text-foreground break-words">
                {customer.address}
              </span>
            </div>
          )}
          {customer.notes && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16 shrink-0">Notes</span>
              <span className="text-foreground break-words">
                {customer.notes}
              </span>
            </div>
          )}
        </div>

        {/* Invoice history */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Invoice History ({customerInvoices.length})
          </h3>
          {customerInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No invoices yet
            </p>
          ) : (
            <div className="space-y-2">
              {customerInvoices.map((inv) => (
                <div
                  key={inv.id.toString()}
                  className="flex items-center justify-between bg-background rounded-lg border border-border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground font-mono">
                      {inv.invoiceNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(inv.issueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-foreground">
                      {formatGBP(inv.grandTotal)}
                    </span>
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Supplier Detail Sheet ───────────────────────────────────────────────────

function SupplierDetailSheet({
  supplier,
  onClose,
  onEdit,
}: {
  supplier: Supplier;
  onClose: () => void;
  onEdit: (s: Supplier) => void;
}) {
  const { data: bills } = useBills();

  const supplierBills = useMemo(
    () => (bills ?? []).filter((b) => b.supplierId === supplier.id),
    [bills, supplier.id],
  );

  const totalSpend = supplierBills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <Sheet open onOpenChange={() => onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-card border-l border-border overflow-y-auto"
      >
        <SheetHeader className="flex flex-row items-start justify-between gap-2 pb-4">
          <div className="min-w-0">
            <SheetTitle className="font-display text-lg text-foreground truncate">
              {supplier.name}
            </SheetTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {BILL_CATEGORY_LABELS[supplier.category] ?? supplier.category}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(supplier)}
              data-ocid="supplier-detail-edit-btn"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Stats */}
        <div className="bg-background rounded-lg p-3 border border-border mb-5">
          <p className="text-label text-muted-foreground mb-1">Total Spend</p>
          <p className="text-lg font-bold font-display text-foreground">
            {formatGBP(totalSpend)}
          </p>
        </div>

        {/* Contact info */}
        <div className="bg-background rounded-lg border border-border p-4 mb-5 space-y-2 text-sm">
          {supplier.email && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16 shrink-0">Email</span>
              <span className="text-foreground break-words">
                {supplier.email}
              </span>
            </div>
          )}
          {supplier.phone && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16 shrink-0">Phone</span>
              <span className="text-foreground">{supplier.phone}</span>
            </div>
          )}
          {supplier.address && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16 shrink-0">
                Address
              </span>
              <span className="text-foreground break-words">
                {supplier.address}
              </span>
            </div>
          )}
          {supplier.notes && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16 shrink-0">Notes</span>
              <span className="text-foreground break-words">
                {supplier.notes}
              </span>
            </div>
          )}
        </div>

        {/* Bill history */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
            Bill History ({supplierBills.length})
          </h3>
          {supplierBills.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No bills yet
            </p>
          ) : (
            <div className="space-y-2">
              {supplierBills.map((bill) => (
                <div
                  key={bill.id.toString()}
                  className="flex items-center justify-between bg-background rounded-lg border border-border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground font-mono">
                      {bill.billNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(bill.date)} ·{" "}
                      {BILL_CATEGORY_LABELS[bill.category] ?? bill.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-foreground">
                      {formatGBP(bill.amount)}
                    </span>
                    <StatusBadge status={bill.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Customer Form Dialog ────────────────────────────────────────────────────

function CustomerFormDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Customer;
  onClose: () => void;
  onSaved: () => void;
}) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const isEdit = !!initial;

  const [form, setForm] = useState<CreateCustomerData>({
    name: initial?.name ?? "",
    customerType: initial?.customerType ?? CustomerType.DTC,
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    address: initial?.address ?? "",
    notes: initial?.notes ?? "",
  });

  function set<K extends keyof CreateCustomerData>(
    key: K,
    val: CreateCustomerData[K],
  ) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    if (isEdit && initial) {
      await updateCustomer.mutateAsync({ id: initial.id, data: form });
      toast.success("Customer updated");
    } else {
      await createCustomer.mutateAsync(form);
      toast.success("Customer added");
    }
    onSaved();
  }

  const busy = createCustomer.isPending || updateCustomer.isPending;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Edit Customer" : "Add Customer"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. The Beauty Lounge"
                data-ocid="customer-form-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.customerType}
                onValueChange={(v) => set("customerType", v as CustomerType)}
              >
                <SelectTrigger data-ocid="customer-form-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CustomerType.DTC}>DTC</SelectItem>
                  <SelectItem value={CustomerType.Wholesale}>
                    Wholesale
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+44 7700 000000"
                data-ocid="customer-form-phone"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="contact@example.com"
                type="email"
                data-ocid="customer-form-email"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Street, City, Postcode"
                data-ocid="customer-form-address"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Any additional details…"
                rows={3}
                data-ocid="customer-form-notes"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={busy || !form.name.trim()}
            data-ocid="customer-form-submit"
          >
            {busy ? "Saving…" : isEdit ? "Save Changes" : "Add Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Supplier Form Dialog ────────────────────────────────────────────────────

function SupplierFormDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Supplier;
  onClose: () => void;
  onSaved: () => void;
}) {
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const isEdit = !!initial;

  const [form, setForm] = useState<CreateSupplierData>({
    name: initial?.name ?? "",
    category: initial?.category ?? BillCategory.Ingredients,
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    address: initial?.address ?? "",
    notes: initial?.notes ?? "",
  });

  function set<K extends keyof CreateSupplierData>(
    key: K,
    val: CreateSupplierData[K],
  ) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    if (isEdit && initial) {
      await updateSupplier.mutateAsync({ id: initial.id, data: form });
      toast.success("Supplier updated");
    } else {
      await createSupplier.mutateAsync(form);
      toast.success("Supplier added");
    }
    onSaved();
  }

  const busy = createSupplier.isPending || updateSupplier.isPending;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Edit Supplier" : "Add Supplier"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. NatureChem Ingredients"
                data-ocid="supplier-form-name"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v as BillCategory)}
              >
                <SelectTrigger data-ocid="supplier-form-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BILL_CATEGORY_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+44 20 0000 0000"
                data-ocid="supplier-form-phone"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="orders@supplier.com"
                type="email"
                data-ocid="supplier-form-email"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Street, City, Postcode"
                data-ocid="supplier-form-address"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Payment terms, delivery notes…"
                rows={3}
                data-ocid="supplier-form-notes"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={busy || !form.name.trim()}
            data-ocid="supplier-form-submit"
          >
            {busy ? "Saving…" : isEdit ? "Save Changes" : "Add Supplier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Customer Type Badge ─────────────────────────────────────────────────────

function TypeBadge({ type }: { type: CustomerType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold tracking-wide",
        type === CustomerType.Wholesale
          ? "bg-primary/10 text-primary border border-primary/30"
          : "bg-success/10 text-success border border-success/30",
      )}
    >
      {type}
    </span>
  );
}

// ─── Main Contacts Page ──────────────────────────────────────────────────────

export function Contacts() {
  const { data: customers, isLoading: loadingCustomers } = useCustomers();
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers();
  const { data: invoices } = useInvoices();
  const { data: bills } = useBills();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"customers" | "suppliers">(
    "customers",
  );

  // Dialogs & sheets
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);

  // Outstanding balances derived from invoices/bills
  const customerBalances = useMemo(() => {
    const map = new Map<bigint, number>();
    for (const inv of (invoices ?? []).filter(
      (i) => i.status === "Overdue" || i.status === "Sent",
    )) {
      map.set(inv.customerId, (map.get(inv.customerId) ?? 0) + inv.grandTotal);
    }
    return map;
  }, [invoices]);

  const supplierBalances = useMemo(() => {
    const map = new Map<bigint, number>();
    for (const b of (bills ?? []).filter(
      (bl) => bl.status === "Unpaid" || bl.status === "Overdue",
    )) {
      map.set(b.supplierId, (map.get(b.supplierId) ?? 0) + b.amount);
    }
    return map;
  }, [bills]);

  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase();
    return (customers ?? []).filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const filteredSuppliers = useMemo(() => {
    const q = search.toLowerCase();
    return (suppliers ?? []).filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [suppliers, search]);

  function handleEditCustomer(c: Customer) {
    setViewingCustomer(null);
    setEditingCustomer(c);
  }

  function handleEditSupplier(s: Supplier) {
    setViewingSupplier(null);
    setEditingSupplier(s);
  }

  return (
    <div className="flex flex-col min-h-full" data-ocid="contacts-page">
      {/* Page Header */}
      <div className="bg-card border-b border-border px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-section-heading text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage customers and suppliers
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "customers" ? (
            <Button
              onClick={() => setShowCustomerForm(true)}
              data-ocid="add-customer-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          ) : (
            <Button
              onClick={() => setShowSupplierForm(true)}
              data-ocid="add-supplier-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {/* Search */}
        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="contacts-search"
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "customers" | "suppliers")}
        >
          <TabsList className="mb-4 bg-muted/40">
            <TabsTrigger
              value="customers"
              className="gap-2"
              data-ocid="tab-customers"
            >
              <Users className="h-4 w-4" />
              Customers
              <span className="ml-1 text-xs text-muted-foreground">
                ({customers?.length ?? 0})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="suppliers"
              className="gap-2"
              data-ocid="tab-suppliers"
            >
              <Building2 className="h-4 w-4" />
              Suppliers
              <span className="ml-1 text-xs text-muted-foreground">
                ({suppliers?.length ?? 0})
              </span>
            </TabsTrigger>
          </TabsList>

          {/* ── Customers Tab ─────────────────────────────────────────── */}
          <TabsContent value="customers">
            <div className="card-elevated rounded-xl overflow-hidden">
              {loadingCustomers ? (
                <div className="p-4 space-y-3">
                  {["sk1", "sk2", "sk3", "sk4", "sk5"].map((k) => (
                    <Skeleton key={k} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 text-center"
                  data-ocid="customers-empty-state"
                >
                  <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {search
                      ? "No customers match your search"
                      : "No customers yet"}
                  </p>
                  {!search && (
                    <Button
                      variant="ghost"
                      className="mt-3 text-primary"
                      onClick={() => setShowCustomerForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add your first customer
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-3 text-label text-muted-foreground font-semibold">
                          Name
                        </th>
                        <th className="text-left px-4 py-3 text-label text-muted-foreground font-semibold hidden sm:table-cell">
                          Type
                        </th>
                        <th className="text-left px-4 py-3 text-label text-muted-foreground font-semibold hidden md:table-cell">
                          Email
                        </th>
                        <th className="text-left px-4 py-3 text-label text-muted-foreground font-semibold hidden lg:table-cell">
                          Phone
                        </th>
                        <th className="text-right px-4 py-3 text-label text-muted-foreground font-semibold">
                          Outstanding
                        </th>
                        <th className="w-8 px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((c, i) => {
                        const balance = customerBalances.get(c.id) ?? 0;
                        return (
                          <tr
                            key={c.id.toString()}
                            className={cn(
                              "border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer transition-colors",
                              i % 2 === 0 ? "" : "bg-muted/10",
                            )}
                            onClick={() => setViewingCustomer(c)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && setViewingCustomer(c)
                            }
                            tabIndex={0}
                            data-ocid={`customer-row-${c.id}`}
                          >
                            <td className="px-4 py-3 font-medium text-foreground">
                              <span className="truncate block max-w-[180px]">
                                {c.name}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <TypeBadge type={c.customerType} />
                            </td>
                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                              <span className="truncate block max-w-[200px]">
                                {c.email || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                              {c.phone || "—"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={cn(
                                  "font-semibold font-mono",
                                  balance > 0
                                    ? "text-destructive"
                                    : "text-muted-foreground",
                                )}
                              >
                                {formatGBP(balance)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Suppliers Tab ──────────────────────────────────────────── */}
          <TabsContent value="suppliers">
            <div className="card-elevated rounded-xl overflow-hidden">
              {loadingSuppliers ? (
                <div className="p-4 space-y-3">
                  {["sk1", "sk2", "sk3", "sk4", "sk5"].map((k) => (
                    <Skeleton key={k} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 text-center"
                  data-ocid="suppliers-empty-state"
                >
                  <Building2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {search
                      ? "No suppliers match your search"
                      : "No suppliers yet"}
                  </p>
                  {!search && (
                    <Button
                      variant="ghost"
                      className="mt-3 text-primary"
                      onClick={() => setShowSupplierForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add your first supplier
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-3 text-label text-muted-foreground font-semibold">
                          Name
                        </th>
                        <th className="text-left px-4 py-3 text-label text-muted-foreground font-semibold hidden sm:table-cell">
                          Category
                        </th>
                        <th className="text-left px-4 py-3 text-label text-muted-foreground font-semibold hidden md:table-cell">
                          Email
                        </th>
                        <th className="text-left px-4 py-3 text-label text-muted-foreground font-semibold hidden lg:table-cell">
                          Phone
                        </th>
                        <th className="text-right px-4 py-3 text-label text-muted-foreground font-semibold">
                          Outstanding
                        </th>
                        <th className="w-8 px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSuppliers.map((s, i) => {
                        const balance = supplierBalances.get(s.id) ?? 0;
                        return (
                          <tr
                            key={s.id.toString()}
                            className={cn(
                              "border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer transition-colors",
                              i % 2 === 0 ? "" : "bg-muted/10",
                            )}
                            onClick={() => setViewingSupplier(s)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && setViewingSupplier(s)
                            }
                            tabIndex={0}
                            data-ocid={`supplier-row-${s.id}`}
                          >
                            <td className="px-4 py-3 font-medium text-foreground">
                              <span className="truncate block max-w-[180px]">
                                {s.name}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                              {BILL_CATEGORY_LABELS[s.category] ?? s.category}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                              <span className="truncate block max-w-[200px]">
                                {s.email || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                              {s.phone || "—"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={cn(
                                  "font-semibold font-mono",
                                  balance > 0
                                    ? "text-destructive"
                                    : "text-muted-foreground",
                                )}
                              >
                                {formatGBP(balance)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Sheets ────────────────────────────────────────────────────────── */}
      {viewingCustomer && (
        <CustomerDetailSheet
          customer={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
          onEdit={handleEditCustomer}
        />
      )}
      {viewingSupplier && (
        <SupplierDetailSheet
          supplier={viewingSupplier}
          onClose={() => setViewingSupplier(null)}
          onEdit={handleEditSupplier}
        />
      )}

      {/* ── Dialogs ───────────────────────────────────────────────────────── */}
      {(showCustomerForm || editingCustomer) && (
        <CustomerFormDialog
          initial={editingCustomer ?? undefined}
          onClose={() => {
            setShowCustomerForm(false);
            setEditingCustomer(null);
          }}
          onSaved={() => {
            setShowCustomerForm(false);
            setEditingCustomer(null);
          }}
        />
      )}
      {(showSupplierForm || editingSupplier) && (
        <SupplierFormDialog
          initial={editingSupplier ?? undefined}
          onClose={() => {
            setShowSupplierForm(false);
            setEditingSupplier(null);
          }}
          onSaved={() => {
            setShowSupplierForm(false);
            setEditingSupplier(null);
          }}
        />
      )}
    </div>
  );
}
