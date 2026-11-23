import React, { act } from "react";
import { createRoot } from "react-dom/client";
import BookingPayments from "./BookingPayments";
import { getBookingPayments } from "../../services/tours/tourService";
jest.mock("../../services/tours/tourService", () => ({ getBookingPayments: jest.fn() }));
jest.mock("./PaymentDialog", () => () => null);
jest.mock("../../utils/alerts", () => ({ showConfirm: jest.fn() }));

test("pending evidence on another page blocks a new collection", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  getBookingPayments.mockImplementation(async (_, __, page) => ({ data: { data: { current_page: page, last_page: 2, data: [{ id: page, status: page === 2 ? "pending" : "confirmed", payment_method: "transfer", amount: "100.00", payment_type: "partial" }] } } }));
  const host = document.createElement("div"); document.body.appendChild(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<BookingPayments context={{ mode: "pos", branchId: 2 }} booking={{ id: 10, status: "confirmed", paid_amount: "300.00", remaining_amount: "700.00" }} onBookingUpdated={() => {}} onSessionExpired={() => {}} />));
    expect(getBookingPayments).toHaveBeenCalledTimes(2);
    expect([...host.querySelectorAll("button")].find(button => button.textContent === "Registrar pago").disabled).toBe(true);
    expect(host.textContent).toContain("Revisa los movimientos pendientes");
  } finally { act(() => root.unmount()); host.remove(); }
});
