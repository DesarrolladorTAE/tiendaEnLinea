import axiosClient from "../../config/axiosClient";
import axiosClientPOS from "../../config/axiosClientPOS";
import { getTourCollections, reconcileBookingPayment, updateBookingPayment } from "./tourService";

jest.mock("../../config/axiosClient", () => ({ defaults: { baseURL: "https://example.test/api/" }, get: jest.fn(), post: jest.fn(), put: jest.fn() }));
jest.mock("../../config/axiosClientPOS", () => ({ defaults: { baseURL: "https://example.test/api/" }, get: jest.fn(), post: jest.fn(), put: jest.fn() }));
beforeEach(() => {
  jest.clearAllMocks();
  for (const client of [axiosClient, axiosClientPOS]) for (const method of ["get", "post", "put"]) client[method].mockResolvedValue({ data: { success: true, data: {} } });
});
test.each(["store", "pos"])("collection report uses the %s session and filters payments rather than booking origin", async mode => {
  const client = mode === "store" ? axiosClient : axiosClientPOS;
  await getTourCollections({ mode, branchId: 2 }, { date_from: "2026-11-06", pos_location_id: 8, status: "pending", per_page: 20, page: 2 });
  expect(client.get).toHaveBeenCalledWith("/branches/2/tours/payments", { params: { date_from: "2026-11-06", pos_location_id: 8, per_page: 20, page: 2 }, signal: undefined });
});
test("PayPal reconciliation and proof approval preserve the existing payment", async () => {
  const context = { mode: "pos", branchId: 2 };
  await reconcileBookingPayment(context, 10, 11);
  expect(axiosClientPOS.post).toHaveBeenCalledWith("/branches/2/bookings/10/payments/11/reconcile", {});
  await updateBookingPayment({ mode: "store", branchId: 2 }, 10, 11, { status: "confirmed", amount: "300.00", pos_location_id: 8 });
  expect(axiosClient.put).toHaveBeenCalledWith("/branches/2/bookings/10/payments/11", { status: "confirmed", amount: "300.00", pos_location_id: 8 });
});
test("an unresolved reconciliation remains an error rather than a successful payment", async () => {
  axiosClientPOS.post.mockResolvedValue({ data: { success: false, message: "Estado incierto" } });
  await expect(reconcileBookingPayment({ mode: "pos", branchId: 2 }, 10, 11)).rejects.toThrow("Estado incierto");
});
