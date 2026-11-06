import TourModuleLayout from "../../components/tours/TourModuleLayout";
import TourCard from "../../components/tours/TourCard";
import TourReportView from "../../components/tours/TourReportView";
import TourSalesHistory from "../../components/tours/TourSalesHistory";
import TourBookingDetailPage from "./TourBookingDetailPage";
import { tourMenuProps } from "../../components/tours/tourFormStyles.mjs";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, Stack, TextField, Typography, Paper, Tabs, Tab } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useAdminUi } from "../../context/AdminUiContext";
import { getTourServices, getDepartures, getManifestReport, downloadManifest } from "../../services/tours/tourService";
import { departureCollection, departureDate } from "../../components/tours/departureUtils";
import { bookingError } from "../../components/tours/bookingUtils";


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
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [services, setServices] = useState([]); const [serviceId, setServiceId] = useState("");
  const [departures, setDepartures] = useState([]); const [departureId, setDepartureId] = useState("");
  const [section, setSection] = useState("bookings");
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
    setManifest(null); if (!departureId || section !== "manifest") { setLoading("manifest", false); return; }
    const controller = new AbortController(); setLoading("manifest", true); setError("");
    getManifestReport({ mode, branchId, departureId, signal: controller.signal }, scope).then(html => {
      if (!controller.signal.aborted) setManifest(html);
    }).catch(e => { if (!controller.signal.aborted) setError(bookingError(e)); }).finally(() => { if (!controller.signal.aborted) setLoading("manifest", false); });
    return () => controller.abort();
  }, [mode, branchId, departureId, scope, revision, section, setLoading]);
  const download = async (format = "xlsx") => {
    if (downloadPending.current) return;
    downloadPending.current = true; setDownloading(true); setError("");
    try { await downloadManifest({ mode, branchId, departureId }, scope, format); }
    catch (e) { setError(bookingError(e)); }
    finally { downloadPending.current = false; setDownloading(false); }
  };
  return <>{selectedBooking && <TourBookingDetailPage mode="pos" posContext={{ branchId, serviceId, departureId: selectedBooking.departure_id || selectedBooking.departure?.id || departureId }} posBookingId={selectedBooking.id} onBack={() => { setSelectedBooking(null); setRevision(v => v + 1); }} />}
  <Box sx={{ display: selectedBooking ? "none" : "block" }}><TourModuleLayout title="Reservas de tours" description={`Sucursal #${branchId} - Consulta ventas, pasajeros y saldos por servicio.`} onBack={onBack}><Stack spacing={2}>
    {!serviceId ? <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))", lg: "repeat(3,minmax(0,1fr))" }, gap: 2 }}>{services.map(service => <TourCard key={service.id} tour={service} actionLabel="Consultar historial" onViewDepartures={item => setServiceId(item.id)} />)}</Box> : <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap"><Typography variant="h6" fontWeight={800}>{services.find(service => String(service.id) === String(serviceId))?.name}</Typography><Button variant="outlined" disabled={downloading} onClick={() => { setServiceId(""); setDepartureId(""); setManifest(null); }}>Cambiar servicio</Button></Stack>}
    {serviceId && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2,minmax(0,280px))" }, gap: 2 }}>

    <TextField size="small" select SelectProps={{ MenuProps: tourMenuProps }} label="Salida (opcional)" value={departureId} disabled={!serviceId || downloading} onChange={e => { setDepartureId(e.target.value); setManifest(null); if (!e.target.value && section === "manifest") setSection("bookings"); }}><MenuItem value="">Todas las salidas</MenuItem>{departures.map(d => <MenuItem key={d.id} value={d.id}>{departureDate(d.departure_date)} · {d.departure_time?.slice(0, 5)} · #{d.id}</MenuItem>)}</TextField>
    <TextField size="small" select SelectProps={{ MenuProps: tourMenuProps }} label="Origen de la reserva" value={scope} disabled={downloading} onChange={e => { setScope(e.target.value); setManifest(null); }}><MenuItem value="">Toda la sucursal (incluye reservas públicas)</MenuItem>{posLocationId && <MenuItem value={posLocationId}>Originadas en este punto de venta</MenuItem>}</TextField></Box>}
    {serviceId && <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, borderBottom: "1px solid #e3e4e7" }}>
        <Tabs value={section} onChange={(_, value) => setSection(value)} variant="scrollable" scrollButtons="auto"><Tab value="bookings" label="Reservas" /><Tab value="report" label="Registro de pasajeros" /><Tab value="manifest" label="Lista de salida" disabled={!departureId} /></Tabs>
        <Button size="small" disabled={loading || downloading} onClick={() => setRevision(v => v + 1)}>Actualizar</Button>
      </Stack>
      <Box sx={{ p: { xs: 2, md: 3 }, minWidth: 0 }}>
        {section !== "manifest" ? <TourSalesHistory key={`${serviceId}-${departureId}-${scope}`} mode={mode} branchId={branchId} serviceId={serviceId} departureId={departureId} posLocationId={scope || undefined} refreshKey={revision} activeView={section} onOpenBooking={mode === "pos" ? setSelectedBooking : undefined} /> : <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}><Box><Typography variant="h6" fontWeight={800}>Lista de salida</Typography><Typography variant="body2" color="text.secondary">Pasajeros activos y datos de abordaje de la salida seleccionada.</Typography></Box><Stack direction="row" gap={1}><Button variant="outlined" disabled={!manifest || loading || downloading} onClick={() => download("pdf")}>PDF</Button><Button variant="outlined" disabled={!manifest || loading || downloading} onClick={() => download("xlsx")}>Excel</Button></Stack></Stack>
          {manifest && !loading && <TourReportView html={manifest} title="Registro de pasajeros por salida" />}
        </Stack>}
      </Box>
    </Paper>}
    {error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{error}</Alert>}
    {loading && <CircularProgress aria-label="Cargando reporte" />}
    {!loading && !error && !services.length && <Alert severity="info">No hay servicios tipo tour en esta sucursal.</Alert>}
    {!loading && !error && serviceId && !departures.length && <Alert severity="info">Este servicio no tiene salidas.</Alert>}
  </Stack></TourModuleLayout></Box></>;
}
