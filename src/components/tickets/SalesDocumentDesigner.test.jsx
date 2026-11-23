import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import SalesDocumentDesigner from "./SalesDocumentDesigner";
import client from "../../config/axiosClient";
import { useAdminUi } from "../../context/AdminUiContext";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), put: jest.fn(), post: jest.fn(), delete: jest.fn() } }));
jest.mock("../../context/AdminUiContext", () => ({ useAdminUi: jest.fn() }));
jest.mock("../../context/TiendaContext", () => ({ useTienda: () => ({ tienda: null }) }));
jest.mock("../../hooks/useReglaTaeconta", () => () => ({ allowed: mockInvoiceAllowed, loading: false }));
jest.mock("./PosDocumentDelivery", () => () => <div>Preferencias POS</div>);
jest.mock("../../services/admin/salesDocumentSettings", () => ({ ...jest.requireActual("../../services/admin/salesDocumentSettings"), validateLogo: jest.fn(async () => {}) }));

let root, host, mockInvoiceAllowed;
const button = text => [...document.querySelectorAll("button")].find(item => item.textContent.includes(text));
const click = async text => act(async () => Simulate.click(button(text)));
const change = (name, value) => act(() => Simulate.change(document.querySelector(`[name="${name}"]`), { target: { value } }));
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true; jest.clearAllMocks();
  mockInvoiceAllowed = false;
  useAdminUi.mockReturnValue({ selectedBranch: { id: 123, name: "Centro" } });
  client.get.mockImplementation(path => Promise.resolve({ data: path.startsWith("/sales/") ? new Blob(["%PDF-demo"], { type: "application/pdf" }) : { config: { direccion: "Dirección heredada", paper_size: path.includes("/ticket/") ? "80" : "letter" } } }));
  client.put.mockResolvedValue({ data: {} });
  URL.createObjectURL = jest.fn(() => "blob:logo"); URL.revokeObjectURL = jest.fn();
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
const render = async () => act(async () => root.render(<SalesDocumentDesigner />));

test.each([["Nota de venta", "nota_venta"], ["Comprobante", "comprobante"]])("%s previews and saves invoice and branch QR without thermal settings", async (label, type) => {
  mockInvoiceAllowed = true;
  await render(); await click(label);
  for (const name of ["qr_factura", "qr_sitio"]) {
    const input = document.querySelector(`input[name="${name}"]`);
    expect(input.disabled).toBe(false);
    await act(async () => Simulate.change(input, { target: { checked: true } }));
  }
  expect(document.querySelectorAll('[aria-label="Códigos QR de ejemplo"] svg')).toHaveLength(2);
  expect(document.body.textContent).toContain("Escanea para facturar");
  expect(document.body.textContent).toContain("Conoce más sobre Centro");
  expect(document.querySelector('[name="qr_factura_size"]')).toBeNull();
  expect(document.querySelector('[name="printer_ip"]')).toBeNull();
  await act(async () => Simulate.submit(document.querySelector("form")));
  expect(client.put).toHaveBeenCalledWith(`/document-settings/${type}/pdf`, { config: { qr_factura: true, qr_sitio: true } }, { params: { branch_id: "123" } });
});

test("invoice QR gating also applies to letter documents while the branch QR remains available", async () => {
  await render(); await click("Nota de venta");
  expect(document.querySelector('input[name="qr_factura"]').disabled).toBe(true);
  expect(document.querySelector('input[name="qr_sitio"]').disabled).toBe(false);
});

test("loads branch config and saves a partial change without overwriting inherited settings", async () => {
  await render();
  expect(client.get).toHaveBeenCalledWith("/document-settings/ticket/pdf", { params: { branch_id: "123" } });
  change("mensaje_1", "Gracias por tu compra");
  await act(async () => Simulate.submit(document.querySelector("form")));
  expect(client.put).toHaveBeenCalledWith("/document-settings/ticket/pdf", { config: { mensaje_1: "Gracias por tu compra" } }, { params: { branch_id: "123" } });
  expect(client.post).not.toHaveBeenCalled();
});

test("asks before discarding edits and loads a separately scoped document", async () => {
  await render(); change("mensaje_2", "Pendiente");
  await click("Nota de venta");
  expect(document.body.textContent).toContain("Hay cambios sin guardar");
  expect(client.get).toHaveBeenCalledTimes(2);
  await click("Descartar y continuar");
  expect(client.get).toHaveBeenCalledWith("/document-settings/nota_venta/pdf", { params: { branch_id: "123" } });
  expect(client.put).not.toHaveBeenCalled();
  expect(document.querySelector('[name="printer_ip"]')).toBeNull();
});

test("does not expose editable defaults when the API fails and can retry", async () => {
  client.get.mockRejectedValueOnce({ response: { status: 503, data: { message: "Falta la migración de documentos" } } });
  await render();
  expect(document.body.textContent).toContain("Falta la migración de documentos");
  expect(button("Guardar diseño")).toBeUndefined();
  await click("Reintentar");
  expect(document.querySelector('[name="direccion"]').value).toBe("Dirección heredada");
});

test("requires a real sale to preview a letter document and uses the selected type", async () => {
  await render(); await click("Comprobante");
  expect(button("Abrir vista previa PDF").disabled).toBe(true);
  const input = [...document.querySelectorAll("input")].find(item => item.getAttribute("inputmode") === "numeric");
  act(() => Simulate.change(input, { target: { value: "456" } }));
  await click("Abrir vista previa PDF");
  expect(client.get).toHaveBeenLastCalledWith("/sales/456/documents/comprobante/pdf", expect.objectContaining({ responseType: "blob" }));
  expect(document.querySelector("iframe").src).toBe("blob:logo");
});

test("follows the active branch and never saves edits from the previous branch into the new one", async () => {
  await render(); change("mensaje_1", "Solo Centro");
  expect(document.body.textContent).not.toContain("Aplicar a");
  expect(document.body.textContent).not.toContain("IDENTIDAD DE TU NEGOCIO");
  useAdminUi.mockReturnValue({ selectedBranch: { id: 456, name: "Norte" } });
  await render();
  expect(client.get).toHaveBeenCalledWith("/document-settings/ticket/pdf", { params: { branch_id: "456" } });
  expect(document.querySelector('[name="mensaje_1"]').value).toBe("");
  change("mensaje_1", "Solo Norte");
  await act(async () => Simulate.submit(document.querySelector("form")));
  expect(client.put).toHaveBeenCalledWith("/document-settings/ticket/pdf", { config: { mensaje_1: "Solo Norte" } }, { params: { branch_id: "456" } });
  expect(client.get.mock.calls.some(([path]) => path === "/branches")).toBe(false);
});

test("does not request general store settings when no branch is selected", async () => {
  useAdminUi.mockReturnValue({ selectedBranch: null });
  await render();
  expect(document.body.textContent).toContain("Selecciona una sucursal desde el panel");
  expect(client.get).not.toHaveBeenCalled();
});

test("does not fall back to a sample for invalid sale numbers and preserves a valid number across formats", async () => {
  await render();
  const input = () => [...document.querySelectorAll("input")].find(item => item.getAttribute("inputmode") === "numeric");
  act(() => Simulate.change(input(), { target: { value: "abc" } }));
  expect(button("Abrir vista previa PDF").disabled).toBe(true);
  expect(document.body.textContent).toContain("Escribe un número de venta válido");
  act(() => Simulate.change(input(), { target: { value: " 999 " } }));
  await click("Nota de venta");
  expect(input().value).toBe(" 999 ");
  await act(async () => Simulate.keyDown(input(), { key: "Enter" }));
  expect(client.get).toHaveBeenLastCalledWith("/sales/999/documents/nota_venta/pdf", expect.objectContaining({ responseType: "blob" }));
  expect(document.querySelector("iframe")).not.toBeNull();
});

test("shows the server error when a sale is missing instead of displaying a fictitious ticket", async () => {
  await render();
  client.get.mockRejectedValueOnce({ response: { status: 404, data: { message: "No se encontró esta venta" } } });
  const input = [...document.querySelectorAll("input")].find(item => item.getAttribute("inputmode") === "numeric");
  act(() => Simulate.change(input, { target: { value: "999" } }));
  await click("Abrir vista previa PDF");
  expect(document.body.textContent).toContain("No se encontró esta venta");
  expect(document.querySelector("iframe")).toBeNull();
});

test("keeps a failed logo upload retryable without resaving already saved text", async () => {
  await render(); change("mensaje_1", "Guardado");
  const file = new File(["logo"], "logo.png", { type: "image/png" });
  await act(async () => Simulate.change(document.querySelector('input[type="file"]'), { target: { files: [file], value: "" } }));
  client.post.mockRejectedValueOnce({ response: { data: { message: "No se pudo subir el logo" } } });
  await act(async () => Simulate.submit(document.querySelector("form")));
  expect(document.body.textContent).toContain("El diseño se guardó, pero el cambio de logo no terminó");
  expect(client.put).toHaveBeenCalledTimes(1);
  client.post.mockResolvedValueOnce({ data: {} });
  await act(async () => Simulate.submit(document.querySelector("form")));
  expect(client.put).toHaveBeenCalledTimes(1);
  expect(client.post).toHaveBeenLastCalledWith("/document-settings/ticket/pdf/logo", expect.any(FormData), { params: { branch_id: "123" } });
});

test("loads and uploads the print logo independently from the PDF logo", async () => {
  client.get.mockImplementation(path => Promise.resolve({ data: { config: { paper_size: "80", show_logo: true, logo_url: path.includes("/payload") ? "https://example.test/print.png" : "https://example.test/pdf.png" } } }));
  await render();
  expect(document.querySelector('img[alt="Logo del ticket PDF"]').src).toBe("https://example.test/pdf.png");
  await click("Logo de impresión");
  expect(client.get).toHaveBeenCalledWith("/document-settings/ticket/payload", { params: { branch_id: "123" } });
  expect(document.querySelector('img[alt="Logo del ticket de impresión"]').src).toBe("https://example.test/print.png");
  expect(document.querySelector('img[alt="Logo del ticket PDF"]')).toBeNull();
  const file = new File(["print"], "print.png", { type: "image/png" });
  await act(async () => Simulate.change(document.querySelector('input[type="file"]'), { target: { files: [file], value: "" } }));
  client.post.mockResolvedValueOnce({ data: {} });
  await act(async () => Simulate.submit(document.querySelector("form")));
  expect(client.post).toHaveBeenLastCalledWith("/document-settings/ticket/payload/logo", expect.any(FormData), { params: { branch_id: "123" } });
  await click("Logo PDF / WhatsApp");
  expect(document.querySelector('img[alt="Logo del ticket PDF"]').src).toBe("https://example.test/pdf.png");
});

test("shows only the printed design without sale or PDF controls in printing mode", async () => {
  await render(); await click("Logo de impresión");
  expect(document.body.textContent).toContain("Tu diseño");
  expect(document.querySelector('[aria-label="Diseño del ticket de impresión"]')).not.toBeNull();
  expect(document.body.textContent).not.toContain("Revisar con una venta");
  expect(button("Abrir vista previa PDF")).toBeUndefined();
  expect([...document.querySelectorAll("input")].some(input => input.getAttribute("inputmode") === "numeric")).toBe(false);
  expect(document.querySelector("iframe")).toBeNull();
  await click("Logo PDF / WhatsApp");
  expect(button("Abrir vista previa PDF")).toBeDefined();
});

test.each([["Nota de venta", "nota_venta"], ["Comprobante", "comprobante"]])("%s has only PDF and WhatsApp even after editing a printed ticket", async (label, type) => {
  await render(); await click("Logo de impresión");
  client.get.mockClear(); await click(label);
  expect(client.get).toHaveBeenCalledWith(`/document-settings/${type}/pdf`, { params: { branch_id: "123" } });
  expect(client.get.mock.calls.some(([path]) => path.includes("/payload"))).toBe(false);
  expect(button("Logo de impresión")).toBeUndefined();
  expect(document.body.textContent).toContain("opciones nativas de tu dispositivo");
  change("mensaje_1", "Mensaje del PDF");
  await act(async () => Simulate.submit(document.querySelector("form")));
  expect(client.put).toHaveBeenCalledWith(`/document-settings/${type}/pdf`, { config: { mensaje_1: "Mensaje del PDF" } }, { params: { branch_id: "123" } });
});
