import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import PaymentDialog from "./PaymentDialog";
import { createBookingPayment } from "../../services/tours/tourService";
jest.mock("../../services/tours/tourService", () => ({ createBookingPayment: jest.fn(), updateBookingPayment: jest.fn() }));
jest.mock("../../utils/alerts", () => ({ showConfirm: jest.fn() }));

test("uncertain payment response blocks another POST until the dialog is closed and movements are checked", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  createBookingPayment.mockRejectedValue(new Error("Network timeout"));
  const host = document.createElement("div"); document.body.appendChild(host);
  const root = createRoot(host), onSaved = jest.fn();
  try {
    await act(async () => root.render(<PaymentDialog context={{ mode: "pos", branchId: 2 }} booking={{ id: 10, status: "confirmed", paid_amount: "300.00", remaining_amount: "700.00" }} onClose={() => {}} onSaved={onSaved} onSessionExpired={() => {}} />));
    act(() => Simulate.change(document.querySelector('input[name="amount"]'), { target: { value: "100.00" } }));
    const form = document.querySelector('[role="dialog"] form') || document.querySelector('form[role="dialog"]');
    await act(async () => Simulate.submit(form));
    expect(document.body.textContent).toContain("El resultado es incierto");
    expect(document.querySelector('button[type="submit"]').disabled).toBe(true);
    await act(async () => Simulate.submit(form));
    expect(createBookingPayment).toHaveBeenCalledTimes(1);
    expect(onSaved).not.toHaveBeenCalled();
  } finally { act(() => root.unmount()); host.remove(); }
});
