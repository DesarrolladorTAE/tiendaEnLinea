import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useAdminUi } from "../../context/AdminUiContext";
import { getTourServices, getDepartures, getManifest, downloadManifest } from "../../services/tours/tourService";
import { departureCollection, departureDate, departureMoney } from "../../components/tours/departureUtils";
import { bookingError } from "../../components/tours/bookingUtils";

const columns = [["numero", "N.º"], ["folio", "Folio"], ["registro", "Registró"], ["nombre", "Pasajero"], ["telefono", "Teléfono"], ["transporte", "Transporte"], ["total", "Total"], ["deposito", "Anticipo"], ["fecha_deposito", "Fecha de anticipo"], ["resto", "Saldo"], ["abordaje", "Parada"], ["ida", "Ida"], ["vuelta", "Regreso"], ["referencia_pago", "Referencia"], ["observaciones", "Observaciones"], ["estatus", "Estado"]];

export default function TourReportsPage({ mode = "store", posBranchId, posLocationId, onBack }) {
  const { selectedBranch, setHideLayout } = useAdminUi();
  const branchId = Number(mode === "pos" ? posBranchId : selectedBranch?.id);
  useEffect(() => { if (mode === "store") setHideLayout(false); }, [mode, setHideLayout]);
  if (!Number.isSafeInteger(branchId) || branchId <= 0) return <Alert severity="warning">Selecciona una sucursal para generar reportes.</Alert>;
  return <Reports key={`${mode}-${branchId}`} context={{ mode, branchId }} posLocationId={posLocationId} onBack={onBack} />;
}

function Reports({ context, posLocationId, onBack }) {
  const [services, setServices] = useState([]); const [serviceId, setServiceId] = useState("");
  const [departures, setDepartures] = useState([]); const [departureId, setDepartureId] = useState("");
  const [scope, setScope] = useState(""); const [manifest, setManifest] = useState(null);
  const [error, setError] = useState(""); const [pendingLoads, setPendingLoads] = useState({});
  const loading = Object.values(pendingLoads).some(Boolean);
  const setLoading = useCallback((key, value) => setPendingLoads(prev => ({ ...prev, [key]: value })), []);
  const [downloading, setDownloading] = useState(false);
  const [revision, setRevision] = useState(0); const downloadPending = useRef(false);
  const { mode, branchId } = context;
  useEffect(() => {
    const controller = new AbortController(); setLoading("services", true); setError("");
    getTourServices({ mode, branchId, signal: controller.signal }).then(setServices).catch(e => { if (!controller.signal.aborted) setError(bookingError(e)); }).finally(() => { if (!controller.signal.aborted) setLoading("services", false); });
    return () => controller.abort();
  }, [mode, branchId, revision, setLoading]);
  useEffect(() => {
    if (!serviceId) { setLoading("departures", false); return; }
    const controller = new AbortController(); setLoading("departures", true); setError("");
    (async () => {
      const rows = []; let page = 1; let lastPage = 1;
      do {
        const response = await getDepartures({ mode, branchId, serviceId, signal: controller.signal }, { page });
        const result = departureCollection(response.data); rows.push(...result.rows); lastPage = result.lastPage; page += 1;
      } while (page <= lastPage);
      if (!controller.signal.aborted) setDepartures(rows);
    })().catch(e => { if (!controller.signal.aborted) setError(bookingError(e)); }).finally(() => { if (!controller.signal.aborted) setLoading("departures", false); });
    return () => controller.abort();
  }, [mode, branchId, serviceId, revision, setLoading]);
  useEffect(() => {
    setManifest(null); if (!departureId) { setLoading("manifest", false); return; }
    const controller = new AbortController(); setLoading("manifest", true); setError("");
    getManifest({ mode, branchId, departureId, signal: controller.signal }, scope).then(({ data }) => {
      if (!data?.data?.summary || !Array.isArray(data?.data?.rows)) throw new Error("No se pudo leer el manifiesto.");
      if (!controller.signal.aborted) setManifest(data.data);
    }).catch(e => { if (!controller.signal.aborted) setError(bookingError(e)); }).finally(() => { if (!controller.signal.aborted) setLoading("manifest", false); });
    return () => controller.abort();
  }, [mode, branchId, departureId, scope, revision, setLoading]);
  const download = async () => {
    if (downloadPending.current) return;
    downloadPending.current = true; setDownloading(true); setError("");
    try { await downloadManifest({ mode, branchId, departureId }, scope); }
    catch (e) { setError(bookingError(e)); }
    finally { downloadPending.current = false; setDownloading(false); }
  };
  return <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "background.paper", color: "text.primary", borderRadius: 3 }}><Stack spacing={2}>
    <Stack direction="row" justifyContent="space-between"><Typography variant="h4">Reportes de servicios</Typography>{onBack && <Button onClick={onBack}>Volver al POS</Button>}</Stack>
    <Typography>Manifiesto de pasajeros por salida · Sucursal #{branchId}</Typography>
    <TextField select label="Servicio" value={serviceId} disabled={downloading} onChange={e => { setServiceId(e.target.value); setDepartureId(""); setDepartures([]); setManifest(null); }}>{services.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}</TextField>
    <TextField select label="Salida" value={departureId} disabled={!serviceId || downloading} onChange={e => { setDepartureId(e.target.value); setManifest(null); }}>{departures.map(d => <MenuItem key={d.id} value={d.id}>{departureDate(d.departure_date)} · {d.departure_time?.slice(0, 5)} · #{d.id}</MenuItem>)}</TextField>
    <TextField select label="Reservas incluidas" value={scope} disabled={downloading} onChange={e => { setScope(e.target.value); setManifest(null); }}><MenuItem value="">Todas las reservas de la sucursal</MenuItem>{posLocationId && <MenuItem value={posLocationId}>Solo este punto de venta</MenuItem>}</TextField>
    <Stack direction="row" spacing={1}><Button disabled={loading || downloading} onClick={() => setRevision(v => v + 1)}>Actualizar</Button><Button variant="contained" disabled={!manifest || loading || downloading} onClick={download}>{downloading ? "Descargando…" : "Descargar Excel"}</Button></Stack>
    {error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{error}</Alert>}
    {loading && <CircularProgress aria-label="Cargando reporte" />}
    {!loading && !error && !services.length && <Alert severity="info">No hay servicios tipo tour en esta sucursal.</Alert>}
    {!loading && !error && serviceId && !departures.length && <Alert severity="info">Este servicio no tiene salidas.</Alert>}
    {manifest && !loading && <>
      <Stack direction="row" flexWrap="wrap" gap={3}>{[["bookings", "Reservas"], ["sold_seats", "Lugares vendidos"], ["available_seats", "Disponibles en la salida"], ["total", "Total"], ["paid", "Recibido"], ["balance", "Saldo"]].map(([key, label]) => <Box key={key}><Typography variant="caption">{label}</Typography><Typography variant="h6">{['total', 'paid', 'balance'].includes(key) ? departureMoney(manifest.summary[key]) : manifest.summary[key] ?? "—"}</Typography></Box>)}</Stack>
      <Alert severity="info">Las reservas pendientes también retienen lugares. Los importes se muestran una sola vez por reserva; el dinero recibido corresponde al resumen del servidor.</Alert>
      {!manifest.rows.length ? <Alert severity="info">No hay pasajeros en este manifiesto.</Alert> : <TableContainer><Table size="small"><TableHead><TableRow>{columns.map(([key, label]) => <TableCell key={key}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{manifest.rows.map((row, index) => <TableRow key={`${row.passenger_assignment_id}-${index}`}>{columns.map(([key]) => <TableCell key={key} sx={{ whiteSpace: "nowrap" }}>{row[key] == null ? "" : ['total', 'deposito', 'resto'].includes(key) ? departureMoney(row[key]) : key === 'transporte' ? (Number(row[key]) ? 'Sí' : 'No') : String(row[key])}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer>}
    </>}
  </Stack></Box>;
}
