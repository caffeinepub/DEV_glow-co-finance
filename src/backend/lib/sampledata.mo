import Types "../types/finance";
import Common "../types/common";
import List "mo:core/List";

module {
  // ---- Timestamp helpers ----
  // Base: approximately Jan 1, 2024 in nanoseconds
  // 2024-01-01 = 1704067200 seconds since epoch
  let base2024 : Int = 1_704_067_200_000_000_000;
  let nsPerDay : Int = 86_400_000_000_000;
  let nsPerMonth : Int = 2_592_000_000_000_000;

  func daysAgo(d : Nat) : Int { base2024 + (365 * nsPerDay) - d.toInt() * nsPerDay };
  func daysFromBase(d : Nat) : Int { base2024 + d.toInt() * nsPerDay };

  // Seed all collections with realistic Glow & Co. sample data
  public func seed(
    products : List.List<Types.Product>,
    customers : List.List<Types.Customer>,
    suppliers : List.List<Types.Supplier>,
    invoices : List.List<Types.Invoice>,
    bills : List.List<Types.Bill>,
    transactions : List.List<Types.Transaction>,
    nextProductId : Nat,
    nextCustomerId : Nat,
    nextSupplierId : Nat,
    nextInvoiceId : Nat,
    nextInvoiceNumber : Nat,
    nextBillId : Nat,
    nextBillNumber : Nat,
    nextTransactionId : Nat,
  ) : {
    nextProductId : Nat;
    nextCustomerId : Nat;
    nextSupplierId : Nat;
    nextInvoiceId : Nat;
    nextInvoiceNumber : Nat;
    nextBillId : Nat;
    nextBillNumber : Nat;
    nextTransactionId : Nat;
  } {
    // ---- PRODUCTS ----
    // 9 products with realistic margins
    let productData : [(Text, Text, Float, Float, Nat, Nat, Text)] = [
      // (name, sku, costPrice, salePrice, stock, reorderPoint, desc)
      ("Rosehip Glow Serum",       "GC-001", 12.50, 45.00, 85, 20, "Brightening vitamin C and rosehip oil serum for radiant skin"),
      ("Keratin Repair Mask",       "GC-002",  9.80, 35.00, 62, 15, "Intensive protein-rich mask for damaged and colour-treated hair"),
      ("Vitamin C Moisturiser",     "GC-003", 14.20, 52.00, 48, 10, "Daily SPF-boosting moisturiser enriched with vitamin C"),
      ("Charcoal Cleanser",         "GC-004",  6.50, 22.00, 120, 25, "Deep-pore cleansing gel with activated charcoal"),
      ("Argan Hair Oil",            "GC-005",  8.90, 38.00, 73, 20, "Lightweight Moroccan argan oil for shine and frizz control"),
      ("Hyaluronic Acid Toner",     "GC-006",  7.40, 28.00, 95, 20, "Hydrating toner with 3 molecular weights of hyaluronic acid"),
      ("Shea Butter Body Cream",    "GC-007",  5.60, 32.00, 55, 15, "Rich nourishing body cream with raw shea butter and jojoba"),
      ("Scalp Revival Treatment",   "GC-008", 11.30, 42.00, 8,  15, "Exfoliating scalp serum with tea tree and peppermint"),
      ("Rose Gold Face Mist",       "GC-009",  4.20, 18.00, 142, 30, "Refreshing facial mist with rose water and gold flecks"),
    ];

    var pId = nextProductId;
    for ((name, sku, costPrice, salePrice, stock, reorder, desc) in productData.values()) {
      let margin = (salePrice - costPrice) / salePrice * 100.0;
      products.add({
        id = pId;
        name;
        sku;
        var stockQuantity = stock;
        costPrice;
        salePrice;
        margin;
        reorderPoint = reorder;
        description = desc;
      });
      pId += 1;
    };

    // ---- WHOLESALE CUSTOMERS ----
    let wholesaleData : [(Text, Text, Text, Text)] = [
      ("Luxe Beauty Salon",     "hello@luxebeauty.co.uk",     "020 7123 4567", "14 King Street, London, EC2V 8DL"),
      ("Bliss Hair & Beauty",   "orders@blisshairandbeauty.co.uk", "0161 234 5678", "52 Deansgate, Manchester, M3 2EN"),
      ("The Glow Studio",       "info@theglowstudio.co.uk",   "0121 345 6789", "88 Colmore Row, Birmingham, B3 2BB"),
      ("Pure Radiance Spa",     "buying@pureradiancespa.co.uk","0131 456 7890", "24 George Street, Edinburgh, EH2 2PF"),
      ("Velvet Touch Salon",    "hello@velvettouchsalon.co.uk","0117 567 8901", "36 Park Street, Bristol, BS1 5JA"),
    ];

    var cId = nextCustomerId;
    for ((name, email, phone, address) in wholesaleData.values()) {
      customers.add({ id = cId; name; customerType = #Wholesale; email; phone; address; notes = "Wholesale account — net 30 terms" });
      cId += 1;
    };

    // ---- DTC CUSTOMERS ----
    let dtcData : [(Text, Text, Text, Text)] = [
      ("Sophie Williams",   "sophie.w@email.com",       "07700 100001", "12 Maple Avenue, Leeds, LS1 4DT"),
      ("Emma Thompson",     "emma.thompson@mail.co.uk", "07700 100002", "7 Oak Lane, Liverpool, L1 9HZ"),
      ("Charlotte Davies",  "cdavies@email.com",        "07700 100003", "33 Rose Street, Cardiff, CF10 3AT"),
      ("Olivia Johnson",    "o.johnson@post.co.uk",     "07700 100004", "5 Birch Road, Glasgow, G1 1XR"),
      ("Amelia Brown",      "ameliab@inbox.com",        "07700 100005", "19 Cedar Close, Nottingham, NG1 2DE"),
      ("Isla Clarke",       "isla.clarke@email.co.uk",  "07700 100006", "44 Elm Drive, Sheffield, S1 2GH"),
      ("Poppy Wilson",      "poppy.w@webmail.com",      "07700 100007", "8 Pine Way, Newcastle, NE1 3PL"),
      ("Freya Moore",       "freyamoore@mail.co.uk",    "07700 100008", "21 Willow Court, Norwich, NR1 1DQ"),
      ("Ruby Taylor",       "ruby.t@inbox.co.uk",       "07700 100009", "6 Hazel Street, Plymouth, PL1 2SX"),
      ("Grace Anderson",    "g.anderson@email.com",     "07700 100010", "15 Ash Grove, Southampton, SO14 3TN"),
    ];

    for ((name, email, phone, address) in dtcData.values()) {
      customers.add({ id = cId; name; customerType = #DTC; email; phone; address; notes = "" });
      cId += 1;
    };

    // ---- SUPPLIERS ----
    let supplierData : [(Text, Text, Text, Text, Common.BillCategory, Text)] = [
      ("Beauty Ingredients Co",       "orders@beautyingredients.co.uk", "020 8234 5678", "Industrial Estate, Unit 7, Slough, SL1 4AA", #Ingredients,          "Primary raw materials supplier — net 30 terms"),
      ("EcoPack Solutions",           "trade@ecopack.co.uk",            "0113 234 9876", "Green Business Park, Leeds, LS10 1AB",         #Packaging,            "Sustainable packaging and bottles"),
      ("SwiftShip Logistics",         "accounts@swiftship.co.uk",       "0800 555 1234", "Logistics Centre, Coventry, CV1 2GG",           #Shipping,             "Primary 3PL — direct-to-consumer fulfilment"),
      ("Digital Marketing Agency",    "hello@dmacreative.co.uk",        "020 3456 7890", "Media House, Shoreditch, London, E1 6RF",        #Marketing,            "Monthly retainer for social and paid ads"),
      ("Studio Rent — Glow HQ",       "rents@property-mgmt.co.uk",      "020 1234 0000", "100 Beauty Lane, London, W1D 3QR",              #Rent,                 "Monthly studio and office rent"),
    ];

    var sId = nextSupplierId;
    for ((name, email, phone, address, category, notes) in supplierData.values()) {
      suppliers.add({ id = sId; name; email; phone; address; category; notes });
      sId += 1;
    };

    // ---- BILLS (6 months of supplier invoices) ----
    // supplierId assignments: Beauty=nextSupplierId, EcoPack=+1, SwiftShip=+2, Marketing=+3, Rent=+4
    let supIngredients = nextSupplierId;
    let supPackaging    = nextSupplierId + 1;
    let supShipping     = nextSupplierId + 2;
    let supMarketing    = nextSupplierId + 3;
    let supRent         = nextSupplierId + 4;

    // Bills: 6 months, multiple per month
    // Format: (supplierId, supplierName, daysAgoIssued, daysAgoToDue, amount, vatRate, vatAmount, category, status, daysAgoPaid)
    type BillSeed = {
      supplierId : Nat;
      supplierName : Text;
      issued : Int;
      due : Int;
      amount : Float;
      vatRate : Common.VatRate;
      vatAmount : Float;
      category : Common.BillCategory;
      status : Common.BillStatus;
      paid : ?Int;
    };

    let billSeeds : [BillSeed] = [
      // Month 1 (6 months ago)
      { supplierId = supIngredients; supplierName = "Beauty Ingredients Co"; issued = daysAgo(180); due = daysAgo(150); amount = 3200.00; vatRate = #Twenty; vatAmount = 640.00; category = #Ingredients; status = #Paid; paid = ?daysAgo(155) },
      { supplierId = supPackaging;    supplierName = "EcoPack Solutions";     issued = daysAgo(178); due = daysAgo(148); amount = 1100.00; vatRate = #Twenty; vatAmount = 220.00; category = #Packaging;  status = #Paid; paid = ?daysAgo(150) },
      { supplierId = supShipping;     supplierName = "SwiftShip Logistics";   issued = daysAgo(175); due = daysAgo(160); amount = 890.00;  vatRate = #Twenty; vatAmount = 178.00; category = #Shipping;   status = #Paid; paid = ?daysAgo(162) },
      { supplierId = supMarketing;    supplierName = "Digital Marketing Agency"; issued = daysAgo(176); due = daysAgo(146); amount = 1500.00; vatRate = #Twenty; vatAmount = 300.00; category = #Marketing; status = #Paid; paid = ?daysAgo(148) },
      { supplierId = supRent;         supplierName = "Studio Rent — Glow HQ"; issued = daysAgo(180); due = daysAgo(170); amount = 2200.00; vatRate = #Twenty; vatAmount = 440.00; category = #Rent;       status = #Paid; paid = ?daysAgo(172) },
      // Month 2
      { supplierId = supIngredients; supplierName = "Beauty Ingredients Co"; issued = daysAgo(150); due = daysAgo(120); amount = 3500.00; vatRate = #Twenty; vatAmount = 700.00; category = #Ingredients; status = #Paid; paid = ?daysAgo(122) },
      { supplierId = supPackaging;    supplierName = "EcoPack Solutions";     issued = daysAgo(148); due = daysAgo(118); amount = 1250.00; vatRate = #Twenty; vatAmount = 250.00; category = #Packaging;  status = #Paid; paid = ?daysAgo(120) },
      { supplierId = supShipping;     supplierName = "SwiftShip Logistics";   issued = daysAgo(145); due = daysAgo(130); amount = 1020.00; vatRate = #Twenty; vatAmount = 204.00; category = #Shipping;   status = #Paid; paid = ?daysAgo(132) },
      { supplierId = supMarketing;    supplierName = "Digital Marketing Agency"; issued = daysAgo(146); due = daysAgo(116); amount = 1500.00; vatRate = #Twenty; vatAmount = 300.00; category = #Marketing; status = #Paid; paid = ?daysAgo(118) },
      { supplierId = supRent;         supplierName = "Studio Rent — Glow HQ"; issued = daysAgo(150); due = daysAgo(140); amount = 2200.00; vatRate = #Twenty; vatAmount = 440.00; category = #Rent;       status = #Paid; paid = ?daysAgo(142) },
      // Month 3
      { supplierId = supIngredients; supplierName = "Beauty Ingredients Co"; issued = daysAgo(120); due = daysAgo(90);  amount = 4100.00; vatRate = #Twenty; vatAmount = 820.00; category = #Ingredients; status = #Paid; paid = ?daysAgo(92) },
      { supplierId = supPackaging;    supplierName = "EcoPack Solutions";     issued = daysAgo(118); due = daysAgo(88);  amount = 980.00;  vatRate = #Twenty; vatAmount = 196.00; category = #Packaging;  status = #Paid; paid = ?daysAgo(90) },
      { supplierId = supShipping;     supplierName = "SwiftShip Logistics";   issued = daysAgo(115); due = daysAgo(100); amount = 1150.00; vatRate = #Twenty; vatAmount = 230.00; category = #Shipping;   status = #Paid; paid = ?daysAgo(102) },
      { supplierId = supMarketing;    supplierName = "Digital Marketing Agency"; issued = daysAgo(116); due = daysAgo(86);  amount = 1500.00; vatRate = #Twenty; vatAmount = 300.00; category = #Marketing; status = #Paid; paid = ?daysAgo(88) },
      { supplierId = supRent;         supplierName = "Studio Rent — Glow HQ"; issued = daysAgo(120); due = daysAgo(110); amount = 2200.00; vatRate = #Twenty; vatAmount = 440.00; category = #Rent;       status = #Paid; paid = ?daysAgo(112) },
      // Month 4
      { supplierId = supIngredients; supplierName = "Beauty Ingredients Co"; issued = daysAgo(90);  due = daysAgo(60);  amount = 3800.00; vatRate = #Twenty; vatAmount = 760.00; category = #Ingredients; status = #Paid; paid = ?daysAgo(62) },
      { supplierId = supPackaging;    supplierName = "EcoPack Solutions";     issued = daysAgo(88);  due = daysAgo(58);  amount = 1300.00; vatRate = #Twenty; vatAmount = 260.00; category = #Packaging;  status = #Paid; paid = ?daysAgo(60) },
      { supplierId = supShipping;     supplierName = "SwiftShip Logistics";   issued = daysAgo(85);  due = daysAgo(70);  amount = 1280.00; vatRate = #Twenty; vatAmount = 256.00; category = #Shipping;   status = #Paid; paid = ?daysAgo(72) },
      { supplierId = supMarketing;    supplierName = "Digital Marketing Agency"; issued = daysAgo(86);  due = daysAgo(56);  amount = 1800.00; vatRate = #Twenty; vatAmount = 360.00; category = #Marketing; status = #Paid; paid = ?daysAgo(58) },
      { supplierId = supRent;         supplierName = "Studio Rent — Glow HQ"; issued = daysAgo(90);  due = daysAgo(80);  amount = 2200.00; vatRate = #Twenty; vatAmount = 440.00; category = #Rent;       status = #Paid; paid = ?daysAgo(82) },
      // Month 5
      { supplierId = supIngredients; supplierName = "Beauty Ingredients Co"; issued = daysAgo(60);  due = daysAgo(30);  amount = 4200.00; vatRate = #Twenty; vatAmount = 840.00; category = #Ingredients; status = #Paid; paid = ?daysAgo(32) },
      { supplierId = supPackaging;    supplierName = "EcoPack Solutions";     issued = daysAgo(58);  due = daysAgo(28);  amount = 1450.00; vatRate = #Twenty; vatAmount = 290.00; category = #Packaging;  status = #Paid; paid = ?daysAgo(30) },
      { supplierId = supShipping;     supplierName = "SwiftShip Logistics";   issued = daysAgo(55);  due = daysAgo(40);  amount = 1400.00; vatRate = #Twenty; vatAmount = 280.00; category = #Shipping;   status = #Paid; paid = ?daysAgo(42) },
      { supplierId = supMarketing;    supplierName = "Digital Marketing Agency"; issued = daysAgo(56);  due = daysAgo(26);  amount = 1800.00; vatRate = #Twenty; vatAmount = 360.00; category = #Marketing; status = #Paid; paid = ?daysAgo(28) },
      { supplierId = supRent;         supplierName = "Studio Rent — Glow HQ"; issued = daysAgo(60);  due = daysAgo(50);  amount = 2200.00; vatRate = #Twenty; vatAmount = 440.00; category = #Rent;       status = #Paid; paid = ?daysAgo(52) },
      // Month 6 (most recent, some unpaid)
      { supplierId = supIngredients; supplierName = "Beauty Ingredients Co"; issued = daysAgo(25);  due = daysAgo(0) + nsPerDay * 5;  amount = 3900.00; vatRate = #Twenty; vatAmount = 780.00; category = #Ingredients; status = #Unpaid; paid = null },
      { supplierId = supPackaging;    supplierName = "EcoPack Solutions";     issued = daysAgo(22);  due = daysAgo(0) + nsPerDay * 8;  amount = 1350.00; vatRate = #Twenty; vatAmount = 270.00; category = #Packaging;  status = #Unpaid; paid = null },
      { supplierId = supShipping;     supplierName = "SwiftShip Logistics";   issued = daysAgo(20);  due = daysAgo(0) + nsPerDay * 10; amount = 1100.00; vatRate = #Twenty; vatAmount = 220.00; category = #Shipping;   status = #Unpaid; paid = null },
      { supplierId = supMarketing;    supplierName = "Digital Marketing Agency"; issued = daysAgo(21);  due = daysAgo(5); amount = 1800.00; vatRate = #Twenty; vatAmount = 360.00; category = #Marketing; status = #Overdue; paid = null },
      { supplierId = supRent;         supplierName = "Studio Rent — Glow HQ"; issued = daysAgo(30);  due = daysAgo(20); amount = 2200.00; vatRate = #Twenty; vatAmount = 440.00; category = #Rent;       status = #Paid; paid = ?daysAgo(22) },
    ];

    var bId = nextBillId;
    var bNum = nextBillNumber;
    for (b in billSeeds.values()) {
      bills.add({
        id = bId;
        billNumber = "BILL-" # bNum.toText();
        supplierId = b.supplierId;
        supplierName = b.supplierName;
        date = b.issued;
        dueDate = b.due;
        amount = b.amount;
        vatRate = b.vatRate;
        vatAmount = b.vatAmount;
        category = b.category;
        var status = b.status;
        var paidDate = b.paid;
        notes = "";
        linkedProductIds = [];
        receiptFileId = null;
      });
      bId += 1;
      bNum += 1;
    };

    // ---- INVOICES ----
    // Wholesale customers get IDs nextCustomerId..nextCustomerId+4
    // DTC customers get IDs nextCustomerId+5..nextCustomerId+14
    let ws1 = nextCustomerId;
    let ws2 = nextCustomerId + 1;
    let ws3 = nextCustomerId + 2;
    let ws4 = nextCustomerId + 3;
    let ws5 = nextCustomerId + 4;
    let dtc1 = nextCustomerId + 5;
    let dtc2 = nextCustomerId + 6;
    let dtc3 = nextCustomerId + 7;
    let dtc4 = nextCustomerId + 8;
    let dtc5 = nextCustomerId + 9;
    let dtc6 = nextCustomerId + 10;
    let dtc7 = nextCustomerId + 11;
    let dtc8 = nextCustomerId + 12;
    let dtc9 = nextCustomerId + 13;
    let dtc10 = nextCustomerId + 14;

    type InvoiceSeed = {
      customerId : Nat;
      customerName : Text;
      lineItems : [Types.InvoiceLineItem];
      issueDate : Int;
      dueDate : Int;
      status : Common.InvoiceStatus;
      paidDate : ?Int;
    };

    // Helper: build line items
    // Product IDs: Rosehip=nextProductId, Keratin=+1, VitC=+2, Charcoal=+3, Argan=+4, Hyal=+5, Shea=+6, Scalp=+7, Mist=+8
    let p1 = nextProductId; // Rosehip Glow Serum £45
    let p2 = nextProductId + 1; // Keratin Repair Mask £35
    let p3 = nextProductId + 2; // Vitamin C Moisturiser £52
    let p4 = nextProductId + 3; // Charcoal Cleanser £22
    let p5 = nextProductId + 4; // Argan Hair Oil £38
    let p6 = nextProductId + 5; // Hyaluronic Acid Toner £28
    let p7 = nextProductId + 6; // Shea Butter Body Cream £32
    let p8 = nextProductId + 7; // Scalp Revival Treatment £42
    let p9 = nextProductId + 8; // Rose Gold Face Mist £18

    func li(pid : Nat, name : Text, qty : Nat, unitPrice : Float) : Types.InvoiceLineItem {
      let lineTotal = unitPrice * qty.toFloat();
      let vatAmount = lineTotal * 0.20;
      {
        productId = pid;
        productName = name;
        quantity = qty;
        unitPrice;
        vatRate = #Twenty;
        vatAmount;
        lineTotal;
      };
    };

    let invoiceSeeds : [InvoiceSeed] = [
      // Month 1 — 6 months ago (all paid)
      {
        customerId = ws1; customerName = "Luxe Beauty Salon";
        lineItems = [li(p1, "Rosehip Glow Serum", 12, 45.00), li(p3, "Vitamin C Moisturiser", 8, 52.00), li(p6, "Hyaluronic Acid Toner", 10, 28.00)];
        issueDate = daysAgo(180); dueDate = daysAgo(150);
        status = #Paid; paidDate = ?daysAgo(148);
      },
      {
        customerId = ws2; customerName = "Bliss Hair & Beauty";
        lineItems = [li(p2, "Keratin Repair Mask", 15, 35.00), li(p5, "Argan Hair Oil", 10, 38.00), li(p8, "Scalp Revival Treatment", 8, 42.00)];
        issueDate = daysAgo(178); dueDate = daysAgo(148);
        status = #Paid; paidDate = ?daysAgo(146);
      },
      // Month 2 — 5 months ago (all paid)
      {
        customerId = ws3; customerName = "The Glow Studio";
        lineItems = [li(p1, "Rosehip Glow Serum", 10, 45.00), li(p4, "Charcoal Cleanser", 20, 22.00), li(p7, "Shea Butter Body Cream", 12, 32.00)];
        issueDate = daysAgo(150); dueDate = daysAgo(120);
        status = #Paid; paidDate = ?daysAgo(118);
      },
      {
        customerId = dtc1; customerName = "Sophie Williams";
        lineItems = [li(p1, "Rosehip Glow Serum", 1, 45.00), li(p9, "Rose Gold Face Mist", 2, 18.00)];
        issueDate = daysAgo(148); dueDate = daysAgo(118);
        status = #Paid; paidDate = ?daysAgo(148);
      },
      {
        customerId = dtc2; customerName = "Emma Thompson";
        lineItems = [li(p3, "Vitamin C Moisturiser", 1, 52.00), li(p6, "Hyaluronic Acid Toner", 1, 28.00)];
        issueDate = daysAgo(145); dueDate = daysAgo(115);
        status = #Paid; paidDate = ?daysAgo(145);
      },
      // Month 3 — 4 months ago (all paid)
      {
        customerId = ws4; customerName = "Pure Radiance Spa";
        lineItems = [li(p1, "Rosehip Glow Serum", 14, 45.00), li(p3, "Vitamin C Moisturiser", 10, 52.00), li(p9, "Rose Gold Face Mist", 20, 18.00)];
        issueDate = daysAgo(120); dueDate = daysAgo(90);
        status = #Paid; paidDate = ?daysAgo(88);
      },
      {
        customerId = dtc3; customerName = "Charlotte Davies";
        lineItems = [li(p7, "Shea Butter Body Cream", 2, 32.00), li(p9, "Rose Gold Face Mist", 1, 18.00)];
        issueDate = daysAgo(118); dueDate = daysAgo(88);
        status = #Paid; paidDate = ?daysAgo(118);
      },
      {
        customerId = dtc4; customerName = "Olivia Johnson";
        lineItems = [li(p4, "Charcoal Cleanser", 1, 22.00), li(p6, "Hyaluronic Acid Toner", 2, 28.00)];
        issueDate = daysAgo(115); dueDate = daysAgo(85);
        status = #Paid; paidDate = ?daysAgo(115);
      },
      // Month 4 — 3 months ago
      {
        customerId = ws5; customerName = "Velvet Touch Salon";
        lineItems = [li(p2, "Keratin Repair Mask", 18, 35.00), li(p5, "Argan Hair Oil", 15, 38.00), li(p8, "Scalp Revival Treatment", 10, 42.00)];
        issueDate = daysAgo(90); dueDate = daysAgo(60);
        status = #Paid; paidDate = ?daysAgo(58);
      },
      {
        customerId = dtc5; customerName = "Amelia Brown";
        lineItems = [li(p1, "Rosehip Glow Serum", 1, 45.00), li(p3, "Vitamin C Moisturiser", 1, 52.00)];
        issueDate = daysAgo(88); dueDate = daysAgo(58);
        status = #Paid; paidDate = ?daysAgo(88);
      },
      {
        customerId = dtc6; customerName = "Isla Clarke";
        lineItems = [li(p2, "Keratin Repair Mask", 1, 35.00), li(p5, "Argan Hair Oil", 1, 38.00)];
        issueDate = daysAgo(85); dueDate = daysAgo(55);
        status = #Paid; paidDate = ?daysAgo(85);
      },
      // Month 5 — 2 months ago
      {
        customerId = ws1; customerName = "Luxe Beauty Salon";
        lineItems = [li(p1, "Rosehip Glow Serum", 15, 45.00), li(p6, "Hyaluronic Acid Toner", 12, 28.00), li(p4, "Charcoal Cleanser", 24, 22.00)];
        issueDate = daysAgo(60); dueDate = daysAgo(30);
        status = #Paid; paidDate = ?daysAgo(28);
      },
      {
        customerId = dtc7; customerName = "Poppy Wilson";
        lineItems = [li(p9, "Rose Gold Face Mist", 2, 18.00), li(p7, "Shea Butter Body Cream", 1, 32.00)];
        issueDate = daysAgo(58); dueDate = daysAgo(28);
        status = #Paid; paidDate = ?daysAgo(58);
      },
      {
        customerId = dtc8; customerName = "Freya Moore";
        lineItems = [li(p3, "Vitamin C Moisturiser", 1, 52.00), li(p9, "Rose Gold Face Mist", 1, 18.00)];
        issueDate = daysAgo(55); dueDate = daysAgo(25);
        status = #Paid; paidDate = ?daysAgo(55);
      },
      // Month 6 — most recent (mixed statuses)
      {
        customerId = ws2; customerName = "Bliss Hair & Beauty";
        lineItems = [li(p2, "Keratin Repair Mask", 20, 35.00), li(p5, "Argan Hair Oil", 16, 38.00), li(p8, "Scalp Revival Treatment", 12, 42.00)];
        issueDate = daysAgo(25); dueDate = daysAgo(0) + nsPerDay * 5;
        status = #Sent; paidDate = null;
      },
      {
        customerId = ws3; customerName = "The Glow Studio";
        lineItems = [li(p1, "Rosehip Glow Serum", 12, 45.00), li(p3, "Vitamin C Moisturiser", 8, 52.00)];
        issueDate = daysAgo(40); dueDate = daysAgo(10);
        status = #Overdue; paidDate = null;
      },
      {
        customerId = dtc9; customerName = "Ruby Taylor";
        lineItems = [li(p6, "Hyaluronic Acid Toner", 1, 28.00), li(p4, "Charcoal Cleanser", 2, 22.00)];
        issueDate = daysAgo(20); dueDate = daysAgo(0) + nsPerDay * 10;
        status = #Sent; paidDate = null;
      },
      {
        customerId = dtc10; customerName = "Grace Anderson";
        lineItems = [li(p1, "Rosehip Glow Serum", 1, 45.00)];
        issueDate = daysAgo(5); dueDate = daysAgo(0) + nsPerDay * 25;
        status = #Draft; paidDate = null;
      },
    ];

    var iId = nextInvoiceId;
    var iNum = nextInvoiceNumber;
    for (inv in invoiceSeeds.values()) {
      let subtotal = inv.lineItems.foldLeft(0.0, func(acc, item) { acc + item.lineTotal });
      let totalVat = inv.lineItems.foldLeft(0.0, func(acc, item) { acc + item.vatAmount });
      let grandTotal = subtotal + totalVat;
      invoices.add({
        id = iId;
        invoiceNumber = "INV-" # iNum.toText();
        customerId = inv.customerId;
        customerName = inv.customerName;
        var status = inv.status;
        lineItems = inv.lineItems;
        subtotal;
        totalVat;
        grandTotal;
        issueDate = inv.issueDate;
        dueDate = inv.dueDate;
        var paidDate = inv.paidDate;
        notes = "";
        isRecurring = false;
        recurringFrequency = null;
      });
      iId += 1;
      iNum += 1;
    };

    {
      nextProductId = pId;
      nextCustomerId = cId;
      nextSupplierId = sId;
      nextInvoiceId = iId;
      nextInvoiceNumber = iNum;
      nextBillId = bId;
      nextBillNumber = bNum;
      nextTransactionId;
    };
  };
};
