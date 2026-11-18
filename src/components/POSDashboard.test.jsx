import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import POSDashboard from "./POSDashboard";

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
jest.mock("../config/axiosClientPOS", () => ({ __esModule: true, default: {} }));
jest.mock("../modules/telorecargo/service", () => ({
  telorecargoPOS: { state: async () => ({ configured: false }) },
}));
jest.mock("../hooks/POS/useCashStatus", () => ({
  __esModule: true,
  default: () => ({
    status: { cash_control_enabled: true, session: { id: 42, opening_amount: 500 } },
    canSell: true,
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
    expect(shortcuts.every((item) => item.querySelector("svg"))).toBe(true);
    expect(button(host, "Configuración")).toBeDefined();
    expect(button(host, "Recargas Telorecargo")).toBeDefined();
    act(() => button(host, "Productos en carrito: 0").click());
    act(() => button(host, "Hacer corte").click());
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
