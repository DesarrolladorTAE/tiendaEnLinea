import React from "react";
import { Box } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import PrintedTicketDesign from "./PrintedTicketDesign";

export default function ThermalTicketPreview({ channel, config, logo, storeName }) {
  if (channel === "payload") return <PrintedTicketDesign config={config} logo={logo} storeName={storeName} />;
  const narrow = config.paper_size === "58";
  const logoWidth = Math.min(100, Math.max(16, (Number(config.logo_max_width) || 384) / (narrow ? 384 : 576) * 100));
  const qr = [config.qr_factura && { key: "factura", label: "Autofacturación", size: config.qr_factura_size }, config.qr_sitio && { key: "tienda", label: "Visita nuestra tienda", size: config.qr_sitio_size }].filter(Boolean);
  return <Box aria-label={`Ejemplo de ticket ${channel === "pdf" ? "PDF" : "de impresión"}`} sx={{ width: "100%", maxWidth: narrow ? 232 : 320, mx: "auto", p: 1.25, pb: 4, minHeight: 520, bgcolor: "#fff", color: "#000", boxShadow: "0 10px 28px #0003", fontFamily: channel === "pdf" ? "Arial, sans-serif" : '"Courier New", monospace', fontSize: narrow ? 9 : 10, lineHeight: 1.3, overflowWrap: "anywhere", "& table": { width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: "inherit", color: "#000" }, "& th, & td": { p: "5px 2px", verticalAlign: "top", color: "#000", borderBottom: "1px dashed #d0d0d0", fontSize: "inherit", overflowWrap: "anywhere" } }}>
    <Box sx={{ textAlign: "center" }}>
      <strong>{storeName}</strong>
      {config.show_logo && logo && <Box component="img" src={logo} alt={channel === "pdf" ? "Logo del ticket PDF" : "Logo del ticket de impresión"} sx={{ display: "block", width: `${logoWidth}%`, maxWidth: "100%", maxHeight: 145, objectFit: "contain", mx: "auto", my: .5 }} />}
      {config.direccion && <Box sx={{ whiteSpace: "pre-line", fontSize: "0.95em", my: .5 }}>{config.direccion}</Box>}
    </Box>
    <Box sx={{ borderBlock: "1px dashed #888", mt: 1, py: .5 }}>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline" }}><strong>VENTA #999</strong><span style={{ fontSize: "0.9em" }}>Fecha: 02/11/2026 16:23</span></Box>
      <Box sx={{ mt: .4 }}>POS: <strong>CAJA DEMO</strong></Box>
    </Box>
    {config.mensaje_1 && <Box sx={{ py: .75, whiteSpace: "pre-line", textAlign: "center" }}>{config.mensaje_1}</Box>}
    <Box component="table" aria-label="Productos de ejemplo del ticket">
      <colgroup><col style={{ width: "34%" }} /><col style={{ width: "14%" }} /><col style={{ width: "25%" }} /><col style={{ width: "27%" }} /></colgroup>
      <thead><tr><th style={{ textAlign: "left" }}>Producto</th><th style={{ textAlign: "center" }}>Cant.</th><th style={{ textAlign: "right" }}>Precio</th><th style={{ textAlign: "right" }}>Importe</th></tr></thead>
      <tbody>
        <tr><td>Camisa deportiva</td><td style={{ textAlign: "center" }}>2</td><td style={{ textAlign: "right" }}>$160.00</td><td style={{ textAlign: "right" }}>$320.00</td></tr>
        <tr><td colSpan={4} style={{ textAlign: "right", color: "#777", fontSize: "0.85em" }}>Precio original por unidad: $200.00<br />Descuento por unidad: 20% (−$40.00)</td></tr>
        <tr><td>Pantalón formal</td><td style={{ textAlign: "center" }}>1</td><td style={{ textAlign: "right" }}>$200.00</td><td style={{ textAlign: "right" }}>$200.00</td></tr>
      </tbody>
    </Box>
    <Box sx={{ mt: .5, "& > div": { display: "flex", justifyContent: "space-between", gap: 1, py: .35, borderBottom: "1px dashed #d0d0d0" } }}>
      {config.mostrar_iva && <Box><span>IVA incluido</span><span>$71.72</span></Box>}
      <Box><strong>Total:</strong><strong>$520.00</strong></Box>
      <Box><span>Método:</span><span>Efectivo</span></Box>
      <Box><span>Recibido:</span><span>$600.00</span></Box>
      <Box><span>Cambio:</span><span>$80.00</span></Box>
    </Box>
    {!!qr.length && <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 1.5, mt: 2 }}>
      {qr.map(item => <Box key={item.key} sx={{ textAlign: "center" }}><QRCodeSVG value={`https://example.invalid/vista-previa/${item.key}`} size={Math.min(qr.length > 1 ? 74 : 110, Math.max(44, Number(item.size || 7) * 12))} marginSize={1} title={`QR de ejemplo: ${item.label}`} /><Box sx={{ fontSize: "0.8em", mt: .25 }}>{item.label}</Box></Box>)}
    </Box>}
    <Box sx={{ textAlign: "center", mt: 1.5, fontSize: "0.85em" }}>
      {config.mensaje_2 && <Box sx={{ whiteSpace: "pre-line", mb: .75 }}>{config.mensaje_2}</Box>}
      <Box>Este es un comprobante de venta no fiscal.</Box>
      <Box>www.mitiendaenlineamx.com.mx</Box>
    </Box>
  </Box>;
}
