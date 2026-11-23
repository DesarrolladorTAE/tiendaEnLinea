import { privateShippingConfig, saleOnline, shipmentTransitions } from "./privateShipping";

test("private configuration requires enabled and allow_pos and filters inactive resources and foreign points", () => {
  const data = { settings: { enabled: 1, allow_pos: true, notify_updates: true, whatsapp_provider: "none" }, channels: [{ id: 1, is_active: true }, { id: 2, is_active: false }], methods: [{ id: 1, shipping_channel_id: 1, is_active: true }, { id: 2, shipping_channel_id: 2, is_active: true }], delivery_points: [{ id: 1, branch_id: 3, is_active: 1 }, { id: 2, branch_id: 4, is_active: 1 }] };
  expect(privateShippingConfig(data, 3)).toMatchObject({ enabled: true, notifications_available: false, methods: [{ id: 1 }], delivery_points: [{ id: 1 }] });
  expect(privateShippingConfig({ ...data, settings: { ...data.settings, allow_pos: false } }).enabled).toBe(false);
});
test("terminal states and forbidden jumps cannot be selected", () => {
  expect(shipmentTransitions.pending).not.toContain("delivered");
  expect(shipmentTransitions.preparing).not.toContain("shipped");
  expect(shipmentTransitions.ready_to_ship).toContain("delivered");
  expect(shipmentTransitions.delivered).toEqual([]);
  expect(shipmentTransitions.cancelled).toEqual([]);
});
test("payment methods and shipments do not by themselves prove an online origin", () => {
  expect(saleOnline({ payment_method: "transferencia", shipping_tracking: {} })).toBe(false);
  expect(saleOnline({ source: "public" })).toBe(true);
  expect(saleOnline({ is_online: true })).toBe(true);
});
