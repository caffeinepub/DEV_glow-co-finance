import Types "../types/finance";
import SampleDataLib "../lib/sampledata";
import List "mo:core/List";
import Runtime "mo:core/Runtime";

mixin (
  products : List.List<Types.Product>,
  customers : List.List<Types.Customer>,
  suppliers : List.List<Types.Supplier>,
  invoices : List.List<Types.Invoice>,
  bills : List.List<Types.Bill>,
  transactions : List.List<Types.Transaction>,
  nextProductId : [var Nat],
  nextCustomerId : [var Nat],
  nextSupplierId : [var Nat],
  nextInvoiceId : [var Nat],
  nextInvoiceNumber : [var Nat],
  nextBillId : [var Nat],
  nextBillNumber : [var Nat],
  nextTransactionId : [var Nat],
) {
  public func initializeSampleData() : async Bool {
    // Guard: only seed if empty
    if (products.size() > 0) { return false };
    let result = SampleDataLib.seed(
      products,
      customers,
      suppliers,
      invoices,
      bills,
      transactions,
      nextProductId[0],
      nextCustomerId[0],
      nextSupplierId[0],
      nextInvoiceId[0],
      nextInvoiceNumber[0],
      nextBillId[0],
      nextBillNumber[0],
      nextTransactionId[0],
    );
    nextProductId[0] := result.nextProductId;
    nextCustomerId[0] := result.nextCustomerId;
    nextSupplierId[0] := result.nextSupplierId;
    nextInvoiceId[0] := result.nextInvoiceId;
    nextInvoiceNumber[0] := result.nextInvoiceNumber;
    nextBillId[0] := result.nextBillId;
    nextBillNumber[0] := result.nextBillNumber;
    nextTransactionId[0] := result.nextTransactionId;
    true;
  };
};
