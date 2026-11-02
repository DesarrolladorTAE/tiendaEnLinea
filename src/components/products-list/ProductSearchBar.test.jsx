import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import ProductSearchBar from "./ProductSearchBar";

test("offers all four fields and keeps the typed query when selecting SKU", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div"); document.body.appendChild(host);
  const root = createRoot(host);
  function Search() {
    const [searchTerm, setSearchTerm] = useState("SHNN0102");
    const [searchField, setSearchField] = useState("all");
    return <ProductSearchBar showOeNumber {...{ searchTerm, setSearchTerm, searchField, setSearchField }} />;
  }
  try {
    act(() => root.render(<Search />));
    expect(document.querySelector('[role="combobox"]').textContent).toBe("Todos los campos");
    act(() => Simulate.mouseDown(document.querySelector('[role="combobox"]'), { button: 0 }));
    expect([...document.querySelectorAll('[role="option"]')].map(option => option.textContent)).toEqual([
      "Todos los campos", "Nombre del producto", "SKU", "Número OE",
    ]);
    act(() => Simulate.click(document.querySelector('[data-value="sku"]')));
    expect(document.querySelector('[role="combobox"]').textContent).toBe("SKU");
    expect(document.querySelector('input[type="text"]').value).toBe("SHNN0102");
  } finally {
    act(() => root.unmount()); host.remove();
  }
});

test("hides the OE search option when it does not apply", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div"); document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() => root.render(<ProductSearchBar searchTerm="Manguera" setSearchTerm={jest.fn()} setSearchField={jest.fn()} />));
    act(() => Simulate.mouseDown(document.querySelector('[role="combobox"]'), { button: 0 }));
    expect([...document.querySelectorAll('[role="option"]')].map(option => option.textContent)).toEqual([
      "Todos los campos", "Nombre del producto", "SKU",
    ]);
  } finally { act(() => root.unmount()); host.remove(); }
});
