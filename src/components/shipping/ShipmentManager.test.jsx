import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import ShipmentManager from "./ShipmentManager";

let root, host, client, shipment;
const button = label => [...document.querySelectorAll("button")].find(item => item.textContent === label);
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  shipment = { id: 8, sale_id: 20, shipment_code: "ENV-ABC123DEF456", status: "pending", events: [], notifications: [] };
  client = {
    get: jest.fn(async path => ({ data: { data: path === "/shipping/config" ? { settings: { enabled: false, allow_pos: false } } : path === "/shipments" ? { data: [shipment], current_page: 1, last_page: 1 } : shipment } })),
    post: jest.fn(),
  };
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
async function render() { await act(async () => root.render(<ShipmentManager open client={client} saleId={20} onClose={() => {}} />)); }
const submit = async () => act(async () => Simulate.submit(document.querySelector("form")));

test("operates existing shipments when registration is disabled and reuses the key after a network failure", async () => {
  await render();
  client.post.mockRejectedValueOnce(new Error("Sin conexión")).mockResolvedValueOnce({ data: { data: shipment } });
  await submit();
  expect(document.body.textContent).toContain("Sin conexión");
  await submit();
  expect(client.post).toHaveBeenCalledTimes(2);
  expect(client.post.mock.calls[0]).toEqual(client.post.mock.calls[1]);
  expect(client.post.mock.calls[0][1]).toMatchObject({ status: "pending", idempotency_key: expect.any(String) });
  expect(document.body.textContent).toContain("Seguimiento actualizado");
});

test("a changed action after failure receives a different idempotency key", async () => {
  await render();
  client.post.mockRejectedValue(new Error("Sin conexión"));
  await submit();
  const input = document.getElementById([...document.querySelectorAll("label")].find(item => item.textContent === "Título").htmlFor);
  await act(async () => Simulate.change(input, { target: { value: "Nueva novedad" } }));
  await submit();
  expect(client.post.mock.calls[0][1].idempotency_key).not.toBe(client.post.mock.calls[1][1].idempotency_key);
});

test("manual reload after a failed response preserves the pending request for retry", async () => {
  await render();
  client.post.mockRejectedValue(new Error("Sin conexión"));
  await submit();
  await act(async () => Simulate.click(button("Recargar")));
  await submit();
  expect(client.post.mock.calls[0]).toEqual(client.post.mock.calls[1]);
});

test("reloads detail on conflict and blocks updates when the server reports closure", async () => {
  await render();
  shipment = { ...shipment, status: "delivered" };
  client.post.mockRejectedValue({ response: { status: 409, data: { message: "Envío cerrado" } } });
  await submit();
  expect(document.querySelector("form")).toBeNull();
  expect(client.get).toHaveBeenLastCalledWith("/shipments/8");
  expect(document.body.textContent).toContain("Envío cerrado");
});

test("hides unauthorized updates and never renders unsafe tracking links", async () => {
  shipment.public_url = "javascript:alert(1)";
  shipment.carrier_tracking_url = "data:text/html,bad";
  await render();
  expect(document.querySelector("a")).toBeNull();
  client.post.mockRejectedValue({ response: { status: 403 } });
  await submit();
  expect(button("Guardar actualización")).toBeUndefined();
});

test("does not post shipment updates after the linked sale has been cancelled", async () => {
  const validateSale = jest.fn().mockResolvedValue(false);
  await act(async () => root.render(<ShipmentManager open client={client} saleId={20} validateSale={validateSale} onClose={() => {}} />));
  await submit();
  expect(validateSale).toHaveBeenCalled();
  expect(client.post).not.toHaveBeenCalled();
});
