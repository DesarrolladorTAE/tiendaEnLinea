import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, Switch, TextField, useMediaQuery, useTheme } from "@mui/material";
import { createDeparture, getTourResources, getTourRoutes, updateDeparture } from "../../services/tours/tourService";
import { DEPARTURE_STATUSES, departureError } from "./departureUtils";

export default function DepartureFormDialog({ context, departure, onClose, onSaved, onSessionExpired }) {
  const { branchId, serviceId, mode } = context;
  const mobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [form, setForm] = useState(() => ({
    tour_route_id: departure?.tour_route_id ?? "", resource_id: departure?.resource_id ?? "",
    departure_date: departure?.departure_date?.slice(0, 10) || "", departure_time: departure?.departure_time?.slice(0, 5) || "",
    estimated_return_time: departure?.estimated_return_time?.slice(0, 5) || "", capacity: departure?.capacity ?? "",
    price: departure?.price ?? "", status: departure?.status || "scheduled", notes: departure?.notes || "",
  }));
  const [catalogs, setCatalogs] = useState({ routes: [], resources: [], loading: true, errors: [] });
  const [revision, setRevision] = useState(0);
  const [vehiclesOnly, setVehiclesOnly] = useState(true);
  const [saving, setSaving] = useState(false); const pending = useRef(false);
  const [error, setError] = useState(""); const [errors, setErrors] = useState({});
  const sessionHandler = useRef(onSessionExpired); sessionHandler.current = onSessionExpired;

  useEffect(() => {
    if (mode !== "store") return;
    let active = true; const controller = new AbortController();
    setCatalogs((prev) => ({ ...prev, loading: true, errors: [] }));
    const options = { branchId, serviceId, mode, signal: controller.signal };
    Promise.allSettled([getTourRoutes(options), getTourResources(options)]).then((results) => {
      if (!active) return;
      const failures = results.filter((result) => result.status === "rejected");
      if (failures.some((result) => result.reason?.response?.status === 401)) sessionHandler.current();
      setCatalogs({ routes: results[0].status === "fulfilled" ? results[0].value : [], resources: results[1].status === "fulfilled" ? results[1].value : [], loading: false,
        errors: results.flatMap((result, index) => result.status === "rejected" ? [(index === 0 ? "Rutas: " : "Recursos: ") + departureError(result.reason)] : []) });
    });
    return () => { active = false; controller.abort(); };
  }, [branchId, serviceId, mode, revision]);

  const field = (name, label, props = {}) => <TextField fullWidth name={name} label={label} value={form[name]} onChange={(event) => { const value = event.target.value; setForm((prev) => ({ ...prev, [name]: value })); }} error={!!errors[name]} helperText={Array.isArray(errors[name]) ? errors[name].join(" ") : errors[name]} {...props} />;
  const resources = catalogs.resources.filter((resource) => !vehiclesOnly || resource.type === "vehicle" || String(resource.id) === String(form.resource_id));
  const selectedOption = (rows, id, label) => id !== "" && id != null && !rows.some((row) => String(row.id) === String(id)) ? <MenuItem value={id}>{label} #{id} (actual)</MenuItem> : null;
  const submit = async (event) => {
    event.preventDefault();
    if (pending.current || mode !== "store") return;
    const validation = {};
    if (!form.departure_date) validation.departure_date = "Selecciona la fecha.";
    if (!form.departure_time) validation.departure_time = "Selecciona la hora.";
    if (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) < 1) validation.capacity = "La capacidad debe ser un entero mayor a cero.";
    if (form.price === "" || !Number.isFinite(Number(form.price)) || Number(form.price) < 0) validation.price = "Ingresa un precio igual o mayor a cero.";
    setErrors(validation); setError("");
    if (Object.keys(validation).length) return;
    pending.current = true; setSaving(true);
    const values = { ...form, tour_route_id: form.tour_route_id === "" ? null : Number(form.tour_route_id), resource_id: form.resource_id === "" ? null : Number(form.resource_id), estimated_return_time: form.estimated_return_time || null, capacity: Number(form.capacity) };
    try {
      await (departure ? updateDeparture(context, departure.id, values) : createDeparture(context, values));
      onSaved();
    } catch (err) {
      setError(departureError(err)); setErrors(err?.response?.data?.errors || {});
      if (err?.response?.status === 401) onSessionExpired();
    } finally { pending.current = false; setSaving(false); }
  };
  if (mode !== "store") return null;
  return <Dialog open fullWidth maxWidth="sm" fullScreen={mobile} onClose={saving ? undefined : onClose} PaperProps={{ component: "form", onSubmit: submit }}>
    <DialogTitle>{departure ? "Editar salida" : "Nueva salida"}</DialogTitle>
    <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      {error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{error}</Alert>}
      {catalogs.errors.length > 0 && <Alert severity="warning" sx={{ whiteSpace: "pre-line" }} action={<Button disabled={saving} onClick={() => setRevision((value) => value + 1)}>Reintentar</Button>}>{catalogs.errors.join("\n")}</Alert>}
      <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}><Stack spacing={2}>
        {catalogs.loading && <CircularProgress size={24} aria-label="Cargando rutas y recursos" />}
        {field("tour_route_id", "Ruta", { select: true, disabled: catalogs.loading, children: [<MenuItem key="none" value="">Sin ruta</MenuItem>, ...catalogs.routes.map((route) => <MenuItem key={route.id} value={route.id}>{route.name}</MenuItem>), selectedOption(catalogs.routes, form.tour_route_id, "Ruta")] })}
        <FormControlLabel control={<Switch checked={vehiclesOnly} onChange={(event) => setVehiclesOnly(event.target.checked)} />} label="Mostrar solo vehículos" />
        {field("resource_id", "Recurso / vehículo", { select: true, disabled: catalogs.loading, children: [<MenuItem key="none" value="">Sin recurso</MenuItem>, ...resources.map((resource) => <MenuItem key={resource.id} value={resource.id}>{resource.name} · Capacidad {resource.capacity ?? "—"}</MenuItem>), selectedOption(resources, form.resource_id, "Recurso")] })}
        {field("departure_date", "Fecha de salida", { type: "date", required: true, InputLabelProps: { shrink: true } })}
        {field("departure_time", "Hora de salida", { type: "time", required: true, InputLabelProps: { shrink: true } })}
        {field("estimated_return_time", "Hora estimada de regreso", { type: "time", InputLabelProps: { shrink: true } })}
        {field("capacity", "Capacidad", { type: "number", required: true, inputProps: { min: 1, step: 1 } })}
        {field("price", "Precio", { type: "number", required: true, inputProps: { min: 0, step: ".01" } })}
        {field("status", "Estado", { select: true, required: true, children: DEPARTURE_STATUSES.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>) })}
        {field("notes", "Notas", { multiline: true, minRows: 3 })}
      </Stack></fieldset>
    </Stack></DialogContent>
    <DialogActions><Button disabled={saving} onClick={onClose}>Cerrar</Button><Button variant="contained" type="submit" disabled={saving || catalogs.loading}>{saving ? "Guardando…" : "Guardar salida"}</Button></DialogActions>
  </Dialog>;
}
