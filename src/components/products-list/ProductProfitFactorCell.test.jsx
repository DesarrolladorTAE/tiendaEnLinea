import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { Simulate } from "react-dom/test-utils";
import ProductProfitFactorCell from "./ProductProfitFactorCell";
import client from "../../config/axiosClient";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), patch: jest.fn() } }));
let root, host, saved;
const product = { id: 7, name: "Producto", purchase_cost: 100, iva: 0.16, profit_factor: 45 };
const render = () => act(async () => root.render(<MemoryRouter><ProductProfitFactorCell product={{ id: 7, name: "Producto", profit_factor: 45 }} onSaved={saved} /></MemoryRouter>));
const saveButton = () => [...document.querySelectorAll('[role="dialog"] button')].find(button => button.textContent === "Guardar factor");
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks(); saved = jest.fn();
  client.get.mockResolvedValue({ data: product });
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

test("missing stored cost blocks factor changes and points to product editing", async () => {
  client.get.mockResolvedValue({ data: { ...product, purchase_cost: null } });
  await render();
  await act(async () => Simulate.click(host.querySelector('[title="Cambiar factor de utilidad"]')));
  expect(saveButton().disabled).toBe(true);
  expect(document.querySelector('[role="dialog"]').textContent).toContain("Primero registra un costo de compra válido");
  expect(document.querySelector('[role="dialog"] input')).toBeNull();
  expect(client.patch).not.toHaveBeenCalled();
});

test("server validation error keeps the modal open and preserves the factor for correction", async () => {
  client.patch.mockRejectedValue({ response: { status: 422, data: { errors: { profit_factor: ["Precio fuera de rango"] } } } });
  await render();
  await act(async () => Simulate.click(host.querySelector('[title="Cambiar factor de utilidad"]')));
  await act(async () => Simulate.change(document.querySelector('[role="dialog"] input'), { target: { value: "60" } }));
  await act(async () => Simulate.click(saveButton()));
  expect(client.patch).toHaveBeenCalledWith("/admin/products/7/profit-factor", { profit_factor: 60 });
  expect(document.querySelector('[role="dialog"] input').value).toBe("60");
  expect(document.querySelector('[role="dialog"]').textContent).toContain("Precio fuera de rango");
  expect(saved).not.toHaveBeenCalled();
});

test("cancel leaves the original table value without making a price change", async () => {
  await render();
  await act(async () => Simulate.click(host.querySelector('[title="Cambiar factor de utilidad"]')));
  await act(async () => Simulate.change(document.querySelector('[role="dialog"] input'), { target: { value: "60" } }));
  await act(async () => Simulate.click([...document.querySelectorAll('[role="dialog"] button')].find(button => button.textContent === "Cancelar")));
  expect(document.querySelector('[role="dialog"] input')).toBeNull();
  expect(host.textContent).toBe("45%");
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 300)); });
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(client.patch).not.toHaveBeenCalled();
});
