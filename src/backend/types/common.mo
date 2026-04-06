module {
  public type Timestamp = Int; // nanoseconds from Time.now()

  public type VatRate = { #Zero; #Five; #Twenty };

  public type BillCategory = {
    #Ingredients;
    #Packaging;
    #Shipping;
    #Marketing;
    #Rent;
    #Software;
    #ProfessionalServices;
    #Other;
  };

  public type InvoiceStatus = { #Draft; #Sent; #Paid; #Overdue };

  public type BillStatus = { #Unpaid; #Paid; #Overdue };

  public type CustomerType = { #DTC; #Wholesale };

  public type RecurringFrequency = { #Weekly; #Monthly };

  public type TransactionType = { #InvoicePayment; #BillPayment };
};
