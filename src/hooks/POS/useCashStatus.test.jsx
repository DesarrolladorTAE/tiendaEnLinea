import React, { act } from "react";
import { createRoot } from "react-dom/client";
import client from "../../config/axiosClientPOS";
import useCashStatus from "./useCashStatus";
import { saveAs } from "file-saver";
import { cashBusinessDate } from "../../utils/cashControl";

jest.mock("../../config/axiosClientPOS", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
jest.mock("file-saver", () => ({ saveAs: jest.fn() }));

const optional = {
  cash_control_enabled: true,
  opening_amount_required: false,
  session: null,
  can_sell: false,
};
let root, host, cash;

function Harness() {
  cash = useCashStatus(7);
  return null;
}

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.resetAllMocks();
  host = document.createElement("div");
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
});

async function mount(status) {
  client.get.mockResolvedValue({ data: status });
  await act(async () => root.render(<Harness />));
}

test("allows checkout with cash control disabled and leaves the box closed", async () => {
  await mount({ ...optional, cash_control_enabled: false });
  await act(async () => expect(await cash.verifyCheckout()).toBeNull());
  expect(cash.canSell).toBe(true);
  expect(cash.canOpenWithoutPrompt).toBe(false);
  expect(client.post).not.toHaveBeenCalled();
  expect(saveAs).not.toHaveBeenCalled();
});

test("opens with zero cash at checkout only, then verifies sales permission", async () => {
  await mount(optional);
  expect(cash.canOpenWithoutPrompt).toBe(true);
  expect(client.post).not.toHaveBeenCalled();
  client.get
    .mockResolvedValueOnce({ data: optional })
    .mockResolvedValueOnce({ data: new Blob(["pdf"]) })
    .mockResolvedValueOnce({ data: new Blob(["xlsx"]) })
    .mockResolvedValueOnce({ data: { ...optional, session: { id: 42 }, can_sell: true } });
  client.post.mockResolvedValue({ data: { session: { id: 42 } } });
  await act(async () => expect(await cash.verifyCheckout()).toBeNull());
  expect(client.post).toHaveBeenCalledWith("/pos/7/cash/open", {}, expect.anything());
  expect(cash.canSell).toBe(true);
  for (const format of ["pdf", "xlsx"]) {
    expect(client.get).toHaveBeenCalledWith(`/pos/7/cash/history/42/export/${format}`, {
      responseType: "blob", params: { phase: "opening" },
    });
    expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), `inventario-inicial-42.${format}`);
  }
});

test("downloads both formats when the operator opens with an initial amount and tracks failed formats", async () => {
  await mount({ ...optional, opening_amount_required: true });
  client.post.mockResolvedValue({ data: { session: { id: 42 } } });
  client.get.mockResolvedValueOnce({ data: new Blob(["pdf"]) }).mockRejectedValueOnce(new Error("Export unavailable"));
  await act(async () => { await cash.openSession({ opening_amount: 500 }); });
  expect(client.post).toHaveBeenCalledWith("/pos/7/cash/open", { opening_amount: 500 }, expect.anything());
  expect(saveAs).toHaveBeenCalledTimes(1);
  expect(cash.downloads.failed).toEqual(["xlsx"]);
});

test("does not attempt automatic opening when the store requires an initial amount", async () => {
  await mount({ ...optional, opening_amount_required: true });
  await act(async () => expect(await cash.verifyCheckout()).toBe("Abre la caja para cobrar."));
  expect(cash.canOpenWithoutPrompt).toBe(false);
  expect(client.post).not.toHaveBeenCalled();
});

test("keeps the sale blocked when the API rejects the opening after a cut", async () => {
  await mount(optional);
  client.post.mockRejectedValue({
    response: { status: 422, data: { errors: { cash_session: ["La caja ya fue cortada hoy."] } } },
  });
  await act(async () => expect(await cash.verifyCheckout()).toBe("La caja ya fue cortada hoy."));
  expect(cash.canSell).toBe(false);
});

test("does not try to open the terminal again after recording today's cut", async () => {
  await mount(optional);
  act(() => cash.recordCut({ business_date: cashBusinessDate() }));
  expect(cash.cutToday).toBe(true);
  expect(cash.canOpenWithoutPrompt).toBe(false);
  await act(async () => expect(await cash.verifyCheckout()).toContain("ya fue cortada hoy"));
  expect(client.post).not.toHaveBeenCalled();
});
