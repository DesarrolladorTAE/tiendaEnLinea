import React from "react";
import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import { DEPARTURE_STATUSES, departureDate, departureMoney } from "./departureUtils";

export default function DepartureCard({ departure, mode, onView, onEdit, onCancel, onBookings, onNewBooking, busy = false }) {
  const route = departure.tour_route || departure.route;
  const routeName = route?.name || [route?.origin, route?.destination].filter(Boolean).join(" → ") || "Sin ruta";
  const state = DEPARTURE_STATUSES.find(([key]) => key === departure.status)?.[1] || departure.status || "Sin estado";
  const color = departure.status === "cancelled" ? "error" : departure.status === "completed" ? "success" : departure.status === "boarding" ? "warning" : "info";
  return <Card variant="outlined" sx={{ height: "100%", borderRadius: 3, bgcolor: "#fff", color: "#171b20" }}>
    <CardContent><Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" gap={1} flexWrap="wrap">
        <Box><Typography variant="h6" fontWeight={800}>{departureDate(departure.departure_date)}</Typography><Typography fontWeight={700}>{departure.departure_time?.slice(0, 5) || "—"}</Typography></Box>
        <Chip label={state} color={color} size="small" />
      </Stack>
      <Typography fontWeight={700}>{routeName}</Typography>
      {departure.resource && <Typography variant="body2">Recurso / vehículo: {departure.resource.name || departure.resource.resource_code || "—"}</Typography>}
      <Box><Typography variant="caption" color="text.secondary">Precio</Typography><Typography variant="h5" fontWeight={900}>{departureMoney(departure.price)}</Typography></Box>
      <Grid container spacing={1}>{[["Capacidad", departure.capacity], ["Reservados", departure.reserved_capacity], ["Disponibles", departure.available_capacity]].map(([label, value]) => <Grid key={label} size={4}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={800}>{value ?? "—"}</Typography></Grid>)}</Grid>
      {onView && <Stack direction="row" flexWrap="wrap" gap={1}>
        <Button variant="outlined" onClick={() => onView(departure)} disabled={busy}>Ver detalle</Button>
        {mode === "store" && <><Button onClick={() => onEdit(departure)} disabled={busy}>Editar</Button><Button color="error" onClick={() => onCancel(departure)} disabled={busy || departure.status === "cancelled"}>Cancelar salida</Button></>}
      </Stack>}
      {onBookings && <Stack direction="row" gap={1} flexWrap="wrap"><Button variant="outlined" disabled={busy} onClick={() => onBookings(departure)}>Ver reservaciones</Button>{mode === "pos" && onNewBooking && <Button variant="contained" disabled={busy || !["scheduled", "boarding"].includes(departure.status) || !(Number(departure.available_capacity) > 0)} onClick={() => onNewBooking(departure)}>Nueva reservación</Button>}</Stack>}
    </Stack></CardContent>
  </Card>;
}
