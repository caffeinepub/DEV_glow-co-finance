import Types "../types/finance";
import Common "../types/common";
import InvoicesLib "invoices";
import BillsLib "bills";
import InventoryLib "inventory";
import List "mo:core/List";
import Nat "mo:core/Nat";

module {
  // Nanoseconds per day
  let nsPerDay : Int = 86_400_000_000_000;

  // Build the full DashboardStats from all collections
  public func buildDashboardStats(
    invoices : List.List<Types.Invoice>,
    bills : List.List<Types.Bill>,
    products : List.List<Types.Product>,
    transactions : List.List<Types.Transaction>,
    now : Common.Timestamp,
  ) : Types.DashboardStats {
    // Cash balance = sum of all paid invoice grandTotals - sum of all paid bill amounts
    let totalPaidRevenue = invoices.foldLeft(0.0, func(acc, inv) {
      if (inv.status == #Paid) { acc + inv.grandTotal } else { acc };
    });
    let totalPaidBills = bills.foldLeft(0.0, func(acc, b) {
      if (b.status == #Paid) { acc + b.amount } else { acc };
    });
    let totalCashBalance = totalPaidRevenue - totalPaidBills;

    // Month boundaries for current month
    let (monthStart, monthEnd) = currentMonthBounds(now);

    let revenueThisMonth = InvoicesLib.revenueInRange(invoices, monthStart, monthEnd);
    let expensesThisMonth = BillsLib.expensesInRange(bills, monthStart, monthEnd);
    let netProfitThisMonth = revenueThisMonth - expensesThisMonth;

    let overdueInvoices = InvoicesLib.getOverdueInvoices(invoices, now);
    let billsDueIn14Days = BillsLib.getBillsDueIn14Days(bills, now);
    let lowStockProducts = InventoryLib.getLowStockProducts(products);

    {
      totalCashBalance;
      revenueThisMonth;
      expensesThisMonth;
      netProfitThisMonth;
      overdueInvoices;
      billsDueIn14Days;
      lowStockProducts;
    };
  };

  public func buildProfitAndLoss(
    invoices : List.List<Types.Invoice>,
    bills : List.List<Types.Bill>,
    start : Common.Timestamp,
    end : Common.Timestamp,
  ) : Types.ProfitAndLossReport {
    let revenue = InvoicesLib.revenueInRange(invoices, start, end);

    // COGS = bills categorised as Ingredients or Packaging paid in range
    let cogs = bills.foldLeft(0.0, func(acc, b) {
      if (b.status == #Paid) {
        switch (b.paidDate) {
          case (?pd) {
            if (pd >= start and pd <= end) {
              switch (b.category) {
                case (#Ingredients or #Packaging) { acc + b.amount };
                case _ { acc };
              };
            } else { acc };
          };
          case null { acc };
        };
      } else { acc };
    });

    let grossProfit = revenue - cogs;

    // Operating expenses (non-COGS)
    let opExpensesByCategory = bills.foldLeft<[(Text, Float)], Types.Bill>([], func(acc, b) {
      if (b.status == #Paid) {
        switch (b.paidDate) {
          case (?pd) {
            if (pd >= start and pd <= end) {
              switch (b.category) {
                case (#Ingredients or #Packaging) { acc }; // Already counted in COGS
                case _ {
                  let catText = BillsLib.categoryToText(b.category);
                  mergeCategory(acc, catText, b.amount);
                };
              };
            } else { acc };
          };
          case null { acc };
        };
      } else { acc };
    });

    let totalExpenses = opExpensesByCategory.foldLeft( 0.0, func(acc, pair) { acc + pair.1 });
    let netProfit = grossProfit - totalExpenses;

    // Previous period (same duration before start)
    let duration = end - start;
    let prevStart = start - duration;
    let prevEnd = start - 1;

    let prevRevenue = InvoicesLib.revenueInRange(invoices, prevStart, prevEnd);
    let prevCogs = bills.foldLeft(0.0, func(acc, b) {
      if (b.status == #Paid) {
        switch (b.paidDate) {
          case (?pd) {
            if (pd >= prevStart and pd <= prevEnd) {
              switch (b.category) {
                case (#Ingredients or #Packaging) { acc + b.amount };
                case _ { acc };
              };
            } else { acc };
          };
          case null { acc };
        };
      } else { acc };
    });
    let prevGrossProfit = prevRevenue - prevCogs;
    let prevOpExpenses = bills.foldLeft(0.0, func(acc, b) {
      if (b.status == #Paid) {
        switch (b.paidDate) {
          case (?pd) {
            if (pd >= prevStart and pd <= prevEnd) {
              switch (b.category) {
                case (#Ingredients or #Packaging) { acc };
                case _ { acc + b.amount };
              };
            } else { acc };
          };
          case null { acc };
        };
      } else { acc };
    });
    let prevNetProfit = prevGrossProfit - prevOpExpenses;

    {
      startDate = start;
      endDate = end;
      revenue;
      cogs;
      grossProfit;
      expensesByCategory = opExpensesByCategory;
      totalExpenses;
      netProfit;
      prevRevenue;
      prevCogs;
      prevGrossProfit;
      prevNetProfit;
    };
  };

  public func buildExpenseSummary(
    bills : List.List<Types.Bill>,
    start : Common.Timestamp,
    end : Common.Timestamp,
  ) : Types.ExpenseSummary {
    // Current period
    let current = BillsLib.expensesByCategoryInRange(bills, start, end);
    // Previous month (same length)
    let duration = end - start;
    let prevStart = start - duration;
    let prevEnd = start - 1;
    let previous = BillsLib.expensesByCategoryInRange(bills, prevStart, prevEnd);

    let categories = current.map(func(pair) {
      let prevAmt = switch (previous.find(func(p) { p.0 == pair.0 })) {
        case (?p) { p.1 };
        case null { 0.0 };
      };
      let flagged = if (prevAmt > 0.0) {
        (pair.1 - prevAmt) / prevAmt > 0.20;
      } else {
        pair.1 > 0.0;
      };
      {
        category = pair.0;
        amount = pair.1;
        prevAmount = prevAmt;
        flagged;
      };
    });

    let total = current.foldLeft(0.0, func(acc, pair) { acc + pair.1 });

    { startDate = start; endDate = end; categories; total };
  };

  public func buildAgedReceivables(
    invoices : List.List<Types.Invoice>,
    now : Common.Timestamp,
  ) : Types.AgedReport {
    var b0_30 : Float = 0.0; var c0_30 : Nat = 0;
    var b31_60 : Float = 0.0; var c31_60 : Nat = 0;
    var b61_90 : Float = 0.0; var c61_90 : Nat = 0;
    var b90plus : Float = 0.0; var c90plus : Nat = 0;

    invoices.forEach(func(inv) {
      if (inv.status == #Sent or inv.status == #Overdue) {
        if (inv.dueDate < now) {
          let daysOverdue = (now - inv.dueDate) / nsPerDay;
          if (daysOverdue <= 30) {
            b0_30 += inv.grandTotal; c0_30 += 1;
          } else if (daysOverdue <= 60) {
            b31_60 += inv.grandTotal; c31_60 += 1;
          } else if (daysOverdue <= 90) {
            b61_90 += inv.grandTotal; c61_90 += 1;
          } else {
            b90plus += inv.grandTotal; c90plus += 1;
          };
        } else {
          // Not yet due but unpaid — counts as 0-30
          b0_30 += inv.grandTotal; c0_30 += 1;
        };
      };
    });

    let grandTotal = b0_30 + b31_60 + b61_90 + b90plus;
    {
      buckets = [
        { title = "0-30 days"; count = c0_30; total = b0_30 },
        { title = "31-60 days"; count = c31_60; total = b31_60 },
        { title = "61-90 days"; count = c61_90; total = b61_90 },
        { title = "90+ days"; count = c90plus; total = b90plus },
      ];
      grandTotal;
    };
  };

  public func buildAgedPayables(
    bills : List.List<Types.Bill>,
    now : Common.Timestamp,
  ) : Types.AgedReport {
    var b0_30 : Float = 0.0; var c0_30 : Nat = 0;
    var b31_60 : Float = 0.0; var c31_60 : Nat = 0;
    var b61_90 : Float = 0.0; var c61_90 : Nat = 0;
    var b90plus : Float = 0.0; var c90plus : Nat = 0;

    bills.forEach(func(b) {
      if (b.status == #Unpaid or b.status == #Overdue) {
        if (b.dueDate < now) {
          let daysOverdue = (now - b.dueDate) / nsPerDay;
          if (daysOverdue <= 30) {
            b0_30 += b.amount; c0_30 += 1;
          } else if (daysOverdue <= 60) {
            b31_60 += b.amount; c31_60 += 1;
          } else if (daysOverdue <= 90) {
            b61_90 += b.amount; c61_90 += 1;
          } else {
            b90plus += b.amount; c90plus += 1;
          };
        } else {
          b0_30 += b.amount; c0_30 += 1;
        };
      };
    });

    let grandTotal = b0_30 + b31_60 + b61_90 + b90plus;
    {
      buckets = [
        { title = "0-30 days"; count = c0_30; total = b0_30 },
        { title = "31-60 days"; count = c31_60; total = b31_60 },
        { title = "61-90 days"; count = c61_90; total = b61_90 },
        { title = "90+ days"; count = c90plus; total = b90plus },
      ];
      grandTotal;
    };
  };

  public func buildCashFlow(
    invoices : List.List<Types.Invoice>,
    bills : List.List<Types.Bill>,
    year : Nat,
  ) : [Types.MonthlyCashFlow] {
    var runningBalance : Float = 0.0;
    var result : [Types.MonthlyCashFlow] = [];

    for (month in Nat.range(1, 13)) {
      let (ms, me) = monthBounds(month, year);
      let inflow = InvoicesLib.revenueInRange(invoices, ms, me);
      let outflow = BillsLib.expensesInRange(bills, ms, me);
      let netFlow = inflow - outflow;
      runningBalance += netFlow;
      let entry : Types.MonthlyCashFlow = {
        month;
        year;
        inflow;
        outflow;
        netFlow;
        runningBalance;
      };
      result := result.concat([entry]);
    };
    result;
  };

  public func buildMonthlySummary(
    invoices : List.List<Types.Invoice>,
    bills : List.List<Types.Bill>,
    month : Nat,
    year : Nat,
  ) : Types.MonthlySummary {
    let (ms, me) = monthBounds(month, year);

    let revenue = InvoicesLib.revenueInRange(invoices, ms, me);
    let expenses = BillsLib.expensesInRange(bills, ms, me);
    let profit = revenue - expenses;

    // Top 3 customers by revenue in range
    var customerTotals : [(Text, Float)] = [];
    invoices.forEach(func(inv) {
      if (inv.status == #Paid) {
        switch (inv.paidDate) {
          case (?pd) {
            if (pd >= ms and pd <= me) {
              customerTotals := mergeCategory(customerTotals, inv.customerName, inv.grandTotal);
            };
          };
          case null {};
        };
      };
    });
    let topCustomers = sortedTopN(customerTotals, 3);

    // Top 3 expense categories
    let expCat = BillsLib.expensesByCategoryInRange(bills, ms, me);
    let topExpenseCategories = sortedTopN(expCat, 3);

    { month; year; revenue; expenses; profit; topCustomers; topExpenseCategories };
  };

  public func buildVatSummary(
    invoices : List.List<Types.Invoice>,
    bills : List.List<Types.Bill>,
    quarter : Nat,
    year : Nat,
  ) : Types.VatSummary {
    let (qs, qe) = quarterBounds(quarter, year);
    let vatCollected = InvoicesLib.vatCollectedInRange(invoices, qs, qe);
    let vatPaid = BillsLib.vatPaidInRange(bills, qs, qe);
    let netVatOwed = vatCollected - vatPaid;
    { quarter; year; vatCollected; vatPaid; netVatOwed };
  };

  // ---- Helpers ----

  func mergeCategory(acc : [(Text, Float)], cat : Text, amount : Float) : [(Text, Float)] {
    var found = false;
    let updated = acc.map(func(pair) {
      if (pair.0 == cat) {
        found := true;
        (pair.0, pair.1 + amount);
      } else { pair };
    });
    if (found) { updated } else { updated.concat([(cat, amount)]) };
  };

  func sortedTopN(items : [(Text, Float)], n : Nat) : [(Text, Float)] {
    let sorted = items.sort(func(a : (Text, Float), b : (Text, Float)) : { #less; #equal; #greater } {
      if (b.1 > a.1) { #less } else if (b.1 < a.1) { #greater } else { #equal };
    });
    if (sorted.size() <= n) { sorted } else {
      sorted.sliceToArray(0, n);
    };
  };

  // Returns (startOfMonth, endOfMonth) as nanosecond timestamps
  // Using a simplified approach: approximate timestamps based on year/month
  func monthBounds(month : Nat, year : Nat) : (Int, Int) {
    // Days per month (non-leap year)
    let daysInMonth : [Nat] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let isLeap = (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0);
    let days = if (month == 2 and isLeap) { 29 } else {
      if (month >= 1 and month <= 12) { daysInMonth[month - 1] } else { 30 };
    };

    // Days from epoch (Jan 1, 1970) to Jan 1 of the given year
    let daysToYear = daysFromEpochToYear(year);

    // Days from Jan 1 of year to start of given month
    var daysToMonth : Nat = 0;
    for (m in Nat.range(1, month)) {
      let md = if (m == 2 and isLeap) { 29 } else {
        if (m >= 1 and m <= 12) { daysInMonth[m - 1] } else { 30 };
      };
      daysToMonth += md;
    };

    let startDay : Int = daysToYear.toInt() + daysToMonth.toInt();
    let endDay : Int = startDay + days.toInt();
    let nsPerDayLocal : Int = 86_400_000_000_000;
    (startDay * nsPerDayLocal, endDay * nsPerDayLocal - 1);
  };

  func daysFromEpochToYear(year : Nat) : Nat {
    // Count days from 1970 to start of given year
    var days : Nat = 0;
    var y : Nat = 1970;
    while (y < year) {
      let isLeap = (y % 4 == 0 and y % 100 != 0) or (y % 400 == 0);
      days += if (isLeap) { 366 } else { 365 };
      y += 1;
    };
    days;
  };

  func currentMonthBounds(now : Common.Timestamp) : (Int, Int) {
    // Approximate: determine year and month from timestamp
    let nsPerDayLocal : Int = 86_400_000_000_000;
    let daysSinceEpoch : Int = now / nsPerDayLocal;
    // Count years from 1970
    var year : Nat = 1970;
    var remaining : Int = daysSinceEpoch;
    label yearLoop while (true) {
      let isLeap = (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0);
      let daysInYear : Int = if (isLeap) { 366 } else { 365 };
      if (remaining < daysInYear) { break yearLoop };
      remaining -= daysInYear;
      year += 1;
    };
    let daysInMonth : [Nat] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let isLeap = (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0);
    var month : Nat = 1;
    label monthLoop while (month <= 12) {
      let days : Int = if (month == 2 and isLeap) { 29 } else {
        daysInMonth[month - 1].toInt();
      };
      if (remaining < days) { break monthLoop };
      remaining -= days;
      month += 1;
    };
    monthBounds(month, year);
  };

  func quarterBounds(quarter : Nat, year : Nat) : (Int, Int) {
    let startMonth = (quarter - 1) * 3 + 1;
    let endMonth = startMonth + 2;
    let (qs, _) = monthBounds(startMonth, year);
    let (_, qe) = monthBounds(endMonth, year);
    (qs, qe);
  };
};
