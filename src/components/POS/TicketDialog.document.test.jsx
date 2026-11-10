import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import TicketDialog from "./TicketDialog";
import client from "../../config/axiosClientPOS";

jest.mock("../../config/axiosClientPOS", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("../../utils/alerts", () => ({ showError: jest.fn(), showSuccess: jest.fn() }));
let host, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  URL.createObjectURL = jest.fn(() => "blob:document");
  URL.revokeObjectURL = jest.fn();
});
afterEach(() => { act(() => root.unmount()); host.remove(); jest.restoreAllMocks(); });

test("checkout offers the POS PDF action without a thermal connection or automatic WhatsApp retry", async () => {
  const send = jest.fn();
  client.get.mockImplementation(url => Promise.resolve({ data: url.includes("payload-config") ? {
    enabled: true, app_type: null,
    document_settings: { document_type: "nota_venta", delivery_method: "pdf", is_enabled: true },
    document_action: { document_type: "nota_venta", delivery_method: "pdf", format: "pdf" },
  } : new Blob(["pdf"]) }));
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  await act(async () => root.render(<TicketDialog open sale={{ id: 456, whatsapp: { attempted: true, sent: false } }} ticketUrl="blob:preview" posLocationId={10} onSend={send} />));
  expect(host.textContent).toContain("La venta se guardó");
  const download = [...host.querySelectorAll("button")].find(button => button.textContent === "Descargar PDF");
  expect(download.disabled).toBe(false);
  await act(async () => Simulate.click(download));
  expect(client.get).toHaveBeenCalledWith("/sales/456/documents/default/pdf?download=1", { responseType: "blob" });
  expect(client.get.mock.calls.some(([url]) => url.endsWith("/payload"))).toBe(false);
  expect(send).not.toHaveBeenCalled();
});
