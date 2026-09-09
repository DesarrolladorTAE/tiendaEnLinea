import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Pagination, Snackbar, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAdminUi } from "../../context/AdminUiContext";
import { cancelDeparture, getDeparture, getDepartures } from "../../services/tours/tourService";
import { DEPARTURE_STATUSES, departureCollection, departureError, departureRecord } from "../../components/tours/departureUtils";
import TourBookingsPage from "./TourBookingsPage";
import DepartureCard from "../../components/tours/DepartureCard";
import DepartureFormDialog from "../../components/tours/DepartureFormDialog";
import { showConfirm } from "../../utils/alerts";

export default function TourDeparturesPage({ mode = "store", posBranchId, posServiceId, posLocationId, tourName, onBack }) {
  const params = useParams(); const navigate = useNavigate(); const location = useLocation();
  const { selectedBranch, setHideLayout } = useAdminUi();
  const branchId = Number(mode === "pos" ? posBranchId : params.branchId || selectedBranch?.id);
  const serviceId = Number(mode === "pos" ? posServiceId : params.serviceId);
  const valid = [branchId, serviceId].every((id) => Number.isSafeInteger(id) && id > 0);
  useEffect(() => { if (mode === "store") setHideLayout(false); }, [mode, setHideLayout]);
  const back = onBack || (() => navigate(valid ? `/admin/branches/${branchId}/tours` : "/admin/tours"));
  if (!valid) return <Alert severity="warning">Selecciona una sucursal y un tour válidos.<Button onClick={back}>Volver a Tours</Button></Alert>;
  return <DepartureList key={`${mode}-${branchId}-${serviceId}`} context={{ mode, branchId, serviceId, posLocationId }} tourName={tourName || location.state?.tourName} onBack={back} />;
}

function DepartureList({ context, tourName, onBack }) {
  const { mode, branchId, serviceId } = context; const isStore = mode === "store";
  const navigate = useNavigate(); const mobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [filters, setFilters] = useState({ date: "", status: "", page: 1 });
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ rows: [], lastPage: 1, loading: true, error: "" });
  const [preview, setPreview] = useState(null);
  const [bookingView, setBookingView] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false); const pending = useRef(false);
  const [notice, setNotice] = useState(null);
  const detailRequest = useRef(null); const mounted = useRef(true);
  const sessionExpired = useCallback(() => {
    // Return to existing login flows. POSWrapper revalidates /pos/me on reload.
    if (mode === "pos") window.location.reload();
    else navigate("/login-register", { replace: true });
  }, [mode, navigate]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; detailRequest.current?.abort(); };
  }, []);
  useEffect(() => {
    let active = true; const controller = new AbortController();
    setState({ rows: [], lastPage: 1, loading: true, error: "" });
    getDepartures({ mode, branchId, serviceId, signal: controller.signal }, filters).then(({ data }) => {
      if (!active) return;
      const result = departureCollection(data);
      if (filters.page > result.lastPage) { setFilters((prev) => ({ ...prev, page: Math.max(1, result.lastPage) })); return; }
      setState({ ...result, loading: false, error: "" });
    }).catch((error) => {
      if (!active) return;
      setState({ rows: [], lastPage: 1, loading: false, error: departureError(error) });
      if (error?.response?.status === 401) sessionExpired();
    });
    return () => { active = false; controller.abort(); };
  }, [mode, branchId, serviceId, filters, revision, sessionExpired]);

  const openBookings = (departure, creating = false) => {
    closePreview();
    if (mode === "pos") setBookingView({ departureId: departure.id, creating });
    else navigate(`/admin/branches/${branchId}/tours/${serviceId}/departures/${departure.id}/bookings`);
  };
  const closePreview = () => { detailRequest.current?.abort(); setPreview(null); };
  const openDeparture = async (row, editing = false) => {
    if (editing && !isStore) return;
    detailRequest.current?.abort();
    const controller = new AbortController(); detailRequest.current = controller;
    setPreview({ loading: true, record: null });
    try {
      const { data } = await getDeparture({ ...context, signal: controller.signal }, row.id);
      if (!mounted.current || controller.signal.aborted) return;
      const record = departureRecord(data);
      if (editing) { setPreview(null); setForm({ departure: record }); }
      else setPreview({ loading: false, record });
    } catch (error) {
      if (!mounted.current || controller.signal.aborted) return;
      setPreview(null); setNotice({ severity: "error", message: departureError(error) });
      if (error?.response?.status === 401) sessionExpired();
    }
  };
  const cancel = async (row) => {
    if (!isStore || pending.current) return;
    pending.current = true; setBusy(true);
    try {
      const confirmed = await showConfirm("¿Cancelar esta salida? El servidor validará si la operación está permitida.", "Sí, cancelar salida");
      if (!confirmed || !mounted.current) return;
      await cancelDeparture(context, row.id);
      if (!mounted.current) return;
      closePreview(); setNotice({ severity: "success", message: "Salida cancelada." }); setRevision((value) => value + 1);
    } catch (error) {
      if (!mounted.current) return;
      setNotice({ severity: "error", message: departureError(error) });
      if (error?.response?.status === 401) sessionExpired();
    } finally { pending.current = false; if (mounted.current) setBusy(false); }
  };
  if (bookingView) return <TourBookingsPage mode="pos" posContext={{ ...context, departureId: bookingView.departureId }} autoCreate={bookingView.creating} onBack={() => { setBookingView(null); setRevision((value) => value + 1); }} />;
  return <Box sx={{ maxWidth: 1400, mx: "auto", p: { xs: 2, sm: 3 }, bgcolor: "#fff", color: "#171b20", borderRadius: 3 }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} mb={3}>
      <Box><Typography variant="h4" fontWeight={900}>Salidas{tourName ? ` · ${tourName}` : ""}</Typography><Typography color="text.secondary">Sucursal #{branchId} · Tour #{serviceId}</Typography></Box>
      <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center"><Button variant="outlined" onClick={onBack}>Volver a Tours</Button>{isStore && <Button variant="contained" disabled={busy} onClick={() => setForm({ departure: null })}>Nueva salida</Button>}</Stack>
    </Stack>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
      <TextField label="Fecha" type="date" value={filters.date} InputLabelProps={{ shrink: true }} onChange={(event) => { const date = event.target.value; setFilters((prev) => ({ ...prev, date, page: 1 })); }} />
      <TextField select label="Estado" value={filters.status} sx={{ minWidth: 190 }} onChange={(event) => { const status = event.target.value; setFilters((prev) => ({ ...prev, status, page: 1 })); }}><MenuItem value="">Todos</MenuItem>{DEPARTURE_STATUSES.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
      <Button onClick={() => setFilters({ date: "", status: "", page: 1 })}>Limpiar filtros</Button>
    </Stack>
    {state.loading ? <Stack alignItems="center" py={5}><CircularProgress aria-label="Cargando salidas" /></Stack>
      : state.error ? <Alert severity="error" sx={{ whiteSpace: "pre-line" }} action={<Button onClick={() => setRevision((value) => value + 1)}>Reintentar</Button>}>{state.error}</Alert>
      : !state.rows.length ? <Alert severity="info">No hay salidas para esta selección.</Alert>
      : <Grid container spacing={2}>{state.rows.map((row) => <Grid key={row.id} size={{ xs: 12, sm: 6, lg: 4 }}><DepartureCard departure={row} mode={mode} busy={busy} onView={(item) => openDeparture(item)} onEdit={(item) => openDeparture(item, true)} onCancel={cancel} onBookings={openBookings} onNewBooking={(item) => openBookings(item, true)} /></Grid>)}</Grid>}
    {!state.loading && !state.error && state.lastPage > 1 && <Pagination sx={{ mt: 3 }} page={filters.page} count={state.lastPage} onChange={(_, page) => setFilters((prev) => ({ ...prev, page }))} />}
    {preview && <Dialog open fullScreen={mobile} fullWidth maxWidth="sm" onClose={busy ? undefined : closePreview}>
      <DialogTitle>Detalle de salida</DialogTitle><DialogContent>{preview.loading ? <Stack alignItems="center" py={5}><CircularProgress /></Stack> : <Stack spacing={2}>
        <DepartureCard departure={preview.record} mode={mode} onBookings={openBookings} onNewBooking={(item) => openBookings(item, true)} />
        <Typography>Regreso estimado: {preview.record.estimated_return_time?.slice(0, 5) || "Sin definir"}</Typography>
        <Typography sx={{ whiteSpace: "pre-wrap" }}>Notas: {preview.record.notes || "Sin notas"}</Typography>
      </Stack>}</DialogContent><DialogActions><Button disabled={busy} onClick={closePreview}>Cerrar</Button>{isStore && preview.record && <><Button disabled={busy} onClick={() => { setForm({ departure: preview.record }); closePreview(); }}>Editar</Button><Button color="error" disabled={busy || preview.record.status === "cancelled"} onClick={() => cancel(preview.record)}>Cancelar salida</Button></>}</DialogActions>
    </Dialog>}
    {isStore && form && <DepartureFormDialog context={context} departure={form.departure} onClose={() => setForm(null)} onSessionExpired={sessionExpired} onSaved={() => { setForm(null); setRevision((value) => value + 1); setNotice({ severity: "success", message: "Salida guardada correctamente." }); }} />}
    <Snackbar open={!!notice} autoHideDuration={notice?.severity === "error" ? null : 4500} onClose={() => setNotice(null)}><Alert severity={notice?.severity || "info"} onClose={() => setNotice(null)} sx={{ whiteSpace: "pre-line" }}>{notice?.message}</Alert></Snackbar>
  </Box>;
}
