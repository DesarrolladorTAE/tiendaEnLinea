import React from "react";
import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { useTienda } from "../../context/TiendaContext";
import ThermalTicketPreview from "./ThermalTicketPreview";

export default function DocumentDraftPreview({ type, channel, config, logo }) {
  const { tienda } = useTienda();
  const thermal = type === "ticket";
  const color = !thermal && /^#[\da-f]{6}$/i.test(config.accent_color) ? config.accent_color : "#333333";
  return <Box sx={{ minWidth: 0 }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} mb={1.5} flexWrap="wrap">
      <Box><Typography fontWeight={800}>Tu diseño</Typography><Typography variant="caption" color="text.secondary">{channel === "pdf" ? "Diseño de PDF y WhatsApp" : "Diseño de impresión"}</Typography></Box><Chip size="small" label={channel === "payload" ? thermal ? `${config.paper_size} mm` : "Impresión" : "Vista orientativa"} variant="outlined" />
    </Stack>
    <Box sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}>
      {thermal ? <ThermalTicketPreview channel={channel} config={config} logo={logo} storeName={tienda?.name || tienda?.nombre || "Tu tienda"} /> : <Box sx={{ width: "100%", maxWidth: 510, minHeight: 430, mx: "auto", p: { xs: 2, sm: 3 }, color: "#20252b", bgcolor: "#fff", boxShadow: "0 12px 36px #0002", borderTop: `5px solid ${color}`, overflowWrap: "anywhere", "& .MuiTypography-root": { color: "inherit", fontFamily: "inherit" } }}>
        <Box sx={{ textAlign: "left" }}>
          {config.show_logo && logo && <Box component="img" src={logo} alt="Logo del documento" sx={{ display: "block", maxWidth: "65%", maxHeight: 80, objectFit: "contain", mb: 1.5 }} />}
          <Typography fontWeight={800} sx={{ fontSize: 17 }}>{tienda?.name || tienda?.nombre || "Tu tienda"}</Typography>
          <Typography sx={{ whiteSpace: "pre-line", fontSize: 11, mt: .5 }}>{config.direccion || "Dirección de tu negocio"}</Typography>
        </Box>
        <Typography fontWeight={900} sx={{ mt: 2, fontSize: 18 }}>{config.title || (type === "nota_venta" ? "NOTA DE VENTA" : "COMPROBANTE")}</Typography>
        <Typography sx={{ fontSize: 10, my: 1.5 }}>Venta de ejemplo · 001</Typography>
        {config.show_customer && <Box sx={{ p: 1.2, bgcolor: "#f3f4f6", mb: 2 }}><Typography sx={{ fontSize: 10 }}>CLIENTE</Typography><Typography sx={{ fontSize: 12 }}>Cliente de ejemplo</Typography></Box>}
        {config.mensaje_1 && <Typography sx={{ fontSize: 11, my: 1.5, whiteSpace: "pre-line" }}>{config.mensaje_1}</Typography>}
        <Divider sx={{ borderColor: "#ddd", my: 1 }} />
        <Stack direction="row" justifyContent="space-between" gap={1}><Typography fontWeight={700} sx={{ fontSize: 11 }}>Descripción</Typography><Typography fontWeight={700} sx={{ fontSize: 11 }}>Importe</Typography></Stack>
        <Stack direction="row" justifyContent="space-between" gap={1} my={1}><Box><Typography sx={{ fontSize: 12 }}>Artículo de ejemplo</Typography>{config.show_sku && <Typography sx={{ fontSize: 10 }}>SKU: PROD-001</Typography>}{config.show_oe && <Typography sx={{ fontSize: 10 }}>OE: 000123</Typography>}<Typography sx={{ fontSize: 10 }}>1 × $100.00</Typography></Box><Typography sx={{ fontSize: 12 }}>$100.00</Typography></Stack>
        <Divider sx={{ borderColor: "#ddd", my: 1 }} />
        {config.mostrar_iva && <Typography sx={{ textAlign: "right", fontSize: 10 }}>IVA incluido: $13.79</Typography>}
        <Typography fontWeight={900} sx={{ textAlign: "right", fontSize: 16, mt: .5 }}>Total $100.00</Typography>
        {type === "comprobante" && <Typography sx={{ fontSize: 10, mt: 1 }}>Pago de ejemplo: efectivo</Typography>}
        {type === "nota_venta" && <Stack direction="row" spacing={2} mt={4}>{["Entregó", "Recibió"].map(label => <Typography key={label} sx={{ width: "50%", borderTop: "1px solid #aaa", textAlign: "center", fontSize: 10, pt: .5 }}>{label}</Typography>)}</Stack>}
        {config.mensaje_2 && <Typography sx={{ fontSize: 11, textAlign: "center", mt: 2, whiteSpace: "pre-line" }}>{config.mensaje_2}</Typography>}
      </Box>}
    </Box>
    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>{channel === "payload" ? "Representación del diseño con datos y QR de ejemplo. El resultado en papel depende de la impresora del POS." : "Datos y QR de ejemplo. El PDF generado con una venta muestra el resultado final."}</Typography>
  </Box>;
}
