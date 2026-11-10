import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import SaleShippingButton from "./SaleShippingButton";

jest.mock("./ShipmentManager", () => () => <div>Historial de envío</div>);
let root, host;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

test.each([{ status: "cancelled" }, { status: "paid", cancelled_at: "2026-11-10" }])("hides all shipping access for a cancelled sale", async sale => {
  await act(async () => root.render(<SaleShippingButton sale={{ id: 20, ...sale }} client={{}} />));
  expect(host.textContent).toBe("");
});
test("hides shipping for a rejected web order", async () => {
  await act(async () => root.render(<SaleShippingButton sale={{ id: 20, status: "paid" }} orderStatus="rejected" client={{}} />));
  expect(host.querySelector("button")).toBeNull();
});
test("refreshes the order before opening and hides history if the sale was cancelled elsewhere", async () => {
  const client = { get: jest.fn().mockResolvedValue({ data: { data: { sale: { id: 20, status: "cancelled" } } } }) };
  await act(async () => root.render(<SaleShippingButton sale={{ id: 20, status: "paid" }} orderId={12} client={client} />));
  await act(async () => Simulate.click(host.querySelector("button")));
  expect(client.get).toHaveBeenCalledWith("/admin/offline-payments/12");
  expect(host.textContent).toBe("");
});
test("opens shipping next to an active web order", async () => {
  const client = { get: jest.fn().mockResolvedValue({ data: { data: { sale: { id: 20, status: "paid" } } } }) };
  await act(async () => root.render(<SaleShippingButton sale={{ id: 20, status: "paid" }} orderId={12} client={client} />));
  await act(async () => Simulate.click(host.querySelector("button")));
  expect(host.textContent).toContain("Historial de envío");
});
