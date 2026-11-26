import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CircularProgress, Dialog, DialogContent, DialogTitle, MenuItem, Pagination, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminUi } from "../../context/AdminUiContext";
import { useTienda } from "../../context/TiendaContext";
import useVehicleRecordsAccess from "../../hooks/useVehicleRecordsAccess";
import useDynamicFormsAccess from "../../hooks/useDynamicFormsAccess";
import { useVehicleMutation, useVehicleRequest, VehicleChoice } from "../../components/vehicles/VehicleRecordFields";
import OperationIntake, { useOperationChoices } from "../../components/services/OperationIntake";
import OperationOrder from "../../components/services/OperationOrder";
import { bookingActions, operationError, operations, operationUrl, readOperationPeriod, statusLabels } from "../../services/admin/serviceOperations";
import { validVehicleId } from "../../services/admin/vehicleRecords";

const bookingStates = ["pending", "confirmed", "arrived", "completed", "cancelled"];
const orderStates = ["pending", "in_progress", "completed", "cancelled"];
const timezone = "America/Mexico_City";
const dateKey = (date) => date.toISOString().slice(0, 10);
function today() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function offset(day, days) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
}

export default function ServiceOperationsPage({ mode }) {
  const access = useVehicleRecordsAccess();
  const { setHideLayout } = useAdminUi();
  useEffect(() => { setHideLayout(false); }, [setHideLayout]);
  const { tiendaLoading } = useTienda();
  const { bookingId, orderId } = useParams();
  const id = bookingId ?? orderId;
  if (tiendaLoading) return <CircularProgress aria-label="Cargando tienda" />;
  if (!access.storeId) return <Alert severity="warning">Necesitas una sesión administrativa para operar servicios.</Alert>;
  if (!access.branch) return <Alert severity="info" action={<Button component={Link} to="/admin/sucursales">Elegir sucursal</Button>}>Selecciona una sucursal.</Alert>;
  if (id && !validVehicleId(id)) return <Alert severity="error">Identificador inválido.</Alert>;
  return <OperationsContext key={JSON.stringify([access.storeId, access.branch.id, mode, id])} access={access} mode={mode} id={id} />;
}

function OperationsContext({ access, mode, id }) {
  const branch = access.branch.id;
  const forms = useDynamicFormsAccess();
  const navigate = useNavigate();
  const orders = mode === "orders";
  const agenda = mode === "agenda";
  const entity = orders ? "service-orders" : "bookings";
  const [page, setPage] = useState(1);
  const [view, setView] = useState(agenda ? "week" : "list");
  const [date, setDate] = useState(today);
  const [filters, setFilters] = useState({});
  const [intake, setIntake] = useState(null);
  const [failure, setFailure] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [revision, revise] = useState(0);
  const { run, busy } = useVehicleMutation();
  const { services, resources } = useOperationChoices(branch, filters.service_id, !id);
  const weekStart = view === "week" && date ? offset(date, -((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7)) : date;
  const period = view !== "list" && weekStart;
  const query = { ...Object.fromEntries(Object.entries(filters).filter(([,value]) => value)),
    ...(period ? { date_from: weekStart, date_to: offset(weekStart, view === "week" ? 6 : 0) } : { page }) };
  const request = useVehicleRequest(async (signal) => {
    if (id) {
      const result = await operations[orders ? "order" : "booking"](branch, id, signal);
      if (Number(result?.data?.id) !== Number(id) || Number(result.data.branch_id) !== Number(branch)) throw new Error("El detalle no coincide con la sucursal solicitada.");
      return result;
    }
    if (period) return { data: await readOperationPeriod(branch, query, signal) };
    const result = await operations.list(branch, entity, query, signal);
    if (!Array.isArray(result.data) || !Number.isSafeInteger(result.last_page)) throw new Error("Listado paginado no reconocido.");
    return result;
  }, blocked || (view !== "list" && !date) ? null : JSON.stringify([branch, entity, query, view, id, revision]));
  const refresh = () => revise((value) => value + 1);
  const mutate = (action, reload = true, after) => run(async (signal) => {
    setFailure("");
    try {
      const value = await action(signal);
      if (signal.aborted) return;
      if (after) after(value);
      else if (reload) refresh();
    } catch (error) {
      if (signal.aborted) return;
      const code = error.response?.status;
      if ([401,403,404].includes(code)) setBlocked(true);
      setFailure(code === 409 ? `${operationError(error)} Revisa los datos actualizados antes de reintentar.` : operationError(error));
      if (code === 409) refresh();
    }
  });
  const saved = (kind) => (row) => {
    setIntake(null);
    if (validVehicleId(row?.id) && Number(row.branch_id) === Number(branch)) navigate(operationUrl(`${kind}/${row.id}`, branch));
    else { setFailure("El servidor guardó la operación, pero el detalle devuelto no corresponde al contexto."); refresh(); }
  };
  const setFilter = (key, value) => {
    setFilters((old) => ({ ...old, [key]: value, ...(key === "service_id" ? { resource_id: "" } : {}) }));
    setPage(1);
  };
  const nav = (path, label) => <Button component={Link} to={operationUrl(path, branch)}>{label}</Button>;
  const row = id ? request.data?.data : null;
  const actions = row && !orders ? bookingActions(row.status) : null;
  const rows = !id ? request.data?.data ?? [] : [];
  const rowPath = (item) => operationUrl(`${orders ? "orders" : "bookings"}/${item.id}`, branch);

  return <Card variant="outlined" sx={{ p: { xs: 2, md: 3 }, maxWidth: 1350, mx: "auto" }}>
    <Stack spacing={2}>
      <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
        {nav("agenda", "Agenda")}{nav("bookings", "Citas")}{nav("orders", "Órdenes")}
        <Button component={Link} to="/admin/sucursales">Cambiar sucursal</Button>
      </Stack>
      <Typography variant="h4">{orders ? "Órdenes de servicio" : agenda ? "Agenda de servicios" : "Citas"}</Typography>
      <Typography variant="body2">Sucursal {access.branch.name ?? branch}</Typography>
      {failure && <Alert severity="error">{failure}</Alert>}
      {request.error && <Alert severity="error" action={<Button onClick={request.retry}>Reintentar</Button>}>{operationError(request.error)}</Alert>}
      {request.loading && <CircularProgress aria-label="Cargando operación" />}
      {!id && <>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {!orders && <TextField select size="small" label="Vista" value={view} onChange={(e) => { setView(e.target.value); setPage(1); }}>
            <MenuItem value="day">Diaria</MenuItem><MenuItem value="week">Semanal</MenuItem><MenuItem value="list">Listado</MenuItem>
          </TextField>}
          {view !== "list" ? <>
            <Button disabled={!date} onClick={() => setDate(offset(date, view === "week" ? -7 : -1))}>Anterior</Button>
            <TextField size="small" type="date" label="Fecha de agenda" value={date} onChange={(e) => setDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <Button disabled={!date} onClick={() => setDate(offset(date, view === "week" ? 7 : 1))}>Siguiente</Button>
          </> : ["date_from", "date_to"].map((key) => <TextField key={key} size="small" type="date" label={key === "date_from" ? "Desde" : "Hasta"}
            value={filters[key] ?? ""} onChange={(e) => setFilter(key, e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />)}
          <TextField select size="small" label="Estado" sx={{ minWidth: { md: 155 } }} value={filters.status ?? ""} onChange={(e) => setFilter("status", e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            {(orders ? orderStates : bookingStates).map((code) => <MenuItem key={code} value={code}>{statusLabels[code]}</MenuItem>)}
          </TextField>
        </Stack>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" } }}>
          <VehicleChoice label="Filtrar servicio" value={filters.service_id} options={services.data} loading={services.loading} onChange={(value) => setFilter("service_id", value)} />
          {filters.service_id ? <VehicleChoice label="Filtrar recurso" value={filters.resource_id} options={resources.data} loading={resources.loading}
            onChange={(value) => setFilter("resource_id", value)} /> : <TextField size="small" label="ID del recurso"
            value={filters.resource_id ?? ""} onChange={(e) => { if (!e.target.value || validVehicleId(e.target.value)) setFilter("resource_id", e.target.value); }} />}
          {["customer_id", "vehicle_id"].map((key) => <TextField key={key} size="small" label={key === "customer_id" ? "ID del cliente" : "ID del vehículo"}
            value={filters[key] ?? ""} onChange={(e) => { if (!e.target.value || validVehicleId(e.target.value)) setFilter(key, e.target.value); }} />)}
        </Box>
        {period && <Typography variant="body2">{query.date_from} — {query.date_to} · {timezone}</Typography>}
        {request.data && <Button variant="contained" sx={{ alignSelf: "start" }} onClick={() => setIntake(orders ? "direct" : "booking")}>
          {orders ? "Recepción sin cita" : "Programar cita"}
        </Button>}
        {request.data && !rows.length && <Alert severity="info">Sin registros para los filtros seleccionados.</Alert>}
        {rows.length > 0 && <>
          <Table size="small" sx={{ display: { xs: "none", md: "table" } }}>
            <TableHead><TableRow>{["Folio", orders ? "Creación" : "Fecha y hora", "Cliente", "Servicio", "Recurso", "Estado"].map((label) => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
            <TableBody>{rows.map((item) => <TableRow key={item.id}>
              <TableCell><Link to={rowPath(item)}>{item.order_code ?? item.booking_code}</Link></TableCell>
              <TableCell>{orders ? item.created_at : `${item.booking_date} · ${item.start_time}`}</TableCell>
              <TableCell>{item.customer_snapshot?.name ?? item.customer?.nombre_alias ?? item.customer_id}</TableCell>
              <TableCell>{item.service?.name}</TableCell><TableCell>{item.resource?.name}</TableCell>
              <TableCell>{statusLabels[orders ? item.status?.code : item.status]}</TableCell>
            </TableRow>)}</TableBody>
          </Table>
          <Stack spacing={1} sx={{ display: { xs: "flex", md: "none" } }}>{rows.map((item) => <Card key={item.id} variant="outlined" sx={{ p: 2 }}>
            <Link to={rowPath(item)}>{item.order_code ?? item.booking_code}</Link>
            <Typography>{item.customer_snapshot?.name ?? item.customer?.nombre_alias ?? item.customer_id} · {item.service?.name}</Typography>
            <Typography>{statusLabels[orders ? item.status?.code : item.status]} {item.booking_date} {item.start_time}</Typography>
          </Card>)}</Stack>
        </>}
        {request.data?.last_page > 1 && <Pagination page={page} count={request.data.last_page} onChange={(_, value) => setPage(value)} />}
      </>}
      {row && orders && <OperationOrder branch={branch} response={request.data} access={access} forms={forms.read} busy={busy} mutate={mutate} onBooking={saved("bookings")} />}
      {row && actions && <>
        <Typography variant="h5">{row.booking_code}</Typography>
        <Typography>{statusLabels[row.status]} · {row.booking_date} · {row.start_time} – {row.end_time}</Typography>
        <Typography>Cliente: {row.customer?.nombre_alias ?? row.customer_id}</Typography>
        <Typography>Servicio: {row.service?.name ?? row.service_id}</Typography>
        <Typography>Recurso: {row.resource?.name ?? row.resource_id ?? "Sin asignar"}</Typography>
        {row.vehicle_id && access.canRead && <Button component={Link} to={operationUrl(`vehicles/${row.vehicle_id}`, branch)}>Ver expediente</Button>}
        {row.notes && <Typography sx={{ whiteSpace: "pre-wrap" }}>{row.notes}</Typography>}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          {actions.confirm && <Button variant="contained" disabled={busy} onClick={() => mutate((signal) => operations.confirm(branch, id, signal))}>Confirmar cita</Button>}
          {actions.arrival && <Button variant="contained" disabled={busy} onClick={() => mutate((signal) => operations.arrival(branch, id, signal))}>Registrar llegada</Button>}
          {actions.convert && <Button variant="outlined" disabled={busy} onClick={() => mutate((signal) => operations.convert(branch, id, signal), false, saved("orders"))}>Abrir orden de servicio</Button>}
        </Stack>
      </>}
    </Stack>
    {intake && <Dialog open fullWidth maxWidth="sm">
      <DialogTitle>{intake === "direct" ? "Recepción sin cita" : "Programar cita"}</DialogTitle>
      <DialogContent dividers><OperationIntake branch={branch} mode={intake} access={access} onCancel={() => setIntake(null)} onSaved={saved(intake === "direct" ? "orders" : "bookings")} /></DialogContent>
    </Dialog>}
  </Card>;
}

