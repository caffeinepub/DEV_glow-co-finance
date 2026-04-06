import Types "../types/finance";
import Common "../types/common";
import List "mo:core/List";

module {
  public func createCustomer(
    customers : List.List<Types.Customer>,
    nextId : Nat,
    data : Types.CreateCustomerData,
  ) : Types.Customer {
    let c : Types.Customer = {
      id = nextId;
      name = data.name;
      customerType = data.customerType;
      email = data.email;
      phone = data.phone;
      address = data.address;
      notes = data.notes;
    };
    customers.add(c);
    c;
  };

  public func updateCustomer(
    customers : List.List<Types.Customer>,
    id : Nat,
    data : Types.CreateCustomerData,
  ) : ?Types.Customer {
    var found : ?Types.Customer = null;
    customers.mapInPlace(func(c) {
      if (c.id == id) {
        let updated : Types.Customer = {
          id = c.id;
          name = data.name;
          customerType = data.customerType;
          email = data.email;
          phone = data.phone;
          address = data.address;
          notes = data.notes;
        };
        found := ?updated;
        updated;
      } else { c };
    });
    found;
  };

  public func createSupplier(
    suppliers : List.List<Types.Supplier>,
    nextId : Nat,
    data : Types.CreateSupplierData,
  ) : Types.Supplier {
    let s : Types.Supplier = {
      id = nextId;
      name = data.name;
      email = data.email;
      phone = data.phone;
      address = data.address;
      category = data.category;
      notes = data.notes;
    };
    suppliers.add(s);
    s;
  };

  public func updateSupplier(
    suppliers : List.List<Types.Supplier>,
    id : Nat,
    data : Types.CreateSupplierData,
  ) : ?Types.Supplier {
    var found : ?Types.Supplier = null;
    suppliers.mapInPlace(func(s) {
      if (s.id == id) {
        let updated : Types.Supplier = {
          id = s.id;
          name = data.name;
          email = data.email;
          phone = data.phone;
          address = data.address;
          category = data.category;
          notes = data.notes;
        };
        found := ?updated;
        updated;
      } else { s };
    });
    found;
  };
};
