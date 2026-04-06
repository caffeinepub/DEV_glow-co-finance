import Types "../types/finance";
import Common "../types/common";
import ReportsLib "../lib/reports";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

mixin (
  invoices : List.List<Types.Invoice>,
  bills : List.List<Types.Bill>,
  products : List.List<Types.Product>,
  transactions : List.List<Types.Transaction>,
) {
  public query func getDashboardStats() : async Types.DashboardStats {
    ReportsLib.buildDashboardStats(invoices, bills, products, transactions, Time.now());
  };

  public query func getProfitAndLoss(startDate : Common.Timestamp, endDate : Common.Timestamp) : async Types.ProfitAndLossReport {
    ReportsLib.buildProfitAndLoss(invoices, bills, startDate, endDate);
  };

  public query func getExpenseSummary(startDate : Common.Timestamp, endDate : Common.Timestamp) : async Types.ExpenseSummary {
    ReportsLib.buildExpenseSummary(bills, startDate, endDate);
  };

  public query func getAgedReceivables() : async Types.AgedReport {
    ReportsLib.buildAgedReceivables(invoices, Time.now());
  };

  public query func getAgedPayables() : async Types.AgedReport {
    ReportsLib.buildAgedPayables(bills, Time.now());
  };

  public query func getCashFlow(year : Nat) : async [Types.MonthlyCashFlow] {
    ReportsLib.buildCashFlow(invoices, bills, year);
  };

  public query func getMonthlySummary(month : Nat, year : Nat) : async Types.MonthlySummary {
    ReportsLib.buildMonthlySummary(invoices, bills, month, year);
  };

  public query func getVatSummary(quarter : Nat, year : Nat) : async Types.VatSummary {
    ReportsLib.buildVatSummary(invoices, bills, quarter, year);
  };
};
