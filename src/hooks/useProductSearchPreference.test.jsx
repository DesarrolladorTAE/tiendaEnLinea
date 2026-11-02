import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import useProductSearchPreference from "./useProductSearchPreference";

let root, host;
function Search({ storeId }) {
  const [field, select] = useProductSearchPreference(storeId);
  return <select value={field} onChange={e => select(e.target.value)}>{["all", "name", "sku", "oe_number"].map(value => <option key={value}>{value}</option>)}</select>;
}
const render = storeId => act(() => root.render(<Search storeId={storeId} />));
const select = value => act(() => Simulate.change(host.querySelector("select"), { target: { value } }));
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true; localStorage.clear();
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); jest.restoreAllMocks(); });

test("remembers each store separately and restores after remount", () => {
  render(329); select("oe_number");
  render(330); expect(host.querySelector("select").value).toBe("all"); select("sku");
  render(329); expect(host.querySelector("select").value).toBe("oe_number");
  act(() => root.unmount()); root = createRoot(host); render(330);
  expect(host.querySelector("select").value).toBe("sku");
  expect(localStorage.length).toBe(2);
});

test("ignores invalid stored values and does not overwrite preferences before store loads", () => {
  localStorage.setItem("products:search-field:v1:329", "sku");
  localStorage.setItem("products:search-field:v1:330", "invalid");
  render(null); select("name"); render(329);
  expect(host.querySelector("select").value).toBe("sku");
  render(330); expect(host.querySelector("select").value).toBe("all");
});

test("keeps searching if browser storage is blocked", () => {
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  render(329); select("sku"); expect(host.querySelector("select").value).toBe("sku");
});
