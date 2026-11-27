import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import POSDashboard from "./POSDashboard";
import posClient from "../config/axiosClientPOS";

let mockOperational = false;
let mockControlled = false;
jest.mock("../utils/posServices", () => ({
  ...jest.requireActual("../utils/posServices"),
  get posServicesEnabled() { return mockOperational; },
  get posControlledEnabled() { return mockControlled; },
}));
jest.mock("./POS/POSServiceWorkspace", () => ({ __esModule: true, default: ({ section }) => <div>Operación {section}</div> }));
jest.mock("./POS", () => ({ __esModule: true, default: ({ cart, setCart, idempotencyEnabled }) => (
  <button data-idempotency={String(Boolean(idempotencyEnabled))} onClick={() => setCart([{ id: 1 }])}>Productos en carrito: {cart.length}</button>
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
const catalog = (...keys) => ({ data: { data: keys.map((key, sort_order) => ({
  key, sort_order, available: true, enabled: true, visible: true, store_enabled: true, source: "pos", operational_enabled: true,
})) } });

test("mantiene las ventas de servicios heredadas sin dar acceso a la nueva agenda", async () => {
  mockOperational = true;
  const response = catalog("sales", "service_sales");
  response.data.data[1].source = "general";
  response.data.data[1].operational_enabled = false;
  posClient.get.mockResolvedValue(response);
  const host = document.createElement("div");
  const root = createRoot(host);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={["/prueba/pos?seccion=servicios"]}>
      <POSDashboard posLocationId={7} session={1} />
    </MemoryRouter>));
    expect(button(host, "Ventas de servicios")).toBeDefined();
    expect(button(host, "Servicios")).toBeUndefined();
    expect(host.textContent).toContain("Este módulo operativo no está disponible");
  } finally {
    act(() => root.unmount());
  }
});

beforeEach(() => {
  mockOperational = false;
  mockControlled = false;
  posClient.get.mockReset();
  posClient.get.mockResolvedValue(catalog("cash", "sales", "history", "web_orders", "pending_sales", "credits", "customers", "invoices", "service_sales", "service_reports", "telorecargo", "internal_notes", "settings"));
});

test.each(["pilot", "control", "failure"])("resuelve idempotencia independiente para %s con el mismo frontend", async (terminal) => {
  mockControlled = true;
  mockCanSell = true;
  posClient.get.mockImplementation(async (path) => {
    if (path === "/pos/modules/enabled") return catalog("sales");
    if (terminal === "failure") throw new Error("Capacidades no disponibles");
    if (terminal === "control") return catalog("sales");
    return catalog("sales", "sales_v2_idempotency");
  });
  const host = document.createElement("div");
  const root = createRoot(host);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={["/prueba/pos?seccion=venta"]}>
      <POSDashboard posLocationId={terminal === "pilot" ? 7 : 8} session={1} />
    </MemoryRouter>));
    expect(button(host, "Productos en carrito: 0").dataset.idempotency).toBe(String(terminal === "pilot"));
    expect(button(host, "Servicios")).toBeUndefined();
    expect(posClient.get).toHaveBeenCalledWith("/pos/modules", { signal: expect.anything() });
  } finally {
    act(() => root.unmount());
  }
});

test("permite abrir recuperación con capacidad retirada y caja cerrada", async () => {
  mockControlled = true;
  mockCanSell = false;
  localStorage.setItem("pos-v2-recovery:7", JSON.stringify({ key: "2bb3f93a-cc52-485c-95c3-fd4e8fcf56ab" }));
  posClient.get.mockResolvedValue(catalog("sales"));
  const host = document.createElement("div");
  const root = createRoot(host);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={["/prueba/pos?seccion=venta"]}>
      <POSDashboard posLocationId={7} session={1} />
    </MemoryRouter>));
    expect(button(host, "Productos en carrito: 0").dataset.idempotency).toBe("false");
  } finally {
    act(() => root.unmount());
    localStorage.removeItem("pos-v2-recovery:7");
    mockCanSell = true;
  }
});

test("muestra Servicios y Expedientes como opciones POS y conserva el carrito al volver a Venta", async () => {
  mockOperational = true;
  mockCanSell = true;
  posClient.get.mockResolvedValue(catalog("sales", "service_sales", "vehicle_records"));
  const host = document.createElement("div");
  const root = createRoot(host);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={["/prueba/pos?seccion=venta"]}>
      <POSDashboard posLocationId={7} session={1} />
    </MemoryRouter>));
    await act(async () => button(host, "Productos en carrito: 0").click());
    await act(async () => button(host, "Servicios").click());
    expect(host.textContent).toContain("Operación servicios");
    await act(async () => button(host, "Expedientes vehiculares").click());
    expect(host.textContent).toContain("Operación expedientes");
    await act(async () => button(host, "Venta").click());
    expect(button(host, "Productos en carrito: 1")).toBeDefined();
  } finally {
    act(() => root.unmount());
  }
});

test.each([
  [false, false, ["sales", "service_sales"]],
  [true, true, ["sales", "service_sales"]],
  [true, false, ["sales"]],
])("bloquea acceso directo con gate=%s, admin=%s, módulos=%j", async (gate, posDesdeAdmin, keys) => {
  mockOperational = gate;
  posClient.get.mockResolvedValue(catalog(...keys));
  const host = document.createElement("div");
  const root = createRoot(host);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={["/prueba/pos?seccion=servicios"]}>
      <POSDashboard posLocationId={7} session={1} posDesdeAdmin={posDesdeAdmin} />
    </MemoryRouter>));
    expect(host.textContent).toContain("Este módulo operativo no está disponible");
    expect(host.textContent).not.toContain("Operación servicios");
  } finally {
    act(() => root.unmount());
  }
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

test("classic cards show only authorized modules and preserve the cart when returning to the menu", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  posClient.get.mockResolvedValue(catalog("history", "sales"));
  const host = document.createElement("div"); document.body.appendChild(host); const root = createRoot(host);
  const card = label => [...host.querySelectorAll("button")].find(item => item.textContent.startsWith(label));
  try {
    await act(async () => root.render(<MemoryRouter><POSDashboard posName="Centro" posLocationId={7} interfaceDesign="clasico" /></MemoryRouter>));
    expect(host.querySelector('nav[aria-label="Secciones del punto de venta"]')).toBeNull();
    expect([...host.querySelectorAll('nav[aria-label="Módulos del punto de venta"] button')].map(item => item.querySelector("span").textContent)).toEqual(["Venta", "Historial"]);
    expect(card("Venta")).toBeDefined(); expect(card("Historial")).toBeDefined(); expect(card("Clientes")).toBeUndefined();
    await act(async () => card("Venta").click());
    await act(async () => button(host, "Productos en carrito: 0").click());
    await act(async () => button(host, "Panel").click());
    await act(async () => card("Venta").click());
    expect(button(host, "Productos en carrito: 1")).toBeDefined();
  } finally { act(() => root.unmount()); host.remove(); }
});

test("unknown interface defaults to the current navigation", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true; const host = document.createElement("div"), root = createRoot(host);
  try { await act(async () => root.render(<MemoryRouter><POSDashboard posLocationId={7} interfaceDesign="futuro" /></MemoryRouter>)); expect(host.querySelector('nav[aria-label="Secciones del punto de venta"]')).not.toBeNull(); } finally { act(() => root.unmount()); }
});
