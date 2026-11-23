import React, { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, Pagination, Stack, TextField, Typography } from "@mui/material";
import axiosClient from "../../config/axiosClient";
import { getTourCollections } from "../../services/tours/tourService";
import { bookingError, customerLabel } from "./bookingUtils";
import { departureMoney, departureDate } from "./departureUtils";
import { tourMenuProps } from "./tourFormStyles.mjs";

export default function TourCollectionsReport({ mode, branchId, departureId }) {
  const [filters, setFilters] = useState({ date_from: "", date_to: "", pos_location_id: "" });
  const [query, setQuery] = useState(filters), [page, setPage] = useState(1), [revision, setRevision] = useState(0);
  const [locations, setLocations] = useState([]), [locationError, setLocationError] = useState("");
  const [state, setState] = useState({ loading: true, error: "", summary: null, rows: [], lastPage: 1 });
  useEffect(() => {
    if (mode !== "store") return;
    const controller = new AbortController();
    axiosClient.get(`/branches/${branchId}/pos`, { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setLocations(data?.list ?? data?.data ?? []);
    }).catch(() => { if (!controller.signal.aborted) setLocationError("No se pudo cargar el selector de cajas. Puedes consultar toda la sucursal."); });
    return () => controller.abort();
  }, [mode, branchId]);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, error: "", summary: null, rows: [], lastPage: 1 });
    getTourCollections({ mode, branchId, signal: controller.signal }, { ...query, departure_id: departureId, page, per_page: 20 }).then(({ data }) => {
      const result = data?.data;
      if (!result?.summary || !Array.isArray(result.payments?.data)) throw new Error("No se pudo leer el reporte de cobros de tours.");
      if (!controller.signal.aborted) setState({ loading: false, error: "", summary: result.summary, rows: result.payments.data, lastPage: Number(result.payments.last_page || 1) });
    }).catch(error => { if (!controller.signal.aborted) setState({ loading: false, error: bookingError(error), summary: null, rows: [], lastPage: 1 }); });
    return () => controller.abort();
  }, [mode, branchId, departureId, query, page, revision]);
  const field = key => ({ value: filters[key], onChange: e => setFilters(prev => ({ ...prev, [key]: e.target.value })) });
  return <Stack spacing={2} sx={{ p: 2, border: "1px solid #ddd", borderRadius: 2 }}>
    <Typography variant="h5" fontWeight={800}>Cobros de tours por caja</Typography>
    <Typography variant="body2">Incluye solo movimientos confirmados, por fecha de pago y caja que recibió el dinero. Los totales abarcan todas las páginas. {mode === "pos" ? "Esta sesión consulta únicamente sus propios cobros." : "Sin filtro de caja incluye administración, pagos en línea y movimientos históricos de la sucursal."}</Typography>
    <Stack component="form" spacing={1} onSubmit={e => { e.preventDefault(); setPage(1); setQuery({ ...filters }); setRevision(value => value + 1); }}>
      <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
        <TextField type="date" label="Pago desde" InputLabelProps={{ shrink: true }} {...field("date_from")} />
        <TextField type="date" label="Pago hasta" InputLabelProps={{ shrink: true }} inputProps={{ min: filters.date_from }} {...field("date_to")} />
        {mode === "store" && <TextField select label="Caja que cobró" SelectProps={{ MenuProps: tourMenuProps }} {...field("pos_location_id")} sx={{ minWidth: 220 }}><MenuItem value="">Toda la sucursal</MenuItem>{Array.isArray(locations) && locations.map(pos => <MenuItem key={pos.id} value={pos.id}>{pos.name || `Caja #${pos.id}`}</MenuItem>)}</TextField>}
      </Stack>
      <Button type="submit" variant="outlined">Consultar cobros</Button>
    </Stack>
    {locationError && <Alert severity="warning">{locationError}</Alert>}
    {state.loading ? <CircularProgress aria-label="Consultando cobros de tours" /> : state.error ? <Alert severity="error">{state.error}</Alert> : <>
      <Stack direction="row" flexWrap="wrap" gap={3}>{[["received", "Recibido"], ["refunded", "Reembolsado"], ["net", "Neto de tours"]].map(([key, label]) => <Box key={key}><Typography>{label}</Typography><Typography variant="h6">{departureMoney(state.summary?.[key])}</Typography></Box>)}</Stack>
      <Alert severity="info">Este rubro es de tours. No se suma de nuevo como venta de productos.</Alert>
      {!state.rows.length && <Typography>No hay cobros con estos filtros.</Typography>}
      {state.rows.map(payment => <Box key={payment.id} sx={{ borderTop: "1px solid #ddd", pt: 1 }}><Typography fontWeight={700}>{payment.booking?.booking_code || `Reserva #${payment.booking_id}`} · {customerLabel(payment.booking || {})}</Typography><Typography>{departureDate(payment.payment_date)} · {payment.payment_type === "refund" ? "Reembolso" : "Cobro"} · {departureMoney(payment.amount)}</Typography><Typography variant="caption">{payment.metadata?.collection?.pos_location_id ? `Caja #${payment.metadata.collection.pos_location_id}` : "Sin caja física atribuida"}</Typography></Box>)}
      {state.lastPage > 1 && <Pagination page={page} count={state.lastPage} onChange={(_, value) => setPage(value)} />}
    </>}
  </Stack>;
}
