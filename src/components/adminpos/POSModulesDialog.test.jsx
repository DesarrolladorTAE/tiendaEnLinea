import React, { act } from "react";
import { createRoot } from "react-dom/client";
import client from "../../config/axiosClient";
import POSModulesDialog from "./POSModulesDialog";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), put: jest.fn() } }));

test("uses the store API and sends only changed available module preferences", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const credits = { key: "credits", name: "Crédito y fiados", sort_order: 1, available: true, enabled: true, visible: true };
  const invoices = { key: "invoices", name: "Facturación", sort_order: 2, available: false, enabled: true, visible: false };
  client.get.mockResolvedValue({ data: { data: [credits, invoices] } });
  client.put.mockResolvedValue({ data: { data: [{ ...credits, enabled: false, visible: false }, invoices] } });
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<POSModulesDialog onClose={() => {}} />));
    const dialog = document.querySelector('[role="dialog"]');
    const save = [...dialog.querySelectorAll("button")].find((element) => element.textContent === "Guardar módulos");
    expect(client.get).toHaveBeenCalledWith("/pos/modules", expect.objectContaining({ signal: expect.any(Object) }));
    expect(dialog.querySelector('[aria-label="Habilitar Facturación"]').disabled).toBe(true);
    expect(save.disabled).toBe(true);
    act(() => dialog.querySelector('[aria-label="Habilitar Crédito y fiados"]').click());
    await act(async () => save.click());
    expect(client.put).toHaveBeenCalledWith("/pos/modules", { modules: [{ key: "credits", enabled: false }] });
    expect(dialog.textContent).toContain("Módulos guardados");
    expect(save.disabled).toBe(true);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

test("hides a module with one switch and clears the terminal override when asked to inherit", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const inherited = { key: "credits", name: "Crédito y fiados", sort_order: 1, available: true, enabled: true, visible: true, source: "general" };
  client.get.mockClear().mockResolvedValue({ data: { data: [inherited] } });
  client.put.mockClear()
    .mockResolvedValueOnce({ data: { data: [{ ...inherited, enabled: false, visible: false, source: "pos" }] } })
    .mockResolvedValueOnce({ data: { data: [inherited] } });
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<POSModulesDialog pos={{ id: 10, name: "Caja Centro" }} onClose={() => {}} />));
    const dialog = document.querySelector('[role="dialog"]');
    const toggle = dialog.querySelector('[aria-label="Habilitar Crédito y fiados"]');
    const save = [...dialog.querySelectorAll("button")].find((element) => element.textContent === "Guardar módulos");
    expect(client.get).toHaveBeenCalledWith("/pos/modules", expect.objectContaining({ params: { pos_location_id: 10 } }));
    expect(toggle.checked).toBe(true);
    expect(dialog.querySelectorAll('input[type="checkbox"]')).toHaveLength(1);
    act(() => toggle.click());
    await act(async () => save.click());
    expect(client.put).toHaveBeenNthCalledWith(1, "/pos/modules", { pos_location_id: 10, modules: [{ key: "credits", enabled: false }] });
    expect(toggle.checked).toBe(false);
    act(() => dialog.querySelector('[aria-label="Heredar Crédito y fiados de la tienda"]').click());
    expect(dialog.textContent).toContain("Heredará al guardar");
    await act(async () => save.click());
    expect(client.put).toHaveBeenNthCalledWith(2, "/pos/modules", { pos_location_id: 10, modules: [{ key: "credits", enabled: null }] });
    expect(toggle.checked).toBe(true);
    expect(dialog.querySelector('[aria-label="Heredar Crédito y fiados de la tienda"]')).toBeNull();
    expect(save.disabled).toBe(true);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
