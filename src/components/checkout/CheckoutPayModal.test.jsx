import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import axios from "axios";
import CheckoutPayModal from "./CheckoutPayModal";
import { getPublicShippingConfig } from "../../services/public/shippingService";

jest.mock("axios", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("../../services/public/shippingService", () => ({ getPublicShippingConfig: jest.fn() }));
jest.mock("../../utils/alerts", () => ({ showSuccess: jest.fn(), showError: jest.fn(), alertFromAxiosError: jest.fn() }));
jest.mock("@paypal/react-paypal-js", () => ({ PayPalScriptProvider: ({ children }) => children, PayPalButtons: () => null }));
// Delivery field validation has its own tests. Here verify the real checkout's
// multipart request, authorization refresh, and confirmation lifecycle.
jest.mock("./ShipmentFields", () => ({ config, onChange }) => config?.enabled ? <button onClick={() => onChange({ shipping_method_id: 1, recipient_name: "Ana", recipient_phone: "7221234567", destination_address: "Calle 10", notification_consent: false })}>Seleccionar entrega de prueba</button> : null);
const response = (enabled = true) => ({ data: { data: { enabled, store_id: 16, branch_id: 2, requirements: { professional_plan: true, payment_gateway: true, branch_pos: true }, methods: [{ id: 1, fulfillment_type: "home_delivery" }], delivery_points: [] } } });
let host, root, clearCart, close;
const button = (text) => [...document.querySelectorAll("button")].find((item) => item.textContent.includes(text));
async function change(selector, value) {
  const input = document.querySelector(selector);
  if (!input) throw new Error(`Missing input ${selector}`);
  await act(async () => Simulate.change(input, { target: { value } }));
}
async function prepareOrder() {
  await act(async () => Simulate.click(document.querySelector('[role="button"]')));
  await change('input[placeholder^="Ej. Luis"]', "Ana López");
  await change('input[placeholder^="10"]', "7221234567");
  await change('input[placeholder^="Ej. correo"]', "ana@example.com");
  await change('input[placeholder^="Ej. Av."]', "Av. Principal 100");
  await change('textarea[placeholder^="Ej. Puerta"]', "Casa blanca");
  await act(async () => Simulate.change(document.querySelector('input[type="file"]'), { target: { files: [new File(["proof"], "proof.png", { type: "image/png" })] } }));
  await act(async () => Simulate.click(button("Seleccionar entrega de prueba")));
}
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  axios.get.mockImplementation(async (url) => {
    if (url.includes("bootstrap")) return { data: { id_store: 16 } };
    if (url.includes("payment-accounts")) return { data: { ok: true, accounts: [{ id: 8, bank_name: "Banco de prueba" }] } };
    throw new Error("PayPal unavailable");
  });
  getPublicShippingConfig.mockResolvedValue(response());
  clearCart = jest.fn(); close = jest.fn();
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  await act(async () => root.render(<CheckoutPayModal open onClose={close} onClearCart={clearCart} storeSlug="tienda" storeId={16} branchId={2} storeName="Tienda" items={[{ id: 5, qty: 1, price: 100 }]} total={100} />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

test("sends branch and shipment without altering totals and retains confirmation until closed", async () => {
  axios.post.mockResolvedValue({ data: { ok: true, branch_id: 2, shipping_tracking: { shipment_code: "ENV-ABC123DEF456", status_label: "Pendiente", public_url: "https://example.test/seguimiento?tracking_token=abc" } } });
  await prepareOrder();
  await act(async () => Simulate.click(button("Enviar pedido")));
  expect(axios.post).toHaveBeenCalledTimes(1);
  const [url, payload] = axios.post.mock.calls[0];
  expect(url).toContain("/public/offline-orders");
  expect(payload.get("branch_id")).toBe("2");
  expect(payload.get("address")).toBe("Av. Principal 100");
  expect(JSON.parse(payload.get("items"))[0].unit_price).toBe(100);
  expect(payload.has("shipping_amount")).toBe(false);
  expect(JSON.parse(payload.get("shipment"))).toMatchObject({ shipping_method_id: 1, notification_consent: false });
  expect(document.body.textContent).toContain("ENV-ABC123DEF456");
  expect(clearCart).not.toHaveBeenCalled();
  await act(async () => Simulate.click(button("Cerrar")));
  expect(clearCart).toHaveBeenCalledTimes(1);
  expect(close).toHaveBeenCalledTimes(1);
});

test("422 refreshes eligibility and never silently resubmits without shipment", async () => {
  getPublicShippingConfig.mockResolvedValue(response(false));
  axios.post.mockRejectedValue({ response: { status: 422, data: { message: "Entrega no disponible", errors: { shipment: ["El complemento venció"] } } } });
  await prepareOrder();
  await act(async () => Simulate.click(button("Enviar pedido")));
  expect(getPublicShippingConfig).toHaveBeenCalledTimes(2);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(document.body.textContent).toContain("El complemento venció");
  expect(button("Continuar sin envío")).toBeDefined();
  await act(async () => Simulate.click(button("Enviar pedido")));
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(document.querySelector('input[placeholder^="Ej. Luis"]').value).toBe("Ana López");
});
