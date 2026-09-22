import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, TextField } from "@mui/material";
import { createAssistedSale, getRouteStops } from "../../services/tours/tourService";
import { bookingError } from "./bookingUtils";
import { PAYMENT_METHODS, paymentCents } from "./paymentUtils";

export default function AssistedSaleDialog({ context, departure, onClose, onSaved, onSessionExpired }) {
  const [form, setForm] = useState({ buyer_name: "", buyer_phone: "", buyer_email: "", boarding_stop_id: "", payment_option: "deposit", trip_type: "round_trip", transport_required: true, notes: "" });
  const [passengers, setPassengers] = useState([{ first_name: "", last_name: "" }]);
  const [stops, setStops] = useState([]); const [loading, setLoading] = useState(true);
  const [collect, setCollect] = useState(false); const [verified, setVerified] = useState(false);
  const [payment, setPayment] = useState({ amount: "", payment_method: "cash", reference: "" });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [uncertain, setUncertain] = useState(false);
  const pending = useRef(false);
  const routeId = departure?.tour_route_id || departure?.tour_route?.id || departure?.route?.id;
  useEffect(() => {
    const controller = new AbortController();
    getRouteStops({ ...context, signal: controller.signal }, routeId).then(setStops).catch(e => { if (!controller.signal.aborted) setError(bookingError(e)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [context, routeId]);
  const field = key => ({ value: form[key], onChange: e => setForm(prev => ({ ...prev, [key]: e.target.value })) });
  const submit = async e => {
    e.preventDefault(); if (pending.current || uncertain) return;
    if (collect && (!verified || !(paymentCents(payment.amount) > 0))) { setError("Verifica el cobro e ingresa un importe positivo con máximo dos decimales."); return; }
    pending.current = true; setBusy(true); setError("");
    try {
      await createAssistedSale(context, {
        ...form, buyer_name: form.buyer_name.trim(), boarding_stop_id: Number(form.boarding_stop_id),
        passengers: passengers.map(p => ({ first_name: p.first_name.trim(), last_name: p.last_name.trim() })),
        ...(collect ? { payment: { ...payment, payment_type: form.payment_option === "full" ? "full" : "deposit", payment_date: new Date().toISOString() } } : {}),
      });
      onSaved();
    } catch (err) {
      const ambiguous = !err.response || err.response.status >= 500;
      setUncertain(ambiguous); setError(bookingError(err));
      if (err.response?.status === 401) onSessionExpired();
    } finally { pending.current = false; setBusy(false); }
  };
  return <Dialog open fullWidth maxWidth="md" onClose={busy ? undefined : onClose}>
    <DialogTitle>Nueva venta de servicio</DialogTitle>
    <form onSubmit={submit}><DialogContent><Stack spacing={2}>
      <Alert severity="info">El servidor calcula el precio y el anticipo. Puedes guardar sin cobro y registrar el pago desde el detalle de la reserva.</Alert>
      {error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{error}</Alert>}
      {uncertain && <Alert severity="warning">No se pudo confirmar el resultado. Cierra y actualiza las reservas antes de intentar otra venta para evitar duplicados.</Alert>}
      <fieldset disabled={busy || uncertain} style={{ border: 0, padding: 0 }}><Stack spacing={2}>
        <TextField required label="Nombre del comprador" {...field("buyer_name")} inputProps={{ maxLength: 191, pattern: ".*\\S.*" }} />
        <TextField required label="Teléfono (10 dígitos)" {...field("buyer_phone")} inputProps={{ pattern: "[0-9]{10}", maxLength: 10 }} />
        <TextField type="email" label="Correo del comprador (opcional)" {...field("buyer_email")} />
        <TextField select required label="Parada de abordaje" {...field("boarding_stop_id")} disabled={loading}>
          {stops.filter(s => s.is_active !== false && s.is_active !== 0 && s.is_active !== "0").map(s => <MenuItem key={s.id} value={s.id}>{s.name || s.stop?.name || `Parada #${s.id}`}</MenuItem>)}
        </TextField>
        {!loading && !stops.length && <Alert severity="warning">Esta ruta no tiene paradas disponibles.</Alert>}
        <TextField select label="Modalidad de pago" {...field("payment_option")}><MenuItem value="deposit">Anticipo</MenuItem><MenuItem value="full">Pago completo</MenuItem></TextField>
        <TextField select label="Viaje" {...field("trip_type")}><MenuItem value="round_trip">Ida y regreso</MenuItem><MenuItem value="one_way">Solo ida</MenuItem><MenuItem value="return_only">Solo regreso</MenuItem></TextField>
        <FormControlLabel control={<Checkbox checked={form.transport_required} onChange={e => setForm(prev => ({ ...prev, transport_required: e.target.checked }))} />} label="Requiere transporte" />
        {passengers.map((p, index) => <Stack key={index} direction={{ xs: "column", sm: "row" }} spacing={1}>
          {[['first_name', 'Nombre'], ['last_name', 'Apellidos']].map(([key, label]) => <TextField key={key} required={key === 'first_name'} label={`${label} del pasajero ${index + 1}`} value={p[key]} inputProps={{ maxLength: 191, ...(key === 'first_name' ? { pattern: ".*\\S.*" } : {}) }} onChange={e => setPassengers(prev => prev.map((row, i) => i === index ? { ...row, [key]: e.target.value } : row))} />)}
          <Button disabled={passengers.length === 1} onClick={() => setPassengers(prev => prev.filter((_, i) => i !== index))}>Quitar</Button>
        </Stack>)}
        <Button disabled={passengers.length >= Math.min(1000, Number(departure.available_capacity) || 1000)} onClick={() => setPassengers(prev => [...prev, { first_name: "", last_name: "" }])}>Agregar pasajero</Button>
        <TextField multiline label="Observaciones" {...field("notes")} />
        <FormControlLabel control={<Checkbox checked={collect} onChange={e => setCollect(e.target.checked)} />} label="Registrar cobro inicial" />
        {collect && <>
          <TextField required label="Importe recibido" value={payment.amount} onChange={e => setPayment(p => ({ ...p, amount: e.target.value }))} inputProps={{ inputMode: "decimal" }} />
          <TextField select label="Método de pago" value={payment.payment_method} onChange={e => setPayment(p => ({ ...p, payment_method: e.target.value }))}>{PAYMENT_METHODS.filter(([key]) => key !== 'online').map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField>
          <TextField label="Referencia" value={payment.reference} onChange={e => setPayment(p => ({ ...p, reference: e.target.value }))} />
          <FormControlLabel control={<Checkbox checked={verified} onChange={e => setVerified(e.target.checked)} />} label="Verifiqué que el cobro fue recibido" />
        </>}
      </Stack></fieldset>
    </Stack></DialogContent><DialogActions><Button disabled={busy} onClick={onClose}>Cerrar</Button><Button type="submit" variant="contained" disabled={busy || loading || uncertain || !form.boarding_stop_id || (collect && !verified)}>{busy ? "Guardando…" : "Registrar venta"}</Button></DialogActions></form>
  </Dialog>;
}
