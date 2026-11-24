import React, { act } from "react";
import { createRoot } from "react-dom/client";
import client from "../../config/axiosClient";
import AdminCashDialog from "./AdminCashDialog";

jest.mock("../../config/axiosClient", () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn() },
}));

test("loads the saved report warehouses and saves only additional IDs, including an empty selection", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  client.get.mockResolvedValue({
    data: {
      report_warehouses: [
        { id: 10, name: "Mostrador", assigned_to_pos: true, included_in_cash_report: true },
        { id: 11, name: "Bodega", assigned_to_pos: false, included_in_cash_report: true },
        { id: 12, name: "Anexo", assigned_to_pos: false, included_in_cash_report: false },
      ],
    },
  });
  client.put.mockResolvedValue({});

  try {
    await act(async () => root.render(<AdminCashDialog pos={{ id: 7, name: "Terminal" }} onClose={jest.fn()} />));
    const save = [...document.querySelectorAll("button")].find((button) => button.textContent === "Guardar almacenes del reporte");
    const [assigned, saved, extra] = save.form.querySelectorAll('input[type="checkbox"]');
    expect(assigned.checked).toBe(true);
    expect(assigned.disabled).toBe(true);
    expect(saved.checked).toBe(true);
    expect(extra.checked).toBe(false);

    act(() => saved.click());
    await act(async () => save.click());
    expect(client.put).toHaveBeenLastCalledWith("/pos/7/cash/report-warehouses", { warehouse_ids: [] });

    act(() => extra.click());
    await act(async () => save.click());
    expect(client.put).toHaveBeenLastCalledWith("/pos/7/cash/report-warehouses", { warehouse_ids: [11, 12] });
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
