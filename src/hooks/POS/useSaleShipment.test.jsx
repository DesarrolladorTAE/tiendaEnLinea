import React, { act } from "react";
import { createRoot } from "react-dom/client";
import client from "../../config/axiosClientPOS";
import useSaleShipment from "./useSaleShipment";
jest.mock("../../config/axiosClientPOS", () => ({ __esModule: true, default: { get: jest.fn() } }));
let root, host, latest, config;
function Harness() { latest = useSaleShipment(10); return null; }
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  config = { settings: { enabled: true, allow_pos: true, notify_updates: false }, channels: [{ id: 2, is_active: true }], methods: [{ id: 3, shipping_channel_id: 2, is_active: true, fulfillment_type: "home_delivery" }], delivery_points: [] };
  client.get.mockReset().mockImplementation(async () => ({ data: { data: config } }));
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  await act(async () => root.render(<Harness />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
const values = { shipping_method_id: 3, recipient_name: "Ana", recipient_phone: "7221234567", destination_address: "Calle 10", notification_consent: true };
test("refreshes eligibility before checkout and never silently drops a selected shipment", async () => {
  await act(async () => latest.setValues(values));
  config.settings.enabled = false;
  await act(async () => { await expect(latest.build()).rejects.toThrow("ya no permite"); });
  expect(latest.values).toEqual(values);
});
test("rejects methods disabled since the form was loaded", async () => {
  await act(async () => latest.setValues(values));
  config.methods[0].is_active = false;
  await act(async () => { await expect(latest.build()).rejects.toThrow("método de entrega disponible"); });
});
test("builds explicit consent without modifying totals and omits shipment for an ordinary sale", async () => {
  await expect(latest.build()).resolves.toBeNull();
  await act(async () => latest.setValues(values));
  let result;
  await act(async () => { result = await latest.build(); });
  expect(result).toEqual({ ...values, notification_consent: false });
});
