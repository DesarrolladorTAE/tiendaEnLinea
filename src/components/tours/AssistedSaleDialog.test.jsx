import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import AssistedSaleDialog from "./AssistedSaleDialog";
import { createAssistedSale, getRouteStops } from "../../services/tours/tourService";

jest.mock("../../services/tours/tourService", () => ({ createAssistedSale: jest.fn(), getRouteStops: jest.fn() }));

test("POS submits both notification channels with the international buyer destination", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  getRouteStops.mockResolvedValue([{ id: 1, name: "Centro", is_active: true }]);
  createAssistedSale.mockResolvedValue({ data: { success: true } });
  const host = document.createElement("div"); document.body.appendChild(host);
  const root = createRoot(host), onSaved = jest.fn();
  const context = { mode: "pos", branchId: 2, departureId: 3 };
  try {
    await act(async () => root.render(<AssistedSaleDialog context={context} departure={{ tour_route_id: 4, available_capacity: 10 }} onClose={() => {}} onSaved={onSaved} onSessionExpired={() => {}} />));
    const change = (label, value) => {
      const input = [...document.querySelectorAll("input")].find(node => document.querySelector(`label[for="${node.id}"]`)?.textContent.startsWith(label));
      expect(input).toBeDefined();
      act(() => Simulate.change(input, { target: { value } }));
    };
    change("Nombre del comprador", "Ana");
    change("Teléfono", "7221234567");
    change("Correo del comprador", "ana@example.com");
    for (const label of ["Avisos por correo electrónico", "Avisos por WhatsApp"]) {
      const input = [...document.querySelectorAll("label")].find(node => node.textContent === label).querySelector("input");
      act(() => Simulate.change(input, { target: { checked: true } }));
    }
    change("WhatsApp internacional", "+14155552671");
    await act(async () => Simulate.submit(document.querySelector("[role=dialog] form")));
    expect(createAssistedSale).toHaveBeenCalledWith(context, expect.objectContaining({ notification_channels: ["email", "whatsapp"], notification_channel: "email", buyer_phone: "7221234567", buyer_whatsapp_phone: "+14155552671" }));
    expect(onSaved).toHaveBeenCalledTimes(1);
  } finally { act(() => root.unmount()); host.remove(); }
});
