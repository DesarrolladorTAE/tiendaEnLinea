import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import TourBookingDetailPage from "./TourBookingDetailPage";

jest.mock("../../hooks/tours/useBookingPage", () => ({
  useBookingScope: () => ({ valid: true, context: { mode: "pos", branchId: 2 }, params: {}, navigate: jest.fn() }),
  useBookingRequest: () => ({ booking: { id: 10, booking_code: "RAI-10", status: "confirmed" }, departure: { departure_date: "2026-12-10" }, loading: false }),
}));
jest.mock("../../components/tours/TourModuleLayout", () => ({ title, children }) => <main><h1>{title}</h1>{children}</main>);
jest.mock("../../components/tours/BookingSummary", () => () => <div>Resumen de reserva</div>);
jest.mock("../../components/tours/BookingPayments", () => ({ showSummary }) => <div>Movimientos de pago{showSummary === false && " sin resumen duplicado"}</div>);
jest.mock("../../components/tours/BookingPassengers", () => () => <div>Lista de pasajeros</div>);
jest.mock("../../components/tours/BookingFormDialog", () => () => null);
jest.mock("../../services/tours/tourService", () => ({ cancelBooking: jest.fn() }));
jest.mock("../../utils/alerts", () => ({ showConfirm: jest.fn() }));

test("booking opens with payments and keeps passengers in a separate tab", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div"); document.body.appendChild(host); const root = createRoot(host);
  try {
    await act(async () => root.render(<TourBookingDetailPage posBookingId={10} onBack={() => {}} />));
    expect(host.querySelector("h1").textContent).toBe("RAI-10");
    expect(host.textContent).toContain("Movimientos de pago sin resumen duplicado");
    expect(host.textContent).not.toContain("Lista de pasajeros");
    act(() => Simulate.click([...host.querySelectorAll('[role="tab"]')].find(tab => tab.textContent === "Pasajeros y abordaje")));
    expect(host.textContent).toContain("Lista de pasajeros");
    expect(host.textContent).not.toContain("Movimientos de pago");
  } finally { act(() => root.unmount()); host.remove(); }
});
