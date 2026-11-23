import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import POSWrapper from "./POSWrapper";
import posClient from "../config/axiosClientPOS";

jest.mock("../config/axiosClientPOS", () => ({ __esModule: true, default: { post: jest.fn() } }));
jest.mock("../config/axiosClient", () => ({ __esModule: true, default: { post: jest.fn() } }));
jest.mock("../components/POSLoginModal", () => ({ onLoginSuccess }) => <button onClick={() => onLoginSuccess({ id: 7, name: "Caja", interface_design: "clasico" })}>Ingresar</button>);
jest.mock("../components/POSDashboard", () => ({ interfaceDesign, onRefreshInterface }) => <button onClick={onRefreshInterface}>{interfaceDesign}</button>);
let host, root;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; localStorage.clear(); posClient.post.mockReset(); host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); localStorage.clear(); });

test("restores the preference from the POS session and refreshes it", async () => {
  localStorage.setItem("POS_TOKEN", "token");
  posClient.post.mockResolvedValueOnce({ data: { id: 7, name: "Caja", abilities: ["sell-only"], interface_design: "clasico" } }).mockResolvedValueOnce({ data: { id: 7, interface_design: "actual" } });
  await act(async () => root.render(<MemoryRouter><POSWrapper /></MemoryRouter>));
  expect(host.textContent).toContain("clasico");
  await act(async () => host.querySelector("button").click());
  expect(host.textContent).toContain("actual");
  expect(posClient.post).toHaveBeenCalledWith("/pos/me");
});

test("uses the login preference immediately when the session refresh fails", async () => {
  posClient.post.mockRejectedValue(new Error("offline"));
  await act(async () => root.render(<MemoryRouter><POSWrapper /></MemoryRouter>));
  await act(async () => host.querySelector("button").click());
  expect(host.textContent).toContain("clasico");
});
