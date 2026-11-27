import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import client from "../../config/axiosClient";
import POS from "./POS";

let mockSecurity = false;
jest.mock("../../utils/posServices", () => ({
  ...jest.requireActual("../../utils/posServices"),
  get posServicesEnabled() { return mockSecurity; },
}));
jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), put: jest.fn(), post: jest.fn() } }));
jest.mock("../../utils/alerts", () => ({ showSuccess: jest.fn().mockResolvedValue(), showConfirm: jest.fn(), alertFromAxiosError: jest.fn() }));
jest.mock("../../hooks/useLimitePOS", () => () => ({ limitePermitido: 10 }));
jest.mock("../../context/AdminUiContext", () => {
  const context = { selectedBranch: { id: 1, name: "Centro" }, setSelectedBranch: jest.fn(), setHideLayout: jest.fn() };
  return { useAdminUi: () => context };
});
jest.mock("../../components/cash/AdminCashDialog", () => () => null);
jest.mock("./modals/AssignWarehousesDialog", () => () => null);
jest.mock("../../components/adminpos/POSModulesDialog", () => ({ onSaved }) => (
  <button onClick={onSaved}>Guardar visibilidad de prueba</button>
));

test("confirms deactivation and reactivation with a partial terminal update", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockSecurity = true;
  client.put.mockReset().mockImplementation(async (_, values) => ({ data: { pos: values } }));
  client.get.mockImplementation(async (url) => ({ data: {
    data: url === "/branches/1/pos" ? [{ id: 10, name: "Terminal de prueba", is_active: true }] : [],
  } }));
  const host = document.createElement("div");
  const root = createRoot(host);
  const press = async (label) => act(async () => [...document.body.querySelectorAll("button")]
    .find((node) => node.textContent === label).click());
  document.body.appendChild(host);
  try {
    await act(async () => root.render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><POS /></MemoryRouter>));
    await press("Desactivar terminal");
    expect(document.body.querySelector('[role="dialog"]').textContent).toContain("se revocarán sus sesiones");
    expect(client.put).not.toHaveBeenCalled();
    await press("Cancelar");
    expect(client.put).not.toHaveBeenCalled();
    await press("Desactivar terminal");
    await press("Confirmar");
    expect(client.put).toHaveBeenLastCalledWith("/pos/10", { is_active: false });
    expect([...host.querySelectorAll("button")].find((item) => item.textContent === "Iniciar sesión").disabled).toBe(true);
    await press("Activar terminal");
    expect(document.body.querySelector('[role="dialog"]').textContent).toContain("iniciar sesión de nuevo");
    await press("Confirmar");
    expect(client.put).toHaveBeenLastCalledWith("/pos/10", { is_active: true });
  } finally {
    act(() => root.unmount());
    host.remove();
    mockSecurity = false;
    client.put.mockReset();
  }
});

test("shows Caja only for terminals whose effective modules include it and refreshes after saving", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  let visibleTerminal = "10";
  client.get.mockImplementation(async (url, config) => {
    if (url === "/branches/1/pos") return { data: { data: [{ id: 10, name: "Terminal Uno" }, { id: 20, name: "Terminal Dos" }] } };
    if (url === "/pos/modules/enabled") {
      const visible = config.params.pos_location_id === visibleTerminal;
      return { data: { data: visible ? [{ key: "cash", visible: true }] : [] } };
    }
    return { data: { data: [] } };
  });
  const host = document.createElement("div");
  const root = createRoot(host);
  const button = (text) => [...host.querySelectorAll("button")].find((node) => node.textContent === text);
  const cashCard = () => button("Caja").closest(".MuiCard-root").textContent;
  try {
    await act(async () => root.render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><POS /></MemoryRouter>));
    expect(cashCard()).toContain("Terminal Uno");
    expect([...host.querySelectorAll("button")].filter((node) => node.textContent === "Caja")).toHaveLength(1);
    expect(button("Módulos generales")).toBeUndefined();
    act(() => button("Módulos de este POS").click());
    visibleTerminal = "20";
    await act(async () => button("Guardar visibilidad de prueba").click());
    expect(cashCard()).toContain("Terminal Dos");
    expect([...host.querySelectorAll("button")].filter((node) => node.textContent === "Caja")).toHaveLength(1);
  } finally {
    act(() => root.unmount());
    client.get.mockReset();
  }
});


test("changes only the interface preference of the selected POS", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  client.get.mockImplementation(async (url) => ({ data: url === "/branches/1/pos" ? { list: [{ id: 10, name: "Terminal Uno", interface_design: "actual" }] } : { data: [] } }));
  client.put.mockResolvedValue({ data: { pos: { id: 10, interface_design: "clasico" } } });
  const host = document.createElement("div"), root = createRoot(host); document.body.appendChild(host);
  try {
    await act(async () => root.render(<MemoryRouter><POS /></MemoryRouter>));
    act(() => host.querySelector('[aria-label="Editar Terminal Uno"]').click());
    const select = document.querySelector('[role="dialog"] [role="combobox"]');
    await act(async () => { select.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })); });
    const option = [...document.querySelectorAll('[role="option"]')].find(item => item.textContent.includes("Clásico"));
    await act(async () => option.click());
    expect(client.put).not.toHaveBeenCalled();
    await act(async () => document.querySelector('[form="pos-editor-form"]').click());
    expect(client.put).toHaveBeenCalledWith("/pos/10", { interface_design: "clasico" });
  } finally { act(() => root.unmount()); host.remove(); }
});

test("creates a POS from a modal and shows its access PIN only on demand", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  client.get.mockResolvedValue({ data: { list: [] } });
  client.post.mockResolvedValue({ data: { pos: { id: 30, name: "Mostrador", code: "POS30" } } });
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  const button = (label) => [...host.querySelectorAll("button")].find(item => item.textContent === label);
  try {
    await act(async () => root.render(<MemoryRouter><POS /></MemoryRouter>));
    act(() => button("Nuevo POS").click());
    expect(host.textContent).not.toContain("POS sin nombre");
    const form = document.getElementById("pos-editor-form");
    const name = form.querySelector('input[type="text"]');
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(name, "Mostrador");
      name.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => document.querySelector('[form="pos-editor-form"]').click());
    const payload = client.post.mock.calls[0][1];
    expect(client.post).toHaveBeenCalledWith("/branches/1/pos", {
      name: "Mostrador", access_code: expect.stringMatching(/^\d{6}$/), interface_design: "actual",
    });
    act(() => button("Accesos").click());
    const pin = document.querySelector('[role="dialog"] input[type="password"]');
    expect(pin.value).toBe(payload.access_code);
    act(() => document.querySelector('[aria-label="Mostrar PIN"]').click());
    expect(pin.type).toBe("text");
  } finally {
    act(() => root.unmount());
    host.remove();
    client.post.mockReset();
    client.get.mockReset();
  }
});

test("uses a compact terminal card on desktop and opens the selected row's access modal", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = query => ({
    matches: query.includes("min-width:900px"), media: query,
    addEventListener: jest.fn(), removeEventListener: jest.fn(),
    addListener: jest.fn(), removeListener: jest.fn(),
  });
  client.get.mockImplementation(async url => ({ data: {
    list: url === "/branches/1/pos" ? [{ id: 10, name: "Terminal Uno", code: "POS10" }] : [],
  } }));
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><POS /></MemoryRouter>,
    ));
    const card = host.querySelector("article");
    expect(card.textContent).toContain("POS10");
    expect([...card.querySelectorAll("button")].map(button => button.getAttribute("aria-label") || button.textContent))
      .toEqual(["Acciones de Terminal Uno", "Iniciar sesión"]);
    act(() => host.querySelector('[aria-label="Acciones de Terminal Uno"]').click());
    const accessItem = [...document.querySelectorAll('[role="menuitem"]')].find(item => item.textContent === "Accesos");
    act(() => accessItem.click());
    expect(document.querySelector('[role="dialog"] input').value).toBe("POS10");
  } finally {
    act(() => root.unmount());
    host.remove();
    window.matchMedia = originalMatchMedia;
    client.get.mockReset();
  }
});
