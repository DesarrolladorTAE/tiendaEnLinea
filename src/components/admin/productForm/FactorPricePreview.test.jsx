import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useForm } from "react-hook-form";
import LocationsProductSection from "./sections/LocationsProductSection";
import VariantsEditor from "./VariantsEditor";
let form, root, host;
function Harness({ variants = [] }) {
  form = useForm({ defaultValues: { use_warehouse_inventory: true, price_mode: "factor", profit_factor: "30", costo_compra: "100", iva: "0.16", warehouse_inventories: [{ warehouse_id: "1", qty: 4, purchase_cost: "10.8", price: "15.66" }, { warehouse_id: "2", qty: 3, purchase_cost: "30", price: "15.66" }, { warehouse_id: "3", qty: 1, purchase_cost: "0", price: "0" }], variants } });
  return <><LocationsProductSection {...form} warehouses={[{id: 1, name: "A"}, {id: 2, name: "B"}, {id: 3, name: "C"}]} /><VariantsEditor {...form} warehouses={[{id: 1, name: "A"}, {id: 2, name: "B"}, {id: 3, name: "C"}]} /></>;
}
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
test("previews each warehouse price as costs change, without changing the saved price or stock", async () => {
  await act(async () => root.render(<Harness />));
  expect(host.textContent).toContain("$14.04"); expect(host.textContent).toContain("$39.00"); expect(host.textContent).toContain("$0.00");
  expect(host.querySelector('[name="warehouse_inventories.1.price"]').readOnly).toBe(true);
  await act(async () => form.setValue("warehouse_inventories.1.purchase_cost", "50"));
  expect(host.textContent).toContain("$65.00");
  expect(form.getValues("warehouse_inventories.1.price")).toBe("15.66");
  expect(form.getValues("warehouse_inventories.1.qty")).toBe(3);
});
test("previews variant warehouse prices using variant or product cost as fallback", async () => {
  const variants = [{ id: 7, name: "Rojo", price: "150", purchase_cost: "120", attributes: [], warehouse_stocks: [{ warehouse_id: "1", stock: 1, purchase_cost: "140", price: "160" }, { warehouse_id: "2", stock: 2, purchase_cost: "", price: "120" }] }];
  await act(async () => root.render(<Harness variants={variants} />));
  expect(host.textContent).toContain("$182.00"); expect(host.textContent).toContain("$156.00"); expect(host.textContent).toContain("Usa el costo de variante como respaldo.");
  await act(async () => form.setValue("variants.0.purchase_cost", ""));
  expect(host.textContent).toContain("$130.00"); expect(host.textContent).toContain("Usa el costo de producto como respaldo.");
});
