import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import PosDocumentDelivery from "./PosDocumentDelivery";
import client from "../../config/axiosClient";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), put: jest.fn() } }));
let root, host;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true; jest.clearAllMocks();
  client.get.mockImplementation(url => Promise.resolve({ data: url.endsWith("/pos") ? { list: [{ id: 10, name: "Caja principal" }] } : { configured: true, data: { is_enabled: true, app_type: "windows_usb", auto_send_payload: true }, document_settings: { configured: true, document_type: "ticket", delivery_method: "print", auto_send_whatsapp: false } } }));
  client.put.mockResolvedValue({ data: {} });
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
const select = async (index, value) => {
  act(() => Simulate.mouseDown(document.querySelectorAll('[role="combobox"]')[index], { button: 0 }));
  await act(async () => Simulate.click(document.querySelector(`[role="option"][data-value="${value}"]`)));
};

test("saves letter printing for only the selected POS without clearing its connection config", async () => {
  await act(async () => root.render(<PosDocumentDelivery branchId="123" />));
  await select(1, "nota_venta");
  expect(document.body.textContent).toContain("se imprimen desde su PDF");
  await act(async () => Simulate.submit(document.querySelector("form")));
  expect(client.put).toHaveBeenCalledWith("/pos/print-settings/10", {
    document_type: "nota_venta", delivery_method: "print", is_enabled: true,
    auto_send_whatsapp: false, auto_send_payload: false, app_type: null,
  });
  expect(client.put.mock.calls[0][1]).not.toHaveProperty("config");
});

test("requires a branch and does not write configuration by opening the section", async () => {
  await act(async () => root.render(<PosDocumentDelivery branchId="" />));
  expect(document.body.textContent).toContain("Selecciona una sucursal");
  expect(client.get).not.toHaveBeenCalled(); expect(client.put).not.toHaveBeenCalled();
});
