import React, { act } from "react";
import { createRoot } from "react-dom/client";
import client from "../../config/axiosClient";
import BatchExpirationsDialog from "./BatchExpirationsDialog";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn() } }));

test("renders unassigned batches returned with the selected warehouse", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  client.get.mockImplementation(async (url, { params } = {}) => {
    if (url === "/branches/10/warehouses") return { data: { data: [{ id: 8, name: "Almacén Norte" }] } };
    return { data: { data: params?.warehouse_id === 8 ? [
      { batch_id: 1, name: "Producto asignado", warehouse_id: 8 },
      { batch_id: 2, name: "Producto sin asignación", warehouse_id: null },
    ] : [], last_page: 1 } };
  });
  try {
    await act(async () => root.render(<BatchExpirationsDialog branchId={10} onClose={jest.fn()} />));
    act(() => document.querySelector('[role="combobox"]').dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
    await act(async () => [...document.querySelectorAll('[role="option"]')].find(option => option.textContent === "Almacén Norte").click());
    expect(client.get).toHaveBeenLastCalledWith("/batch-expirations", expect.objectContaining({
      params: { branch_id: 10, days: 30, page: 1, per_page: 20, warehouse_id: 8 },
    }));
    const report = document.querySelector('[role="dialog"]');
    expect(report.textContent).toContain("Producto asignado");
    expect(report.textContent).toContain("Producto sin asignación");
    expect(report.textContent).toContain("Sin almacén asignado");
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
