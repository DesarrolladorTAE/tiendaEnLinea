import React, { act } from "react";
import { createRoot } from "react-dom/client";
import TourCollectionsReport from "./TourCollectionsReport";
import { getTourCollections } from "../../services/tours/tourService";
jest.mock("../../services/tours/tourService", () => ({ getTourCollections: jest.fn() }));
jest.mock("../../config/axiosClient", () => ({ get: jest.fn() }));

test("POS collections use backend summary across all pages rather than summing visible payments", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  getTourCollections.mockResolvedValue({ data: { data: { summary: { received: "1520.00", refunded: "20.00", net: "1500.00" }, payments: { last_page: 2, total: 21, data: [{ id: 1, booking_id: 8, amount: "100.00", payment_type: "partial" }] } } } });
  const host = document.createElement("div"); document.body.appendChild(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<TourCollectionsReport mode="pos" branchId={2} />));
    expect(getTourCollections).toHaveBeenCalledWith(expect.objectContaining({ mode: "pos", branchId: 2 }), expect.objectContaining({ page: 1, per_page: 20 }));
    expect(host.textContent).toContain("1,520.00");
    expect(host.textContent).toContain("1,500.00");
    expect(host.textContent).toContain("Esta sesión consulta únicamente sus propios cobros");
    expect(host.querySelectorAll('[role="combobox"]')).toHaveLength(0);
  } finally { act(() => root.unmount()); host.remove(); }
});
