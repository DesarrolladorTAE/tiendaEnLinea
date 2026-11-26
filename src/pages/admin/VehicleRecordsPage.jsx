import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CircularProgress, Grid, MenuItem, Pagination, Stack, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link, useNavigate, useParams } from "react-router-dom";
import ModalPDFPreview from "../../components/tickets/ModalPDFPreview";
import useVehicleRecordsAccess from "../../hooks/useVehicleRecordsAccess";
import { integerRange, readVehicle, readVehiclePage, validVehicleId, vehicleDocumentPath, vehicleRecords, vehicleRecordsUrl } from "../../services/admin/vehicleRecords";
import VehicleRecordForm, { VehicleCatalogChoices, VehicleChoice, useVehicleCustomers, useVehicleMutation, useVehicleRequest } from "../../components/vehicles/VehicleRecordFields";
import VehicleRecordHistory, { mileageLabel } from "../../components/vehicles/VehicleRecordHistory";
import { useVehicleQrRotation, VehicleQrResolver } from "../../components/vehicles/VehicleQrActions";
import { showConfirm } from "../../utils/alerts";

function RequestState({ request, fallback }) {
  if (request.loading) return <CircularProgress size={28} aria-label="Cargando expedientes" />;
  if (!request.error) return null;
  const messages = {
    401: "Inicia sesión para consultar expedientes.",
    403: "No tienes acceso a esta operación vehicular.",
    404: "El expediente no existe o está fuera de tu alcance.",
  };
  const message = messages[request.status] || (request.status ? fallback : request.error.message) || fallback;
  return <Alert severity="error" action={!messages[request.status] && <Button onClick={request.retry}>Reintentar</Button>}>{message}</Alert>;
}

const yearLabel = (vehicle) => vehicle.year ?? "Año no disponible";
const clientLabel = (vehicle) => vehicle.customer?.nombre_alias || (vehicle.customer_id == null ? "No disponible" : `#${vehicle.customer_id}`);
const modelLabel = (vehicle) => [vehicle.brand?.name || (vehicle.vehicle_brand_id ? `#${vehicle.vehicle_brand_id}` : "—"),
  vehicle.model?.name || (vehicle.vehicle_model_id ? `#${vehicle.vehicle_model_id}` : "—")].join(" / ");
const stateLabel = (value) => value === true ? "Activo" : value === false ? "Inactivo" : "No disponible";

export default function VehicleRecordsPage({ mode = "view" }) {
  const { vehicleId, customerId } = useParams();
  const access = useVehicleRecordsAccess();
  const branchId = access.branch?.id;
  const contextKey = `${access.storeId}:${branchId}`;
  const navigate = useNavigate();
  return <Stack spacing={2} sx={{ maxWidth: 1400, mx: "auto" }}>
    <Card variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderLeft: "5px solid #f9b233" }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
        <Box><Typography variant="h4" fontWeight={800}>Expedientes vehiculares</Typography>
          {branchId && <Typography color="text.secondary">Sucursal de operación: {access.branch.name || `#${branchId}`}</Typography>}
        </Box>
        <Button component={Link} to={branchId ? `/admin/services?branch_id=${branchId}` : "/admin/sucursales"}>Volver a {branchId ? "servicios" : "sucursales"}</Button>
      </Stack>
    </Card>
    {!branchId ? <Alert severity="info">Selecciona una sucursal para comprobar el acceso.</Alert> :
      access.loading ? <CircularProgress aria-label="Comprobando acceso vehicular" /> :
      access.status === 401 ? <Alert severity="warning">Inicia sesión para consultar expedientes.</Alert> :
      [403, 404].includes(access.status) ? <Alert severity="warning">No tienes acceso a expedientes vehiculares en este contexto.</Alert> :
      access.error ? <Alert severity="error" action={<Button onClick={access.retry}>Reintentar</Button>}>{access.error}</Alert> :
      !access.canRead ? <Alert severity="warning">No tienes acceso a expedientes vehiculares en este contexto.</Alert> :
      ["new", "edit"].includes(mode) && !access.canWrite ? <Alert severity="warning">No tienes permiso de escritura de expedientes.</Alert> :
      mode === "new" && !access.canReadCatalog ? <Alert severity="info">El alta requiere acceso al catálogo de marcas y modelos.</Alert> :
      mode === "new" ? <Card variant="outlined" sx={{ p: 2 }}>
        <VehicleRecordForm key={contextKey} canReadCatalog={access.canReadCatalog}
          onCancel={() => navigate(vehicleRecordsUrl(branchId))} onSaved={(id) => navigate(vehicleRecordsUrl(branchId, `/${id}`), { replace: true })} />
      </Card> : mode === "resolve" ? <Card variant="outlined" sx={{ p: 2 }}><VehicleQrResolver key={contextKey} branchId={branchId} /></Card> :
      vehicleId ? validVehicleId(vehicleId) ?
        <VehicleDetail key={`${contextKey}:${vehicleId}:${mode}`} branchId={branchId} id={vehicleId} access={access} editing={mode === "edit"} /> :
        <Alert severity="error">Identificador de expediente inválido.</Alert> :
      customerId && !validVehicleId(customerId) ? <Alert severity="error">Identificador de cliente inválido.</Alert> :
        <VehicleList key={`${contextKey}:${customerId ?? ""}`} branchId={branchId} customerId={customerId} access={access} />}
  </Stack>;
}

function VehicleList({ branchId, customerId, access }) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const mobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const request = useVehicleRequest(async (signal) => {
    const { data } = await (customerId ? vehicleRecords.forCustomer(customerId, page, signal) : vehicleRecords.list(page, signal, filters));
    const result = readVehiclePage(data);
    if (result.rows.some((row) => !validVehicleId(row?.id))) throw new Error("El servidor devolvió expedientes sin identificadores válidos.");
    return result;
  }, JSON.stringify([page, filters]));
  const { rows, pages } = request.data ?? { rows: [], pages: 1 };
  const link = (vehicle) => <Button component={Link} to={vehicleRecordsUrl(branchId, `/${vehicle.id}`)}>Ver expediente #{vehicle.id}</Button>;
  return <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        {access.canWrite && access.canReadCatalog && <Button component={Link} variant="contained" to={vehicleRecordsUrl(branchId, "/new")}>Registrar vehículo</Button>}
        <Button component={Link} variant="outlined" to={vehicleRecordsUrl(branchId, "/resolve")}>Resolver código QR</Button>
        {!customerId && <Button aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}>{showFilters ? "Ocultar filtros" : "Mostrar filtros"}</Button>}
      </Stack>
      {!customerId && showFilters && <VehicleFilters initial={filters} canReadCatalog={access.canReadCatalog} onApply={(values) => { setFilters(values); setPage(1); }} />}
      {customerId && <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Vehículos del cliente #{customerId}</Typography>
        <Button component={Link} to={vehicleRecordsUrl(branchId)}>Ver todos</Button>
      </Stack>}
      <RequestState request={request} fallback="No se pudieron cargar los expedientes." />
      {request.data && (rows.length === 0 ? <Typography>Sin expedientes en esta consulta.</Typography> : mobile ?
        rows.map((vehicle) => <Card key={vehicle.id} variant="outlined" sx={{ p: 2 }}>
          <Typography fontWeight={700}>Expediente #{vehicle.id}</Typography>
          <Typography>Cliente {clientLabel(vehicle)} · {yearLabel(vehicle)}</Typography>
          <Typography>{modelLabel(vehicle)} · {vehicle.plates || "Sin placas"}</Typography>
          <Typography>{mileageLabel(vehicle.latest_mileage)} · {stateLabel(vehicle.is_active)}</Typography>{link(vehicle)}
        </Card>) :
        <Box sx={{ overflowX: "auto" }}><Table size="small" aria-label="Expedientes vehiculares">
          <TableHead><TableRow>{["Expediente", "Cliente", "Marca / modelo", "Año", "Placas", "Kilometraje", "Estado", "Acciones"].map((value) => <TableCell key={value}>{value}</TableCell>)}</TableRow></TableHead>
          <TableBody>{rows.map((vehicle) => <TableRow key={vehicle.id}>
            <TableCell>#{vehicle.id}</TableCell><TableCell>{clientLabel(vehicle)}</TableCell>
            <TableCell>{modelLabel(vehicle)}</TableCell><TableCell>{yearLabel(vehicle)}</TableCell>
            <TableCell>{vehicle.plates || "—"}</TableCell><TableCell>{mileageLabel(vehicle.latest_mileage)}</TableCell>
            <TableCell>{stateLabel(vehicle.is_active)}</TableCell><TableCell>{link(vehicle)}</TableCell>
          </TableRow>)}</TableBody>
        </Table></Box>)}
      {pages > 1 && <Pagination count={pages} page={page} onChange={(_, number) => setPage(number)} />}
    </Stack>
  </Card>;
}

function VehicleFilters({ initial, canReadCatalog, onApply }) {
  const [draft, setDraft] = useState(() => Object.fromEntries(Object.entries(initial).map(([key, value]) => [key, String(value)])));
  const customers = useVehicleCustomers();
  const update = (key, value) => setDraft((old) => ({ ...old, [key]: value, ...(key === "brand_id" ? { model_id: "" } : {}) }));
  const submit = (event) => {
    event.preventDefault();
    const query = Object.fromEntries(Object.entries(draft).flatMap(([key, value]) => {
      const clean = value.trim();
      if (!clean) return [];
      return [[key, key.endsWith("_id") || key === "is_active" ? Number(clean) : clean]];
    }));
    onApply(query);
  };
  return <Stack component="form" spacing={1.5} onSubmit={submit}>
    <Grid container spacing={1.5}>
      <Grid size={{ xs: 12, sm: 6 }}><VehicleChoice label="Cliente" value={draft.customer_id ?? ""} options={customers.data}
        onChange={(value) => update("customer_id", value)} loading={customers.loading} disabled={Boolean(customers.error)} /></Grid>
      <Grid size={{ xs: 12, sm: 6 }}><TextField select label="Estado" fullWidth size="small" value={draft.is_active ?? ""} onChange={(e) => update("is_active", e.target.value)}>
        <MenuItem value="">Todos</MenuItem><MenuItem value="1">Activo</MenuItem><MenuItem value="0">Inactivo</MenuItem>
      </TextField></Grid>
      <VehicleCatalogChoices available={canReadCatalog} brandId={draft.brand_id ?? ""} modelId={draft.model_id ?? ""}
        onBrand={(value) => update("brand_id", value)} onModel={(value) => update("model_id", value)} />
      {[["plates", "Buscar por placas", 32], ["vin", "Buscar por VIN", 50]].map(([key, label, maxLength]) =>
        <Grid size={{ xs: 12, sm: 6 }} key={key}><TextField fullWidth size="small" label={label} value={draft[key] ?? ""}
          onChange={(e) => update(key, e.target.value)} slotProps={{ htmlInput: { maxLength } }} /></Grid>
      )}
    </Grid>
    {customers.error && <Alert severity="warning" action={<Button onClick={customers.retry}>Reintentar</Button>}>No se pudo cargar el selector de clientes.</Alert>}
    <Stack direction="row" spacing={1}>
      <Button type="submit" variant="outlined">Buscar</Button>
      <Button type="button" onClick={() => { setDraft({}); onApply({}); }}>Limpiar filtros</Button>
    </Stack>
  </Stack>;
}

function VehicleDetail({ branchId, id, access, editing }) {
  const [tab, setTab] = useState("general");
  const [notice, setNotice] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState(null);
  const mutation = useVehicleMutation();
  const navigate = useNavigate();
  const request = useVehicleRequest(async (signal) => readVehicle((await vehicleRecords.get(id, signal)).data, id), id);
  if (!request.data) return <RequestState request={request} fallback="No se pudo cargar el expediente." />;
  const vehicle = request.data;
  const active = updatedStatus ?? vehicle.is_active;
  const detailUrl = vehicleRecordsUrl(branchId, `/${id}`);
  const changeStatus = () => mutation.run(async (signal) => {
    const next = !active;
    if (!await showConfirm(next ? "¿Activar este expediente?" : "¿Desactivar este expediente? Se conservará el historial.", next ? "Activar" : "Desactivar") || signal.aborted) return;
    try {
      await vehicleRecords.status(id, next, signal);
      if (!signal.aborted) { setUpdatedStatus(next); setNotice({ severity: "success", text: "Estado del expediente actualizado." }); }
    } catch (error) {
      if (!signal.aborted) setNotice({ severity: "error", text: error.response?.data?.message || "No se pudo cambiar el estado." });
    }
  });
  if (editing) return <Card variant="outlined" sx={{ p: 2 }}><VehicleRecordForm record={vehicle} canReadCatalog={access.canReadCatalog}
    onCancel={() => navigate(detailUrl)} onSaved={() => navigate(detailUrl, { replace: true })} /></Card>;
  return <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between">
        <Typography variant="h5" fontWeight={800}>Expediente #{id}</Typography>
        <Button component={Link} to={vehicleRecordsUrl(branchId)}>Volver al listado</Button>
      </Stack>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" aria-label="Secciones del expediente">
        <Tab value="general" label="Datos generales" />
        <Tab value="history" label="Historial" />
        <Tab value="identification" label="Identificación" />
      </Tabs>
      {notice && <Alert severity={notice.severity}>{notice.text}</Alert>}
      {tab === "general" && <Grid container spacing={2}>
        {[["Cliente asociado", clientLabel(vehicle)], ["Marca / modelo", modelLabel(vehicle)], ["Año", yearLabel(vehicle)],
          ["Placas", vehicle.plates || "—"], ["VIN", vehicle.vin || "—"], ["Kilometraje", mileageLabel(vehicle.latest_mileage)], ["Estado", stateLabel(active)]].map(([label, value]) =>
          <Grid key={label} size={{ xs: 12, sm: 4 }}><Typography color="text.secondary">{label}</Typography><Typography fontWeight={700}>{value}</Typography></Grid>
        )}
        <Grid size={12}>
          {validVehicleId(vehicle.customer_id) && <Button component={Link} to={vehicleRecordsUrl(branchId, `/client/${vehicle.customer_id}`)}>Ver vehículos del cliente</Button>}
          {access.canWrite && <Button component={Link} to={vehicleRecordsUrl(branchId, `/${id}/edit`)}>Editar vehículo</Button>}
          {access.canManageStatus && typeof active === "boolean" && <Button onClick={changeStatus} disabled={mutation.busy}>{active ? "Desactivar vehículo" : "Activar vehículo"}</Button>}
        </Grid>
      </Grid>}
      {tab === "history" && <VehicleRecordHistory id={id} branchId={branchId} />}
      {tab === "identification" && <VehicleIdentification branchId={branchId} id={id} canRotate={access.canWrite} />}
    </Stack>
  </Card>;
}

function VehicleIdentification({ branchId, id, canRotate }) {
  const [pdfOpen, setPdfOpen] = useState(false);
  const [size, setSize] = useState({ width_mm: "50", height_mm: "35" });
  const [pdfPath, setPdfPath] = useState("");
  const [sizeError, setSizeError] = useState("");
  const request = useVehicleRequest(async (signal) => {
    const { data } = await vehicleRecords.qr(branchId, id, signal);
    if (!(data instanceof Blob) || data.type.split(";")[0] !== "image/svg+xml" || !data.size) {
      throw new Error("El servidor no devolvió un código QR en SVG.");
    }
    return data;
  }, id);
  const [preview, setPreview] = useState(null);
  const rotation = useVehicleQrRotation({ branchId, id,
    invalidate: () => { setPreview(null); setPdfOpen(false); },
    refresh: request.retry,
  });
  useEffect(() => {
    if (!request.data) { setPreview(null); return undefined; }
    const url = URL.createObjectURL(request.data);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [request.data]);
  return <Stack alignItems="start" spacing={2}>
    <Typography variant="h6">Identificación del vehículo</Typography>
    <RequestState request={request} fallback="No se pudo cargar el código QR." />
    {!rotation.busy && request.data && preview && <Box component="img" src={preview} alt="Código QR del vehículo" sx={{ width: 180, maxWidth: "100%", bgcolor: "white" }} />}
    {rotation.notice && <Alert severity={rotation.notice.severity}>{rotation.notice.text}</Alert>}
    {canRotate && request.data && <Button color="warning" onClick={rotation.rotate} disabled={rotation.busy}>Regenerar QR</Button>}
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <TextField label="Ancho (mm)" size="small" value={size.width_mm} onChange={(e) => setSize({ ...size, width_mm: e.target.value })} />
      <TextField label="Alto (mm)" size="small" value={size.height_mm} onChange={(e) => setSize({ ...size, height_mm: e.target.value })} />
    </Stack>
    {sizeError && <Alert severity="error">{sizeError}</Alert>}
    <Button variant="outlined" disabled={rotation.busy} onClick={() => {
      if (!integerRange(size.width_mm, 35, 100) || !integerRange(size.height_mm, 25, 80)) {
        setSizeError("Ancho: 35–100 mm. Alto: 25–80 mm. Usa números enteros."); return;
      }
      const customSize = Number(size.width_mm) !== 50 || Number(size.height_mm) !== 35 ? size : undefined;
      setSizeError(""); setPdfPath(vehicleDocumentPath(branchId, id, "label.pdf", customSize)); setPdfOpen(true);
    }}>Ver y descargar etiqueta PDF</Button>
    {pdfOpen && <ModalPDFPreview open privateDocument onClose={() => setPdfOpen(false)} endpoint={pdfPath}
      nombreArchivo={`etiqueta-vehiculo-${id}.pdf`} title="Etiqueta vehicular" />}
  </Stack>;
}
