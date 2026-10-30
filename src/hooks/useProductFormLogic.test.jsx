import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useForm } from "react-hook-form";
import useProductFormLogic from "./useProductFormLogic";
import InventoryDiscountSection from "../components/admin/productForm/sections/InventoryDiscountSection";
import client from "../config/axiosClient";
import { showError } from "../utils/alerts";

jest.mock("react-router-dom", () => ({ useParams: () => ({}), useNavigate: () => jest.fn() }));
jest.mock("../context/AdminUiContext", () => ({ useAdminUi: () => ({ selectedBranch: { id: 7 } }) }));
jest.mock("../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
jest.mock("../utils/alerts", () => ({ showError: jest.fn(), showSuccess: jest.fn() }));
jest.mock("../utils/inventoryEvents", () => ({ notifyInventoryChanged: jest.fn() }));
jest.mock("../components/admin/productForm/SatFields", () => () => null);
jest.mock("../components/admin/ProductField", () => () => null);
let root, host, latest;
const draft = { name: "Producto", sku: "SKU", stock: 7, price: 100, iva: "0.16", variants: [], use_warehouse_inventory: false, warehouse_inventories: [] };
function Harness() {
  const form = useForm({ defaultValues: draft });
  const logic = useProductFormLogic(form);
  latest = { ...logic, form };
  return <InventoryDiscountSection {...form} hasVariants={logic.ui.hasVariants} errors={form.formState.errors} isEdit />;
}
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  client.get.mockResolvedValue({ data: [] }); client.post.mockResolvedValue({ data: {} });
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  await act(async () => root.render(<Harness />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
test("simple product stock remains editable even in edit mode and is sent normally", async () => {
  const input = host.querySelector('input[type="number"]');
  expect(input.readOnly).toBe(false);
  await act(async () => latest.actions.onSubmit(draft));
  expect(client.post.mock.calls[0][1].get("stock")).toBe("7");
});
test("warehouse stock may differ from the fixed parent zero and is sent only as detail", async () => {
  const data = { ...draft, stock: 0, use_warehouse_inventory: true, warehouse_inventories: [{ warehouse_id: 2, qty: 9 }] };
  await act(async () => latest.form.setValue("use_warehouse_inventory", true));
  expect(host.querySelector('input[type="number"]')).toBeNull();
  await act(async () => latest.actions.onSubmit(data));
  const form = client.post.mock.calls[0][1];
  expect(form.has("stock")).toBe(false);
  expect(form.get("warehouse_inventories[0][qty]")).toBe("9");
});
test("variant totals never populate or send the parent stock", async () => {
  const data = { ...draft, stock: 999, variants: [{ id: 11, name: "Variante", stock: 5 }] };
  await act(async () => latest.actions.onSubmit(data));
  const form = client.post.mock.calls[0][1];
  expect(form.has("stock")).toBe(false);
  expect(form.get("variants[0][stock]")).toBe("5");
});
test("warehouse variants use the warehouse detail without requiring a matching variant total", async () => {
  const data = { ...draft, stock: 0, use_warehouse_inventory: true, warehouse_inventories: [{ warehouse_id: 2 }], variants: [{ id: 11, name: "Variante", stock: 0, warehouse_stocks: [{ warehouse_id: 2, stock: 8 }] }] };
  await act(async () => latest.actions.onSubmit(data));
  const form = client.post.mock.calls[0][1];
  expect(form.has("stock")).toBe(false);
  expect(form.has("variants[0][stock]")).toBe(false);
  expect(form.get("variants[0][warehouse_stocks][0][stock]")).toBe("8");
});
test("invalid detail quantities prevent saving", async () => {
  await act(async () => latest.actions.onSubmit({ ...draft, use_warehouse_inventory: true, warehouse_inventories: [{ warehouse_id: 2, qty: -2 }] }));
  expect(client.post).not.toHaveBeenCalled();
  expect(showError).toHaveBeenCalled();
});
test("switching to warehouse inventory removes the hidden global-stock validation", async () => {
  act(() => latest.form.setValue("stock", ""));
  await act(async () => latest.form.setValue("use_warehouse_inventory", true));
  const valid = jest.fn(), invalid = jest.fn();
  await act(async () => latest.form.handleSubmit(valid, invalid)());
  expect(invalid).not.toHaveBeenCalled();
  expect(valid).toHaveBeenCalled();
});
