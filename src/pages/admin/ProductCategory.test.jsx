import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import axiosClient from "../../config/axiosClient";
import ProductCategory from "./ProductCategory";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
jest.mock("../../context/AdminUiContext", () => ({
  useAdminUi: () => ({ selectedBranch: { id: 7, name: "Centro" } }),
}));
jest.mock("../../hooks/useCategoriaPadreGate", () => ({
  __esModule: true,
  default: () => ({ isPlanSoloSueltas: false }),
}));

test("opens category help on demand and saves an existing subcategory in its branch", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const principal = { id: 1, name: "Refacciones", parent_id: null };
  const subcategory = { id: 2, name: "Filtros", parent_id: 1 };
  axiosClient.get.mockImplementation((_, { params }) => Promise.resolve({
    data: params.mode === "tree" ? { parents: [{ ...principal, children: [subcategory] }] } : { categories: [principal, subcategory] },
  }));
  axiosClient.post.mockResolvedValue({ data: { category: subcategory } });

  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  const button = (label) => host.querySelector(`[aria-label="${label}"]`);
  jest.useFakeTimers();
  try {
    await act(async () => root.render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ProductCategory />
      </MemoryRouter>,
    ));
    expect(host.textContent).toContain("Categorías principales");
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    act(() => button("Abrir guía de categorías").click());
    const help = document.querySelector('[role="dialog"]');
    expect(help.textContent).toContain("Categoría independiente");
    act(() => help.querySelector("button").click());
    act(() => jest.runOnlyPendingTimers());

    act(() => button("Editar Filtros").click());
    const form = document.getElementById("admin-category-form");
    await act(async () => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(axiosClient.post).toHaveBeenCalledWith("admin/categories/2", {
      name: "Filtros", parent_id: 1, branch_id: 7, _method: "PATCH",
    });
    act(() => jest.runOnlyPendingTimers());
    expect(document.getElementById("admin-category-form")).toBeNull();

    const newCategory = [...host.querySelectorAll("button")].find(item => item.textContent === "Nueva categoría");
    act(() => newCategory.click());
    const newForm = document.getElementById("admin-category-form");
    const submit = () => document.querySelector('[form="admin-category-form"]');
    act(() => newForm.querySelector('[value="subcategory"]').click());
    expect(submit().disabled).toBe(true);
    act(() => newForm.querySelector('[value="principal"]').click());
    const nameInput = newForm.querySelector('input[type="text"]');
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(nameInput, "Accesorios");
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    axiosClient.post.mockResolvedValueOnce({ data: { category: { id: 3, name: "Accesorios" } } });
    await act(async () => newForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(axiosClient.post).toHaveBeenLastCalledWith("admin/categories", {
      name: "Accesorios", parent_id: null, branch_id: 7,
    });
    expect(newForm.querySelector('[value="subcategory"]').checked).toBe(true);
    expect(newForm.querySelector('[role="combobox"]').textContent).toBe("Accesorios");
  } finally {
    act(() => root.unmount());
    host.remove();
    jest.useRealTimers();
  }
});
