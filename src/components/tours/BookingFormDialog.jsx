import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import SaleClientAssign from "../POS/SaleClientAssign";
import { createBooking, getBookingCustomers, getDeparture, updateBooking } from "../../services/tours/tourService";
import { departureRecord, departureMoney } from "./departureUtils";
import { BOOKING_STATUSES, bookingError, bookingEstimate, bookingLimit } from "./bookingUtils";

export default function BookingFormDialog({ context, booking, onClose, onSaved, onSessionExpired }) {
  const { branchId, serviceId, departureId, mode, posLocationId } = context;
  const mobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [form, setForm] = useState({ customer_id: booking?.customer_id ?? null, registered_by: booking?.registered_by ?? undefined, passenger_count: booking?.passenger_count ?? 1, external_reference: booking?.external_reference || "", status: booking?.status || "pending", notes: booking?.notes || "" });
  const [data, setData] = useState({ loading: true, departure: null, clients: [], error: "" });
  const [revision, setRevision] = useState(0); const [saving, setSaving] = useState(false); const pending = useRef(false);
  const [error, setError] = useState(""); const [errors, setErrors] = useState({});
  const sessionRef = useRef(onSessionExpired); sessionRef.current = onSessionExpired;
  useEffect(() => {
    if (mode !== "pos") return;
    let active = true; const controller = new AbortController();
    setData((prev) => ({ ...prev, loading: true, error: "" }));
    const options = { branchId, serviceId, departureId, mode, posLocationId, signal: controller.signal };
    Promise.all([getDeparture(options, departureId), getBookingCustomers(options)]).then(([response, clients]) => {
      if (active) setData({ loading: false, departure: departureRecord(response.data), clients, error: "" });
    }).catch((err) => {
      if (!active) return;
      setData({ loading: false, departure: null, clients: [], error: bookingError(err) });
      if (err?.response?.status === 401) sessionRef.current();
    });
    return () => { active = false; controller.abort(); };
  }, [branchId, serviceId, departureId, mode, posLocationId, revision]);
  const limit = bookingLimit(data.departure, booking);
  const estimate = bookingEstimate(data.departure?.price, form.passenger_count);
  const clients = [...data.clients];
  if (booking?.customer_id && !clients.some((client) => Number(client.id) === Number(booking.customer_id))) {
    clients.push({ ...booking.customer, id: booking.customer_id, nombre_alias: booking.customer?.nombre_alias || booking.customer?.name || "Cliente #" + booking.customer_id });
  }
  const selectedClient = clients.find((client) => Number(client.id) === Number(form.customer_id)) || null;
  const change = (name) => (event) => { const value = event.target.value; setForm((prev) => ({ ...prev, [name]: value })); };
  const field = (name, label, props = {}) => <TextField fullWidth label={label} name={name} value={form[name] ?? ""} onChange={change(name)} error={!!errors[name]} helperText={Array.isArray(errors[name]) ? errors[name].join(" ") : errors[name]} {...props} />;
  const unavailable = data.loading || !!data.error || limit == null || (!booking && (!['scheduled', 'boarding'].includes(data.departure?.status) || estimate == null));
  const submit = async (event) => {
    event.preventDefault();
    if (pending.current || mode !== "pos" || unavailable) return;
    const next = {};
    if (!Number.isInteger(Number(form.passenger_count)) || Number(form.passenger_count) < 1 || Number(form.passenger_count) > limit) next.passenger_count = "Selecciona entre 1 y " + limit + " pasajeros.";
    if (!BOOKING_STATUSES.some(([status]) => status === form.status)) next.status = "Selecciona un estado válido.";
    setErrors(next); setError(""); if (Object.keys(next).length) return;
    pending.current = true; setSaving(true);
    const values = { ...form, passenger_count: Number(form.passenger_count), ...(!booking ? { subtotal: estimate, total: estimate } : {}) };
    try {
      const response = await (booking ? updateBooking(context, booking.id, values) : createBooking(context, values));
      onSaved(response.data?.booking ?? response.data?.data ?? null);
    } catch (err) {
      setError(bookingError(err)); setErrors(err?.response?.data?.errors || {});
      if (err?.response?.status === 401) onSessionExpired();
      if ([409, 422].includes(err?.response?.status)) setRevision((value) => value + 1);
    } finally { pending.current = false; setSaving(false); }
  };
  if (mode !== "pos") return null;
  return <Dialog open fullWidth maxWidth="sm" fullScreen={mobile} onClose={saving ? undefined : onClose} PaperProps={{ component: "form", onSubmit: submit }}>
    <DialogTitle>{booking ? "Editar reservación" : "Nueva reservación"}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      {error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{error}</Alert>}
      {data.error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }} action={<Button onClick={() => setRevision((value) => value + 1)}>Reintentar</Button>}>{data.error}</Alert>}
      {data.loading && <CircularProgress size={24} aria-label="Actualizando cupo y clientes" />}
      <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}><Stack spacing={2}>
        <SaleClientAssign clients={clients} value={selectedClient} title="Cliente de la reservación" showCreditStatus={false} disabled={saving || data.loading || !!data.error} onChange={(client) => setForm((prev) => ({ ...prev, customer_id: client?.id ?? null }))} />
        {errors.customer_id && <Alert severity="error">{[].concat(errors.customer_id).join(" ")}</Alert>}
        {field("registered_by", "Registrado por", { InputProps: { readOnly: true }, helperText: errors.registered_by ? [].concat(errors.registered_by).join(" ") : form.registered_by ? "Trabajador registrado en la reservación." : "Esta sesión no identifica un trabajador. Sin asignar." })}
        <Alert severity="info">Disponibles: {data.departure?.available_capacity ?? "Sin información"}.{booking && " La cantidad máxima incluye los lugares actuales de esta reservación."}</Alert>
        {field("passenger_count", "Cantidad de pasajeros", { type: "number", required: true, inputProps: { min: 1, max: limit ?? 0, step: 1 } })}
        {!booking && <><Typography>Precio de salida: {departureMoney(data.departure?.price)}</Typography><Typography fontWeight={800}>Subtotal estimado: {departureMoney(estimate)} · Total estimado: {departureMoney(estimate)}</Typography><Typography variant="caption">El importe final lo confirma el servidor al guardar.</Typography></>}
        {field("external_reference", "Referencia externa")}
        {field("status", "Estado", { select: true, required: true, children: BOOKING_STATUSES.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>) })}
        {field("notes", "Notas", { multiline: true, minRows: 3 })}
      </Stack></fieldset>
    </Stack></DialogContent><DialogActions><Button disabled={saving} onClick={onClose}>Cerrar</Button><Button type="submit" variant="contained" size="large" disabled={saving || unavailable || limit < 1}>{saving ? "Guardando…" : "Guardar reservación"}</Button></DialogActions>
  </Dialog>;
}
