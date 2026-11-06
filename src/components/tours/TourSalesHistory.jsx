import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, CircularProgress, MenuItem, Pagination, Stack, TextField, Typography, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Collapse, Tabs, Tab } from "@mui/material";
import { getTourHistory, getTourHistoryReport } from "../../services/tours/tourService";
import TourReportView from "./TourReportView";
import { BOOKING_STATUSES, PAYMENT_STATUSES, bookingCollection, bookingError, customerLabel } from "./bookingUtils";
import { departureMoney } from "./departureUtils";
import { tourMenuProps } from "./tourFormStyles.mjs";
import { useNavigate } from "react-router-dom";
import TourBookingDetailPage from "../../pages/tours/TourBookingDetailPage";

export default function TourSalesHistory({ mode, branchId, serviceId, departureId, posLocationId, refreshKey = 0, activeView, onOpenBooking }) {
  const navigate = useNavigate();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [localView, setView] = useState("bookings");
  const view = activeView || localView;
  const [advanced, setAdvanced] = useState(false);
  const [report, setReport] = useState({ loading: true, html: "", error: "" });
  const [exportError, setExportError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const downloadPending = useRef(false);
  const [filters, setFilters] = useState({ search: "", status: "", payment_status: "", date_from: "", date_to: "" });
  const [query, setQuery] = useState(filters);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ loading: true, rows: [], lastPage: 1, error: "" });
  useEffect(() => {
    if (view !== "bookings") return;
    const controller = new AbortController();
    setState({ loading: true, rows: [], lastPage: 1, error: "" });
    const params = Object.fromEntries(Object.entries({ ...query, page, per_page: 16, departure_id: departureId, pos_location_id: posLocationId }).filter(([, value]) => value !== "" && value != null));
    getTourHistory({ mode, branchId, serviceId, signal: controller.signal }, params).then(({ data }) => {
      if (!controller.signal.aborted) setState({ ...bookingCollection(data), loading: false, error: "" });
    }).catch(error => { if (!controller.signal.aborted) setState({ loading: false, rows: [], lastPage: 1, error: bookingError(error) }); });
    return () => controller.abort();
  }, [mode, branchId, serviceId, departureId, posLocationId, query, page, revision, view, refreshKey]);
  useEffect(() => {
    if (view !== "report") return;
    const controller = new AbortController();
    setReport({ loading: true, html: "", error: "" });
    getTourHistoryReport({ mode, branchId, serviceId, signal: controller.signal }, { ...query, departure_id: departureId, pos_location_id: posLocationId })
      .then(html => { if (!controller.signal.aborted) setReport({ loading: false, html, error: "" }); })
      .catch(error => { if (!controller.signal.aborted) setReport({ loading: false, html: "", error: bookingError(error) }); });
    return () => controller.abort();
  }, [mode, branchId, serviceId, departureId, posLocationId, query, revision, view, refreshKey]);
  const download = async format => {
    if (downloadPending.current) return;
    downloadPending.current = true; setDownloading(true); setExportError("");
    try { await getTourHistoryReport({ mode, branchId, serviceId }, { ...query, departure_id: departureId, pos_location_id: posLocationId }, format); }
    catch (error) { setExportError(bookingError(error)); }
    finally { downloadPending.current = false; setDownloading(false); }
  };
  const field = key => ({ value: filters[key], onChange: e => setFilters(prev => ({ ...prev, [key]: e.target.value })) });
  if (selectedBooking) return <TourBookingDetailPage mode="pos" posContext={{ branchId, serviceId, departureId: selectedBooking.departure_id || selectedBooking.departure?.id || departureId }} posBookingId={selectedBooking.id} onBack={() => { setSelectedBooking(null); setRevision(value => value + 1); }} />;
  return <Stack spacing={2}>
    {!activeView && <Tabs value={view} onChange={(_, value) => setView(value)}><Tab value="bookings" label="Reservas" /><Tab value="report" label="Registro de pasajeros" /></Tabs>}
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3 }}>
      <Stack component="form" spacing={2} onSubmit={e => { e.preventDefault(); setPage(1); setQuery({ ...filters, search: filters.search.trim() }); setExportError(""); setRevision(v => v + 1); }}>
        <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
          <TextField fullWidth size="small" label="Buscar reserva" placeholder="Folio, comprador, tel\u00e9fono o pasajero" {...field("search")} />
          <Button type="submit" variant="contained" sx={{ minWidth: 110 }}>Buscar</Button>
          <Button onClick={() => setAdvanced(v => !v)} aria-expanded={advanced} sx={{ minWidth: 100 }}>Filtros</Button>
        </Stack>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          <Chip clickable label="Todas las reservas" color={!query.payment_status && !query.status ? "primary" : "default"} variant={!query.payment_status && !query.status ? "filled" : "outlined"} onClick={() => { const next = { search: "", status: "", payment_status: "", date_from: "", date_to: "" }; setFilters(next); setQuery(next); setPage(1); setRevision(v => v + 1); }} />
          <Chip clickable label="Con abonos y saldo" color={query.payment_status === "partial" ? "primary" : "default"} variant={query.payment_status === "partial" ? "filled" : "outlined"} onClick={() => { const next = { ...query, status: "", payment_status: "partial" }; setFilters(next); setQuery(next); setPage(1); setRevision(v => v + 1); }} />
          {query.search && <Chip label={`B\u00fasqueda: ${query.search}`} onDelete={() => { const next = { ...query, search: "" }; setFilters(next); setQuery(next); setPage(1); }} />}
        </Stack>
        <Collapse in={advanced}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 2, pt: 1 }}>
            {[["status", "Estado de reserva", BOOKING_STATUSES], ["payment_status", "Estado de pago", PAYMENT_STATUSES]].map(([key, label, options]) => <TextField size="small" key={key} fullWidth select label={label} {...field(key)} SelectProps={{ MenuProps: tourMenuProps }}><MenuItem value="">Todos</MenuItem>{options.map(([value, text]) => <MenuItem key={value} value={value}>{text}</MenuItem>)}</TextField>)}
            <TextField size="small" fullWidth type="date" label="Creada desde" InputLabelProps={{ shrink: true }} {...field("date_from")} />
            <TextField size="small" fullWidth type="date" label="Creada hasta" InputLabelProps={{ shrink: true }} inputProps={{ min: filters.date_from }} {...field("date_to")} />
          </Box>
          <Button type="submit" sx={{ mt: 1 }}>Aplicar filtros</Button>
        </Collapse>
      </Stack>
    </Paper>
    {view === "report" && <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}>
      <Box><Typography fontWeight={800}>Registro de pasajeros</Typography><Typography variant="body2" color="text.secondary">Reporte del backend con todos los resultados de la consulta.</Typography></Box>
      <Stack direction="row" gap={1}><Button disabled={downloading} variant="outlined" onClick={() => download("pdf")}>Descargar historial PDF</Button><Button disabled={downloading} variant="outlined" onClick={() => download("xlsx")}>Descargar historial Excel</Button>{downloading && <CircularProgress size={24} aria-label="Descargando historial" />}</Stack>
    </Stack>}
    {exportError && <Alert severity="error">{exportError}</Alert>}
    {view === "report" ? report.loading ? <CircularProgress aria-label="Consultando registro de pasajeros" /> : report.error ? <Alert severity="error">{report.error}</Alert> : <TourReportView html={report.html} title="Registro de pasajeros e historial de tours" /> : state.loading ? <CircularProgress aria-label="Consultando historial" /> : state.error ? <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{state.error}</Alert> : <>
      {!state.rows.length ? <Alert severity="info">No hay reservas con estos filtros.</Alert> : <TableContainer sx={{ border: "1px solid #d9dde3", borderRadius: 2, bgcolor: "#fff" }}>
        <Table size="small" aria-label="Historial de reservas y abonos" sx={{ minWidth: 820, "& th": { bgcolor: "#f5f6f8", py: 1.5 }, "& td": { py: 2 }, "& td:nth-of-type(5), & td:nth-of-type(6), & td:nth-of-type(7)": { textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" } }}>
          <TableHead><TableRow>{["Reserva", "Comprador", "Estado", "Pago", "Total", "Pagado", "Saldo", ""].map(label => <TableCell key={label} sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>{label}</TableCell>)}</TableRow></TableHead>
          <TableBody>{state.rows.map(row => <TableRow key={row.id} hover>
            <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>{row.folio || row.booking_code || row.code || `Reserva #${row.id}`}</TableCell>
            <TableCell>{customerLabel(row)}</TableCell>
            <TableCell><Chip size="small" label={Object.fromEntries(BOOKING_STATUSES)[row.status] || row.status || "Sin estado"} /></TableCell>
            <TableCell><Chip size="small" label={row.payment_status === "partial" ? "Con abonos" : Object.fromEntries(PAYMENT_STATUSES)[row.payment_status] || row.payment_status || "Pendiente"} color={row.payment_status === "paid" ? "success" : "warning"} /></TableCell>
            <TableCell>{departureMoney(row.total)}</TableCell><TableCell>{departureMoney(row.paid_amount)}</TableCell><TableCell>{departureMoney(row.remaining_amount)}</TableCell>
            <TableCell>{(row.departure_id || row.departure?.id || departureId) && <Button sx={{ whiteSpace: "nowrap" }} variant="outlined" onClick={() => onOpenBooking ? onOpenBooking(row) : mode === "pos" ? setSelectedBooking(row) : navigate(`/admin/branches/${branchId}/tours/${serviceId}/departures/${row.departure_id || row.departure?.id || departureId}/bookings/${row.id}`)}>Abrir reserva</Button>}</TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </TableContainer>}
      {state.lastPage > 1 && <Pagination page={page} count={state.lastPage} onChange={(_, next) => setPage(next)} />}
    </>}
  </Stack>;
}
