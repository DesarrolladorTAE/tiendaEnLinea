import TourModuleLayout from "../../components/tours/TourModuleLayout";
import TourCard from "../../components/tours/TourCard";
import TourSalesHistory from "../../components/tours/TourSalesHistory";
import { tourMenuProps } from "../../components/tours/tourFormStyles.mjs";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useAdminUi } from "../../context/AdminUiContext";
import { getTourServices, getDepartures, getManifest, downloadManifest } from "../../services/tours/tourService";
import { departureCollection, departureDate, departureMoney } from "../../components/tours/departureUtils";
import { bookingError } from "../../components/tours/bookingUtils";

const columns = [["numero", "N.º"], ["folio", "Folio"], ["registro", "Registró"], ["nombre", "Pasajero"], ["telefono", "Teléfono"], ["transporte", "Transporte"], ["total", "Total"], ["deposito", "Anticipo"], ["fecha_deposito", "Fecha de anticipo"], ["resto", "Saldo"], ["abordaje", "Parada"], ["ida", "Ida"], ["vuelta", "Regreso"], ["referencia_pago", "Referencia"], ["observaciones", "Observaciones"], ["estatus", "Estado"]];

export default function TourReportsPage({ mode = "store", posBranchId, posLocationId, onBack }) {
  const navigate = useNavigate();
  const back = mode === "store" ? () => navigate("/admin/reportes") : onBack;
  const { selectedBranch, setHideLayout } = useAdminUi();
  const branchId = Number(mode === "pos" ? posBranchId : selectedBranch?.id);
  useEffect(() => { if (mode === "store") setHideLayout(false); }, [mode, setHideLayout]);
  if (!Number.isSafeInteger(branchId) || branchId <= 0) return <Stack spacing={2}><Button startIcon={<ArrowBackRoundedIcon />} onClick={back} sx={{ alignSelf: "flex-start" }}>{mode === "store" ? "Regresar a Reportes" : "Volver al POS"}</Button><Alert severity="warning">Selecciona una sucursal para generar reportes.</Alert></Stack>;
  return <Reports key={`${mode}-${branchId}`} context={{ mode, branchId }} posLocationId={posLocationId} onBack={back} />;
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
  const download = async (format = "xlsx") => {
    if (downloadPending.current) return;
    downloadPending.current = true; setDownloading(true); setError("");
    try { await downloadManifest({ mode, branchId, departureId }, scope, format); }
    catch (e) { setError(bookingError(e)); }
    finally { downloadPending.current = false; setDownloading(false); }
  };
  return <TourModuleLayout title="Historial y reportes de servicios" description={`Sucursal #${branchId} - Consulta ventas, pasajeros y saldos por servicio.`} onBack={onBack}><Stack spacing={2}>
    {!serviceId ? <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))", lg: "repeat(3,minmax(0,1fr))" }, gap: 2 }}>{services.map(service => <TourCard key={service.id} tour={service} actionLabel="Consultar historial" onViewDepartures={item => setServiceId(item.id)} />)}</Box> : <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap"><Typography variant="h6" fontWeight={800}>{services.find(service => String(service.id) === String(serviceId))?.name}</Typography><Button variant="outlined" disabled={downloading} onClick={() => { setServiceId(""); setDepartureId(""); setManifest(null); }}>Cambiar servicio</Button></Stack>}
    {serviceId && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2,minmax(0,280px))" }, gap: 2 }}>

    <TextField size="small" select SelectProps={{ MenuProps: tourMenuProps }} label="Salida (opcional)" value={departureId} disabled={!serviceId || downloading} onChange={e => { setDepartureId(e.target.value); setManifest(null); }}><MenuItem value="">Todas las salidas</MenuItem>{departures.map(d => <MenuItem key={d.id} value={d.id}>{departureDate(d.departure_date)} · {d.departure_time?.slice(0, 5)} · #{d.id}</MenuItem>)}</TextField>
    <TextField size="small" select SelectProps={{ MenuProps: tourMenuProps }} label="Reservas incluidas" value={scope} disabled={downloading} onChange={e => { setScope(e.target.value); setManifest(null); }}><MenuItem value="">Todas las reservas de la sucursal</MenuItem>{posLocationId && <MenuItem value={posLocationId}>Solo este punto de venta</MenuItem>}</TextField></Box>}
    <Stack direction="row" flexWrap="wrap" gap={1}><Button disabled={loading || downloading} onClick={() => setRevision(v => v + 1)}>Actualizar</Button><Button variant="contained" disabled={!manifest || loading || downloading} onClick={() => download("xlsx")}>{downloading ? "Descargando…" : "Descargar Excel"}</Button><Button variant="contained" disabled={!manifest || loading || downloading} onClick={() => download("pdf")}>Descargar PDF</Button></Stack>
    {serviceId && <TourSalesHistory key={`${serviceId}-${departureId}-${scope}`} mode={mode} branchId={branchId} serviceId={serviceId} departureId={departureId} posLocationId={scope || undefined} />}
    {error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{error}</Alert>}
    {loading && <CircularProgress aria-label="Cargando reporte" />}
    {!loading && !error && !services.length && <Alert severity="info">No hay servicios tipo tour en esta sucursal.</Alert>}
    {!loading && !error && serviceId && !departures.length && <Alert severity="info">Este servicio no tiene salidas.</Alert>}
    {manifest && !loading && <>
      <Stack direction="row" flexWrap="wrap" gap={3}>{[["bookings", "Reservas"], ["sold_seats", "Lugares vendidos"], ["available_seats", "Disponibles en la salida"], ["total", "Total"], ["paid", "Recibido"], ["balance", "Saldo"]].map(([key, label]) => <Box key={key}><Typography variant="caption">{label}</Typography><Typography variant="h6">{['total', 'paid', 'balance'].includes(key) ? departureMoney(manifest.summary[key]) : manifest.summary[key] ?? "—"}</Typography></Box>)}</Stack>
      <Alert severity="info">Las reservas pendientes también retienen lugares. Los importes se muestran una sola vez por reserva; el dinero recibido corresponde al resumen del servidor.</Alert>
      {!manifest.rows.length ? <Alert severity="info">No hay pasajeros en este manifiesto.</Alert> : <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))", lg: "repeat(3,minmax(0,1fr))" }, gap: 2 }}>{manifest.rows.map((row, index) => <Box key={`${row.passenger_assignment_id}-${index}`} sx={{ p: 2, bgcolor: "#fff", border: "1px solid #e3e4e7", borderRadius: 3 }}><Typography fontWeight={800} mb={1}>{row.nombre || "Pasajero"}</Typography><Stack spacing={.75}>{columns.filter(([key]) => key !== "nombre" && row[key] != null && row[key] !== "").map(([key, label]) => <Stack key={key} direction="row" justifyContent="space-between" gap={1}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="body2" sx={{ textAlign: "right", overflowWrap: "anywhere", minWidth: 0 }}>{['total', 'deposito', 'resto'].includes(key) ? departureMoney(row[key]) : key === 'transporte' ? (Number(row[key]) ? 'Si' : 'No') : String(row[key])}</Typography></Stack>)}</Stack></Box>)}</Box>}
    </>}
  </Stack></TourModuleLayout>;
}
