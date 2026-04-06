import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface InvoiceLineItem {
    lineTotal: number;
    productId: bigint;
    productName: string;
    quantity: bigint;
    unitPrice: number;
    vatAmount: number;
    vatRate: VatRate;
}
export type Timestamp = bigint;
export interface InvoiceShared {
    id: bigint;
    issueDate: Timestamp;
    customerName: string;
    status: InvoiceStatus;
    lineItems: Array<InvoiceLineItem>;
    isRecurring: boolean;
    dueDate: Timestamp;
    totalVat: number;
    grandTotal: number;
    paidDate?: Timestamp;
    invoiceNumber: string;
    notes: string;
    customerId: bigint;
    recurringFrequency?: RecurringFrequency;
    subtotal: number;
}
export interface AgedReport {
    grandTotal: number;
    buckets: Array<AgedBucket>;
}
export interface ProfitAndLossReport {
    prevCogs: number;
    revenue: number;
    endDate: Timestamp;
    expensesByCategory: Array<[string, number]>;
    grossProfit: number;
    cogs: number;
    totalExpenses: number;
    prevRevenue: number;
    prevGrossProfit: number;
    prevNetProfit: number;
    netProfit: number;
    startDate: Timestamp;
}
export interface ExpenseCategory {
    category: string;
    amount: number;
    prevAmount: number;
    flagged: boolean;
}
export interface ProductShared {
    id: bigint;
    sku: string;
    stockQuantity: bigint;
    reorderPoint: bigint;
    name: string;
    description: string;
    salePrice: number;
    margin: number;
    costPrice: number;
}
export interface CreateSupplierData {
    name: string;
    email: string;
    address: string;
    notes: string;
    category: BillCategory;
    phone: string;
}
export interface MonthlySummary {
    month: bigint;
    revenue: number;
    expenses: number;
    year: bigint;
    topCustomers: Array<[string, number]>;
    topExpenseCategories: Array<[string, number]>;
    profit: number;
}
export interface MonthlyCashFlow {
    month: bigint;
    netFlow: number;
    year: bigint;
    inflow: number;
    runningBalance: number;
    outflow: number;
}
export interface DashboardStats {
    overdueInvoices: Array<InvoiceShared>;
    lowStockProducts: Array<ProductShared>;
    netProfitThisMonth: number;
    billsDueIn14Days: Array<BillShared>;
    totalCashBalance: number;
    revenueThisMonth: number;
    expensesThisMonth: number;
}
export interface Customer {
    id: bigint;
    customerType: CustomerType;
    name: string;
    email: string;
    address: string;
    notes: string;
    phone: string;
}
export interface CreateProductData {
    sku: string;
    stockQuantity: bigint;
    reorderPoint: bigint;
    name: string;
    description: string;
    salePrice: number;
    costPrice: number;
}
export interface CreateInvoiceData {
    issueDate: Timestamp;
    customerName: string;
    lineItems: Array<InvoiceLineItem>;
    isRecurring: boolean;
    dueDate: Timestamp;
    totalVat: number;
    grandTotal: number;
    notes: string;
    customerId: bigint;
    recurringFrequency?: RecurringFrequency;
    subtotal: number;
}
export interface BillShared {
    id: bigint;
    status: BillStatus;
    supplierName: string;
    date: Timestamp;
    dueDate: Timestamp;
    linkedProductIds: Array<bigint>;
    paidDate?: Timestamp;
    notes: string;
    billNumber: string;
    category: BillCategory;
    vatAmount: number;
    receiptFileId?: string;
    amount: number;
    supplierId: bigint;
    vatRate: VatRate;
}
export interface VatSummary {
    quarter: bigint;
    year: bigint;
    vatCollected: number;
    netVatOwed: number;
    vatPaid: number;
}
export interface CreateCustomerData {
    customerType: CustomerType;
    name: string;
    email: string;
    address: string;
    notes: string;
    phone: string;
}
export interface AgedBucket {
    title: string;
    total: number;
    count: bigint;
}
export interface CreateBillData {
    supplierName: string;
    date: Timestamp;
    dueDate: Timestamp;
    linkedProductIds: Array<bigint>;
    notes: string;
    category: BillCategory;
    vatAmount: number;
    receiptFileId?: string;
    amount: number;
    supplierId: bigint;
    vatRate: VatRate;
}
export interface Supplier {
    id: bigint;
    name: string;
    email: string;
    address: string;
    notes: string;
    category: BillCategory;
    phone: string;
}
export interface ExpenseSummary {
    categories: Array<ExpenseCategory>;
    total: number;
    endDate: Timestamp;
    startDate: Timestamp;
}
export enum BillCategory {
    Shipping = "Shipping",
    Rent = "Rent",
    ProfessionalServices = "ProfessionalServices",
    Software = "Software",
    Packaging = "Packaging",
    Other = "Other",
    Ingredients = "Ingredients",
    Marketing = "Marketing"
}
export enum BillStatus {
    Paid = "Paid",
    Overdue = "Overdue",
    Unpaid = "Unpaid"
}
export enum CustomerType {
    DTC = "DTC",
    Wholesale = "Wholesale"
}
export enum InvoiceStatus {
    Paid = "Paid",
    Sent = "Sent",
    Draft = "Draft",
    Overdue = "Overdue"
}
export enum RecurringFrequency {
    Weekly = "Weekly",
    Monthly = "Monthly"
}
export enum VatRate {
    Five = "Five",
    Zero = "Zero",
    Twenty = "Twenty"
}
export interface backendInterface {
    createBill(data: CreateBillData): Promise<BillShared>;
    createCustomer(data: CreateCustomerData): Promise<Customer>;
    createInvoice(data: CreateInvoiceData): Promise<InvoiceShared>;
    createProduct(data: CreateProductData): Promise<ProductShared>;
    createSupplier(data: CreateSupplierData): Promise<Supplier>;
    getAgedPayables(): Promise<AgedReport>;
    getAgedReceivables(): Promise<AgedReport>;
    getBill(id: bigint): Promise<BillShared | null>;
    getBills(): Promise<Array<BillShared>>;
    getCashFlow(year: bigint): Promise<Array<MonthlyCashFlow>>;
    getCustomer(id: bigint): Promise<Customer | null>;
    getCustomerInvoiceHistory(customerId: bigint): Promise<{
        invoices: Array<InvoiceShared>;
        outstandingBalance: number;
    }>;
    getCustomers(): Promise<Array<Customer>>;
    getDashboardStats(): Promise<DashboardStats>;
    getExpenseSummary(startDate: Timestamp, endDate: Timestamp): Promise<ExpenseSummary>;
    getInventoryStats(): Promise<{
        totalAtCost: number;
        totalAtSale: number;
    }>;
    getInvoice(id: bigint): Promise<InvoiceShared | null>;
    getInvoices(): Promise<Array<InvoiceShared>>;
    getMonthlySummary(month: bigint, year: bigint): Promise<MonthlySummary>;
    getProduct(id: bigint): Promise<ProductShared | null>;
    getProducts(): Promise<Array<ProductShared>>;
    getProfitAndLoss(startDate: Timestamp, endDate: Timestamp): Promise<ProfitAndLossReport>;
    getSupplier(id: bigint): Promise<Supplier | null>;
    getSupplierBillHistory(supplierId: bigint): Promise<{
        bills: Array<BillShared>;
        outstandingBalance: number;
    }>;
    getSuppliers(): Promise<Array<Supplier>>;
    getVatSummary(quarter: bigint, year: bigint): Promise<VatSummary>;
    initializeSampleData(): Promise<boolean>;
    markBillPaid(id: bigint, paidDate: Timestamp): Promise<BillShared | null>;
    markInvoicePaid(id: bigint, paidDate: Timestamp): Promise<InvoiceShared | null>;
    updateBill(id: bigint, data: CreateBillData): Promise<BillShared | null>;
    updateCustomer(id: bigint, data: CreateCustomerData): Promise<Customer | null>;
    updateInvoice(id: bigint, data: CreateInvoiceData): Promise<InvoiceShared | null>;
    updateProduct(id: bigint, data: CreateProductData): Promise<ProductShared | null>;
    updateSupplier(id: bigint, data: CreateSupplierData): Promise<Supplier | null>;
}
