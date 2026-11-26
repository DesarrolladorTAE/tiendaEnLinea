import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, CircularProgress, FormControlLabel, Pagination, Stack, Switch, TextField, Typography } from "@mui/material";
import { readVehicleHistory, validVehicleId, vehicleRecords } from "../../services/admin/vehicleRecords";
import { useVehicleRequest } from "./VehicleRecordFields";
import useDynamicFormsAccess from "../../hooks/useDynamicFormsAccess";
import { formLink, orderFormsPath, positiveId } from "../../services/admin/dynamicForms";

export const mileageLabel = (value) => value == null ? "Desconocido" : `${value} km`;
const formatDate = (value) => {
  if (!value) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
};

export default function VehicleRecordHistory({ id, branchId }) {
  const [draft, setDraft] = useState({ date_from: "", date_to: "", service_id: "", status: "", onlyBranch: false });
  const [filters, setFilters] = useState({});
  const [ordersPage, setOrdersPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [error, setError] = useState("");
  const params = { orders_page: ordersPage, bookings_page: bookingsPage, ...filters };
  const request = useVehicleRequest(async (signal) => readVehicleHistory((await vehicleRecords.history(id, params, signal)).data, id), JSON.stringify(params));
  const formsAccess = useDynamicFormsAccess(Boolean(request.data?.orders.rows.some((order) => order.form_submissions?.length)));
  const submit = (event) => {
    event.preventDefault();
    if (draft.date_from && draft.date_to && draft.date_to < draft.date_from) { setError("La fecha final debe ser igual o posterior a la inicial."); return; }
    if (draft.service_id && !validVehicleId(draft.service_id.trim())) { setError("Ingresa un identificador de servicio válido."); return; }
    setError("");
    const { onlyBranch, ...query } = draft;
    setFilters({ ...Object.fromEntries(Object.entries(query).flatMap(([key, value]) => value.trim() ? [[key, value.trim()]] : [])), ...(onlyBranch ? { branch_id: branchId } : {}) });
    setOrdersPage(1); setBookingsPage(1);
  };
  return <Stack spacing={2}>
    <Stack component="form" onSubmit={submit} spacing={1.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        {[["date_from", "Desde"], ["date_to", "Hasta"], ["service_id", "ID de servicio"], ["status", "Estado de la orden (código)"]].map(([key, label]) =>
          <TextField key={key} label={label} size="small" fullWidth type={key.startsWith("date_") ? "date" : "text"}
            value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: key === "status" ? { maxLength: 30 } : undefined }} />
        )}
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <FormControlLabel label="Solo la sucursal actual" control={<Switch checked={draft.onlyBranch} onChange={(event) => setDraft({ ...draft, onlyBranch: event.target.checked })} />} />
        <Button variant="outlined" type="submit">Filtrar historial</Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
    {request.loading && <CircularProgress size={28} aria-label="Cargando historial" />}
    {request.error && <Alert severity="error" action={<Button onClick={request.retry}>Reintentar</Button>}>
      {request.status ? "No se pudo consultar el historial. Verifica el acceso o los filtros." : request.error.message}
    </Alert>}
    {request.data && <>
      {!request.data.orders.rows.length && !request.data.bookings.rows.length && <Typography>Sin atenciones en esta consulta.</Typography>}
      <HistoryGroup title="Órdenes" group={request.data.orders} page={ordersPage} onPage={setOrdersPage} render={(order) => orderDetails(order, formsAccess.read && Number(formsAccess.branch?.id) === Number(branchId))} />
      <HistoryGroup title="Citas" group={request.data.bookings} page={bookingsPage} onPage={setBookingsPage} render={bookingDetails} />
    </>}
  </Stack>;
}

function HistoryGroup({ title, group, page, onPage, render }) {
  return <Stack spacing={1}>
    <Typography variant="h6">{title}</Typography>
    {!group.rows.length && <Typography color="text.secondary">Sin resultados.</Typography>}
    {group.rows.map((item) => <Card variant="outlined" key={item.id} sx={{ p: 2 }}>{render(item)}</Card>)}
    {group.pages > 1 && <Pagination aria-label={`Páginas de ${title.toLowerCase()}`} count={group.pages} page={page} onChange={(_, value) => onPage(value)} />}
  </Stack>;
}

function orderDetails(order, canReadForms) {
  const snapshot = order.vehicle_snapshot;
  const documentBranch = order.branch?.id ?? order.branch_id;
  return <Stack spacing={0.5}>
    <Typography fontWeight={700}>{order.order_code || `Orden #${order.id}`} · {order.service?.name || "Servicio sin nombre"}</Typography>
    <Typography>{formatDate(order.created_at)} · {order.status?.name || order.status?.code || "Estado no disponible"}</Typography>
    {order.branch?.name && <Typography>Sucursal: {order.branch.name}</Typography>}
    <Typography>Kilometraje de visita: {mileageLabel(order.visit_mileage)}</Typography>
    {snapshot ? <Typography>Vehículo al momento de la atención: {[snapshot.brand, snapshot.model, snapshot.year].filter((value) => value != null && value !== "").join(" ") || "No disponible"} · Placas: {snapshot.plates ?? "—"} · VIN: {snapshot.vin ?? "—"}</Typography> :
      <Typography color="text.secondary">Sin snapshot vehicular.</Typography>}
    {order.customer_snapshot?.name && <Typography>Cliente al momento de la atención: {order.customer_snapshot.name}</Typography>}
    {order.form_submissions?.map((form) => <Stack key={form.id} direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={1}>
      <Typography variant="body2">Formulario {form.folio || `#${form.id}`} · {form.status || "Estado no disponible"}{form.completed_at ? ` · ${formatDate(form.completed_at)}` : ""}</Typography>
      {canReadForms && [documentBranch, order.id, form.id].every(positiveId) && <Button component={Link}
        to={formLink(`${orderFormsPath}/${order.id}/forms/${form.id}`, documentBranch) + "&history=1"}>Ver captura histórica</Button>}
    </Stack>)}
  </Stack>;
}

function bookingDetails(booking) {
  return <Stack spacing={0.5}>
    <Typography fontWeight={700}>{booking.booking_code || `Cita #${booking.id}`} · {booking.service?.name || "Servicio sin nombre"}</Typography>
    <Typography>{formatDate(booking.booking_date)} · {booking.start_time || "—"} – {booking.end_time || "—"} · {booking.status || "Estado no disponible"}</Typography>
    {booking.branch?.name && <Typography>Sucursal: {booking.branch.name}</Typography>}
  </Stack>;
}
