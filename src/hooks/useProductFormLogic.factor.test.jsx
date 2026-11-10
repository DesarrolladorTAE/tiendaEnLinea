import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useForm } from "react-hook-form";
import useProductFormLogic from "./useProductFormLogic";
import client from "../config/axiosClient";
import { showError } from "../utils/alerts";
import ProfitFactorControl from "../components/admin/productForm/ProfitFactorControl";

let mockId;
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({ useParams: () => ({ id: mockId }), useNavigate: () => mockNavigate }));
jest.mock("../context/AdminUiContext", () => ({ useAdminUi: () => ({ selectedBranch: { id: 7 } }) }));
jest.mock("../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() } }));
jest.mock("../utils/alerts", () => ({ showError: jest.fn(), showSuccess: jest.fn() }));
jest.mock("../utils/inventoryEvents", () => ({ notifyInventoryChanged: jest.fn() }));
const product = { id: 8, sku: "SKU", name: "Producto", stock: 4, purchase_cost: 100, iva: 0.16, price: 120, base_price: 103.448276, variants: [], warehouse_inventories: [] };
const draft = { sku: "SKU", name: "Producto", stock: 4, costo_compra: "100", iva: "0.16", price: 145, profit_factor: "45", price_mode: "factor", variants: [], use_warehouse_inventory: false };
let root, host, latest, changes;
function Harness({ showControl = false }) {
  const form = useForm({ defaultValues: draft });
  const logic = useProductFormLogic({ ...form, dirtyFields: changes });
  latest = { ...logic, form };
  return showControl ? <ProfitFactorControl watch={form.watch} setValue={form.setValue} /> : null;
}
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks(); changes = {}; mockId = "8";
  client.get.mockImplementation(url => Promise.resolve({ data: url.startsWith("/admin/productos/") ? product : [] }));
  client.post.mockResolvedValue({ data: { data: { id: 12 } } });
  client.patch.mockResolvedValue({ data: { data: { ...product, profit_factor: "45.0000", price: "145.02", base_price: "125.017241" } } });
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

test.each(["45.0000", 0])("stored factor %s selects factor mode without recalculating the saved price", async factor => {
  client.get.mockImplementation(url => Promise.resolve({ data: url.startsWith("/admin/productos/") ? { ...product, profit_factor: factor } : [] }));
  await act(async () => root.render(<Harness showControl />));
  expect(host.querySelector('input[type="checkbox"]').checked).toBe(true);
  expect(latest.form.getValues("price_mode")).toBe("factor");
  expect(latest.form.getValues("profit_factor")).toBe(factor);
  expect(latest.form.getValues("price")).toBe("120.00");
  expect(client.patch).not.toHaveBeenCalled();
  await act(async () => latest.actions.onSubmit(latest.form.getValues()));
  expect(client.patch).not.toHaveBeenCalled();
  expect(client.post.mock.calls[0][1].get("price")).toBe("120.00");
});

test("a product without a factor keeps manual mode", async () => {
  client.get.mockImplementation(url => Promise.resolve({ data: url.startsWith("/admin/productos/") ? { ...product, profit_factor: null } : [] }));
  await act(async () => root.render(<Harness showControl />));
  expect(host.querySelector('input[type="checkbox"]').checked).toBe(false);
  expect(latest.form.getValues("price_mode")).toBe("manual");
});

test("factor-only edit skips the full form and uses all three server values", async () => {
  await act(async () => root.render(<Harness />));
  await act(async () => latest.actions.onSubmit(draft));
  expect(client.post).not.toHaveBeenCalled();
  expect(client.patch).toHaveBeenCalledWith("/admin/products/8/profit-factor", { profit_factor: 45 });
  expect(latest.form.getValues("profit_factor")).toBe("45.0000");
  expect(latest.form.getValues("price")).toBe("145.02");
  expect(latest.form.getValues("base_price")).toBe("125.017241");
});

test("changed purchase cost is saved before applying the factor to the stored cost", async () => {
  changes = { costo_compra: true };
  await act(async () => root.render(<Harness />));
  await act(async () => latest.actions.onSubmit({ ...draft, costo_compra: "200" }));
  expect(client.post.mock.calls[0][1].get("purchase_cost")).toBe("200");
  expect(client.post.mock.invocationCallOrder[0]).toBeLessThan(client.patch.mock.invocationCallOrder[0]);
  expect(client.patch.mock.calls[0][1]).toEqual({ profit_factor: 45 });
});

test("creation saves first and a failed factor retry does not create a duplicate product", async () => {
  mockId = undefined;
  client.patch.mockRejectedValueOnce({ response: { status: 422, data: { message: "Costo inválido" } } });
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  await act(async () => root.render(<Harness />));
  await act(async () => latest.actions.onSubmit(draft));
  expect(client.post.mock.calls[0][0]).toBe("/cargar/productos");
  expect(client.patch.mock.calls[0][0]).toBe("/admin/products/12/profit-factor");
  expect(showError).toHaveBeenCalledWith(expect.stringContaining("El producto se guardó"));
  await act(async () => latest.actions.onSubmit(draft));
  expect(client.post).toHaveBeenCalledTimes(1);
  expect(client.patch).toHaveBeenCalledTimes(2);
  log.mockRestore();
});

test("image uploads are saved along with a factor change", async () => {
  await act(async () => root.render(<Harness />));
  const image = new File(["image"], "producto.png", { type: "image/png" });
  await act(async () => latest.actions.setImageFiles([image]));
  await act(async () => latest.actions.onSubmit(draft));
  expect(client.post.mock.calls[0][1].get("images[]")).toBe(image);
  expect(client.patch).toHaveBeenCalledWith("/admin/products/8/profit-factor", { profit_factor: 45 });
});

test("invalid factor prevents any mutation", async () => {
  await act(async () => root.render(<Harness />));
  await act(async () => latest.actions.onSubmit({ ...draft, profit_factor: "45.12345" }));
  expect(client.patch).not.toHaveBeenCalled();
  expect(client.post).not.toHaveBeenCalled();
});
