import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import BookingTickets from "./BookingTickets";
import { getBookingTickets } from "../../services/tours/tourService";

jest.mock("../../services/tours/tourService", () => ({ getBookingTickets: jest.fn() }));
const booking = { id: 10, booking_code: "RAI-10", status: "confirmed", payment_status: "partial", remaining_amount: "760", tickets_pdf_url: "https://example.test/public/bookings/private-token/tickets.pdf" };
let host, root;
const button = text => [...document.querySelectorAll("button")].find(item => item.textContent === text);
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true; jest.clearAllMocks();
  URL.createObjectURL = jest.fn(() => "blob:tickets"); URL.revokeObjectURL = jest.fn();
  getBookingTickets.mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" }));
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

test("confirmed partial booking previews authenticated PDF and releases it on close", async () => {
  await act(async () => root.render(<BookingTickets context={{ mode: "pos", branchId: 2 }} booking={booking} />));
  expect(host.textContent).toContain("saldo pendiente");
  await act(async () => Simulate.click(button("Ver boletos")));
  expect(getBookingTickets).toHaveBeenCalledWith(expect.objectContaining({ mode: "pos", branchId: 2, signal: expect.anything() }), 10);
  expect(document.querySelector('iframe[title="Boletos PDF de la reserva"]').getAttribute("src")).toBe("blob:tickets");
  act(() => Simulate.click(button("Cerrar")));
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:tickets");
});

test.each([
  { status: "pending", tickets_pdf_url: null }, { status: "cancelled" }, { payment_status: "refunded" }, { tickets_pdf_url: null },
])("unavailable tickets cannot be requested: %j", async patch => {
  await act(async () => root.render(<BookingTickets context={{ mode: "pos", branchId: 2 }} booking={{ ...booking, ...patch }} />));
  expect(button("Ver boletos").disabled).toBe(true);
  expect(button("Descargar boletos PDF").disabled).toBe(true);
  expect(getBookingTickets).not.toHaveBeenCalled();
});

test("409 is displayed without leaving a stale PDF preview", async () => {
  getBookingTickets.mockRejectedValue({ response: { status: 409 } });
  await act(async () => root.render(<BookingTickets context={{ mode: "store", branchId: 2 }} booking={booking} />));
  await act(async () => Simulate.click(button("Ver boletos")));
  expect(host.textContent).toContain("ya no están vigentes");
  expect(document.querySelector("iframe")).toBeNull();
});

test("download uses a PDF file and releases the object URL", async () => {
  jest.useFakeTimers();
  const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () { expect(this.download).toBe("reserva-10-boletos.pdf"); });
  try {
    await act(async () => root.render(<BookingTickets context={{ mode: "pos", branchId: 2 }} booking={booking} />));
    await act(async () => Simulate.click(button("Descargar boletos PDF")));
    expect(click).toHaveBeenCalledTimes(1);
    act(() => jest.runAllTimers());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:tickets");
  } finally { click.mockRestore(); jest.useRealTimers(); }
});
