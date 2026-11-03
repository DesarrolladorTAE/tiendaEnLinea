import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import ShippingSettings from "./ShippingSettings";
import { getShippingConfig, getShippingBranches, saveShippingSettings, saveShippingResource } from "../../services/admin/shippingService";

jest.mock("../../context/AdminUiContext", () => ({ useAdminUi: () => ({ selectedBranch: { id: 2, name: "Centro" } }) }));
jest.mock("../../context/TiendaContext", () => ({ useTienda: () => ({ tienda: { id: 16, plan_id: 4 } }) }));
jest.mock("../../services/admin/shippingService", () => ({ getShippingConfig: jest.fn(), getShippingBranches: jest.fn(), saveShippingSettings: jest.fn(), saveShippingResource: jest.fn(), uploadShippingLogo: jest.fn() }));
let root, host;
const button = (label) => [...document.querySelectorAll("button")].find((item) => item.textContent === label);
const field = (label) => document.getElementById([...document.querySelectorAll("label")].find((item) => item.textContent.startsWith(label))?.htmlFor);
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  getShippingConfig.mockResolvedValue({ data: { data: { settings: { enabled: true, allow_pos: true, allow_public: false, notify_updates: true, whatsapp_provider: "auto", tracking_page_url: null }, channels: [], methods: [], delivery_points: [] } } });
  getShippingBranches.mockResolvedValue([{ id: 2, name: "Centro" }]);
  saveShippingSettings.mockResolvedValue({ data: {} });
  saveShippingResource.mockResolvedValue({ data: { data: { id: 8 } } });
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  await act(async () => root.render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><ShippingSettings /></MemoryRouter>));
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

test("loads settings and saves the public switch and frontend tracking URL", async () => {
  expect(document.body.textContent).toContain("Envíos de productos");
  const checkbox = [...document.querySelectorAll("label")].find((item) => item.textContent.includes("Permitir envíos en catálogos públicos")).querySelector("input");
  await act(async () => Simulate.change(checkbox, { target: { checked: true } }));
  await act(async () => Simulate.click(button("Usar la página de seguimiento de este sitio")));
  await act(async () => Simulate.submit(document.querySelector("form")));
  expect(saveShippingSettings).toHaveBeenCalledWith({ enabled: true, allow_pos: true, allow_public: true, notify_updates: true, whatsapp_provider: "auto", tracking_page_url: `${window.location.origin}/seguimiento` });
  expect(document.body.textContent).toContain("Configuración de envíos guardada");
});

test("rejects tracking URLs with an existing token", async () => {
  await act(async () => Simulate.change(field("URL pública"), { target: { value: "https://example.test/seguimiento?tracking_token=abc" } }));
  await act(async () => Simulate.submit(document.querySelector("form")));
  expect(saveShippingSettings).not.toHaveBeenCalled();
  expect(document.body.textContent).toContain("sin fragmentos #");
});

test("creates a channel with the complete private contract and refreshes the list", async () => {
  await act(async () => Simulate.click([...document.querySelectorAll('[role="tab"]')].find((item) => item.textContent === "Canales")));
  await act(async () => Simulate.click(button("Agregar canal")));
  await act(async () => Simulate.change(field("Nombre"), { target: { value: "Reparto propio" } }));
  await act(async () => Simulate.change(field("Código"), { target: { value: "propio" } }));
  await act(async () => Simulate.submit(document.querySelector('[role="dialog"] form') || document.querySelector('form')));
  expect(saveShippingResource).toHaveBeenCalledWith("channels", null, { name: "Reparto propio", code: "propio", type: "manual", has_tracking: true, tracking_url_template: null, is_active: true });
  expect(getShippingConfig).toHaveBeenCalledTimes(2);
});

test("keeps settings and displays a rejected save as text", async () => {
  saveShippingSettings.mockRejectedValue({ response: { status: 422, data: { message: "Configuración no válida", errors: { allow_public: ["Revisa el plan y la pasarela"] } } } });
  await act(async () => Simulate.submit(document.querySelector("form")));
  expect(document.body.textContent).toContain("Revisa el plan y la pasarela");
  expect(document.querySelectorAll('input[type="checkbox"]')[0].checked).toBe(true);
});
