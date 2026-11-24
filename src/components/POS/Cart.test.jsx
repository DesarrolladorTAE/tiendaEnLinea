import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import client from "../../config/axiosClientPOS";
import Cart from "./Cart";

jest.mock("../../config/axiosClientPOS", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));
jest.mock("../../utils/alerts", () => ({ showError: jest.fn(), showSuccess: jest.fn() }));

test("registers a fully discounted product with no payment", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  client.get.mockResolvedValue({ data: [] });
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  const onCheckout = jest.fn().mockResolvedValue({ id: 1 });
  function Harness() {
    const [cart, setCart] = useState([{ id: 1, name: "Producto", price: 100, price_original: 100, quantity: 1 }]);
    return <Cart classic cart={cart} setCart={setCart} onCheckout={onCheckout} />;
  }
  const button = (label) => [...document.querySelectorAll("button")].find((item) => item.textContent === label);

  try {
    await act(async () => root.render(<Harness />));
    act(() => host.querySelector('[aria-label="Editar descuento"]').click());
    const dialog = document.querySelector('[role="dialog"]');
    const [discount, price] = dialog.querySelectorAll('input[type="number"]');
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(price, "0");
      price.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(discount.value).toBe("100");
    act(() => button("Aplicar cambios").click());
    expect(host.textContent).not.toContain("Método(s) de pago");
    await act(async () => button("Registrar venta sin pago").click());
    expect(onCheckout).toHaveBeenCalledWith(expect.objectContaining({
      total_amount: "0.000000",
      payments: [],
      items: [expect.objectContaining({
        unit_price: "0.000000",
        original_price: "100.000000",
        discount_percent: "100.00",
      })],
    }), expect.anything());
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
