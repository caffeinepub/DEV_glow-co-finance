import Common "common";

module {
  public type Product = {
    id : Nat;
    name : Text;
    sku : Text;
    var stockQuantity : Nat;
    costPrice : Float;
    salePrice : Float;
    margin : Float;
    reorderPoint : Nat;
    description : Text;
  };

  // Shared (immutable) version for API boundary
  public type ProductShared = {
    id : Nat;
    name : Text;
    sku : Text;
    stockQuantity : Nat;
    costPrice : Float;
    salePrice : Float;
    margin : Float;
    reorderPoint : Nat;
    description : Text;
  };

  public type CreateProductData = {
    name : Text;
    sku : Text;
    stockQuantity : Nat;
    costPrice : Float;
    salePrice : Float;
    reorderPoint : Nat;
    description : Text;
  };

  public type Customer = {
    id : Nat;
    name : Text;
    customerType : Common.CustomerType;
    email : Text;
    phone : Text;
    address : Text;
    notes : Text;
  };

  public type CreateCustomerData = {
    name : Text;
    customerType : Common.CustomerType;
    email : Text;
    phone : Text;
    address : Text;
    notes : Text;
  };

  public type Supplier = {
    id : Nat;
    name : Text;
    email : Text;
    phone : Text;
    address : Text;
    category : Common.BillCategory;
    notes : Text;
  };

  public type CreateSupplierData = {
    name : Text;
    email : Text;
    phone : Text;
    address : Text;
    category : Common.BillCategory;
    notes : Text;
  };

  public type InvoiceLineItem = {
    productId : Nat;
    productName : Text;
    quantity : Nat;
    unitPrice : Float;
    vatRate : Common.VatRate;
    vatAmount : Float;
    lineTotal : Float;
  };

  public type Invoice = {
    id : Nat;
    invoiceNumber : Text;
    customerId : Nat;
    customerName : Text;
    var status : Common.InvoiceStatus;
    lineItems : [InvoiceLineItem];
    subtotal : Float;
    totalVat : Float;
    grandTotal : Float;
    issueDate : Common.Timestamp;
    dueDate : Common.Timestamp;
    var paidDate : ?Common.Timestamp;
    notes : Text;
    isRecurring : Bool;
    recurringFrequency : ?Common.RecurringFrequency;
  };

  // Shared (immutable) version for API boundary
  public type InvoiceShared = {
    id : Nat;
    invoiceNumber : Text;
    customerId : Nat;
    customerName : Text;
    status : Common.InvoiceStatus;
    lineItems : [InvoiceLineItem];
    subtotal : Float;
    totalVat : Float;
    grandTotal : Float;
    issueDate : Common.Timestamp;
    dueDate : Common.Timestamp;
    paidDate : ?Common.Timestamp;
    notes : Text;
    isRecurring : Bool;
    recurringFrequency : ?Common.RecurringFrequency;
  };

  public type CreateInvoiceData = {
    customerId : Nat;
    customerName : Text;
    lineItems : [InvoiceLineItem];
    subtotal : Float;
    totalVat : Float;
    grandTotal : Float;
    issueDate : Common.Timestamp;
    dueDate : Common.Timestamp;
    notes : Text;
    isRecurring : Bool;
    recurringFrequency : ?Common.RecurringFrequency;
  };

  public type Bill = {
    id : Nat;
    billNumber : Text;
    supplierId : Nat;
    supplierName : Text;
    date : Common.Timestamp;
    dueDate : Common.Timestamp;
    amount : Float;
    vatRate : Common.VatRate;
    vatAmount : Float;
    category : Common.BillCategory;
    var status : Common.BillStatus;
    var paidDate : ?Common.Timestamp;
    notes : Text;
    linkedProductIds : [Nat];
    receiptFileId : ?Text;
  };

  // Shared (immutable) version for API boundary
  public type BillShared = {
    id : Nat;
    billNumber : Text;
    supplierId : Nat;
    supplierName : Text;
    date : Common.Timestamp;
    dueDate : Common.Timestamp;
    amount : Float;
    vatRate : Common.VatRate;
    vatAmount : Float;
    category : Common.BillCategory;
    status : Common.BillStatus;
    paidDate : ?Common.Timestamp;
    notes : Text;
    linkedProductIds : [Nat];
    receiptFileId : ?Text;
  };

  public type CreateBillData = {
    supplierId : Nat;
    supplierName : Text;
    date : Common.Timestamp;
    dueDate : Common.Timestamp;
    amount : Float;
    vatRate : Common.VatRate;
    vatAmount : Float;
    category : Common.BillCategory;
    notes : Text;
    linkedProductIds : [Nat];
    receiptFileId : ?Text;
  };

  // PDF extraction result type
  public type ExtractedBillData = {
    supplierName : ?Text;
    invoiceNumber : ?Text;
    date : ?Text;
    amount : ?Float;
    vatAmount : ?Float;
    confidence : Text; // "high" | "partial" | "failed"
  };

  public type Transaction = {
    id : Nat;
    date : Common.Timestamp;
    transactionType : Common.TransactionType;
    referenceId : Nat;
    amount : Float;
    description : Text;
  };

  // ---- Report / Dashboard types ----

  public type DashboardStats = {
    totalCashBalance : Float;
    revenueThisMonth : Float;
    expensesThisMonth : Float;
    netProfitThisMonth : Float;
    overdueInvoices : [InvoiceShared];
    billsDueIn14Days : [BillShared];
    lowStockProducts : [ProductShared];
  };

  public type PnLSection = {
    title : Text;
    amount : Float;
  };

  public type ProfitAndLossReport = {
    startDate : Common.Timestamp;
    endDate : Common.Timestamp;
    revenue : Float;
    cogs : Float;
    grossProfit : Float;
    expensesByCategory : [(Text, Float)];
    totalExpenses : Float;
    netProfit : Float;
    // Comparison vs previous period
    prevRevenue : Float;
    prevCogs : Float;
    prevGrossProfit : Float;
    prevNetProfit : Float;
  };

  public type ExpenseCategory = {
    category : Text;
    amount : Float;
    prevAmount : Float;
    flagged : Bool; // >20% increase vs last month
  };

  public type ExpenseSummary = {
    startDate : Common.Timestamp;
    endDate : Common.Timestamp;
    categories : [ExpenseCategory];
    total : Float;
  };

  public type AgedBucket = {
    title : Text; // "0-30", "31-60", "61-90", "90+"
    count : Nat;
    total : Float;
  };

  public type AgedReport = {
    buckets : [AgedBucket];
    grandTotal : Float;
  };

  public type MonthlyCashFlow = {
    month : Nat;
    year : Nat;
    inflow : Float;
    outflow : Float;
    netFlow : Float;
    runningBalance : Float;
  };

  public type MonthlySummary = {
    month : Nat;
    year : Nat;
    revenue : Float;
    expenses : Float;
    profit : Float;
    topCustomers : [(Text, Float)];
    topExpenseCategories : [(Text, Float)];
  };

  public type VatSummary = {
    quarter : Nat;
    year : Nat;
    vatCollected : Float;
    vatPaid : Float;
    netVatOwed : Float;
  };
};
