import Types "../types/finance";
import Common "../types/common";
import List "mo:core/List";

module {
  public func toBillShared(b : Types.Bill) : Types.BillShared {
    {
      id = b.id;
      billNumber = b.billNumber;
      supplierId = b.supplierId;
      supplierName = b.supplierName;
      date = b.date;
      dueDate = b.dueDate;
      amount = b.amount;
      vatRate = b.vatRate;
      vatAmount = b.vatAmount;
      category = b.category;
      status = b.status;
      paidDate = b.paidDate;
      notes = b.notes;
      linkedProductIds = b.linkedProductIds;
      receiptFileId = b.receiptFileId;
    };
  };

  public func createBill(
    bills : List.List<Types.Bill>,
    nextId : Nat,
    nextNumber : Nat,
    data : Types.CreateBillData,
  ) : Types.Bill {
    let b : Types.Bill = {
      id = nextId;
      billNumber = "BILL-" # nextNumber.toText();
      supplierId = data.supplierId;
      supplierName = data.supplierName;
      date = data.date;
      dueDate = data.dueDate;
      amount = data.amount;
      vatRate = data.vatRate;
      vatAmount = data.vatAmount;
      category = data.category;
      var status = #Unpaid;
      var paidDate = null;
      notes = data.notes;
      linkedProductIds = data.linkedProductIds;
      receiptFileId = data.receiptFileId;
    };
    bills.add(b);
    b;
  };

  public func updateBill(
    bills : List.List<Types.Bill>,
    id : Nat,
    data : Types.CreateBillData,
  ) : ?Types.BillShared {
    var found : ?Types.BillShared = null;
    bills.mapInPlace(func(b) {
      if (b.id == id) {
        let updated = {
          b with
          supplierId = data.supplierId;
          supplierName = data.supplierName;
          date = data.date;
          dueDate = data.dueDate;
          amount = data.amount;
          vatRate = data.vatRate;
          vatAmount = data.vatAmount;
          category = data.category;
          notes = data.notes;
          linkedProductIds = data.linkedProductIds;
          receiptFileId = data.receiptFileId;
          var status = b.status;
          var paidDate = b.paidDate;
        };
        found := ?toBillShared(updated);
        updated;
      } else { b };
    });
    found;
  };

  public func markBillPaid(
    bills : List.List<Types.Bill>,
    id : Nat,
    paidDate : Common.Timestamp,
  ) : ?Types.BillShared {
    var found : ?Types.BillShared = null;
    bills.mapInPlace(func(b) {
      if (b.id == id) {
        b.status := #Paid;
        b.paidDate := ?paidDate;
        found := ?toBillShared(b);
        b;
      } else { b };
    });
    found;
  };

  public func getBillsDueIn14Days(
    bills : List.List<Types.Bill>,
    now : Common.Timestamp,
  ) : [Types.BillShared] {
    let fourteenDays : Int = 14 * 24 * 60 * 60 * 1_000_000_000;
    bills.filter(func(b) {
      b.status == #Unpaid and b.dueDate >= now and b.dueDate <= now + fourteenDays;
    }).map<Types.Bill, Types.BillShared>(func(b) { toBillShared(b) })
      .toArray();
  };

  public func expensesInRange(
    bills : List.List<Types.Bill>,
    start : Common.Timestamp,
    end : Common.Timestamp,
  ) : Float {
    bills.foldLeft<Float, Types.Bill>(0.0, func(acc, b) {
      if (b.status == #Paid) {
        switch (b.paidDate) {
          case (?pd) {
            if (pd >= start and pd <= end) { acc + b.amount }
            else { acc };
          };
          case null { acc };
        };
      } else { acc };
    });
  };

  public func vatPaidInRange(
    bills : List.List<Types.Bill>,
    start : Common.Timestamp,
    end : Common.Timestamp,
  ) : Float {
    bills.foldLeft<Float, Types.Bill>(0.0, func(acc, b) {
      if (b.status == #Paid) {
        switch (b.paidDate) {
          case (?pd) {
            if (pd >= start and pd <= end) { acc + b.vatAmount }
            else { acc };
          };
          case null { acc };
        };
      } else { acc };
    });
  };

  public func expensesByCategoryInRange(
    bills : List.List<Types.Bill>,
    start : Common.Timestamp,
    end : Common.Timestamp,
  ) : [(Text, Float)] {
    // Collect totals per category
    var ingredients : Float = 0.0;
    var packaging : Float = 0.0;
    var shipping : Float = 0.0;
    var marketing : Float = 0.0;
    var rent : Float = 0.0;
    var software : Float = 0.0;
    var professional : Float = 0.0;
    var other : Float = 0.0;

    bills.forEach(func(b) {
      let inRange = switch (b.paidDate) {
        case (?pd) { b.status == #Paid and pd >= start and pd <= end };
        case null { false };
      };
      if (inRange) {
        switch (b.category) {
          case (#Ingredients) { ingredients += b.amount };
          case (#Packaging) { packaging += b.amount };
          case (#Shipping) { shipping += b.amount };
          case (#Marketing) { marketing += b.amount };
          case (#Rent) { rent += b.amount };
          case (#Software) { software += b.amount };
          case (#ProfessionalServices) { professional += b.amount };
          case (#Other) { other += b.amount };
        };
      };
    });

    [
      ("Ingredients", ingredients),
      ("Packaging", packaging),
      ("Shipping", shipping),
      ("Marketing", marketing),
      ("Rent", rent),
      ("Software", software),
      ("Professional Services", professional),
      ("Other", other),
    ];
  };

  public func categoryToText(cat : Common.BillCategory) : Text {
    switch (cat) {
      case (#Ingredients) { "Ingredients" };
      case (#Packaging) { "Packaging" };
      case (#Shipping) { "Shipping" };
      case (#Marketing) { "Marketing" };
      case (#Rent) { "Rent" };
      case (#Software) { "Software" };
      case (#ProfessionalServices) { "Professional Services" };
      case (#Other) { "Other" };
    };
  };
};
