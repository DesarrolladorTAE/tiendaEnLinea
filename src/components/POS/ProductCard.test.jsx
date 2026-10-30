import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import ProductCard from "./ProductCard";
import { productStock, hasProductVariants } from "../../utils/productInventory";

test("variant selections create separate cart keys for each warehouse while parent stock is zero", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div"); document.body.appendChild(host);
  const root = createRoot(host), onAdd = jest.fn();
  const product = { id: 1, name: "Producto", stock: 0, has_variants: true, price: 100, use_warehouse_inventory: true, variants: [
    { id: 11, name: "Variante", stock: 0, warehouse_stocks: [{ warehouse_id: 2, warehouse_name: "Guerrero", stock: 3 }, { warehouse_id: 3, warehouse_name: "Yucatán", stock: 4 }] },
  ] };
  const button = text => [...document.querySelectorAll("button")].find(b => b.textContent.includes(text));
  try {
    act(() => root.render(<ProductCard product={product} cart={[]} onAdd={onAdd} getQuantityInCart={() => 0} getAvailableStock={productStock} getProductImage={() => null} isVariantProduct={hasProductVariants} />));
    expect(host.textContent).toContain("Stock: 7");
    expect(host.textContent).not.toContain("Sin stock");
    act(() => Simulate.click(button("Ver catálogo")));
    const chooseWarehouse = name => {
      act(() => Simulate.mouseDown(document.querySelector('[role="combobox"]'), { button: 0 }));
      const option = [...document.querySelectorAll('[role="option"]')].find(option => option.textContent.includes(name));
      act(() => Simulate.click(option));
      act(() => Simulate.click(button("Agregar al carrito")));
    };
    chooseWarehouse("Guerrero");
    chooseWarehouse("Yucatán");
    expect(onAdd.mock.calls.map(([item]) => [item.cart_key, item.variant_id, item.warehouse_id])).toEqual([["1-v11-w2", 11, 2], ["1-v11-w3", 11, 3]]);
  } finally { act(() => root.unmount()); host.remove(); }
});
