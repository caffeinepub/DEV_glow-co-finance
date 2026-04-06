import Types "types/finance";
import List "mo:core/List";

import InventoryApi "mixins/inventory-api";
import InvoicesApi "mixins/invoices-api";
import BillsApi "mixins/bills-api";
import ContactsApi "mixins/contacts-api";
import ReportsApi "mixins/reports-api";
import SampleDataApi "mixins/sampledata-api";

actor {
  // ---- Stable state ----
  let products = List.empty<Types.Product>();
  let customers = List.empty<Types.Customer>();
  let suppliers = List.empty<Types.Supplier>();
  let invoices = List.empty<Types.Invoice>();
  let bills = List.empty<Types.Bill>();
  let transactions = List.empty<Types.Transaction>();

  let nextProductId : [var Nat] = [var 1];
  let nextCustomerId : [var Nat] = [var 1];
  let nextSupplierId : [var Nat] = [var 1];
  let nextInvoiceId : [var Nat] = [var 1];
  let nextInvoiceNumber : [var Nat] = [var 1];
  let nextBillId : [var Nat] = [var 1];
  let nextBillNumber : [var Nat] = [var 1];
  let nextTransactionId : [var Nat] = [var 1];

  // ---- Mixin composition ----
  include InventoryApi(products, nextProductId);
  include InvoicesApi(invoices, products, nextInvoiceId, nextInvoiceNumber);
  include BillsApi(bills, nextBillId, nextBillNumber);
  include ContactsApi(customers, suppliers, invoices, bills, nextCustomerId, nextSupplierId);
  include ReportsApi(invoices, bills, products, transactions);
  include SampleDataApi(
    products,
    customers,
    suppliers,
    invoices,
    bills,
    transactions,
    nextProductId,
    nextCustomerId,
    nextSupplierId,
    nextInvoiceId,
    nextInvoiceNumber,
    nextBillId,
    nextBillNumber,
    nextTransactionId,
  );
};
