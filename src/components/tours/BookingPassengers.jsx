import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, CircularProgress, Grid, Snackbar, Stack, Typography } from "@mui/material";
import { getBookingPassengers, getRouteStops, removeBookingPassenger } from "../../services/tours/tourService";
import { activeAssignment, activePassengerCount, assignmentLimitReached, passengerError, routeStop } from "./passengerUtils";
import { showConfirm } from "../../utils/alerts";
import BookingPassengerCard from "./BookingPassengerCard";
import PassengerPickerDialog from "./PassengerPickerDialog";
import BookingPassengerDialog from "./BookingPassengerDialog";

export default function BookingPassengers({ context, booking, departure, onChanged, onSessionExpired }) {
  const [state, setState] = useState({ rows: [], loading: true, error: "" });
  const [route, setRoute] = useState({ stops: [], loading: true, error: "" });
  const [revision, setRevision] = useState(0); const [routeRevision, setRouteRevision] = useState(0);
  const [picker, setPicker] = useState(false); const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false); const pending = useRef(false); const mounted = useRef(true);
  const [notice, setNotice] = useState(null);
  const sessionRef = useRef(onSessionExpired); sessionRef.current = onSessionExpired;
  const routeId = departure.tour_route_id;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let active = true; const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    getBookingPassengers({ ...context, signal: controller.signal }, booking.id).then((rows) => {
      if (active) setState({ rows, loading: false, error: "" });
    }).catch((err) => {
      if (!active) return;
      setState({ rows: [], loading: false, error: passengerError(err) });
      if (err?.response?.status === 401) sessionRef.current();
    });
    return () => { active = false; controller.abort(); };
  }, [context, booking.id, revision]);
  useEffect(() => {
    let active = true; const controller = new AbortController();
    setRoute({ stops: [], loading: true, error: "" });
    const request = routeId ? getRouteStops({ ...context, signal: controller.signal }, routeId) : Promise.resolve([]);
    request.then((rows) => {
      if (active) setRoute({ stops: rows.map(routeStop), loading: false, error: "" });
    }).catch((err) => {
      if (!active) return;
      setRoute({ stops: [], loading: false, error: passengerError(err) });
      if (err?.response?.status === 401) sessionRef.current();
    });
    return () => { active = false; controller.abort(); };
  }, [context, routeId, routeRevision]);
  const reload = () => setRevision((value) => value + 1);
  const canManage = ["store", "pos"].includes(context.mode) && booking.status !== "cancelled";
  const count = activePassengerCount(state.rows);
  const atLimit = assignmentLimitReached(state.rows, booking.passenger_count);
  const blocked = busy || state.loading || !!state.error || route.loading || !!route.error;
  const remove = async (assignment) => {
    if (!canManage || pending.current) return;
    pending.current = true; setBusy(true);
    try {
      const confirmed = await showConfirm("¿Cancelar este pasajero de la reservación? Su registro e historial se conservarán.", "Sí, cancelar pasajero");
      if (!confirmed || !mounted.current) return;
      await removeBookingPassenger(context, booking.id, assignment.id);
      if (mounted.current) { reload(); onChanged(); }
    } catch (err) {
      if (!mounted.current) return;
      setNotice(passengerError(err));
      if (err?.response?.status === 401) onSessionExpired();
    } finally { pending.current = false; if (mounted.current) setBusy(false); }
  };
  return <Stack spacing={2}>
    <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1}><Typography variant="h6" fontWeight={800}>Pasajeros {state.loading || state.error ? "—" : count} / {booking.passenger_count}</Typography>{canManage && <Button size="large" variant="contained" disabled={blocked || atLimit || !route.stops.length} onClick={() => setPicker(true)}>Agregar pasajero</Button>}</Stack>
    {!state.loading && !state.error && count < Number(booking.passenger_count) && <Alert severity="info">La reservación mantiene {booking.passenger_count} lugares reservados aunque actualmente tiene {count} pasajeros activos.</Alert>}
    {route.error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }} action={<Button onClick={() => setRouteRevision((value) => value + 1)}>Reintentar</Button>}>{route.error}</Alert>}
    {!route.loading && !route.error && !route.stops.length && <Alert severity="warning">Esta salida no tiene puntos de abordaje configurados.</Alert>}
    {state.loading ? <CircularProgress size={28} aria-label="Cargando pasajeros asignados" /> : state.error ? <Alert severity="error" sx={{ whiteSpace: "pre-line" }} action={<Button onClick={reload}>Reintentar</Button>}>{state.error}</Alert> : <>
      {!state.rows.length && <Typography color="text.secondary">Todavía no hay pasajeros asignados.</Typography>}
      <Grid container spacing={2}>{state.rows.map((assignment) => <Grid key={assignment.id} size={{ xs: 12, md: 6 }}><BookingPassengerCard assignment={assignment} stops={route.stops} canManage={canManage} busy={busy || state.loading || !!state.error} editDisabled={route.loading || !!route.error} onEdit={(row) => setEditor({ assignment: row, passenger: row.passenger || { id: row.passenger_id } })} onRemove={remove} /></Grid>)}</Grid>
    </>}
    {picker && canManage && <PassengerPickerDialog context={context} assignedIds={state.rows.filter(activeAssignment).map((row) => row.passenger_id)} onClose={() => setPicker(false)} onSessionExpired={onSessionExpired} onSelect={(passenger) => { setPicker(false); setEditor({ passenger }); }} />}
    {editor && canManage && <BookingPassengerDialog context={context} booking={booking} {...editor} stops={route.stops} onClose={() => setEditor(null)} onSessionExpired={onSessionExpired} onRefresh={reload} onSaved={() => { setEditor(null); reload(); onChanged(); }} />}
    <Snackbar open={!!notice} onClose={() => setNotice(null)}><Alert severity="error" onClose={() => setNotice(null)} sx={{ whiteSpace: "pre-line" }}>{notice}</Alert></Snackbar>
  </Stack>;
}
