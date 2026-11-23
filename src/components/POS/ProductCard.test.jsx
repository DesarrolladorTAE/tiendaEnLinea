import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import ProductCard from "./ProductCard";
import { productStock } from "../../utils/productInventory";

test("variant selections create separate cart keys for each warehouse while parent stock is zero", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div"); document.body.appendChild(host);
  const root = createRoot(host), onAdd = jest.fn();
  const product = { id: 1, name: "Producto", stock: 0, has_variants: true, price: 100, use_warehouse_inventory: true, variants: [
    { id: 11, name: "Variante", stock: 0, warehouse_stocks: [{ warehouse_id: 2, warehouse_name: "Guerrero", stock: 3, price: 120 }, { warehouse_id: 3, warehouse_name: "Yucatán", stock: 4 }] },
  ] };
  const button = text => [...document.querySelectorAll("button")].find(b => b.textContent.includes(text));
  try {
    act(() => root.render(<table><tbody><ProductCard product={product} cart={[]} onAdd={onAdd} getQuantityInCart={() => 0} getAvailableStock={productStock} getProductImage={() => null} /></tbody></table>));
    expect(host.querySelector("td:last-child").textContent).toBe("7");
    expect(host.textContent).not.toContain("Sin stock");
    act(() => Simulate.click(button("Ver variantes")));
    const chooseWarehouse = name => {
      act(() => Simulate.mouseDown(document.querySelector('[role="combobox"]'), { button: 0 }));
      const option = [...document.querySelectorAll('[role="option"]')].find(option => option.textContent.includes(name));
      act(() => Simulate.click(option));
      act(() => Simulate.click(button("Agregar al carrito")));
    };
    chooseWarehouse("Guerrero");
    chooseWarehouse("Yucatán");
    expect(onAdd.mock.calls[0][0].original_price).toBe(120);
    expect(onAdd.mock.calls[0][0].price).toBe(120);
    expect(onAdd.mock.calls[1][0].original_price).toBe(100);
    expect(onAdd.mock.calls.map(([item]) => [item.cart_key, item.variant_id, item.warehouse_id])).toEqual([["1-v11-w2", 11, 2], ["1-v11-w3", 11, 3]]);
  } finally { act(() => root.unmount()); host.remove(); }
});

test("classic product card shows image and price and adds the same inventory selection", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div"); document.body.appendChild(host); const root = createRoot(host), onAdd = jest.fn();
  const product = { id: 2, name: "Producto", sku: "ABC", price: 100, stock: 5 };
  try {
    act(() => root.render(<ProductCard classic product={product} cart={[]} onAdd={onAdd} getQuantityInCart={() => 0} getAvailableStock={productStock} getProductImage={() => "https://example.com/product.png"} />));
    expect(host.querySelector("img").src).toContain("product.png"); expect(host.textContent).toContain("SKU: ABC"); expect(host.textContent).toContain("$100.00");
    act(() => host.querySelector('button[aria-label="Agregar Producto"]').click());
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ product_id: 2, price: 100, quantity: 1 }));
  } finally { act(() => root.unmount()); host.remove(); }
});
