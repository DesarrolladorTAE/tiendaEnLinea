import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import POSLoginModal from "./POSLoginModal";
import { getLoginBanners } from "../utils/loginBannerCache";
import client from "../config/axiosClient";

jest.mock("../config/axiosClient", () => ({ __esModule: true, default: { post: jest.fn() } }));
let mockSecurity = false;
jest.mock("../utils/posServices", () => ({ get posServicesEnabled() { return mockSecurity; } }));
jest.mock("../utils/loginBannerCache", () => ({ getLoginBanners: jest.fn() }));

let host;
let root;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  mockSecurity = false;
  localStorage.removeItem("POS_TOKEN");
});

async function renderLogin(banners) {
  getLoginBanners.mockResolvedValue(banners);
  await act(async () => root.render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <POSLoginModal onLoginSuccess={jest.fn()} />
    </MemoryRouter>,
  ));
}

test("shows login announcements and lets the cashier select a video or reveal the PIN", async () => {
  await renderLogin([
    { url: "/principal.jpg", tipo: "principal" },
    { url: "/anuncio.jpg", tipo: "login", titulo: "Promoción" },
    { url: "/anuncio.mp4", tipo: "login" },
  ]);
  expect(host.querySelector(".auth-img").alt).toBe("Promoción");
  expect(host.querySelectorAll(".auth-banner-dots button")).toHaveLength(2);
  act(() => host.querySelector('[aria-label="Ir al banner 2"]').click());
  expect(host.querySelector(".auth-video").getAttribute("src")).toBe("/anuncio.mp4");

  const pin = host.querySelector('input[autocomplete="current-password"]');
  expect(pin.type).toBe("password");
  act(() => host.querySelector('[aria-label="Mostrar PIN"]').click());
  expect(pin.type).toBe("text");
});

test("keeps the POS form available when there are no announcements", async () => {
  await renderLogin([]);
  expect(host.querySelector(".auth-panel").classList.contains("no-media")).toBe(true);
  expect(host.querySelector('button[type="submit"]').disabled).toBe(false);
});

test("muestra la razón de desactivación de Laravel y no guarda una sesión", async () => {
  mockSecurity = true;
  client.post.mockRejectedValueOnce({ response: { status: 403, data: { message: "Esta terminal POS está desactivada." } } });
  await renderLogin([]);
  const change = (selector, value) => {
    const input = host.querySelector(selector);
    input.value = value;
    Simulate.change(input);
  };
  await act(async () => {
    change('input[autocomplete="username"]', "POS-DEMO");
    change('input[autocomplete="current-password"]', "123456");
  });
  await act(async () => Simulate.submit(host.querySelector("form")));
  expect(host.querySelector('[role="alert"]').textContent).toContain("Esta terminal POS está desactivada.");
  expect(localStorage.getItem("POS_TOKEN")).toBeNull();
});

test("opens and closes the company certificate from the POS login", async () => {
  jest.useFakeTimers();
  try {
    await renderLogin([]);
    act(() => host.querySelector('[aria-label="Ver certificado de Empresa Guerrerense"]').click());
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain("Folio 2026-027");
    expect(dialog.querySelector("img").getAttribute("src")).toBe("/assets/images/certificado.png");
    act(() => dialog.querySelector("button").click());
    act(() => jest.runOnlyPendingTimers());
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  } finally {
    jest.useRealTimers();
  }
});
