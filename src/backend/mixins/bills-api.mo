import Types "../types/finance";
import Common "../types/common";
import BillsLib "../lib/bills";
import List "mo:core/List";

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

  /// Associate an uploaded file (by its object-storage file ID) with an existing bill.
  /// The frontend uploads the file via object-storage and then calls this with the returned fileId.
  public func uploadBillAttachment(billId : Nat, fileId : Text) : async ?Types.BillShared {
    BillsLib.attachFileToBill(bills, billId, fileId);
  };

  /// Accept plain text extracted from a PDF on the frontend and parse it for bill fields.
  /// The frontend is responsible for reading the PDF bytes (via object-storage) and
  /// converting them to text (e.g., with pdf.js). The backend applies pattern-matching
  /// extraction and returns structured data with a confidence score.
  public query func extractPdfBillData(pdfText : Text) : async Types.ExtractedBillData {
    BillsLib.extractBillDataFromText(pdfText);
  };
};
