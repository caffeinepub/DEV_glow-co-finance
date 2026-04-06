import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateProduct,
  useProducts,
  useUpdateProduct,
} from "@/hooks/useBackend";
import { formatGBP, formatPercent } from "@/lib/format";
import type { CreateProductData, ProductShared } from "@/types";
import {
  AlertTriangle,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Status helpers ───────────────────────────────────────────────────────────

type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

function getStockStatus(product: ProductShared): StockStatus {
  const qty = Number(product.stockQuantity);
  const reorder = Number(product.reorderPoint);
  if (qty === 0) return "out-of-stock";
  if (qty <= reorder) return "low-stock";
  return "in-stock";
}

const STATUS_CONFIG: Record<StockStatus, { label: string; cls: string }> = {
  "in-stock": { label: "In Stock", cls: "badge-success" },
  "low-stock": { label: "Low Stock", cls: "badge-warning" },
  "out-of-stock": { label: "Out of Stock", cls: "badge-destructive" },
};

// ─── Product form ─────────────────────────────────────────────────────────────

interface ProductFormState {
  name: string;
  sku: string;
  stockQuantity: string;
  costPrice: string;
  salePrice: string;
  reorderPoint: string;
  description: string;
}

const EMPTY_FORM: ProductFormState = {
  name: "",
  sku: "",
  stockQuantity: "",
  costPrice: "",
  salePrice: "",
  reorderPoint: "",
  description: "",
};

function productToForm(p: ProductShared): ProductFormState {
  return {
    name: p.name,
    sku: p.sku,
    stockQuantity: Number(p.stockQuantity).toString(),
    costPrice: p.costPrice.toFixed(2),
    salePrice: p.salePrice.toFixed(2),
    reorderPoint: Number(p.reorderPoint).toString(),
    description: p.description,
  };
}

function formToData(f: ProductFormState): CreateProductData {
  return {
    name: f.name.trim(),
    sku: f.sku.trim().toUpperCase(),
    stockQuantity: BigInt(
      Math.max(0, Number.parseInt(f.stockQuantity, 10) || 0),
    ),
    costPrice: Number.parseFloat(f.costPrice) || 0,
    salePrice: Number.parseFloat(f.salePrice) || 0,
    reorderPoint: BigInt(Math.max(0, Number.parseInt(f.reorderPoint, 10) || 0)),
    description: f.description.trim(),
  };
}

function calcMargin(cost: string, sale: string): number | null {
  const c = Number.parseFloat(cost);
  const s = Number.parseFloat(sale);
  if (!c || !s || s === 0) return null;
  return ((s - c) / s) * 100;
}

// ─── Product Dialog ───────────────────────────────────────────────────────────

interface ProductDialogProps {
  open: boolean;
  onClose: () => void;
  editProduct: ProductShared | null;
}

function ProductDialog({ open, onClose, editProduct }: ProductDialogProps) {
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEdit = editProduct !== null;
  const margin = calcMargin(form.costPrice, form.salePrice);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setForm(editProduct ? productToForm(editProduct) : EMPTY_FORM);
    } else {
      onClose();
    }
  };

  const set =
    (field: keyof ProductFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim()) {
      toast.error("Product name and SKU are required.");
      return;
    }
    const data = formToData(form);
    try {
      if (isEdit && editProduct) {
        await updateProduct.mutateAsync({ id: editProduct.id, data });
        toast.success("Product updated successfully.");
      } else {
        await createProduct.mutateAsync(data);
        toast.success("Product added to inventory.");
      }
      onClose();
    } catch {
      toast.error("Failed to save product. Please try again.");
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="prod-name">Product Name *</Label>
              <Input
                id="prod-name"
                data-ocid="product-name-input"
                placeholder="e.g. Rosehip Glow Serum"
                value={form.name}
                onChange={set("name")}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-sku">SKU *</Label>
              <Input
                id="prod-sku"
                data-ocid="product-sku-input"
                placeholder="e.g. RGS-001"
                value={form.sku}
                onChange={set("sku")}
                className="font-mono uppercase"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-qty">Initial Stock Qty</Label>
              <Input
                id="prod-qty"
                data-ocid="product-qty-input"
                type="number"
                min="0"
                placeholder="0"
                value={form.stockQuantity}
                onChange={set("stockQuantity")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-cost">Cost Price (£)</Label>
              <Input
                id="prod-cost"
                data-ocid="product-cost-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.costPrice}
                onChange={set("costPrice")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-sale">Sale Price (£)</Label>
              <Input
                id="prod-sale"
                data-ocid="product-sale-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.salePrice}
                onChange={set("salePrice")}
              />
            </div>

            {margin !== null && (
              <div className="col-span-2 flex items-center gap-2 rounded-md bg-muted/40 border border-border px-3 py-2">
                <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Calculated margin:
                </span>
                <span
                  className={`text-sm font-semibold ${
                    margin >= 30
                      ? "text-[oklch(var(--success))]"
                      : margin >= 0
                        ? "text-[oklch(var(--warning))]"
                        : "text-destructive"
                  }`}
                >
                  {formatPercent(margin)}
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="prod-reorder">Reorder Point</Label>
              <Input
                id="prod-reorder"
                data-ocid="product-reorder-input"
                type="number"
                min="0"
                placeholder="10"
                value={form.reorderPoint}
                onChange={set("reorderPoint")}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="prod-desc">Description</Label>
              <Textarea
                id="prod-desc"
                data-ocid="product-desc-input"
                placeholder="Brief product description…"
                value={form.description}
                onChange={set("description")}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="product-save-btn"
              disabled={isPending}
            >
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Summary cards ────────────────────────────────────────────────────────────

function SummaryCards({ products }: { products: ProductShared[] }) {
  const totalAtCost = products.reduce(
    (s, p) => s + p.costPrice * Number(p.stockQuantity),
    0,
  );
  const totalAtSale = products.reduce(
    (s, p) => s + p.salePrice * Number(p.stockQuantity),
    0,
  );
  const needsAttention = products.filter(
    (p) => getStockStatus(p) !== "in-stock",
  ).length;

  const cards = [
    {
      label: "Total at Cost",
      value: formatGBP(totalAtCost),
      icon: ShoppingBag,
      color: "text-[oklch(var(--chart-4))]",
    },
    {
      label: "Total at Sale Price",
      value: formatGBP(totalAtSale),
      icon: TrendingUp,
      color: "text-[oklch(var(--success))]",
    },
    {
      label: "Total Products",
      value: String(products.length),
      icon: Package,
      color: "text-primary",
    },
    {
      label: "Needs Attention",
      value: String(needsAttention),
      icon: AlertTriangle,
      color:
        needsAttention > 0
          ? "text-[oklch(var(--warning))]"
          : "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
        >
          <Card className="card-elevated">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-label text-muted-foreground">
                  {card.label}
                </span>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className={`text-2xl font-bold font-display ${card.color}`}>
                {card.value}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Low-stock banner ─────────────────────────────────────────────────────────

function LowStockBanner({ products }: { products: ProductShared[] }) {
  const alerts = products.filter((p) => getStockStatus(p) !== "in-stock");
  if (alerts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-lg border border-[oklch(var(--warning)/0.35)] bg-[oklch(var(--warning)/0.08)] px-4 py-3"
      data-ocid="low-stock-banner"
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-[oklch(var(--warning))] mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[oklch(var(--warning))]">
          {alerts.length} product{alerts.length > 1 ? "s" : ""} need restocking
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {alerts.map((p) => p.name).join(" · ")}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

const SKELETON_KEYS = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"];

function TableSkeletons() {
  return (
    <div className="p-6 space-y-3">
      {SKELETON_KEYS.map((k) => (
        <Skeleton key={k} className="h-10 w-full rounded-md" />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Inventory() {
  const { data: products = [], isLoading } = useProducts();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductShared | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [products, search]);

  const openAdd = () => {
    setEditProduct(null);
    setDialogOpen(true);
  };
  const openEdit = (p: ProductShared) => {
    setEditProduct(p);
    setDialogOpen(true);
  };
  const closeDialog = () => {
    setDialogOpen(false);
    setEditProduct(null);
  };

  return (
    <div className="space-y-6 p-6" data-ocid="inventory-page">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-section-heading text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track stock levels, costs, and product margins
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="add-product-btn" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Low-stock alert */}
      {!isLoading && <LowStockBanner products={products} />}

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(["sk-1", "sk-2", "sk-3", "sk-4"] as const).map((k) => (
            <Card key={k} className="card-elevated">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <SummaryCards products={products} />
      )}

      {/* Products table */}
      <Card className="card-elevated">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="font-display text-base">
              All Products
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                data-ocid="inventory-search"
                placeholder="Search by name or SKU…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeletons />
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="inventory-empty-state"
            >
              <Package className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold text-foreground">
                {search ? "No products match your search" : "No products yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                {search
                  ? "Try a different name or SKU"
                  : "Add your first product to start tracking inventory"}
              </p>
              {!search && (
                <Button
                  size="sm"
                  onClick={openAdd}
                  data-ocid="inventory-empty-add-btn"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add First Product
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-label text-muted-foreground pl-6">
                      Product
                    </TableHead>
                    <TableHead className="text-label text-muted-foreground">
                      SKU
                    </TableHead>
                    <TableHead className="text-label text-muted-foreground text-right">
                      Stock Qty
                    </TableHead>
                    <TableHead className="text-label text-muted-foreground text-right">
                      Cost Price
                    </TableHead>
                    <TableHead className="text-label text-muted-foreground text-right">
                      Sale Price
                    </TableHead>
                    <TableHead className="text-label text-muted-foreground text-right">
                      Margin
                    </TableHead>
                    <TableHead className="text-label text-muted-foreground text-right">
                      Reorder Point
                    </TableHead>
                    <TableHead className="text-label text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-label text-muted-foreground text-right pr-6">
                      Edit
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product, i) => {
                    const status = getStockStatus(product);
                    const cfg = STATUS_CONFIG[status];
                    const qty = Number(product.stockQuantity);
                    const reorder = Number(product.reorderPoint);

                    return (
                      <motion.tr
                        key={product.id.toString()}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.035 }}
                        className="border-border hover:bg-muted/20 transition-colors"
                        data-ocid={`inventory-row-${product.id}`}
                      >
                        <TableCell className="pl-6 py-4">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate max-w-[200px]">
                              {product.name}
                            </p>
                            {product.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                            {product.sku}
                          </span>
                        </TableCell>

                        <TableCell className="text-right font-mono text-sm">
                          <span
                            className={
                              status === "out-of-stock"
                                ? "text-destructive font-semibold"
                                : status === "low-stock"
                                  ? "text-[oklch(var(--warning))] font-semibold"
                                  : "text-foreground"
                            }
                          >
                            {qty}
                          </span>
                        </TableCell>

                        <TableCell className="text-right font-mono text-sm text-muted-foreground">
                          {formatGBP(product.costPrice)}
                        </TableCell>

                        <TableCell className="text-right font-mono text-sm font-medium text-foreground">
                          {formatGBP(product.salePrice)}
                        </TableCell>

                        <TableCell className="text-right font-mono text-sm">
                          <span
                            className={
                              product.margin >= 30
                                ? "text-[oklch(var(--success))] font-semibold"
                                : product.margin >= 0
                                  ? "text-[oklch(var(--warning))]"
                                  : "text-destructive"
                            }
                          >
                            {formatPercent(product.margin)}
                          </span>
                        </TableCell>

                        <TableCell className="text-right font-mono text-sm text-muted-foreground">
                          {reorder}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${cfg.cls}`}
                          >
                            {cfg.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right pr-6">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(product)}
                            data-ocid={`edit-product-${product.id}`}
                            aria-label={`Edit ${product.name}`}
                            className="h-8 w-8 p-0 hover:bg-muted/40"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProductDialog
        open={dialogOpen}
        onClose={closeDialog}
        editProduct={editProduct}
      />
    </div>
  );
}
