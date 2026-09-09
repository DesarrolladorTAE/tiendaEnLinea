import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Pagination, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { getPassengers } from "../../services/tours/tourService";
import { passengerCollection, passengerError, passengerName } from "./passengerUtils";
import PassengerFormDialog from "./PassengerFormDialog";

export default function PassengerPickerDialog({ context, assignedIds, onClose, onSelect, onSessionExpired }) {
  const mobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false); const [notice, setNotice] = useState("");
  const [state, setState] = useState({ rows: [], lastPage: 1, loading: true, error: "" });
  const sessionRef = useRef(onSessionExpired); sessionRef.current = onSessionExpired;
  useEffect(() => {
    if (creating) return;
    let active = true; const controller = new AbortController();
    setState({ rows: [], lastPage: 1, loading: true, error: "" });
    const timer = setTimeout(() => {
      getPassengers({ ...context, signal: controller.signal }, { search, page }).then(({ data }) => {
        if (active) setState({ ...passengerCollection(data), loading: false, error: "" });
      }).catch((error) => {
        if (!active) return;
        setState({ rows: [], lastPage: 1, loading: false, error: passengerError(error) });
        if (error?.response?.status === 401) sessionRef.current();
      });
    }, 300);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [context, search, page, revision, creating]);
  if (creating) return <PassengerFormDialog context={context} onClose={() => setCreating(false)} onSessionExpired={onSessionExpired} onCreated={(passenger, name) => {
    if (passenger) onSelect(passenger);
    else { setCreating(false); setSearch(name); setPage(1); setRevision((value) => value + 1); setNotice("El pasajero fue creado. Selecciónalo en los resultados para continuar."); }
  }} />;
  return <Dialog open fullScreen={mobile} fullWidth maxWidth="sm" onClose={onClose}>
    <DialogTitle>Agregar pasajero</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      <TextField autoFocus fullWidth label="Buscar pasajero" placeholder="Nombre, apellido, teléfono, correo o código" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
      <Button size="large" variant="outlined" onClick={() => setCreating(true)}>Crear nuevo pasajero</Button>
      {notice && <Alert severity="info">{notice}</Alert>}
      {state.loading ? <CircularProgress aria-label="Buscando pasajeros" /> : state.error ? <Alert severity="error" sx={{ whiteSpace: "pre-line" }} action={<Button onClick={() => setRevision((value) => value + 1)}>Reintentar</Button>}>{state.error}</Alert> : <>
        {!state.rows.length && <Alert severity="info">No se encontraron pasajeros.</Alert>}
        {state.rows.map((passenger) => <Card variant="outlined" key={passenger.id}><CardContent><Stack spacing={1}><Typography fontWeight={800}>{passengerName(passenger)}</Typography><Typography>{passenger.passenger_code}</Typography><Typography variant="body2">{passenger.phone || passenger.email || "Sin datos de contacto"}</Typography><Button size="large" variant="contained" disabled={assignedIds.some((id) => String(id) === String(passenger.id))} onClick={() => onSelect(passenger)}>{assignedIds.some((id) => String(id) === String(passenger.id)) ? "Ya asignado" : "Seleccionar"}</Button></Stack></CardContent></Card>)}
        {state.lastPage > 1 && <Pagination page={page} count={state.lastPage} onChange={(_, value) => setPage(value)} />}
      </>}
    </Stack></DialogContent><DialogActions><Button onClick={onClose}>Cerrar</Button></DialogActions>
  </Dialog>;
}
