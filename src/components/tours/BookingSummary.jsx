import React from "react";
import { Alert, Chip, Grid, Stack, Typography } from "@mui/material";
import { bookingNotificationLabel } from "./notificationUtils";
import { BOOKING_STATUSES, PAYMENT_STATUSES, customerLabel } from "./bookingUtils";
import { departureMoney, departureDate } from "./departureUtils";
export default function BookingSummary({ booking }) {
  return <Stack spacing={2}>
    <Typography variant="h5" fontWeight={900}>{booking.booking_code || "Reservación #" + booking.id}</Typography>
    <Stack direction="row" gap={1} flexWrap="wrap"><Chip label={Object.fromEntries(BOOKING_STATUSES)[booking.status] || booking.status || "Sin estado"} color={booking.status === "confirmed" ? "success" : booking.status === "cancelled" ? "error" : "warning"} /><Chip label={"Pago: " + (Object.fromEntries(PAYMENT_STATUSES)[booking.payment_status] || booking.payment_status || "Sin información")} color={booking.payment_status === "paid" ? "success" : "default"} /></Stack>
    <Typography>Cliente: {customerLabel(booking)}</Typography><Typography>Pasajeros: {booking.passenger_count ?? "—"}</Typography>
    <Grid container spacing={2}>{[["Subtotal", booking.subtotal], ["Total", booking.total], ["Pagado", booking.paid_amount], ["Saldo", booking.remaining_amount]].map(([label, value]) => <Grid key={label} size={{ xs: 6, sm: 3 }}><Typography variant="caption">{label}</Typography><Typography fontWeight={900} sx={{ overflowWrap: "anywhere" }}>{departureMoney(value)}</Typography></Grid>)}</Grid>
    <Typography variant="body2">Creada: {departureDate(booking.created_at)}</Typography>
    {booking.status === "confirmed" && Number(booking.remaining_amount) > 0 && <Alert severity="warning">Reserva aceptada con saldo pendiente. La aceptación no significa que esté liquidada.</Alert>}
    {booking.status === "pending" && <Alert severity="info">Solicitud pendiente de confirmación. Un comprobante recibido o un abono menor al anticipo requerido no significa que la reserva esté aceptada.</Alert>}
    {booking.status === "cancelled" && <Alert severity="warning">Cancelar la reserva no registra ni ejecuta un reembolso por sí solo.</Alert>}
    {(booking.notification_channels != null || booking.notification_channel != null) && <Typography variant="body2">Avisos al comprador: {bookingNotificationLabel(booking)}. Esta preferencia no confirma que los mensajes hayan sido entregados.</Typography>}
    {booking.external_reference && <Typography>Referencia: {booking.external_reference}</Typography>}
    {booking.notes && <Typography sx={{ whiteSpace: "pre-wrap" }}>Notas: {booking.notes}</Typography>}
  </Stack>;
}
