import Types "../types/finance";
import Common "../types/common";
import BillsLib "../lib/bills";
import List "mo:core/List";
import Runtime "mo:core/Runtime";

mixin (
  bills : List.List<Types.Bill>,
  nextBillId : [var Nat],
  nextBillNumber : [var Nat],
) {
  public query func getBills() : async [Types.BillShared] {
    bills.map<Types.Bill, Types.BillShared>(func(b) { BillsLib.toBillShared(b) }).toArray();
  };

  public query func getBill(id : Nat) : async ?Types.BillShared {
    switch (bills.find(func(b) { b.id == id })) {
      case (?b) { ?BillsLib.toBillShared(b) };
      case null { null };
    };
  };

  public func createBill(data : Types.CreateBillData) : async Types.BillShared {
    let id = nextBillId[0];
    nextBillId[0] += 1;
    let num = nextBillNumber[0];
    nextBillNumber[0] += 1;
    let b = BillsLib.createBill(bills, id, num, data);
    BillsLib.toBillShared(b);
  };

  public func updateBill(id : Nat, data : Types.CreateBillData) : async ?Types.BillShared {
    BillsLib.updateBill(bills, id, data);
  };

  public func markBillPaid(id : Nat, paidDate : Common.Timestamp) : async ?Types.BillShared {
    BillsLib.markBillPaid(bills, id, paidDate);
  };
};
