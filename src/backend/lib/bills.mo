import Types "../types/finance";
import Common "../types/common";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Float "mo:core/Float";

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

  // ---- PDF text extraction helpers ----

  // Returns true if a text line (lowercased) contains any of the supplied keywords
  private func lineContains(lower : Text, keywords : [Text]) : Bool {
    var matched = false;
    for (kw in keywords.values()) {
      if (lower.contains(#text kw)) { matched := true };
    };
    matched;
  };

  // Strip currency symbols and commas, then attempt to parse as float.
  // Handles formats like "£1,234.56", "1234.56", "$999"
  private func cleanParseFloat(tok : Text) : ?Float {
    var s = tok.trim(#char ' ');
    s := s.replace(#char '£', "");
    s := s.replace(#char '$', "");
    s := s.replace(#char ',', "");
    // Split on '.' — left is integer, optional right is decimals
    let parts = s.split(#char '.').toArray();
    if (parts.size() == 0) { return null };
    switch (Nat.fromText(parts[0])) {
      case null { null };
      case (?whole) {
        if (parts.size() == 1) {
          ?whole.toFloat()
        } else {
          let decStr = parts[1];
          let denom : Float = switch (decStr.size()) {
            case 1 { 10.0 };
            case 2 { 100.0 };
            case 3 { 1000.0 };
            case _ { 10000.0 };
          };
          let dec = switch (Nat.fromText(decStr)) {
            case (?d) { d };
            case null { 0 };
          };
          ?(whole.toFloat() + dec.toFloat() / denom);
        };
      };
    };
  };

  // Extract the rightmost token from a line that parses as a positive float
  private func firstAmountToken(line : Text) : ?Float {
    var result : ?Float = null;
    label search for (tok in line.split(#char ' ')) {
      switch (cleanParseFloat(tok)) {
        case (?f) {
          if (f > 0.0) { result := ?f; break search };
        };
        case null {};
      };
    };
    result;
  };

  // Return the text after the first ':' in a line, trimmed, or null
  private func afterColon(line : Text) : ?Text {
    var found = false;
    var buf = "";
    for (c in line.toIter()) {
      if (found) {
        buf := buf # Text.fromChar(c);
      } else if (c == ':') {
        found := true;
      };
    };
    if (found) {
      let trimmed = buf.trim(#char ' ');
      if (trimmed.size() > 0) { ?trimmed } else { null };
    } else { null };
  };

  /// Parse extracted plain text (rendered from a PDF on the frontend) and attempt to
  /// find supplier name, invoice number, date, total, and VAT.
  /// confidence: "high" (≥3 fields), "partial" (≥1 field), "failed" (0 fields).
  public func extractBillDataFromText(content : Text) : Types.ExtractedBillData {
    var supplierName : ?Text = null;
    var invoiceNumber : ?Text = null;
    var date : ?Text = null;
    var amount : ?Float = null;
    var vatAmount : ?Float = null;
    var firstNonEmpty : ?Text = null;

    for (rawLine in content.split(#char '\n')) {
      let line = rawLine.trim(#char ' ');
      if (line.size() > 0) {
        if (firstNonEmpty == null) { firstNonEmpty := ?line };
        let lower = line.toLower();

        // Supplier
        if (supplierName == null) {
          if (lineContains(lower, ["from:", "supplier:", "vendor:", "bill from", "issued by"])) {
            switch (afterColon(line)) {
              case (?v) { supplierName := ?v };
              case null {};
            };
          };
        };

        // Invoice number
        if (invoiceNumber == null) {
          if (lineContains(lower, ["invoice no", "invoice #", "invoice number", "bill no", "bill #", "ref:", "reference:"])) {
            switch (afterColon(line)) {
              case (?v) { invoiceNumber := ?v };
              case null {
                // fallback: last space-separated token
                var last = "";
                for (tok in line.split(#char ' ')) { last := tok };
                let trimmed = last.trim(#char ' ');
                if (trimmed.size() > 0) { invoiceNumber := ?trimmed };
              };
            };
          };
        };

        // Date
        if (date == null) {
          if (lineContains(lower, ["date:", "invoice date", "bill date", "issued:", "issue date"])) {
            switch (afterColon(line)) {
              case (?v) { date := ?v };
              case null {};
            };
          };
        };

        // VAT (check before total so totals don't overwrite VAT lines)
        if (vatAmount == null) {
          if (lineContains(lower, ["vat", "tax amount", "gst", "hst"])) {
            switch (firstAmountToken(line)) {
              case (?v) { vatAmount := ?v };
              case null {};
            };
          };
        };

        // Total
        if (amount == null) {
          if (lineContains(lower, ["total:", "total due", "amount due", "balance due", "grand total", "total amount"])) {
            switch (firstAmountToken(line)) {
              case (?v) { amount := ?v };
              case null {};
            };
          };
        };
      };
    };

    let finalSupplier : ?Text = switch (supplierName) {
      case (?s) { ?s };
      case null { firstNonEmpty };
    };

    let fieldsFound = (if (finalSupplier != null) 1 else 0)
      + (if (invoiceNumber != null) 1 else 0)
      + (if (date != null) 1 else 0)
      + (if (amount != null) 1 else 0);

    let confidence = if (fieldsFound >= 3) { "high" }
      else if (fieldsFound >= 1) { "partial" }
      else { "failed" };

    {
      supplierName = finalSupplier;
      invoiceNumber;
      date;
      amount;
      vatAmount;
      confidence;
    };
  };

  /// Associate a file ID with an existing bill (update receiptFileId).
  /// Returns the updated BillShared, or null if bill not found.
  public func attachFileToBill(
    bills : List.List<Types.Bill>,
    id : Nat,
    fileId : Text,
  ) : ?Types.BillShared {
    var found : ?Types.BillShared = null;
    bills.mapInPlace(func(b) {
      if (b.id == id) {
        let updated = {
          b with
          receiptFileId = ?(fileId);
          var status = b.status;
          var paidDate = b.paidDate;
        };
        found := ?toBillShared(updated);
        updated;
      } else { b };
    });
    found;
  };
};
