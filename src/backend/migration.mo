import List "mo:core/List";

module {
  // Old inline types (from previous version's types/finance.mo and types/common.mo)
  type Timestamp = Int;
  type TransactionType = { #InvoicePayment; #BillPayment };
  type Transaction = {
    id : Nat;
    date : Timestamp;
    transactionType : TransactionType;
    referenceId : Nat;
    amount : Float;
    description : Text;
  };

  type OldActor = {
    transactions : List.List<Transaction>;
    nextTransactionId : [var Nat];
  };

  type NewActor = {};

  public func run(_old : OldActor) : NewActor {
    // Intentionally drop transactions and nextTransactionId — no longer needed
    {};
  };
};
