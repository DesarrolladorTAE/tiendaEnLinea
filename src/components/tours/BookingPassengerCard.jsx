import React from "react";
import { Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { BOARDING_STATUSES, PASSENGER_STATUSES, TRIP_TYPES, activeAssignment, passengerName } from "./passengerUtils";
export default function BookingPassengerCard({ assignment, stops, canManage, busy, editDisabled = false, onEdit, onRemove }) {
  const passenger = assignment.passenger || { id: assignment.passenger_id };
  const stop = stops.find((item) => String(item.id) === String(assignment.boarding_stop_id));
  return <Card variant="outlined" sx={{ borderRadius: 3, opacity: activeAssignment(assignment) ? 1 : .7 }}><CardContent><Stack spacing={1.5}>
    <Typography variant="h6" fontWeight={800}>{passengerName(passenger)}</Typography>
    {passenger.passenger_code && <Typography>{passenger.passenger_code}</Typography>}
    <Typography>{stop?.name || assignment.boarding_stop?.name || (assignment.boarding_stop_id ? "Parada #" + assignment.boarding_stop_id : "Sin parada")}{stop?.default_departure_time ? " · " + stop.default_departure_time.slice(0, 5) : ""}</Typography>
    <Typography>{Object.fromEntries(TRIP_TYPES)[assignment.trip_type] || assignment.trip_type || "Sin tipo de viaje"}</Typography>
    <Typography variant="body2">Transporte: {[true, 1, "1"].includes(assignment.transport_required) ? "Sí" : "No"}{assignment.seat_number ? " · Asiento: " + assignment.seat_number : ""}</Typography>
    <Stack direction="row" gap={1} flexWrap="wrap"><Chip size="small" color={assignment.status === "cancelled" ? "error" : "info"} label={Object.fromEntries(PASSENGER_STATUSES)[assignment.status] || assignment.status || "Sin estado"} />{assignment.boarding_status && <Chip size="small" variant="outlined" label={"Abordaje: " + (Object.fromEntries(BOARDING_STATUSES)[assignment.boarding_status] || assignment.boarding_status)} />}</Stack>
    {assignment.notes && <Typography sx={{ whiteSpace: "pre-wrap" }}>{assignment.notes}</Typography>}
    {canManage && <Stack direction="row" gap={1}><Button size="large" disabled={busy || editDisabled} onClick={() => onEdit(assignment)}>Editar</Button><Button size="large" color="error" disabled={busy || !activeAssignment(assignment)} onClick={() => onRemove(assignment)}>Cancelar pasajero</Button></Stack>}
  </Stack></CardContent></Card>;
}
