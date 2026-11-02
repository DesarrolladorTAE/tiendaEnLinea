import React, { act } from "react";
import { createRoot } from "react-dom/client";
import PrintedTicketDesign from "./PrintedTicketDesign";

test("renders a thermal-paper design with its own logo, totals and enabled QR", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div"); document.body.appendChild(host);
  const root = createRoot(host);
  const config = { paper_size: "80", show_logo: true, qr_sitio: true, qr_sitio_size: 7, mostrar_iva: true, direccion: "Calle Principal 123", mensaje_1: "Bienvenido", mensaje_2: "Gracias por preferirnos" };
  try {
    act(() => root.render(<PrintedTicketDesign config={config} logo="https://example.test/print.png" storeName="Mi negocio" />));
    expect(host.querySelector('img[alt="Logo del ticket de impresión"]').src).toBe("https://example.test/print.png");
    for (const text of ["Mi negocio", "Calle Principal 123", "Cliente: Público en general", "$13.00", "$7.00", "VENTA CONFIRMADA", "Gracias por preferirnos"]) expect(host.textContent).toContain(text);
    expect(host.querySelector("svg").getAttribute("width")).toBe("154");
    act(() => root.render(<PrintedTicketDesign config={{ ...config, paper_size: "58", show_logo: false, qr_sitio: false }} storeName="Mi negocio" />));
    expect(host.querySelector("img")).toBeNull(); expect(host.querySelector("svg")).toBeNull();
  } finally { act(() => root.unmount()); host.remove(); }
});
