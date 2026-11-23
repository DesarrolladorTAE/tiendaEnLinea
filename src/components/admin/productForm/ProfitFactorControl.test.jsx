import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { useForm } from "react-hook-form";
import ProductInfoSection from "./sections/ProductInfoSection";

let root, host, form;
function Harness() {
  form = useForm({ defaultValues: { costo_compra: "", iva: "0.16", price: "", base_price: "", profit_factor: "", price_mode: "manual" } });
  return <ProductInfoSection {...form} errors={{}} basePriceStr={form.watch("base_price")} />;
}
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  await act(async () => root.render(<Harness />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

test("cost unlocks the modal, applying previews 145 including IVA, and manual mode remains available", async () => {
  const checkbox = host.querySelector('input[type="checkbox"]');
  const configure = [...host.querySelectorAll("button")].find(button => button.textContent === "Configurar factor");
  expect(checkbox.disabled).toBe(true);
  expect(configure.disabled).toBe(true);
  expect(host.querySelector('input[name="price"]').readOnly).toBe(false);
  await act(async () => form.setValue("costo_compra", "100"));
  expect(checkbox.disabled).toBe(false);
  expect(configure.disabled).toBe(true);
  await act(async () => Simulate.change(checkbox, { target: { checked: true } }));
  const dialog = document.querySelector('[role="dialog"]');
  expect(checkbox.closest(".border").classList.contains("border-info")).toBe(true);
  expect(dialog.textContent).toContain("Porcentaje de aumento sobre el costo de compra");
  expect(dialog.querySelector("input").classList.contains("bg-secondary")).toBe(true);
  const apply = [...dialog.querySelectorAll("button")].find(button => button.textContent === "Usar este factor");
  expect(apply.disabled).toBe(true);
  await act(async () => Simulate.change(dialog.querySelector("input"), { target: { value: "45" } }));
  expect(apply.disabled).toBe(false);
  await act(async () => Simulate.click(apply));
  expect(form.getValues()).toMatchObject({ profit_factor: "45", price_mode: "factor", price: "145.00", base_price: "125.000000" });
  expect(host.querySelector('input[name="price"]').readOnly).toBe(true);
  expect(host.textContent).toContain("Calculado por factor");
  expect(checkbox.checked).toBe(true);
  await act(async () => Simulate.click(configure));
  const updatedDialog = document.querySelector('[role="dialog"]');
  await act(async () => Simulate.change(updatedDialog.querySelector("input"), { target: { value: "60" } }));
  await act(async () => Simulate.click([...updatedDialog.querySelectorAll("button")].find(button => button.textContent === "Usar este factor")));
  expect(host.querySelector('input[name="price"]').value).toBe("160.00");
  expect(host.querySelector('input[name="price"]').readOnly).toBe(true);
  expect(host.querySelector('input[name="price"]').disabled).toBe(false);
  await act(async () => Simulate.change(checkbox, { target: { checked: false } }));
  expect(form.getValues("price_mode")).toBe("manual");
  expect(host.querySelector('input[name="price"]').readOnly).toBe(false);
});

test("canceling automatic setup for zero preserves manual pricing", async () => {
  await act(async () => { form.setValue("costo_compra", "100"); form.setValue("price", "77"); form.setValue("profit_factor", "0"); });
  const checkbox = host.querySelector('input[type="checkbox"]');
  await act(async () => Simulate.change(checkbox, { target: { checked: true } }));
  expect(document.querySelector('[role="dialog"] input').value).toBe("");
  const cancel = [...document.querySelectorAll('[role="dialog"] button')].find(button => button.textContent === "Cancelar");
  await act(async () => Simulate.click(cancel));
  expect(form.getValues("price_mode")).toBe("manual");
  expect(form.getValues("price")).toBe("77");
  expect(checkbox.checked).toBe(false);
  expect(checkbox.closest(".border").classList.contains("border-secondary")).toBe(true);
  expect(host.querySelector('input[name="price"]').readOnly).toBe(false);
});

test("enabling a positive factor keeps the dialog closed", async () => {
  await act(async () => {
    form.setValue("costo_compra", "100");
    form.setValue("profit_factor", "45");
  });
  const checkbox = host.querySelector('input[type="checkbox"]');
  await act(async () => Simulate.change(checkbox, { target: { checked: true } }));
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(checkbox.checked).toBe(true);
});
