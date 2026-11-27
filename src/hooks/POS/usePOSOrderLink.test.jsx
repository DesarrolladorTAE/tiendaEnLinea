import React, { act } from "react";
import { createRoot } from "react-dom/client";
import client from "../../config/axiosClientPOS";
import usePOSOrderLink from "./usePOSOrderLink";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: {} }));
jest.mock("../../config/axiosClientPOS", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
const modules = ["service_sales"];
let host, root, flow;
function Harness({ id, order }) {
  flow = usePOSOrderLink(true, id, null, modules, order);
  return null;
}
const mount = (id, order) => act(async () => root.render(<Harness id={id} order={order} />));
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  sessionStorage.clear();
  jest.resetAllMocks();
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); sessionStorage.clear(); });

test("espera /pos/me y deriva la sucursal de la respuesta autenticada del catálogo", async () => {
  let finish;
  client.post.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  client.get.mockResolvedValueOnce({ data: { pos: { id: 6 }, branch_id: 12, store_id: 3 } })
    .mockResolvedValueOnce({ data: { data: { id: 77, branch_id: 12, store_id: 3 } } });
  await mount(6, 77);
  expect(client.get).not.toHaveBeenCalled();
  await act(async () => finish({ data: { id: 6, store_id: 3, abilities: ["sell-only"] } }));
  expect(client.get.mock.calls.map(([url]) => url)).toEqual(["/my-products-by-pos1", "/branches/12/service-orders/77"]);
  expect(flow.order.data.id).toBe(77);
});

test("una nueva terminal descarta el vínculo anterior y cancela su revalidación", async () => {
  const ref = { store: 3, branch: 12, terminal: 6, order: 77, sale: 901 };
  sessionStorage.setItem("pos-order-link:3:12:6", JSON.stringify(ref));
  client.post.mockResolvedValueOnce({ data: { id: 6, store_id: 3, abilities: ["sell-only"] } })
    .mockResolvedValueOnce({ data: { id: 9, store_id: 3, abilities: ["sell-only"] } });
  let delayed;
  client.get.mockImplementation((url, config) => {
    if (url.includes("service-orders")) return new Promise((resolve) => { delayed = { signal: config.signal, resolve }; });
    return Promise.resolve({ data: { pos: { id: config.params.pos_location_id }, branch_id: 12, store_id: 3 } });
  });
  await mount(6);
  expect(flow.link.reference.sale).toBe(901);
  await act(async () => flow.retry());
  expect(flow.link.state).toBe("checking");
  await mount(9);
  expect(flow.link).toBeNull();
  expect(delayed.signal.aborted).toBe(true);
  await act(async () => delayed.resolve({ data: { data: { id: 77, branch_id: 12, store_id: 3, sale_id: 901 } } }));
  expect(flow.link).toBeNull();
  expect(JSON.parse(sessionStorage.getItem("pos-order-link:3:12:6"))).toEqual(ref);
  expect(client.post.mock.calls.every(([url]) => url === "/pos/me")).toBe(true);
});

