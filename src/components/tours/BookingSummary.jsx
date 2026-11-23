import React from "react";
import { Alert, Box, Chip, Divider, Stack, Typography } from "@mui/material";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { bookingNotificationLabel } from "./notificationUtils";
import { BOOKING_STATUSES, PAYMENT_STATUSES, customerLabel } from "./bookingUtils";
import { departureMoney, departureDate } from "./departureUtils";
export default function BookingSummary({ booking }) {
  return <Stack spacing={2.5}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
      <Stack direction="row" gap={1.5} alignItems="center">
        <Box sx={{ width: 46, height: 46, bgcolor: "#f3f4f6", borderRadius: 2.5, display: "grid", placeItems: "center", flexShrink: 0 }}><PersonOutlineRoundedIcon sx={{ color: "#626a76" }} /></Box>
        <Box sx={{ minWidth: 0 }}><Typography variant="overline" sx={{ color: "#717986", letterSpacing: 1.4, fontSize: 10, fontWeight: 800 }}>Titular de la reserva</Typography><Typography fontWeight={800} sx={{ fontSize: 19, overflowWrap: "anywhere", lineHeight: 1.3 }}>{customerLabel(booking)}</Typography></Box>
      </Stack>
      <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap"><Chip size="small" label={Object.fromEntries(BOOKING_STATUSES)[booking.status] || booking.status || "Sin estado"} color={booking.status === "confirmed" ? "success" : booking.status === "cancelled" ? "error" : "warning"} /><Chip size="small" variant="outlined" label={"Pago: " + (Object.fromEntries(PAYMENT_STATUSES)[booking.payment_status] || booking.payment_status || "Sin información")} color={booking.payment_status === "paid" ? "success" : "default"} /></Stack>
    </Stack>
    <Divider />
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", md: "repeat(4,minmax(0,1fr))" }, gap: 1.5 }}>
      {[["Total de la reserva", booking.total, false], ["Pagado", booking.paid_amount, false], ["Saldo pendiente", booking.remaining_amount, true], ["Pasajeros", booking.passenger_count, false]].map(([label, value, accent]) => <Box key={label} sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 2.5, bgcolor: accent ? "#fff8e3" : "#f7f8fa", border: "1px solid", borderColor: accent ? "#f3df9b" : "#edf0f3", minWidth: 0 }}><Typography sx={{ fontSize: 12, color: "#687180", fontWeight: 600 }}>{label}</Typography><Typography sx={{ mt: 1, fontSize: { xs: 22, md: 28 }, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-.04em", fontVariantNumeric: "tabular-nums", overflowWrap: "anywhere", color: "#202631" }}>{label === "Pasajeros" ? value ?? "—" : departureMoney(value)}</Typography></Box>)}
    </Box>
    <Stack direction={{ xs: "column", sm: "row" }} gap={1} justifyContent="space-between"><Typography variant="caption" color="text.secondary">Creada: {departureDate(booking.created_at)}</Typography>{booking.external_reference && <Typography variant="caption" color="text.secondary">Referencia: {booking.external_reference}</Typography>}</Stack>
    {booking.status === "confirmed" && Number(booking.remaining_amount) > 0 && <Alert severity="warning">Reserva aceptada con saldo pendiente. La aceptación no significa que esté liquidada.</Alert>}
    {booking.status === "pending" && <Alert severity="info">Solicitud pendiente de confirmación. Un comprobante recibido o un abono menor al anticipo requerido no significa que la reserva esté aceptada.</Alert>}
    {booking.status === "cancelled" && <Alert severity="warning">Cancelar la reserva no registra ni ejecuta un reembolso por sí solo.</Alert>}
    {(booking.notification_channels != null || booking.notification_channel != null) && <Typography variant="caption" color="text.secondary">Avisos al comprador: {bookingNotificationLabel(booking)}. Esta preferencia no confirma que los mensajes hayan sido entregados.</Typography>}
    {booking.notes && <Box sx={{ p: 2, bgcolor: "#f7f8fa", borderRadius: 2 }}><Typography variant="caption" fontWeight={800}>Notas de la reserva</Typography><Typography variant="body2" sx={{ mt: .5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{booking.notes}</Typography></Box>}
  </Stack>;
}
