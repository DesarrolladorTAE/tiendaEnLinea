import React from "react";
import { Box } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";

export default function PrintedTicketDesign({ config, logo, storeName }) {
  const narrow = config.paper_size === "58";
  const logoWidth = Math.min(90, Math.max(18, (Number(config.logo_max_width) || 384) / (narrow ? 384 : 576) * 100));
  const qr = [config.qr_factura && { key: "factura", label: "Autofacturación", size: config.qr_factura_size }, config.qr_sitio && { key: "tienda", label: "Visita nuestra tienda", size: config.qr_sitio_size }].filter(Boolean);
  const rule = { borderBottom: "1px dashed #6b6b65", py: 1 };
  return <Box aria-label="Diseño del ticket de impresión" sx={{ width: "100%", maxWidth: narrow ? 232 : 330, minWidth: 0, mx: "auto", px: 1.5, pt: 2.5, pb: 4, bgcolor: "#fffef9", color: "#262723", boxShadow: "0 12px 30px #0003", fontFamily: '"Courier New", monospace', fontSize: narrow ? 9 : 11, lineHeight: 1.5, fontWeight: 400, overflowWrap: "anywhere", "& table": { width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: "inherit", color: "inherit" }, "& th, & td": { p: "6px 1px", fontSize: "inherit", color: "inherit", fontWeight: 400, verticalAlign: "top", overflowWrap: "anywhere" } }}>
    {config.show_logo && logo && <Box component="img" src={logo} alt="Logo del ticket de impresión" sx={{ display: "block", width: `${logoWidth}%`, maxWidth: "100%", maxHeight: narrow ? 140 : 180, objectFit: "contain", mx: "auto", mb: 3, filter: "grayscale(1) contrast(1.2)" }} />}
    <Box sx={{ ...rule, whiteSpace: "pre-line" }}><Box>{storeName}</Box>{config.direccion && <Box>{config.direccion}</Box>}</Box>
    <Box sx={rule}><Box>Venta #999</Box><Box>Fecha: 02/11/2026 16:23</Box><Box>POS: CAJA DEMO</Box><Box>Cliente: Público en general</Box></Box>
    <Box component="table" aria-label="Productos de ejemplo del ticket impreso">
      <colgroup><col style={{ width: "40%" }} /><col style={{ width: "12%" }} /><col style={{ width: "24%" }} /><col style={{ width: "24%" }} /></colgroup>
      <thead style={{ borderBottom: "1px dashed #6b6b65" }}><tr><th style={{ textAlign: "left" }}>Producto</th><th style={{ textAlign: "center" }}>Cant.</th><th style={{ textAlign: "right" }}>Precio</th><th style={{ textAlign: "right" }}>Importe</th></tr></thead>
      <tbody><tr><td>Producto de ejemplo</td><td style={{ textAlign: "center" }}>1</td><td style={{ textAlign: "right" }}>$10.00</td><td style={{ textAlign: "right" }}>$10.00</td></tr><tr><td>Servicio de ejemplo</td><td style={{ textAlign: "center" }}>1</td><td style={{ textAlign: "right" }}>$3.00</td><td style={{ textAlign: "right" }}>$3.00</td></tr></tbody>
    </Box>
    <Box sx={{ borderTop: "1px dashed #6b6b65", pt: 1, "& > div": { display: "flex", justifyContent: "space-between", gap: 1, py: .2 } }}>
      {config.mostrar_iva && <Box><span>IVA incluido:</span><span>$1.79</span></Box>}
      <Box><span>Total:</span><span>$13.00</span></Box>
    </Box>
    <Box sx={{ mt: 2, "& > div": { display: "flex", justifyContent: "space-between", gap: 1 } }}><Box><span>Efectivo:</span><span>$20.00</span></Box><Box><span>Pagado:</span><span>$13.00</span></Box><Box><span>Cambio:</span><span>$7.00</span></Box></Box>
    {config.mensaje_1 && <Box sx={{ mt: 2.5, whiteSpace: "pre-line" }}>{config.mensaje_1}</Box>}
    <Box sx={{ mt: 2 }}>VENTA CONFIRMADA</Box>
    {!!qr.length && <Box sx={{ display: "grid", justifyItems: "center", gap: 3, mt: 2 }}>
      {qr.map(item => <Box key={item.key} sx={{ width: "100%", textAlign: "center" }}><QRCodeSVG value={`https://example.invalid/vista-previa/${item.key}`} size={Math.min(narrow ? 140 : 180, Math.max(60, Number(item.size || 7) * 22))} marginSize={2} title={`QR de ejemplo: ${item.label}`} style={{ display: "block", maxWidth: "100%", height: "auto", marginInline: "auto" }} /><Box sx={{ mt: 1 }}>{item.label}</Box></Box>)}
    </Box>}
    <Box sx={{ mt: 2.5, whiteSpace: "pre-line" }}>{config.mensaje_2 || "GRACIAS POR TU COMPRA"}</Box>
    <Box sx={{ mt: 2, fontSize: "0.9em" }}>Este es un comprobante de venta no fiscal.<br />www.mitiendaenlineamx.com.mx</Box>
  </Box>;
}
