import React, { useEffect, useState } from "react";
import { Alert, Button, CircularProgress, MenuItem, Pagination, Stack, TextField, Typography, Box, Card, CardContent, Chip } from "@mui/material";
import { getTourHistory } from "../../services/tours/tourService";
import { BOOKING_STATUSES, PAYMENT_STATUSES, bookingCollection, bookingError, customerLabel } from "./bookingUtils";
import { departureMoney } from "./departureUtils";
import { tourMenuProps } from "./tourFormStyles.mjs";

export default function TourSalesHistory({ mode, branchId, serviceId, departureId, posLocationId }) {
  const [filters, setFilters] = useState({ search: "", status: "", payment_status: "", date_from: "", date_to: "" });
  const [query, setQuery] = useState(filters);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ loading: true, rows: [], lastPage: 1, error: "" });
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, rows: [], lastPage: 1, error: "" });
    const params = Object.fromEntries(Object.entries({ ...query, page, per_page: 16, departure_id: departureId, pos_location_id: posLocationId }).filter(([, value]) => value !== "" && value != null));
    getTourHistory({ mode, branchId, serviceId, signal: controller.signal }, params).then(({ data }) => {
      if (!controller.signal.aborted) setState({ ...bookingCollection(data), loading: false, error: "" });
    }).catch(error => { if (!controller.signal.aborted) setState({ loading: false, rows: [], lastPage: 1, error: bookingError(error) }); });
    return () => controller.abort();
  }, [mode, branchId, serviceId, departureId, posLocationId, query, page, revision]);
  const field = key => ({ value: filters[key], onChange: e => setFilters(prev => ({ ...prev, [key]: e.target.value })) });
  return <Stack spacing={2}>
    <Typography variant="h5" fontWeight={800}>Historial de ventas del servicio</Typography>
    <Typography variant="body2">Incluye reservas publicas y ventas de la sucursal, tambien canceladas. Las fechas filtran el registro de la venta.</Typography>
    <Stack component="form" spacing={2} onSubmit={e => { e.preventDefault(); setPage(1); setQuery({ ...filters }); setRevision(v => v + 1); }}>
      <TextField size="small" label="Buscar folio, comprador, telefono o pasajero" {...field("search")} />
      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
        {[["status", "Estado", BOOKING_STATUSES], ["payment_status", "Pago", PAYMENT_STATUSES]].map(([key, label, options]) => <TextField size="small" key={key} fullWidth select label={label} {...field(key)} SelectProps={{ MenuProps: tourMenuProps }}><MenuItem value="">Todos</MenuItem>{options.map(([value, text]) => <MenuItem key={value} value={value}>{text}</MenuItem>)}</TextField>)}
        <TextField size="small" fullWidth type="date" label="Desde" InputLabelProps={{ shrink: true }} {...field("date_from")} />
        <TextField size="small" fullWidth type="date" label="Hasta" InputLabelProps={{ shrink: true }} inputProps={{ min: filters.date_from }} {...field("date_to")} />
      </Stack>
      <Button type="submit" variant="outlined">Consultar historial</Button>
    </Stack>
    {state.loading ? <CircularProgress aria-label="Consultando historial" /> : state.error ? <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{state.error}</Alert> : <>
      {!state.rows.length ? <Alert severity="info">No hay ventas con estos filtros.</Alert> : <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))", xl: "repeat(3,minmax(0,1fr))" }, gap: 2 }}>{state.rows.map(row => <Card key={row.id} variant="outlined"><CardContent><Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" gap={1} flexWrap="wrap"><Typography fontWeight={800} sx={{ overflowWrap: "anywhere" }}>{row.folio || row.booking_code || `Reserva #${row.id}`}</Typography><Chip size="small" label={Object.fromEntries(BOOKING_STATUSES)[row.status] || row.status} color={row.status === "cancelled" ? "error" : row.status === "confirmed" ? "success" : "default"} /></Stack>
        <Typography sx={{ overflowWrap: "anywhere" }}>{customerLabel(row)}</Typography>
        <Chip size="small" sx={{ alignSelf: "flex-start" }} label={Object.fromEntries(PAYMENT_STATUSES)[row.payment_status] || row.payment_status} color={row.payment_status === "paid" ? "success" : "warning"} />
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 1, bgcolor: "#fffbee", p: 1.5, borderRadius: 2 }}>{[["Total", row.total], ["Recibido", row.paid_amount], ["Saldo", row.remaining_amount]].map(([label, amount]) => <Box key={label} sx={{ minWidth: 0 }}><Typography variant="caption">{label}</Typography><Typography fontWeight={800} sx={{ fontSize: 14, overflowWrap: "anywhere" }}>{departureMoney(amount)}</Typography></Box>)}</Box>
      </Stack></CardContent></Card>)}</Box>}
      {state.lastPage > 1 && <Pagination page={page} count={state.lastPage} onChange={(_, next) => setPage(next)} />}
    </>}
  </Stack>;
}
