import { InvoiceDetailDialog } from "@/components/invoices/InvoiceDetailDialog";
import { InvoiceFormDialog } from "@/components/invoices/InvoiceFormDialog";
import { MarkPaidDialog } from "@/components/invoices/MarkPaidDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateInvoice,
  useCustomers,
  useInvoices,
  useMarkInvoicePaid,
  useProducts,
  useUpdateInvoice,
} from "@/hooks/useBackend";
import { dateToTimestamp, formatDate, formatGBP } from "@/lib/format";
import type { InvoiceShared } from "@/types";
import { InvoiceStatus } from "@/types";
import { FileText, Plus, Search } from "lucide-react";
import { useState } from "react";

type StatusFilter = "All" | "Draft" | "Sent" | "Paid" | "Overdue";

export function Invoices() {
  const { data: invoices, isLoading } = useInvoices();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const markInvoicePaid = useMarkInvoicePaid();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [viewingInvoice, setViewingInvoice] = useState<InvoiceShared | null>(
    null,
  );
  const [editingInvoice, setEditingInvoice] = useState<InvoiceShared | null>(
    null,
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [markingPaidInvoice, setMarkingPaidInvoice] =
    useState<InvoiceShared | null>(null);

  const filtered = (invoices ?? []).filter((inv) => {
    if (statusFilter !== "All" && inv.status !== statusFilter) return false;
    if (
      searchQuery &&
      !inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;

    if (dateFrom) {
      const from = dateToTimestamp(new Date(dateFrom));
      if (inv.issueDate < from) return false;
    }
    if (dateTo) {
      const to = dateToTimestamp(new Date(`${dateTo}T23:59:59`));
      if (inv.issueDate > to) return false;
    }
    return true;
  });

  const statusCounts: Record<StatusFilter, number> = {
    All: invoices?.length ?? 0,
    Draft:
      invoices?.filter((i) => i.status === InvoiceStatus.Draft).length ?? 0,
    Sent: invoices?.filter((i) => i.status === InvoiceStatus.Sent).length ?? 0,
    Paid: invoices?.filter((i) => i.status === InvoiceStatus.Paid).length ?? 0,
    Overdue:
      invoices?.filter((i) => i.status === InvoiceStatus.Overdue).length ?? 0,
  };

  return (
    <div className="flex flex-col min-h-full" data-ocid="invoices-page">
      {/* Page Header */}
      <div className="bg-card border-b border-border px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-section-heading text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create, send, and track customer invoices
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="shrink-0"
          data-ocid="create-invoice-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-muted/30 border-b border-border px-6 py-4">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(["All", "Draft", "Sent", "Paid", "Overdue"] as StatusFilter[]).map(
            (s) => (
              <button
                type="button"
                key={s}
                onClick={() => setStatusFilter(s)}
                data-ocid={`filter-status-${s.toLowerCase()}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground border border-border hover:text-foreground hover:border-border/80"
                }`}
              >
                {s}
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4 ml-0.5"
                >
                  {statusCounts[s]}
                </Badge>
              </button>
            ),
          )}
        </div>

        {/* Search + date range */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by invoice # or customer…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-ocid="invoice-search-input"
            />
          </div>
          <div className="flex gap-2 items-center shrink-0">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36"
              data-ocid="filter-date-from"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36"
              data-ocid="filter-date-to"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-background p-6">
        {isLoading ? (
          <div className="space-y-3">
            {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"].map((k) => (
              <Skeleton key={k} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 text-center"
            data-ocid="invoices-empty-state"
          >
            <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-semibold text-foreground mb-1">
              No invoices found
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {statusFilter === "All" && !searchQuery
                ? "Create your first invoice to get started"
                : "Try adjusting your filters"}
            </p>
            {statusFilter === "All" && !searchQuery && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 text-label text-muted-foreground font-semibold">
                      Invoice #
                    </th>
                    <th className="text-left px-4 py-3 text-label text-muted-foreground font-semibold">
                      Customer
                    </th>
                    <th className="text-left px-4 py-3 text-label text-muted-foreground font-semibold hidden md:table-cell">
                      Issue Date
                    </th>
                    <th className="text-left px-4 py-3 text-label text-muted-foreground font-semibold hidden md:table-cell">
                      Due Date
                    </th>
                    <th className="text-right px-4 py-3 text-label text-muted-foreground font-semibold">
                      Amount
                    </th>
                    <th className="text-left px-4 py-3 text-label text-muted-foreground font-semibold">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-label text-muted-foreground font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((invoice, idx) => (
                    <tr
                      key={invoice.id.toString()}
                      className={`border-b border-border/50 hover:bg-muted/20 transition-colors duration-100 cursor-pointer ${
                        idx % 2 === 1 ? "bg-muted/10" : ""
                      }`}
                      onClick={() => setViewingInvoice(invoice)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setViewingInvoice(invoice)
                      }
                      tabIndex={0}
                      data-ocid={`invoice-row-${invoice.id}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-foreground font-medium">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium truncate max-w-[160px]">
                        {invoice.customerName}
                        {invoice.isRecurring && (
                          <span className="ml-2 text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">
                            Recurring
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {formatDate(invoice.issueDate)}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className={
                            invoice.status === InvoiceStatus.Overdue
                              ? "text-destructive font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {formatDate(invoice.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold font-mono text-foreground">
                        {formatGBP(invoice.grandTotal)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <InvoiceRowActions
                          invoice={invoice}
                          onView={() => setViewingInvoice(invoice)}
                          onEdit={() => setEditingInvoice(invoice)}
                          onMarkPaid={() => setMarkingPaidInvoice(invoice)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 bg-muted/20 border-t border-border/50 text-xs text-muted-foreground text-right">
              {filtered.length} invoice{filtered.length !== 1 ? "s" : ""} ·{" "}
              Total:{" "}
              <span className="font-semibold text-foreground">
                {formatGBP(filtered.reduce((s, i) => s + i.grandTotal, 0))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {viewingInvoice && (
        <InvoiceDetailDialog
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          onMarkPaid={() => {
            setMarkingPaidInvoice(viewingInvoice);
            setViewingInvoice(null);
          }}
          onEdit={() => {
            setEditingInvoice(viewingInvoice);
            setViewingInvoice(null);
          }}
        />
      )}

      {(showCreateForm || editingInvoice) && (
        <InvoiceFormDialog
          invoice={editingInvoice}
          customers={customers ?? []}
          products={products ?? []}
          onClose={() => {
            setShowCreateForm(false);
            setEditingInvoice(null);
          }}
          onCreate={async (data) => {
            await createInvoice.mutateAsync(data);
            setShowCreateForm(false);
          }}
          onUpdate={async (id, data) => {
            await updateInvoice.mutateAsync({ id, data });
            setEditingInvoice(null);
          }}
        />
      )}

      {markingPaidInvoice && (
        <MarkPaidDialog
          invoice={markingPaidInvoice}
          onClose={() => setMarkingPaidInvoice(null)}
          onConfirm={async (paidDate) => {
            await markInvoicePaid.mutateAsync({
              id: markingPaidInvoice.id,
              paidDate: dateToTimestamp(paidDate),
            });
            setMarkingPaidInvoice(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Row Actions ─────────────────────────────────────────────────────────────

function InvoiceRowActions({
  invoice,
  onView,
  onEdit,
  onMarkPaid,
}: {
  invoice: InvoiceShared;
  onView: () => void;
  onEdit: () => void;
  onMarkPaid: () => void;
}) {
  const canMarkPaid =
    invoice.status === InvoiceStatus.Sent ||
    invoice.status === InvoiceStatus.Overdue;
  const canEdit = invoice.status === InvoiceStatus.Draft;

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onView}
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        data-ocid={`invoice-view-${invoice.id}`}
      >
        View
      </Button>
      {canMarkPaid && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onMarkPaid}
          className="h-7 px-2 text-xs text-success hover:text-success hover:bg-success/10"
          data-ocid={`invoice-mark-paid-${invoice.id}`}
        >
          Mark Paid
        </Button>
      )}
      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          data-ocid={`invoice-edit-${invoice.id}`}
        >
          Edit
        </Button>
      )}
    </div>
  );
}
