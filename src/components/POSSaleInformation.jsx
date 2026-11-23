import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { posDate, posDateValue, posMoney, validAmount, saleInfo } from "../utils/posSaleInfo";

export function SaleTypeChip({ sale }) {
  const info = saleInfo(sale);
  return <Chip size="small" color={info.color} label={info.label}
    icon={info.type === "unknown" ? undefined : info.type === "cash" ? <PaymentsRoundedIcon /> : <CalendarTodayRoundedIcon />} />;
}

export default function POSSaleInformation({ sale, payments = [] }) {
  const info = saleInfo(sale);
  const movements = Array.isArray(sale.credit_movements) ? sale.credit_movements : [];
  const events = [{ label: "Venta registrada", date: sale.created_at }];
  if (sale.credit_granted_at || sale.credit?.created_at) events.push({ label: "Crédito otorgado", date: sale.credit_granted_at || sale.credit.created_at });
  const recorded = [
    ...payments.map(payment => ({ label: "Pago registrado", date: payment.paid_at || payment.created_at, amount: payment.amount })),
    ...movements.map(movement => ({ label: movement.type_label || "Movimiento de crédito", date: movement.created_at, amount: movement.amount })),
  ];
  recorded.sort((a, b) => (posDateValue(a.date)?.getTime() ?? Infinity) - (posDateValue(b.date)?.getTime() ?? Infinity));
  events.push(...recorded);
  if (info.paymentDate) events.push({ label: info.type === "credit_paid" ? "Venta liquidada" : "Pago completado", date: info.paymentDate });
  if (sale.facturable === true) events.push({ label: "Disponible para facturar · periodo", date: sale.invoice_period_date });
  if (info.invoiced) events.push({ label: "Factura timbrada", date: sale.invoice?.timbrado_at });
  return <Box sx={theme => ({ p: { xs: 1.5, sm: 2.5 }, border: "1px solid", borderColor: alpha(theme.palette.primary.main, 0.15), borderRadius: 4, background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)}, ${theme.palette.background.paper})` })}>
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <ReceiptLongRoundedIcon color="primary" />
        <Typography fontWeight={900} sx={{ mr: "auto" }}>Información de la venta</Typography>
        <SaleTypeChip sale={sale} /><Chip size="small" label={info.invoiceLabel} color={info.invoiceColor} variant="outlined" />
      </Stack>
      {info.type === "unknown" && <Typography variant="body2" color="text.secondary">No se recibió información suficiente para confirmar si la venta fue de contado o a crédito.</Typography>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
        {[["Fecha de venta", sale.created_at, true], ["Pago / liquidación", info.paymentDate, true], ["Periodo de facturación", sale.invoice_period_date, false]].map(([label, date, detailed]) =>
          <Box key={label} sx={theme => ({ p: 1.5, borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.8), border: "1px solid", borderColor: "divider" })}>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}><CalendarTodayRoundedIcon color="primary" sx={{ fontSize: 16 }} /><Typography variant="caption" color="text.secondary">{label}</Typography></Stack>
            <Typography variant="body2" fontWeight={700}>{posDate(date, detailed)}</Typography>
          </Box>)}
      </Box>
      {sale.fuera_de_rango && <Typography color="text.secondary">{sale.fuera_de_rango_reason || sale.invoice_status_name || "Fuera del periodo de facturación permitido."}</Typography>}
      <Box>
        <Typography fontWeight={800} sx={{ mb: 2 }}>Historial de la venta</Typography>
        {payments.length > 0 && movements.length > 0 && <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>Los movimientos de crédito pueden corresponder a los mismos pagos; sus importes no se suman entre sí.</Typography>}
        <Stack spacing={0}>
          {events.map((event, index) => <Stack key={index} direction="row" spacing={1.5}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 30, flexShrink: 0 }}>
              <Box sx={theme => ({ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.1) })}><CheckCircleRoundedIcon sx={{ fontSize: 18 }} /></Box>
              {index < events.length - 1 && <Box sx={{ width: 2, flex: 1, minHeight: 20, bgcolor: "divider", my: 0.5 }} />}
            </Box>
            <Box sx={{ minWidth: 0, pb: index < events.length - 1 ? 2 : 0, pt: 0.25 }}>
              <Typography variant="body2" fontWeight={800}>{event.label}</Typography>
              <Typography variant="caption" color="text.secondary">{posDate(event.date, true)}{event.amount != null && ` · ${posMoney(validAmount(event.amount))}`}</Typography>
            </Box>
          </Stack>)}
        </Stack>
      </Box>
    </Stack>
  </Box>;
}
