import Types "../types/finance";
import Common "../types/common";
import ContactsLib "../lib/contacts";
import InvoicesLib "../lib/invoices";
import BillsLib "../lib/bills";
import List "mo:core/List";
import Runtime "mo:core/Runtime";

mixin (
  customers : List.List<Types.Customer>,
  suppliers : List.List<Types.Supplier>,
  invoices : List.List<Types.Invoice>,
  bills : List.List<Types.Bill>,
  nextCustomerId : [var Nat],
  nextSupplierId : [var Nat],
) {
  public query func getCustomers() : async [Types.Customer] {
    customers.toArray();
  };

  public query func getCustomer(id : Nat) : async ?Types.Customer {
    customers.find(func(c) { c.id == id });
  };

  public func createCustomer(data : Types.CreateCustomerData) : async Types.Customer {
    let id = nextCustomerId[0];
    nextCustomerId[0] += 1;
    ContactsLib.createCustomer(customers, id, data);
  };

  public func updateCustomer(id : Nat, data : Types.CreateCustomerData) : async ?Types.Customer {
    ContactsLib.updateCustomer(customers, id, data);
  };

  public query func getCustomerInvoiceHistory(customerId : Nat) : async {
    invoices : [Types.InvoiceShared];
    outstandingBalance : Float;
  } {
    let customerInvoices = invoices.filter(func(inv) { inv.customerId == customerId })
      .map<Types.Invoice, Types.InvoiceShared>(func(inv) { InvoicesLib.toInvoiceShared(inv) })
      .toArray();
    let outstanding = customerInvoices.foldLeft(0.0, func(acc, inv) {
      switch (inv.status) {
        case (#Paid) { acc };
        case _ { acc + inv.grandTotal };
      };
    });
    { invoices = customerInvoices; outstandingBalance = outstanding };
  };

  public query func getSuppliers() : async [Types.Supplier] {
    suppliers.toArray();
  };

  public query func getSupplier(id : Nat) : async ?Types.Supplier {
    suppliers.find(func(s) { s.id == id });
  };

  public func createSupplier(data : Types.CreateSupplierData) : async Types.Supplier {
    let id = nextSupplierId[0];
    nextSupplierId[0] += 1;
    ContactsLib.createSupplier(suppliers, id, data);
  };

  public func updateSupplier(id : Nat, data : Types.CreateSupplierData) : async ?Types.Supplier {
    ContactsLib.updateSupplier(suppliers, id, data);
  };

  public query func getSupplierBillHistory(supplierId : Nat) : async {
    bills : [Types.BillShared];
    outstandingBalance : Float;
  } {
    let supplierBills = bills.filter(func(b) { b.supplierId == supplierId })
      .map<Types.Bill, Types.BillShared>(func(b) { BillsLib.toBillShared(b) })
      .toArray();
    let outstanding = supplierBills.foldLeft(0.0, func(acc, b) {
      switch (b.status) {
        case (#Paid) { acc };
        case _ { acc + b.amount };
      };
    });
    { bills = supplierBills; outstandingBalance = outstanding };
  };
};
