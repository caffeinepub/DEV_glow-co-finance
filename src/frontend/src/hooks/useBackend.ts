import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type {
  AgedReport,
  BillShared,
  CreateBillData,
  CreateCustomerData,
  CreateInvoiceData,
  CreateProductData,
  CreateSupplierData,
  Customer,
  DashboardStats,
  ExpenseSummary,
  InvoiceShared,
  MonthlyCashFlow,
  MonthlySummary,
  ProductShared,
  ProfitAndLossReport,
  Supplier,
  Timestamp,
  VatSummary,
} from "../backend";

// Shared hook that returns the typed actor
function useBackendActor() {
  return useActor(createActor);
}

// ─── Queries ────────────────────────────────────────────────────────────────

export function useDashboardStats() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 300_000,
  });
}

export function useInvoices() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<InvoiceShared[]>({
    queryKey: ["invoices"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInvoices();
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000,
    refetchInterval: 300_000,
  });
}

export function useInvoice(id: bigint | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<InvoiceShared | null>({
    queryKey: ["invoice", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getInvoice(id);
    },
    enabled: !!actor && !isFetching && id !== null,
    staleTime: 300_000,
  });
}

export function useBills() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<BillShared[]>({
    queryKey: ["bills"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBills();
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000,
    refetchInterval: 300_000,
  });
}

export function useBill(id: bigint | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<BillShared | null>({
    queryKey: ["bill", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getBill(id);
    },
    enabled: !!actor && !isFetching && id !== null,
    staleTime: 300_000,
  });
}

export function useProducts() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<ProductShared[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProducts();
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000,
    refetchInterval: 300_000,
  });
}

export function useProduct(id: bigint | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<ProductShared | null>({
    queryKey: ["product", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getProduct(id);
    },
    enabled: !!actor && !isFetching && id !== null,
    staleTime: 300_000,
  });
}

export function useCustomers() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomers();
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000,
    refetchInterval: 300_000,
  });
}

export function useSuppliers() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSuppliers();
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000,
    refetchInterval: 300_000,
  });
}

export function useProfitAndLoss(startDate: Timestamp, endDate: Timestamp) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<ProfitAndLossReport | null>({
    queryKey: ["profitAndLoss", startDate.toString(), endDate.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getProfitAndLoss(startDate, endDate);
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000,
    retry: false,
  });
}

export function useExpenseSummary(startDate: Timestamp, endDate: Timestamp) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<ExpenseSummary | null>({
    queryKey: ["expenseSummary", startDate.toString(), endDate.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getExpenseSummary(startDate, endDate);
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000,
    retry: false,
  });
}

export function useAgedReceivables() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<AgedReport | null>({
    queryKey: ["agedReceivables"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAgedReceivables();
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000,
    refetchInterval: 300_000,
    retry: false,
  });
}

export function useAgedPayables() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<AgedReport | null>({
    queryKey: ["agedPayables"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAgedPayables();
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000,
    refetchInterval: 300_000,
    retry: false,
  });
}

export function useCashFlow(year: bigint) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<MonthlyCashFlow[]>({
    queryKey: ["cashFlow", year.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCashFlow(year);
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000,
    retry: false,
  });
}

export function useMonthlySummary(month: bigint, year: bigint) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<MonthlySummary | null>({
    queryKey: ["monthlySummary", month.toString(), year.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMonthlySummary(month, year);
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000,
    retry: false,
  });
}

export function useVatSummary(quarter: bigint, year: bigint) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<VatSummary | null>({
    queryKey: ["vatSummary", quarter.toString(), year.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getVatSummary(quarter, year);
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000,
    retry: false,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useCreateInvoice() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInvoiceData) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createInvoice(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateInvoice() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: { id: bigint; data: CreateInvoiceData }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateInvoice(id, data);
    },
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice", id.toString()] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useMarkInvoicePaid() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      paidDate,
    }: { id: bigint; paidDate: Timestamp }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.markInvoicePaid(id, paidDate);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useCreateBill() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBillData) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createBill(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateBill() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: bigint; data: CreateBillData }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateBill(id, data);
    },
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["bill", id.toString()] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useMarkBillPaid() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      paidDate,
    }: { id: bigint; paidDate: Timestamp }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.markBillPaid(id, paidDate);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useCreateProduct() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProductData) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createProduct(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: { id: bigint; data: CreateProductData }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateProduct(id, data);
    },
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product", id.toString()] });
    },
  });
}

export function useCreateCustomer() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCustomerData) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createCustomer(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: { id: bigint; data: CreateCustomerData }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateCustomer(id, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useCreateSupplier() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSupplierData) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createSupplier(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useUpdateSupplier() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: { id: bigint; data: CreateSupplierData }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateSupplier(id, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useInitializeSampleData() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.initializeSampleData();
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}
