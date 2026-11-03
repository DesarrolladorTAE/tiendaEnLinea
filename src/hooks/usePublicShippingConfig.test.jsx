import React, { act } from "react";
import { createRoot } from "react-dom/client";
import usePublicShippingConfig from "./usePublicShippingConfig";
import { getPublicShippingConfig } from "../services/public/shippingService";

jest.mock("../services/public/shippingService", () => ({ getPublicShippingConfig: jest.fn() }));
let root, host, latest;
const config = (branch_id, enabled = true) => ({ data: { data: { enabled, branch_id, store_id: 16, requirements: { professional_plan: true, payment_gateway: true, branch_pos: true }, methods: [{ id: branch_id }], delivery_points: [] } } });
function Harness(props) { latest = usePublicShippingConfig(props); return null; }
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); jest.useRealTimers(); });

test("does not load public shipping until checkout opens and hides disabled shipping", async () => {
  getPublicShippingConfig.mockResolvedValue(config(2, false));
  await act(async () => root.render(<Harness open={false} branchId={2} storeId={16} />));
  expect(getPublicShippingConfig).not.toHaveBeenCalled();
  await act(async () => root.render(<Harness open branchId={2} storeId={16} />));
  expect(latest.config.enabled).toBe(false);
  expect(latest.config.methods).toEqual([]);
});

test("a late response from the previous branch cannot replace current delivery options", async () => {
  let resolveOld;
  getPublicShippingConfig.mockImplementation((id) => id === 2 ? new Promise((resolve) => { resolveOld = resolve; }) : Promise.resolve(config(3)));
  await act(async () => root.render(<Harness open branchId={2} storeId={16} />));
  const oldSignal = getPublicShippingConfig.mock.calls[0][1];
  await act(async () => root.render(<Harness open branchId={3} storeId={16} />));
  expect(oldSignal.aborted).toBe(true);
  expect(latest.config.branch_id).toBe(3);
  await act(async () => resolveOld(config(2)));
  expect(latest.config.branch_id).toBe(3);
});

test("refresh picks up revoked eligibility without retrying a purchase", async () => {
  getPublicShippingConfig.mockResolvedValueOnce(config(2)).mockResolvedValueOnce(config(2, false));
  await act(async () => root.render(<Harness open branchId={2} storeId={16} />));
  expect(latest.config.enabled).toBe(true);
  await act(async () => latest.refresh());
  expect(latest.config.enabled).toBe(false);
});

test("429 prevents early refresh and allows retry after Retry-After", async () => {
  jest.useFakeTimers();
  getPublicShippingConfig.mockRejectedValueOnce({ response: { status: 429, headers: { "retry-after": "30" } } }).mockResolvedValue(config(2));
  await act(async () => root.render(<Harness open branchId={2} storeId={16} />));
  expect(latest.waiting).toBe(true);
  await act(async () => latest.refresh());
  expect(getPublicShippingConfig).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(30001));
  expect(latest.waiting).toBe(false);
  await act(async () => latest.refresh());
  expect(getPublicShippingConfig).toHaveBeenCalledTimes(2);
  expect(latest.config.enabled).toBe(true);
});
