import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { Simulate } from "react-dom/test-utils";
import ProductTable from "./ProductTable";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), patch: jest.fn() } }));

test("shows unassigned stock with and without warehouse quantities", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  const root = createRoot(host);
  try {
    const products = [
      { id: 1, stock: "12.5", use_warehouse_inventory: true, warehouse_inventories: [], warehouse_stocks: [] },
      { id: 2, stock: 3, warehouse_stocks: [{ warehouse_id: 4, warehouse_name: "Centro", qty: 8 }] },
      { id: 3, stock: 0, warehouse_stocks: [] },
    ];
    act(() => root.render(<MemoryRouter><ProductTable products={products} /></MemoryRouter>));
    const cells = host.querySelectorAll('[data-label="Stock"]');
    expect(cells[0].textContent).toBe("Sin almacén12.5");
    expect(cells[1].textContent).toBe("Sin almacén3Centro8");
    expect(cells[2].textContent).toBe("0");
  } finally { act(() => root.unmount()); }
});

test("replaces row numbers with SKU and OE, displays scoped warehouse quantities and preserves actions", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div"); document.body.appendChild(host);
  const root = createRoot(host), onDelete = jest.fn(), onOpenLabels = jest.fn(), onOpenImages = jest.fn(), onOpenCategories = jest.fn();
  const product = { id: 5, sku: "AM1-123", oe_number: "000123", name: "Manguera", stock: 0, price: 99, iva: 0.16, warehouse_stocks: [{ warehouse_id: 1, warehouse_name: "Guerrero", qty: 12.5 }, { warehouse_id: 2, warehouse_name: "Yucatán", qty: 0 }, { warehouse_id: 3, warehouse_name: "Quintana Roo", qty: -2 }] };
  try {
    act(() => root.render(<MemoryRouter><ProductTable products={[product]} showOeNumber onDelete={onDelete} onOpenLabels={onOpenLabels} onOpenImages={onOpenImages} onOpenCategories={onOpenCategories} /></MemoryRouter>));
    const row = host.querySelector("tbody tr");
    expect(row.cells).toHaveLength(7);
    expect(row.cells[0].textContent).toContain("AM1-123");
    expect(row.cells[0].textContent).toContain("000123");
    const stock = host.querySelector('[data-label="Stock"]');
    expect(stock.textContent).toContain("Guerrero12.5");
    expect(stock.textContent).toContain("Quintana Roo-2");
    expect(stock.textContent).not.toContain("Yucatán");
    expect(host.querySelector('[title="Editar producto"]').getAttribute("href")).toContain("edit/5");
    for (const [title, callback] of [["Imprimir etiquetas", onOpenLabels], ["Agregar Imágenes", onOpenImages], ["Eliminar", onDelete], ["Administrar categorías", onOpenCategories]]) {
      act(() => Simulate.click(host.querySelector(`[title="${title}"]`)));
      expect(callback).toHaveBeenCalledWith(title === "Eliminar" ? 5 : product);
    }
    act(() => root.render(<MemoryRouter><ProductTable products={[{ ...product, oe_number: "  " }]} showOeNumber /></MemoryRouter>));
    expect(host.querySelector("th").textContent).toBe("SKU");
    expect(host.querySelector(".product-oe")).toBeNull();
  } finally { act(() => root.unmount()); host.remove(); }
});
