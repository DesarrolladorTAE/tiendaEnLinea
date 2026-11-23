import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import TourSalesHistory from "./TourSalesHistory";
import { getTourHistory, getTourHistoryReport } from "../../services/tours/tourService";

jest.mock("../../services/tours/tourService", () => ({ getTourHistory: jest.fn(), getTourHistoryReport: jest.fn() }));
jest.mock("../../pages/tours/TourBookingDetailPage", () => () => <div>Detalle</div>);

test("shows folios and partial payments first, exports the applied query and retains passenger register", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  getTourHistoryReport.mockResolvedValue("<table><tr><td>Ana</td><td>ANTICIPO INCOMPLETO</td></tr></table>");
  getTourHistory.mockResolvedValue({ data: { data: [{ id: 10, booking_code: "RAI-10", buyer_name: "Ana", departure_id: 45, total: 1520, paid_amount: 760, remaining_amount: 760, status: "confirmed", payment_status: "partial" }] } });
  const host = document.createElement("div"); document.body.appendChild(host); const root = createRoot(host);
  const button = text => [...host.querySelectorAll('button, [role="button"]')].find(item => item.textContent === text);
  try {
    await act(async () => root.render(<MemoryRouter><TourSalesHistory mode="pos" branchId={2} serviceId={9} departureId={45} /></MemoryRouter>));
    expect(host.textContent).toContain("RAI-10");
    expect(host.textContent).toContain("Con abonos");
    expect(host.querySelector("table")).not.toBeNull();
    expect(button("Descargar historial Excel")).toBeUndefined();
    expect(button("Filtros").getAttribute("aria-expanded")).toBe("false");
    await act(async () => Simulate.click(button("Con abonos y saldo")));
    expect(getTourHistory).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ payment_status: "partial" }));
    expect(getTourHistory.mock.calls.at(-1)[1].status).toBeUndefined();
    await act(async () => Simulate.click(button("Registro de pasajeros")));
    const frame = host.querySelector("iframe");
    expect(frame.getAttribute("srcdoc")).toContain("ANTICIPO INCOMPLETO");
    expect(frame.getAttribute("sandbox")).toBe("");

    act(() => Simulate.change(host.querySelector("input"), { target: { value: "Ana" } }));
    await act(async () => Simulate.submit(host.querySelector("form")));
    await act(async () => Simulate.click(button("Descargar historial Excel")));
    expect(getTourHistoryReport).toHaveBeenLastCalledWith({ mode: "pos", branchId: 2, serviceId: 9 }, expect.objectContaining({ search: "Ana", departure_id: 45, pos_location_id: undefined }), "xlsx");
    await act(async () => Simulate.click(button("Reservas")));
    expect(host.textContent).toContain("RAI-10");
    expect(button("Abrir reserva")).toBeDefined();
    expect(getTourHistory).toHaveBeenCalledWith(expect.objectContaining({ mode: "pos", branchId: 2, serviceId: 9 }), expect.objectContaining({ search: "Ana", page: 1 }));
  } finally { act(() => root.unmount()); host.remove(); }
});
