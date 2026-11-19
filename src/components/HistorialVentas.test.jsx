import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import HistorialVentas from "./HistorialVentas";
import client from "../config/axiosClientPOS";

jest.mock("../config/axiosClientPOS", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("date-fns/locale", () => ({ es: {} }));
jest.mock("./HistorialPOSResumen", () => () => null);
jest.mock("./ModalTicketVenta", () => () => null);
jest.mock("./ModalCancelarVenta", () => () => null);
jest.mock("./ModalDevolverVenta", () => () => null);
jest.mock("./ModalClienteVenta", () => () => null);

test.each([
  [42, "Ticket #84353"],
  [9, "No se encontró el folio en este punto de venta."],
  [undefined, "No se encontró el folio en este punto de venta."],
])("only shows details for the active terminal when the returned terminal is %j", async (saleTerminal, expected) => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  client.get.mockImplementation(async (url) => ({ data: url === "/ventas/84353"
    ? { sale: { id: 84353, status: "paid", pos_location_id: saleTerminal } }
    : { rows: [] } }));
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<HistorialVentas posLocationId={42} />));
    const search = host.querySelector('form[role="search"]');
    const input = search.querySelector("input");
    act(() => Simulate.change(input, { target: { value: "ABC" } }));
    await act(async () => Simulate.submit(search));
    expect(search.textContent).toContain("Ingresa un folio numérico válido.");
    expect(client.get).toHaveBeenCalledTimes(1);
    act(() => Simulate.change(input, { target: { value: "#00084353" } }));
    await act(async () => Simulate.submit(search));
    expect(client.get.mock.calls.map(([url]) => url)).toEqual(["/pos/historial-unificado", "/ventas/84353"]);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain(expected);
    expect(dialog.textContent.includes("Ticket #84353")).toBe(saleTerminal === 42);
  } finally {
    act(() => root.unmount());
    host.remove();
    client.get.mockReset();
  }
});
