import React, { act } from "react";
import { createRoot } from "react-dom/client";
import client from "../../config/axiosClient";
import ProductBatchesDialog from "./ProductBatchesDialog";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), patch: jest.fn() } }));

test("loads batch settings and sends the three configuration fields to the Store route", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const product = { id: 101, name: "Refacción", stock: 0 };
  const settings = { batch_tracking_enabled: false, expiration_required: false, stock_rotation_policy: "fifo" };
  client.get.mockImplementation(async url => {
    if (url === "/admin/products/101/batches") return { data: { settings, data: [] } };
    if (url === "/admin/productos/101") return { data: { data: product } };
    if (url === "/branches/10/warehouses") return { data: { data: [] } };
    throw new Error(`Ruta inesperada ${url}`);
  });
  client.patch.mockResolvedValue({ data: { data: { ...settings, batch_tracking_enabled: true } } });
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  const onChanged = jest.fn();
  try {
    await act(async () => root.render(<ProductBatchesDialog product={product} branchId={10} onClose={jest.fn()} onChanged={onChanged} />));
    const select = document.querySelector('[role="combobox"]');
    act(() => select.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })));
    const option = [...document.querySelectorAll('[role="option"]')].find(item => item.textContent === "Configuración");
    act(() => option.click());
    act(() => document.querySelector('input[type="checkbox"]').click());
    await act(async () => document.querySelector('button[form="product-batches-form"]').click());
    expect(client.patch).toHaveBeenCalledWith("/admin/products/101/batch-settings", {
      batch_tracking_enabled: true, expiration_required: false, stock_rotation_policy: "fifo",
    });
    expect(onChanged).toHaveBeenCalledTimes(1);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
