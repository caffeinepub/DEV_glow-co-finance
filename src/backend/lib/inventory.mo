import Types "../types/finance";
import Common "../types/common";
import List "mo:core/List";

module {
  // ---- Product helpers ----

  public func toShared(p : Types.Product) : Types.ProductShared {
    let margin = if (p.salePrice > 0.0) {
      (p.salePrice - p.costPrice) / p.salePrice * 100.0;
    } else { 0.0 };
    {
      id = p.id;
      name = p.name;
      sku = p.sku;
      stockQuantity = p.stockQuantity;
      costPrice = p.costPrice;
      salePrice = p.salePrice;
      margin = margin;
      reorderPoint = p.reorderPoint;
      description = p.description;
    };
  };

  public func createProduct(
    products : List.List<Types.Product>,
    nextId : Nat,
    data : Types.CreateProductData,
  ) : Types.Product {
    let margin = if (data.salePrice > 0.0) {
      (data.salePrice - data.costPrice) / data.salePrice * 100.0;
    } else { 0.0 };
    let p : Types.Product = {
      id = nextId;
      name = data.name;
      sku = data.sku;
      var stockQuantity = data.stockQuantity;
      costPrice = data.costPrice;
      salePrice = data.salePrice;
      margin = margin;
      reorderPoint = data.reorderPoint;
      description = data.description;
    };
    products.add(p);
    p;
  };

  public func updateProduct(
    products : List.List<Types.Product>,
    id : Nat,
    data : Types.CreateProductData,
  ) : ?Types.ProductShared {
    let margin = if (data.salePrice > 0.0) {
      (data.salePrice - data.costPrice) / data.salePrice * 100.0;
    } else { 0.0 };
    var found : ?Types.ProductShared = null;
    products.mapInPlace(func(p) {
      if (p.id == id) {
        p.stockQuantity := data.stockQuantity;
        let updated : Types.ProductShared = {
          id = p.id;
          name = data.name;
          sku = data.sku;
          stockQuantity = data.stockQuantity;
          costPrice = data.costPrice;
          salePrice = data.salePrice;
          margin = margin;
          reorderPoint = data.reorderPoint;
          description = data.description;
        };
        found := ?updated;
        {
          p with
          name = data.name;
          sku = data.sku;
          var stockQuantity = data.stockQuantity;
          costPrice = data.costPrice;
          salePrice = data.salePrice;
          margin = margin;
          reorderPoint = data.reorderPoint;
          description = data.description;
        };
      } else { p };
    });
    found;
  };

  public func decrementStock(products : List.List<Types.Product>, productId : Nat, qty : Nat) {
    products.mapInPlace(func(p) {
      if (p.id == productId) {
        if (p.stockQuantity >= qty) {
          p.stockQuantity := p.stockQuantity - qty;
        } else {
          p.stockQuantity := 0;
        };
        p;
      } else { p };
    });
  };

  public func getLowStockProducts(products : List.List<Types.Product>) : [Types.ProductShared] {
    products.filter(func(p) { p.stockQuantity <= p.reorderPoint })
      .map<Types.Product, Types.ProductShared>(func(p) { toShared(p) })
      .toArray();
  };

  public func totalInventoryValueAtCost(products : List.List<Types.Product>) : Float {
    products.foldLeft<Float, Types.Product>(0.0, func(acc, p) {
      acc + p.costPrice * p.stockQuantity.toFloat();
    });
  };

  public func totalInventoryValueAtSale(products : List.List<Types.Product>) : Float {
    products.foldLeft<Float, Types.Product>(0.0, func(acc, p) {
      acc + p.salePrice * p.stockQuantity.toFloat();
    });
  };
};
