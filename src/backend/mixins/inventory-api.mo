import Types "../types/finance";
import Common "../types/common";
import InventoryLib "../lib/inventory";
import List "mo:core/List";
import Runtime "mo:core/Runtime";

mixin (
  products : List.List<Types.Product>,
  nextProductId : [var Nat],
) {
  public query func getProducts() : async [Types.ProductShared] {
    products.map<Types.Product, Types.ProductShared>(func(p) { InventoryLib.toShared(p) }).toArray();
  };

  public query func getProduct(id : Nat) : async ?Types.ProductShared {
    switch (products.find(func(p) { p.id == id })) {
      case (?p) { ?InventoryLib.toShared(p) };
      case null { null };
    };
  };

  public func createProduct(data : Types.CreateProductData) : async Types.ProductShared {
    let id = nextProductId[0];
    nextProductId[0] += 1;
    let p = InventoryLib.createProduct(products, id, data);
    InventoryLib.toShared(p);
  };

  public func updateProduct(id : Nat, data : Types.CreateProductData) : async ?Types.ProductShared {
    InventoryLib.updateProduct(products, id, data);
  };

  public query func getInventoryStats() : async { totalAtCost : Float; totalAtSale : Float } {
    {
      totalAtCost = InventoryLib.totalInventoryValueAtCost(products);
      totalAtSale = InventoryLib.totalInventoryValueAtSale(products);
    };
  };
};
