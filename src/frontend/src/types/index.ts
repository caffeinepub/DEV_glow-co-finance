// Re-export runtime enums from the generated backend bindings
export {
  InvoiceStatus,
  BillStatus,
  BillCategory,
  CustomerType,
  RecurringFrequency,
  VatRate,
} from "../backend";

// Re-export types from the backend type declarations
export type {
  InvoiceLineItem,
  InvoiceShared,
  BillShared,
  ProductShared,
  Customer,
  Supplier,
  DashboardStats,
  ProfitAndLossReport,
  ExpenseSummary,
  ExpenseCategory,
  AgedReport,
  AgedBucket,
  MonthlyCashFlow,
  MonthlySummary,
  VatSummary,
  CreateInvoiceData,
  CreateBillData,
  CreateProductData,
  CreateCustomerData,
  CreateSupplierData,
  Timestamp,
  Option,
  Some,
  None,
} from "../backend";

// Convenience UI types
export type DateRange = {
  startDate: Date;
  endDate: Date;
};
