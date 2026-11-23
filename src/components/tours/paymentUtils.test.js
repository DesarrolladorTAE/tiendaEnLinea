import { validatePayment, pendingOnlinePayment } from "./paymentUtils";
const booking = { status: "confirmed", total: "1000.00", paid_amount: "300.00", remaining_amount: "700.00" };
const payment = { payment_type: "final", payment_method: "cash", status: "confirmed", amount: "700.00", payment_date: "2026-11-06T12:30:00" };
test("settlement uses exactly the remaining amount, while a partial payment may be smaller", () => {
  expect(validatePayment(payment, booking)).toEqual({});
  expect(validatePayment({ ...payment, amount: "1000.00" }, booking).amount).toMatch(/supera/);
  expect(validatePayment({ ...payment, amount: "500.00" }, booking).amount).toMatch(/exactamente/);
  expect(validatePayment({ ...payment, payment_type: "partial", amount: "500.00" }, booking)).toEqual({});
});
test("cancelled booking cannot confirm a new charge but may record a refund", () => {
  expect(validatePayment(payment, { ...booking, status: "cancelled" }).status).toMatch(/cancelada/);
  expect(validatePayment({ ...payment, payment_type: "refund", amount: "100.00" }, { ...booking, status: "cancelled" })).toEqual({});
});
test("pending online orders must be reconciled instead of manually confirmed", () => {
  expect(pendingOnlinePayment({ status: "pending", payment_method: "online" })).toBe(true);
  expect(pendingOnlinePayment({ status: "confirmed", payment_method: "online" })).toBe(false);
  expect(pendingOnlinePayment({ status: "pending", payment_method: "transfer" })).toBe(false);
});
