import React, { act } from "react";
import { createRoot } from "react-dom/client";
import ThermalTicketPreview from "./ThermalTicketPreview";

test("renders the receipt layout, payment breakdown and only enabled logos and QR codes", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div"); document.body.appendChild(host);
  const root = createRoot(host);
  const config = { paper_size: "80", show_logo: true, mostrar_iva: true, qr_sitio: true, qr_factura: false, mensaje_2: "Gracias por tu compra" };
  try {
    act(() => root.render(<ThermalTicketPreview channel="pdf" config={config} logo="https://example.test/pdf.png" storeName="Refacciones Universal" />));
    expect([...host.querySelectorAll("th")].map(cell => cell.textContent)).toEqual(["Producto", "Cant.", "Precio", "Importe"]);
    for (const text of ["Refacciones Universal", "VENTA #999", "$520.00", "$600.00", "$80.00", "Gracias por tu compra"]) expect(host.textContent).toContain(text);
    expect(host.querySelector('img[alt="Logo del ticket PDF"]')).not.toBeNull();
    expect(host.querySelector('svg title').textContent).toContain("Visita nuestra tienda");
    act(() => root.render(<ThermalTicketPreview channel="payload" config={{ ...config, paper_size: "58", show_logo: false, mostrar_iva: false, qr_sitio: false }} logo="https://example.test/print.png" storeName="Tienda" />));
    expect(host.querySelector("img")).toBeNull();
    expect(host.querySelector("svg")).toBeNull();
    expect(host.textContent).not.toContain("IVA incluido");
  } finally { act(() => root.unmount()); host.remove(); }
});
