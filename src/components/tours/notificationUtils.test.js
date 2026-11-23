import { bookingNotificationPayload, bookingNotificationLabel } from "./notificationUtils";

const form = { buyer_phone: "7221234567", buyer_email: " ana@example.com ", notification_channels: [] };

test("supports both channels without sending the unsupported singular both", () => {
  expect(bookingNotificationPayload({ ...form, notification_channels: ["email", "whatsapp"], buyer_whatsapp_phone: "+14155552671" })).toEqual({
    buyer_phone: "7221234567", buyer_email: "ana@example.com", buyer_whatsapp_phone: "+14155552671", notification_channels: ["email", "whatsapp"], notification_channel: "email",
  });
});
test("empty selection disables notifications and leaves the default WhatsApp destination to the backend", () => {
  expect(bookingNotificationPayload(form)).toMatchObject({ notification_channels: [], notification_channel: "none" });
  expect(bookingNotificationPayload({ ...form, notification_channels: ["whatsapp"] }).buyer_whatsapp_phone).toBeUndefined();
  expect(bookingNotificationPayload({ ...form, buyer_whatsapp_phone: "invalid hidden value" }).buyer_whatsapp_phone).toBeUndefined();
});
test("validates contact, email, international destination and channel selection", () => {
  expect(() => bookingNotificationPayload({ ...form, buyer_phone: "+527221234567" })).toThrow(/10 dígitos/);
  expect(() => bookingNotificationPayload({ ...form, buyer_email: "", notification_channels: ["email"] })).toThrow(/correo/);
  for (const phone of ["+52 7221234567", "7221234567", "+1234567", "+1234567890123456"]) {
    expect(() => bookingNotificationPayload({ ...form, notification_channels: ["whatsapp"], buyer_whatsapp_phone: phone })).toThrow(/WhatsApp/);
  }
  expect(() => bookingNotificationPayload({ ...form, notification_channels: ["both"] })).toThrow(/canales/);
  expect(() => bookingNotificationPayload({ ...form, notification_channels: ["email", "email"] })).toThrow(/canales/);
});
test("full channel list takes precedence over legacy preference", () => {
  expect(bookingNotificationLabel({ notification_channels: [], notification_channel: "email" })).toBe("Sin avisos");
  expect(bookingNotificationLabel({ notification_channels: ["email", "whatsapp"] })).toBe("Correo electrónico y WhatsApp");
  expect(bookingNotificationLabel({ notification_channel: "whatsapp" })).toBe("WhatsApp");
});
