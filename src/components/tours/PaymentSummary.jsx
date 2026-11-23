import React from "react";
import { Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import { BOOKING_PAYMENT_LABELS, paymentMoney } from "./paymentUtils";
export default function PaymentSummary({ booking }) {
  return <Card variant="outlined" sx={{ borderTop: "4px solid #f9b233", borderRadius: 3 }}><CardContent><Stack spacing={2}>
    <Grid container spacing={2}>{[["Total", booking.total], ["Pagado", booking.paid_amount], ["Saldo pendiente", booking.remaining_amount]].map(([label, amount]) => <Grid key={label} size={{ xs: 12, sm: 4 }}><Typography color="text.secondary">{label}</Typography><Typography variant="h4" fontWeight={900} sx={{ overflowWrap: "anywhere" }}>{paymentMoney(amount)}</Typography></Grid>)}</Grid>
    <Chip sx={{ alignSelf: "flex-start" }} color={booking.payment_status === "paid" ? "success" : booking.payment_status === "partial" ? "warning" : "default"} label={BOOKING_PAYMENT_LABELS[booking.payment_status] || booking.payment_status || "Sin información"} />
  </Stack></CardContent></Card>;
}
