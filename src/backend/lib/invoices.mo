import Types "../types/finance";
import Common "../types/common";
import List "mo:core/List";

module {
  public func toInvoiceShared(inv : Types.Invoice) : Types.InvoiceShared {
    {
      id = inv.id;
      invoiceNumber = inv.invoiceNumber;
      customerId = inv.customerId;
      customerName = inv.customerName;
      status = inv.status;
      lineItems = inv.lineItems;
      subtotal = inv.subtotal;
      totalVat = inv.totalVat;
      grandTotal = inv.grandTotal;
      issueDate = inv.issueDate;
      dueDate = inv.dueDate;
      paidDate = inv.paidDate;
      notes = inv.notes;
      isRecurring = inv.isRecurring;
      recurringFrequency = inv.recurringFrequency;
    };
  };

  public func createInvoice(
    invoices : List.List<Types.Invoice>,
    nextId : Nat,
    nextNumber : Nat,
    data : Types.CreateInvoiceData,
  ) : Types.Invoice {
    let inv : Types.Invoice = {
      id = nextId;
      invoiceNumber = "INV-" # nextNumber.toText();
      customerId = data.customerId;
      customerName = data.customerName;
      var status = #Draft;
      lineItems = data.lineItems;
      subtotal = data.subtotal;
      totalVat = data.totalVat;
      grandTotal = data.grandTotal;
      issueDate = data.issueDate;
      dueDate = data.dueDate;
      var paidDate = null;
      notes = data.notes;
      isRecurring = data.isRecurring;
      recurringFrequency = data.recurringFrequency;
    };
    invoices.add(inv);
    inv;
  };

  public func updateInvoice(
    invoices : List.List<Types.Invoice>,
    id : Nat,
    data : Types.CreateInvoiceData,
  ) : ?Types.InvoiceShared {
    var found : ?Types.InvoiceShared = null;
    invoices.mapInPlace(func(inv) {
      if (inv.id == id) {
        inv.status := inv.status; // keep existing status
        let updated = {
          inv with
          customerId = data.customerId;
          customerName = data.customerName;
          lineItems = data.lineItems;
          subtotal = data.subtotal;
          totalVat = data.totalVat;
          grandTotal = data.grandTotal;
          issueDate = data.issueDate;
          dueDate = data.dueDate;
          notes = data.notes;
          isRecurring = data.isRecurring;
          recurringFrequency = data.recurringFrequency;
          var status = inv.status;
          var paidDate = inv.paidDate;
        };
        found := ?toInvoiceShared(updated);
        updated;
      } else { inv };
    });
    found;
  };

  public func markInvoicePaid(
    invoices : List.List<Types.Invoice>,
    id : Nat,
    paidDate : Common.Timestamp,
  ) : ?Types.InvoiceShared {
    var found : ?Types.InvoiceShared = null;
    invoices.mapInPlace(func(inv) {
      if (inv.id == id) {
        inv.status := #Paid;
        inv.paidDate := ?paidDate;
        found := ?toInvoiceShared(inv);
        inv;
      } else { inv };
    });
    found;
  };

  public func getOverdueInvoices(
    invoices : List.List<Types.Invoice>,
    now : Common.Timestamp,
  ) : [Types.InvoiceShared] {
    invoices.filter(func(inv) {
      inv.status == #Overdue or (inv.status == #Sent and inv.dueDate < now);
    }).map<Types.Invoice, Types.InvoiceShared>(func(inv) { toInvoiceShared(inv) })
      .toArray();
  };

  public func revenueInRange(
    invoices : List.List<Types.Invoice>,
    start : Common.Timestamp,
    end : Common.Timestamp,
  ) : Float {
    invoices.foldLeft<Float, Types.Invoice>(0.0, func(acc, inv) {
      if (inv.status == #Paid) {
        switch (inv.paidDate) {
          case (?pd) {
            if (pd >= start and pd <= end) { acc + inv.grandTotal }
            else { acc };
          };
          case null { acc };
        };
      } else { acc };
    });
  };

  public func vatCollectedInRange(
    invoices : List.List<Types.Invoice>,
    start : Common.Timestamp,
    end : Common.Timestamp,
  ) : Float {
    invoices.foldLeft<Float, Types.Invoice>(0.0, func(acc, inv) {
      if (inv.status == #Paid) {
        switch (inv.paidDate) {
          case (?pd) {
            if (pd >= start and pd <= end) { acc + inv.totalVat }
            else { acc };
          };
          case null { acc };
        };
      } else { acc };
    });
  };
};
