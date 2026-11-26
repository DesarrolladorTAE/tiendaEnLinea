import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { useForm } from "react-hook-form";
import useProductFormLogic from "./useProductFormLogic";
import InventoryDiscountSection from "../components/admin/productForm/sections/InventoryDiscountSection";
import ProductInfoSection from "../components/admin/productForm/sections/ProductInfoSection";
import AccordionSection from "../components/admin/productForm/AccordionSection";
import client from "../config/axiosClient";
import { showError } from "../utils/alerts";

jest.mock("react-router-dom", () => ({ useParams: () => ({}), useNavigate: () => jest.fn() }));
jest.mock("../context/AdminUiContext", () => ({ useAdminUi: () => ({ selectedBranch: { id: 7 } }) }));
jest.mock("../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
jest.mock("../utils/alerts", () => ({ showError: jest.fn(), showSuccess: jest.fn() }));
jest.mock("../utils/inventoryEvents", () => ({ notifyInventoryChanged: jest.fn() }));
jest.mock("../components/admin/productForm/SatFields", () => () => null);
jest.mock("../components/admin/ProductField", () => ({ name, children }) => <div data-field={name}>{children}</div>);
let root, host, latest;
const draft = { name: "Producto", sku: "SKU", stock: 7, price: 100, iva: "0.16", variants: [], use_warehouse_inventory: false, warehouse_inventories: [] };
function Harness() {
  const form = useForm({ defaultValues: draft });
  const logic = useProductFormLogic({ ...form, dirtyFields: form.formState.dirtyFields });
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

test("creates a tracked product with exact expiry enabled and zero stock in its warehouse", async () => {
  await act(async () => latest.actions.onSubmit({
    ...draft, batch_tracking_enabled: true, expiration_required: true,
    use_warehouse_inventory: true, warehouse_inventories: [{ warehouse_id: 2, qty: 9 }],
  }));
  const [url, payload] = client.post.mock.calls[0];
  expect(url).toBe("/cargar/productos");
  expect(payload.get("batch_tracking_enabled")).toBe("1");
  expect(payload.get("expiration_required")).toBe("1");
  expect(payload.get("warehouse_inventories[0][qty]")).toBe("0");
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

test("shows a SweetAlert error for form validation before calling the API", async () => {
  await act(async () => latest.form.setValue("stock", ""));
  await act(async () => latest.form.handleSubmit(latest.actions.onSubmit, latest.actions.onInvalid)());
  expect(showError).toHaveBeenCalledWith("El stock es obligatorio");
  expect(client.post).not.toHaveBeenCalled();
});

test("marks a collapsed section with errors and clears the indicator when corrected", async () => {
  const indicator = () => host.querySelector('[aria-label="Contiene campos con error"], svg title');
  await act(async () => root.render(<AccordionSection title="Descripciones" hasError />));
  expect(indicator()).not.toBeNull();
  await act(async () => host.querySelector("button").click());
  expect(indicator()).toBeNull();
  await act(async () => host.querySelector("button").click());
  expect(indicator()).not.toBeNull();
  await act(async () => root.render(<AccordionSection title="Descripciones" hasError={false} />));
  expect(indicator()).toBeNull();
});

test("shows the API validation message in a SweetAlert error when saving fails", async () => {
  const message = "El número OE admite hasta 255 caracteres.";
  client.post.mockRejectedValueOnce({ response: { status: 422, data: { errors: { oe_number: [message] } } } });
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await act(async () => latest.actions.onSubmit({ ...draft, oe_number: "0".repeat(256) }));
    expect(showError).toHaveBeenCalledWith(message);
  } finally {
    log.mockRestore();
  }
});

test("omits untouched compatibilities from a normal save", async () => {
  await act(async () => latest.actions.onSubmit({ ...draft, vehicle_compatibilities: [{ vehicle_brand: "Nissan", vehicle_model: "Versa" }] }));
  expect(client.post.mock.calls[0][1].has("vehicle_compatibilities")).toBe(false);
});

test("reveals the optional OE, copies the SKU as text, and clears OE when unchecked", async () => {
  function OeHarness() {
    const form = useForm({ defaultValues: { ...draft, sku: "00012345", oe_enabled: false, oe_number: "" } });
    return <ProductInfoSection {...form} errors={form.formState.errors} />;
  }
  await act(async () => root.render(<OeHarness />));
  const checkbox = host.querySelector('[name="oe_enabled"]');
  expect(checkbox.closest('[data-field="sku"]')).not.toBeNull();
  expect(host.querySelector('[name="oe_number"]')).toBeNull();
  await act(async () => { checkbox.checked = true; Simulate.change(checkbox); });
  const button = [...host.querySelectorAll("button")].find(element => element.textContent === "Usar el mismo SKU");
  await act(async () => button.click());
  expect(host.querySelector('[name="oe_number"]').value).toBe("00012345");
  await act(async () => { checkbox.checked = false; Simulate.change(checkbox); });
  expect(host.querySelector('[name="oe_number"]')).toBeNull();
  await act(async () => { checkbox.checked = true; Simulate.change(checkbox); });
  expect(host.querySelector('[name="oe_number"]').value).toBe("");
});

test("sends an OE with leading zeros in the warehouse product payload", async () => {
  await act(async () => latest.actions.onSubmit({
    ...draft, oe_number: "00012345", use_warehouse_inventory: true,
    warehouse_inventories: [{ warehouse_id: 2, qty: 9 }],
  }));
  expect(client.post.mock.calls[0][1].get("oe_number")).toBe("00012345");
});
test("sends changed compatibilities as JSON with open years and no foreign IDs", async () => {
  const rows = [{ id: 10, vehicle_brand: "Nissan", vehicle_model: "Versa", year_from: "2020", year_to: "" }];
  act(() => latest.form.register("vehicle_compatibilities"));
  await act(async () => latest.form.setValue("vehicle_compatibilities", rows, { shouldDirty: true }));
  await act(async () => latest.actions.onSubmit({ ...draft, vehicle_compatibilities: rows }));
  expect(JSON.parse(client.post.mock.calls[0][1].get("vehicle_compatibilities"))).toEqual([{ vehicle_brand: "Nissan", vehicle_model: "Versa", year_from: 2020, year_to: null }]);
});
test("sends explicit [] when removing loaded compatibilities", async () => {
  await act(async () => latest.form.reset({ ...draft, vehicle_compatibilities: [{ vehicle_brand: "Nissan", vehicle_model: "Versa" }] }));
  act(() => latest.form.register("vehicle_compatibilities"));
  await act(async () => latest.form.setValue("vehicle_compatibilities", [], { shouldDirty: true }));
  await act(async () => latest.actions.onSubmit({ ...draft, vehicle_compatibilities: [] }));
  expect(client.post.mock.calls[0][1].get("vehicle_compatibilities")).toBe("[]");
});
