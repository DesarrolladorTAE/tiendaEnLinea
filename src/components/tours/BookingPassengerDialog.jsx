import React, { useRef, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { addBookingPassenger, getBookingPassengers, updateBookingPassenger } from "../../services/tours/tourService";
import { BOARDING_STATUSES, PASSENGER_STATUSES, TRIP_TYPES, activeAssignment, activePassengerCount, passengerError, passengerName } from "./passengerUtils";
import { departureMoney } from "./departureUtils";

export default function BookingPassengerDialog({ context, booking, passenger, assignment, stops, onClose, onSaved, onRefresh, onSessionExpired }) {
  const mobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [form, setForm] = useState({ boarding_stop_id: stops.some((stop) => String(stop.id) === String(assignment?.boarding_stop_id)) ? assignment.boarding_stop_id : "",
    trip_type: assignment?.trip_type || "round_trip", transport_required: assignment ? [true, 1, "1"].includes(assignment.transport_required) : true,
    seat_number: assignment?.seat_number || "", status: assignment?.status || "reserved", notes: assignment?.notes || "" });
  const [saving, setSaving] = useState(false); const pending = useRef(false);
  const [error, setError] = useState(""); const [errors, setErrors] = useState({});
  const selectedStop = stops.find((stop) => String(stop.id) === String(form.boarding_stop_id));
  const field = (name, label, props = {}) => <TextField fullWidth name={name} label={label} value={form[name]} onChange={(event) => { const value = event.target.value; setForm((prev) => ({ ...prev, [name]: value })); }} error={!!errors[name]} helperText={[].concat(errors[name] || []).join(" ")} {...props} />;
  const submit = async (event) => {
    event.preventDefault(); if (pending.current) return;
    const next = {};
    if (!selectedStop || !Number.isSafeInteger(Number(selectedStop.id)) || Number(selectedStop.id) <= 0) next.boarding_stop_id = "Selecciona una parada válida de esta ruta.";
    if (!TRIP_TYPES.some(([value]) => value === form.trip_type)) next.trip_type = "Selecciona un tipo de viaje válido.";
    if (!PASSENGER_STATUSES.some(([value]) => value === form.status)) next.status = "Selecciona un estado válido.";
    setErrors(next); setError(""); if (Object.keys(next).length) return;
    pending.current = true; setSaving(true);
    try {
      const latest = await getBookingPassengers(context, booking.id);
      if (booking.status === "cancelled") throw new Error("La reservación está cancelada.");
      const otherActive = latest.filter((row) => String(row.id) !== String(assignment?.id) && activeAssignment(row));
      if (form.status !== "cancelled" && activePassengerCount(otherActive) >= Number(booking.passenger_count)) throw new Error("Se alcanzó el límite de pasajeros de la reservación.");
      if (!assignment && otherActive.some((row) => String(row.passenger_id) === String(passenger.id))) throw new Error("Este pasajero ya está asignado a la reservación.");
      const values = { ...form, boarding_stop_id: Number(form.boarding_stop_id), seat_number: form.seat_number || null };
      if (assignment) await updateBookingPassenger(context, booking.id, assignment.id, values);
      else await addBookingPassenger(context, booking.id, { ...values, passenger_id: passenger.id });
      onSaved();
    } catch (err) {
      setError(passengerError(err)); setErrors(err?.response?.data?.errors || {});
      if (err?.response?.status === 401) onSessionExpired();
      else onRefresh();
    } finally { pending.current = false; setSaving(false); }
  };
  return <Dialog open fullScreen={mobile} fullWidth maxWidth="sm" onClose={saving ? undefined : onClose} PaperProps={{ component: "form", onSubmit: submit }}>
    <DialogTitle>{assignment ? "Editar asignación" : "Asignar pasajero"}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      <Typography variant="h6">{passengerName(passenger)}</Typography>{passenger.passenger_code && <Typography>{passenger.passenger_code}</Typography>}
      {error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{error}</Alert>}
      {!stops.length && <Alert severity="warning">Esta salida no tiene puntos de abordaje configurados.</Alert>}
      <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}><Stack spacing={2}>
        {field("boarding_stop_id", "Parada de abordaje", { select: true, required: true, children: [<MenuItem key="none" value="">Selecciona una parada</MenuItem>, ...stops.map((stop) => <MenuItem key={stop.id} value={stop.id}>{stop.name}{stop.default_departure_time ? " · " + stop.default_departure_time.slice(0, 5) : ""}</MenuItem>)] })}
        {selectedStop && <Alert severity="info">Hora: {selectedStop.default_departure_time?.slice(0, 5) || "Sin horario"}<br />Tiempo de abordaje: {selectedStop.boarding_minutes == null ? "Sin definir" : selectedStop.boarding_minutes + " minutos"}<br />Ajuste de precio: {departureMoney(selectedStop.price_adjustment)}</Alert>}
        {field("trip_type", "Tipo de viaje", { select: true, children: TRIP_TYPES.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>) })}
        <FormControlLabel label="Requiere transporte" control={<Switch checked={form.transport_required} onChange={(event) => { const checked = event.target.checked; setForm((prev) => ({ ...prev, transport_required: checked })); }} />} />
        {field("seat_number", "Asiento (opcional)")}
        {field("status", "Estado", { select: true, children: PASSENGER_STATUSES.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>) })}
        {assignment?.boarding_status && <TextField label="Estado de abordaje" value={Object.fromEntries(BOARDING_STATUSES)[assignment.boarding_status] || assignment.boarding_status} InputProps={{ readOnly: true }} />}
        {field("notes", "Notas", { multiline: true, minRows: 2 })}
      </Stack></fieldset>
    </Stack></DialogContent><DialogActions><Button disabled={saving} onClick={onClose}>Cerrar</Button><Button size="large" variant="contained" type="submit" disabled={saving || !stops.length}>{saving ? "Guardando…" : "Guardar asignación"}</Button></DialogActions>
  </Dialog>;
}
