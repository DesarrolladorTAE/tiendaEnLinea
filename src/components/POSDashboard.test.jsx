import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import POSDashboard from "./POSDashboard";
import posClient from "../config/axiosClientPOS";

jest.mock("./POS", () => ({ __esModule: true, default: ({ cart, setCart }) => (
  <button onClick={() => setCart([{ id: 1 }])}>Productos en carrito: {cart.length}</button>
) }));
jest.mock("./HistorialVentas", () => () => null);
jest.mock("./ComprasFacturadas", () => () => null);
jest.mock("./ClientesPOS", () => () => null);
jest.mock("./NotasInternas", () => () => null);
jest.mock("./PendingSalePos", () => () => null);
jest.mock("./CreditoFiadoPOS", () => () => null);
jest.mock("./POS/PosLocationPrintSettings", () => () => null);
jest.mock("../config/axiosClientPOS", () => ({ __esModule: true, default: { get: jest.fn() } }));
let mockCanSell = true;
jest.mock("../hooks/POS/useCashStatus", () => ({
  __esModule: true,
  default: () => ({
    status: { cash_control_enabled: true, session: mockCanSell ? { id: 42, opening_amount: 500 } : null },
    canSell: mockCanSell,
  }),
}));

function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output>{location.pathname}{location.search}</output>
      <button onClick={() => navigate(-1)}>Atrás del navegador</button>
    </>
  );
}

const button = (host, label) => [...host.querySelectorAll("button")].find((item) => item.textContent === label);
const catalog = (...keys) => ({ data: { data: keys.map((key, sort_order) => ({ key, sort_order, visible: true })) } });

beforeEach(() => {
  posClient.get.mockReset();
  posClient.get.mockResolvedValue(catalog("cash", "sales", "history", "web_orders", "pending_sales", "credits", "customers", "invoices", "service_sales", "service_reports", "telorecargo", "internal_notes", "settings"));
});

test("renders only visible modules in API order and refreshes the menu in the same session", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  posClient.get.mockResolvedValueOnce(catalog("history", "sales")).mockResolvedValueOnce(catalog("cash"));
  const host = document.createElement("div");
  const root = createRoot(host);
  const options = () => [...host.querySelectorAll("nav button")].map((item) => item.textContent);
  try {
    await act(async () => root.render(
      <MemoryRouter initialEntries={["/pos?seccion=credito_fiado"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <POSDashboard posLocationId={7} />
      </MemoryRouter>,
    ));
    expect(options()).toEqual(["Historial", "Venta"]);
    expect(host.querySelector("h1").textContent).toBe("Historial");
    await act(async () => host.querySelector('[aria-label="Actualizar menú"]').click());
    expect(options()).toEqual(["Caja"]);
    expect(host.querySelector("h1").textContent).toBe("Caja");
    expect(posClient.get.mock.calls.map(([path]) => path)).toEqual(["/pos/modules/enabled", "/pos/modules/enabled"]);
  } finally {
    act(() => root.unmount());
  }
});

test("mounts the sales catalog only while the cash session permits sales", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  const root = createRoot(host);
  const render = () => root.render(
    <MemoryRouter initialEntries={["/admin/prueba/pos?seccion=venta"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <POSDashboard posName="Terminal Centro" posLocationId={7} posDesdeAdmin />
    </MemoryRouter>,
  );
  try {
    mockCanSell = false;
    await act(async () => render());
    expect(host.textContent).toContain("Abre la caja para cobrar.");
    expect(button(host, "Ver caja")).toBeUndefined();
    expect(button(host, "Productos en carrito: 0")).toBeUndefined();
    mockCanSell = true;
    await act(async () => render());
    expect(button(host, "Productos en carrito: 0")).toBeDefined();
    mockCanSell = false;
    await act(async () => render());
    expect(button(host, "Productos en carrito: 0")).toBeUndefined();
  } finally {
    mockCanSell = true;
    act(() => root.unmount());
  }
});

test("opens the cut page in its own URL and preserves the cart when navigating back", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(
      <MemoryRouter initialEntries={["/admin/prueba/pos"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <POSDashboard posName="Terminal Centro" posLocationId={7} posDesdeAdmin />
        <LocationProbe />
      </MemoryRouter>,
    ));
    const shortcuts = [...host.querySelectorAll('nav[aria-label="Secciones del punto de venta"] button')];
    expect(shortcuts).toHaveLength(13);
    expect(shortcuts[0].textContent).toBe("Caja");
    expect(shortcuts[0].getAttribute("aria-current")).toBe("page");
    expect(shortcuts.every((item) => item.querySelector("svg"))).toBe(true);
    expect(button(host, "Configuración")).toBeDefined();
    expect(button(host, "Recargas Telorecargo")).toBeDefined();
    act(() => button(host, "Venta").click());
    act(() => button(host, "Productos en carrito: 0").click());
    expect(button(host, "Hacer corte")).toBeUndefined();
    act(() => button(host, "Caja").click());
    expect(host.querySelector("output").textContent).toBe("/admin/prueba/pos?seccion=caja");
    expect(host.querySelector("h1").textContent).toBe("Caja");
    expect(host.textContent).toContain("Efectivo contado (MXN)");
    expect(button(host, "Confirmar corte").disabled).toBe(true);
    expect(button(host, "Caja").getAttribute("aria-current")).toBe("page");
    act(() => button(host, "Atrás del navegador").click());
    expect(host.querySelector("h1").textContent).toBe("Venta");
    expect(button(host, "Productos en carrito: 1")).toBeDefined();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
