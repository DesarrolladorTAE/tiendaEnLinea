import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import OfflinePaymentsPage from "./OfflinePaymentsPage";
import axiosClientStore from "../../config/axiosClient";
import axiosClientPOS from "../../config/axiosClientPOS";
import { showConfirm, showSuccess } from "../../utils/alerts";

jest.mock("../../config/axiosClient", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("../../config/axiosClientPOS", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("../../utils/alerts", () => ({ showConfirm: jest.fn(), showSuccess: jest.fn(), alertFromAxiosError: jest.fn() }));

test.each([
  ["pending", "pending", true],
  ["approved", "cancelled", false],
  ["rejected", "paid", false],
])("web order %s with sale %s exposes shipping only while active", async (status, saleStatus, visible) => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  const row = { id: 12, full_name: "Ana", status, has_proof: true, sale: { id: 20, status: saleStatus, grand_total: 100 } };
  axiosClientPOS.get.mockImplementation(async url => ({ data: { data: url.endsWith("/stats") ? {} : [row] } }));
  const host = document.createElement("div"); document.body.appendChild(host); const root = createRoot(host);
  try {
    await act(async () => root.render(<OfflinePaymentsPage mode="pos" branchId={2} posLocationId={8} />));
    expect([...host.querySelectorAll("button")].some(button => button.textContent === "Entrega / envío")).toBe(visible);
    if (!visible) expect(host.textContent).toContain("Cancelada");
  } finally { act(() => root.unmount()); host.remove(); }
});

test.each(["store", "pos"])("offline list and statistics use %s authentication with the same branch and box", async mode => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  jest.clearAllMocks();
  for (const client of [axiosClientStore, axiosClientPOS]) client.get.mockResolvedValue({ data: { data: [] } });
  const host = document.createElement("div"); document.body.appendChild(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<OfflinePaymentsPage mode={mode} branchId={2} posLocationId={8} onBack={() => {}} />));
    expect(host.querySelector("h1").textContent).toBe("Pedidos web y comprobantes");
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    const client = mode === "pos" ? axiosClientPOS : axiosClientStore;
    expect(client.get).toHaveBeenCalledWith("/admin/offline-payments", { params: expect.objectContaining({ branch_id: 2, pos_location_id: mode === "pos" ? undefined : 8, status: "pending" }) });
    expect(client.get).toHaveBeenCalledWith("/admin/offline-payments/stats", { params: expect.objectContaining({ branch_id: 2, pos_location_id: mode === "pos" ? undefined : 8 }) });
    if (mode === "pos") expect(axiosClientStore.get).not.toHaveBeenCalled();
  } finally { act(() => root.unmount()); host.remove(); }
});

test("opens a request inside the page and returns to the filtered inbox without a detail modal", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  const row = { id: 12, full_name: "Ana", status: "pending", has_proof: true, sale: { id: 20, grand_total: 100 } };
  axiosClientPOS.get.mockImplementation(async url => ({ data: { data: url.endsWith("/12") ? { form: row, sale: row.sale } : url.endsWith("/stats") ? {} : [row] } }));
  const host = document.createElement("div"); document.body.appendChild(host);
  const root = createRoot(host), onBack = jest.fn();
  try {
    await act(async () => root.render(<OfflinePaymentsPage mode="pos" branchId={2} posLocationId={8} onBack={onBack} />));
    await act(async () => Simulate.click([...host.querySelectorAll("button")].find(button => button.textContent === "Ver")));
    expect(host.querySelector("h2").textContent).toBe("Detalle de solicitud");
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    act(() => Simulate.click([...host.querySelectorAll("button")].find(button => button.textContent === "Volver a pedidos")));
    expect(host.textContent).toContain("Resumen del mes");
    expect(host.textContent).toContain("Ana");
    act(() => Simulate.click([...host.querySelectorAll("button")].find(button => button.textContent === "Volver al POS")));
    expect(onBack).toHaveBeenCalledTimes(1);
  } finally { act(() => root.unmount()); host.remove(); }
});

 test("tour details preserve prefixed IDs, payment amount and private proof without product actions", async () => {
  const row = { id: "tour-123", source: "tour", full_name: "Ana", status: "uploaded", has_proof: true, amount: "760.00", sale: null, booking: { booking_code: "RAI-000045", tour_name: "Tour ejemplo", total: "1520", remaining_amount: "1520" }, payment: { payment_type: "deposit" }, proof_url: "/admin/offline-payments/tour-123/proof", actions: { can_approve: true, can_reject: false, can_delete: false, can_send_ticket: false } };
  showConfirm.mockResolvedValue(true); showSuccess.mockResolvedValue(); axiosClientPOS.post.mockResolvedValue({ data: { message: "Confirmado" } });
  const blob = new Blob(["pdf"], { type: "application/pdf" });
  URL.createObjectURL = jest.fn(() => "blob:proof"); URL.revokeObjectURL = jest.fn();
  axiosClientPOS.get.mockImplementation(async url => url.endsWith("/proof") ? { data: blob } : { data: { data: url.endsWith("/tour-123") ? row : url.endsWith("/stats") ? {} : { data: [row], last_page: 2 } } });
  const host = document.createElement("div"); document.body.appendChild(host); const root = createRoot(host);
  try {
    await act(async () => root.render(<OfflinePaymentsPage mode="pos" branchId={2} posLocationId={8} />));
    expect(host.textContent).toContain("RAI-000045"); expect(host.textContent).toContain("Anticipo"); expect(host.textContent).toContain("Página 1 de 2");
    expect([...host.querySelectorAll("button")].some(b => b.textContent === "Eliminar")).toBe(false);
    await act(async () => Simulate.click([...host.querySelectorAll("button")].find(b => b.textContent === "Ver")));
    expect(axiosClientPOS.get).toHaveBeenCalledWith("/admin/offline-payments/tour-123");
    expect(host.textContent).toContain("Anticipo a revisar: $760.00");
    expect([...host.querySelectorAll("button")].find(b => b.textContent === "Rechazar").disabled).toBe(true);
    expect([...host.querySelectorAll("button")].find(b => b.textContent === "Confirmar").disabled).toBe(false);
    expect(host.textContent).not.toContain("Venta #");
    await act(async () => Simulate.click([...host.querySelectorAll("button")].find(b => b.textContent === "Ver comprobante")));
    expect(axiosClientPOS.get).toHaveBeenCalledWith("/admin/offline-payments/tour-123/proof", { responseType: "blob" });
    expect(document.querySelector('iframe[title="Comprobante PDF"]').getAttribute("src")).toBe("blob:proof");
    const before = axiosClientPOS.get.mock.calls.length;
    await act(async () => Simulate.click([...host.querySelectorAll("button")].find(b => b.textContent === "Confirmar")));
    expect(axiosClientPOS.post).toHaveBeenCalledWith("/admin/offline-payments/tour-123/approve", {});
    expect(axiosClientPOS.get.mock.calls.slice(before).map(call => call[0])).toEqual(expect.arrayContaining(["/admin/offline-payments", "/admin/offline-payments/stats"]));
  } finally { act(() => root.unmount()); host.remove(); }
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:proof");
});
