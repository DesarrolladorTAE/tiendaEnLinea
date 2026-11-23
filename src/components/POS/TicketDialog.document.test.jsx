import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import TicketDialog from "./TicketDialog";
import client from "../../config/axiosClientPOS";

jest.mock("../../config/axiosClientPOS", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("../../utils/alerts", () => ({ showError: jest.fn(), showSuccess: jest.fn() }));
let host, root;
const settings = { document_settings: { document_type: "comprobante", delivery_method: "pdf", is_enabled: true }, document_action: { document_type: "comprobante", delivery_method: "pdf" } };
const preview = { document_type: "comprobante", channel: "pdf", config: { title: "COMPROBANTE", accent_color: "#333333", show_customer: true, show_logo: true, logo_url: "https://example.com/logo.png" }, document: { sale: { id: 456 }, store: { name: "Mi tienda" }, customer: { name: "Ana" }, items: [{ name: "Zapato", quantity: 2, unit_price: "20.00", total: "40.00" }], totals: { total: "40.00" }, payments: [{ method: "efectivo", amount: "40.00" }], links: { invoice: { url: "https://example.com/factura/456" }, site: null } } };
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); URL.createObjectURL = jest.fn(() => "blob:document"); URL.revokeObjectURL = jest.fn(); client.get.mockReset(); });
afterEach(() => { act(() => root.unmount()); host.remove(); jest.restoreAllMocks(); });

test("renders the configured document from the POS preview and keeps download available", async () => {
  const send = jest.fn();
  client.get.mockImplementation(url => Promise.resolve({ data: url.includes("payload-config") ? settings : url.endsWith("/preview") ? preview : new Blob(["pdf"]) }));
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  await act(async () => root.render(<TicketDialog open sale={{ id: 456, whatsapp: { attempted: true, sent: false } }} posLocationId={10} onSend={send} />));
  expect(client.get).toHaveBeenCalledWith("/sales/456/documents/default/preview");
  expect(client.get.mock.calls.some(([url]) => url.includes("/document-settings/"))).toBe(false);
  expect(host.textContent).toContain("COMPROBANTE"); expect(host.textContent).toContain("Mi tienda"); expect(host.textContent).toContain("Ana"); expect(host.textContent).toContain("Zapato"); expect(host.textContent).toContain("$40.00");
  expect(host.querySelector('img[alt="Logo de la tienda"]').src).toBe("https://example.com/logo.png");
  expect(host.querySelector('svg[role="img"]')).not.toBeNull(); expect(host.querySelector("iframe")).toBeNull();
  const download = [...host.querySelectorAll("button")].find(button => button.textContent === "Descargar ticket");
  await act(async () => Simulate.click(download));
  expect(client.get).toHaveBeenCalledWith("/sales/456/documents/default/pdf?download=1", { responseType: "blob" }); expect(send).not.toHaveBeenCalled();
});

test("allows retry after preview failure without hiding the saved sale", async () => {
  let attempts = 0;
  client.get.mockImplementation(url => url.includes("payload-config") ? Promise.resolve({ data: settings }) : ++attempts === 1 ? Promise.reject(new Error("offline")) : Promise.resolve({ data: preview }));
  await act(async () => root.render(<TicketDialog open sale={{ id: 456 }} posLocationId={10} />));
  expect(host.textContent).toContain("No se pudo cargar la vista previa");
  await act(async () => Simulate.click([...host.querySelectorAll("button")].find(button => button.textContent === "Reintentar")));
  expect(host.textContent).toContain("Mi tienda"); expect(attempts).toBe(2);
});

test("uses the sale preview for thermal tickets and omits unavailable QR codes", async () => {
  const thermal = { ...preview, document_type: "ticket", channel: "payload", config: { paper_size: "58", mensaje_2: "Gracias" }, document: { ...preview.document, links: { site: null, invoice: null } } };
  client.get.mockImplementation(url => Promise.resolve({ data: url.includes("payload-config") ? settings : thermal }));
  await act(async () => root.render(<TicketDialog open sale={{ id: 456 }} posLocationId={10} />));
  expect(host.textContent).toContain("Gracias");
  expect(host.querySelector('svg[role="img"]')).toBeNull();
  expect(host.querySelector('img[alt="Logo de la tienda"]')).toBeNull();
});
