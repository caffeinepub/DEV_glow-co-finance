import Types "../types/finance";
import Common "../types/common";
import InvoicesLib "../lib/invoices";
import InventoryLib "../lib/inventory";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

mixin (
  invoices : List.List<Types.Invoice>,
  products : List.List<Types.Product>,
  nextInvoiceId : [var Nat],
  nextInvoiceNumber : [var Nat],
) {
  public query func getInvoices() : async [Types.InvoiceShared] {
    invoices.map<Types.Invoice, Types.InvoiceShared>(func(inv) { InvoicesLib.toInvoiceShared(inv) }).toArray();
  };

  public query func getInvoice(id : Nat) : async ?Types.InvoiceShared {
    switch (invoices.find(func(inv) { inv.id == id })) {
      case (?inv) { ?InvoicesLib.toInvoiceShared(inv) };
      case null { null };
    };
  };

  public func createInvoice(data : Types.CreateInvoiceData) : async Types.InvoiceShared {
    let id = nextInvoiceId[0];
    nextInvoiceId[0] += 1;
    let num = nextInvoiceNumber[0];
    nextInvoiceNumber[0] += 1;
    let inv = InvoicesLib.createInvoice(invoices, id, num, data);
    // Decrement stock for each line item
    for (item in data.lineItems.values()) {
      InventoryLib.decrementStock(products, item.productId, item.quantity);
    };
    InvoicesLib.toInvoiceShared(inv);
  };

  public func updateInvoice(id : Nat, data : Types.CreateInvoiceData) : async ?Types.InvoiceShared {
    InvoicesLib.updateInvoice(invoices, id, data);
  };

  public func markInvoicePaid(id : Nat, paidDate : Common.Timestamp) : async ?Types.InvoiceShared {
    InvoicesLib.markInvoicePaid(invoices, id, paidDate);
  };
};
