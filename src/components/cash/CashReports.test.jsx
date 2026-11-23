import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { CashHistory, CashReport } from "./CashReports";

test("shows the POS sale states in Spanish in the cash report", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  const root = createRoot(host);
  const statuses = ["paid", "credit", "credit_paid", "cancelled", "partially_cancelled", "devuelta", "devuelta_parcial", "open"];
  try {
    await act(async () => root.render(
      <CashReport client={{}} path="/cash" report={{
        session: { id: 4 },
        sales: statuses.map((status, id) => ({ id, status })),
      }} />,
    ));
    expect([...host.querySelectorAll("tbody .MuiChip-label")].map((label) => label.textContent)).toEqual([
      "Venta pagada", "Venta a crédito pendiente", "Venta a crédito saldada", "Venta cancelada",
      "Cancelación parcial", "Venta devuelta", "Devolución parcial", "Venta pendiente",
    ]);
  } finally {
    act(() => root.unmount());
  }
});

test("requests one filtered API page at a time with a Monday-to-Monday range in Mexico City", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-11-19T19:00:00Z"));
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  const session = (id, date, has_difference) => ({ id, opened_at: date, closed_at: date, has_difference });
  const client = { get: jest.fn().mockResolvedValue({ data: { last_page: 2, data: [
    session(3, "2026-11-23T05:59:59Z", true),
    session(2, "2026-11-16T06:00:00Z", false),
  ] } }) };
  const rows = () => [...host.querySelectorAll("tbody th")].map((cell) => cell.textContent);
  const button = (label) => [...host.querySelectorAll("button")].find((item) => item.textContent === label);
  const range = { from: "2026-11-16T00:00:00-06:00", to: "2026-11-23T00:00:00-06:00" };
  const request = (index) => client.get.mock.calls[index][1].params;
  try {
    await act(async () => root.render(<CashHistory client={client} path="/cash" />));
    expect(rows()).toEqual(["#3", "#2"]);
    expect(host.querySelector(".MuiChip-colorError").textContent).toBe("Con diferencia");
    expect(host.querySelector(".MuiChip-colorSuccess").textContent).toBe("Sin diferencia");
    expect(client.get).toHaveBeenCalledTimes(1);
    expect(request(0)).toEqual({ ...range, page: 1 });
    expect(button("Siguiente").disabled).toBe(true);
    await act(async () => host.querySelector('input[type="checkbox"]').click());
    expect(request(1)).toEqual({ ...range, page: 1, has_difference: 1 });
    await act(async () => button("2").click());
    expect(request(2)).toEqual({ ...range, page: 2, has_difference: 1 });
    await act(async () => button("Anterior").click());
    expect(request(3)).toEqual({ from: "2026-11-09T00:00:00-06:00", to: range.from, page: 1, has_difference: 1 });
    expect(client.get).toHaveBeenCalledTimes(4);
  } finally {
    act(() => root.unmount());
    host.remove();
    jest.useRealTimers();
  }
});
