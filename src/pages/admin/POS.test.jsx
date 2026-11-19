import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import client from "../../config/axiosClient";
import POS from "./POS";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn() } }));
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
