import assert from "node:assert/strict";
import { buildShipment, validTrackingCode, safeShippingUrl, retryAfterMs, shippingConfigForBranch } from "../src/utils/shipping.mjs";

const eligible = { enabled: true, store_id: 16, branch_id: 2, requirements: { professional_plan: true, payment_gateway: true, branch_pos: true }, methods: [{ id: 1 }], delivery_points: [{ id: 4 }] };
assert.equal(shippingConfigForBranch(eligible, 2, 16).enabled, true);
for (const requirement of Object.keys(eligible.requirements)) {
  const denied = shippingConfigForBranch({ ...eligible, requirements: { ...eligible.requirements, [requirement]: false } }, 2, 16);
  assert.equal(denied.enabled, false);
  assert.deepEqual(denied.methods, []);
}
assert.equal(shippingConfigForBranch({ ...eligible, enabled: false }, 2, 16).enabled, false);
assert.throws(() => shippingConfigForBranch(eligible, 3, 16));
assert.throws(() => shippingConfigForBranch(eligible, 2, 99));

const config = { enabled: true, notifications_available: true, methods: [{ id: 1, fulfillment_type: "home_delivery" }, { id: 2, fulfillment_type: "pickup" }], delivery_points: [{ id: 4 }] };
const values = { shipping_method_id: "1", recipient_name: "Ana", recipient_phone: "+527221234567", destination_address: "Calle 10", notification_consent: false };
assert.equal(buildShipment(null, values), null);
assert.equal(buildShipment({ ...config, enabled: false }, values), null);
assert.equal(buildShipment(config, { ...values, shipping_method_id: "" }), null);
assert.equal(buildShipment(config, values).notification_consent, false);
assert.equal(buildShipment(config, values).shipping_method_id, 1);
const pickup = buildShipment(config, { ...values, shipping_method_id: 2, delivery_point_id: 4 });
assert.equal(pickup.delivery_point_id, 4);
assert.ok(!("destination_address" in pickup));
assert.ok(!("delivery_point_id" in buildShipment(config, { ...values, delivery_point_id: 4 })));
assert.throws(() => buildShipment(config, { ...values, shipping_method_id: 99 }));
assert.throws(() => buildShipment(config, { ...values, shipping_method_id: 2, delivery_point_id: 999 }));
assert.throws(() => buildShipment(config, { ...values, recipient_phone: "1234" }));
assert.throws(() => buildShipment(config, { ...values, notification_consent: undefined }));
assert.throws(() => buildShipment(config, { ...values, destination_address: "" }));
assert.equal(buildShipment({ ...config, notifications_available: false }, { ...values, notification_consent: true }).notification_consent, false);
assert.equal(validTrackingCode("ENV-ABC123DEF456"), true);
assert.equal(validTrackingCode("a".repeat(48)), true);
assert.equal(validTrackingCode("123"), false);
assert.equal(validTrackingCode("ENV-abc123def456"), false);
assert.equal(safeShippingUrl("javascript:alert(1)"), null);
assert.equal(safeShippingUrl("https://carrier.example/track"), "https://carrier.example/track");
assert.equal(retryAfterMs("45"), 45000);
assert.equal(retryAfterMs("Tue, 03 Nov 2026 16:01:00 GMT", Date.parse("2026-11-03T16:00:00Z")), 60000);
assert.equal(retryAfterMs(undefined), 60000);
console.log("Shipping validation tests passed.");
