import React, { useEffect, useRef, useState } from "react";
import { Alert, Autocomplete, Button, CircularProgress, Grid, Stack, TextField, Typography } from "@mui/material";
import { integerRange, validVehicleId, vehicleRecords } from "../../services/admin/vehicleRecords";

export function useVehicleRequest(read, key) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({});
  useEffect(() => {
    if (key == null) return undefined;
    const controller = new AbortController();
    setState({ key, loading: true });
    read(controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ key, data });
    }).catch((error) => {
      if (!controller.signal.aborted) setState({ key, error, status: error.response?.status });
    });
    return () => controller.abort();
  }, [key, revision]); // The key identifies the request and its parameters.
  return { ...(state.key === key ? state : { loading: key != null }), retry: () => setRevision((n) => n + 1) };
}

export function useVehicleMutation() {
  const active = useRef(false);
  const pending = useRef();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; pending.current?.abort(); };
  }, []);
  const run = async (action) => {
    if (!active.current || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    try { await action(controller.signal); }
    finally {
      pending.current = null;
      if (active.current) setBusy(false);
    }
  };
  return { busy, run };
}

export function useVehicleCustomers() {
  return useVehicleRequest(async (signal) => readChoices(await vehicleRecords.customers(signal)), "customers");
}

function readChoices(response) {
  if (!Array.isArray(response?.data?.data)) throw new Error("Formato de catálogo no reconocido.");
  return response.data.data.filter((row) => validVehicleId(row?.id));
}

const choiceLabel = (item) => (item.nombre_alias || item.name || `#${item.id}`);
export function VehicleChoice({ label, value, options = [], current, onChange, loading, disabled, message }) {
  const rows = current && !options.some((item) => Number(item.id) === Number(current.id)) ? [current, ...options] : options;
  return <Autocomplete
    options={rows} value={rows.find((item) => Number(item.id) === Number(value)) ?? null}
    onChange={(_, item) => onChange(item ? String(item.id) : "")}
    isOptionEqualToValue={(option, item) => Number(option.id) === Number(item.id)}
    getOptionLabel={choiceLabel} getOptionKey={(item) => item.id}
    loading={Boolean(loading)} disabled={disabled}
    loadingText="Cargando…" noOptionsText="Sin resultados"
    renderInput={(params) => <TextField {...params} label={label} size="small" error={Boolean(message)} helperText={message} />}
  />;
}

export function VehicleCatalogChoices({ available, brandId, modelId, current, onBrand, onModel, errors = {}, disabled }) {
  const brands = useVehicleRequest(async (signal) => readChoices(await vehicleRecords.brands(signal)), available ? "brands" : null);
  const models = useVehicleRequest(async (signal) => (await readChoices(await vehicleRecords.models(brandId, signal)))
    .filter((model) => Number(model.vehicle_brand_id) === Number(brandId)), available && validVehicleId(brandId) ? `models:${brandId}` : null);
  const currentBrand = current?.brand ?? (current?.vehicle_brand_id ? { id: current.vehicle_brand_id } : null);
  const currentModel = current?.model ?? (current?.vehicle_model_id ? { id: current.vehicle_model_id } : null);
  return <>
    <Grid size={{ xs: 12, sm: 6 }}>
      <VehicleChoice label="Marca" value={brandId} options={brands.data} current={currentBrand} onChange={onBrand}
        loading={brands.loading} disabled={disabled || !available || Boolean(brands.error)} message={errors.vehicle_brand_id} />
      {brands.error && <Alert severity="warning" action={<Button onClick={brands.retry}>Reintentar</Button>}>No se pudo cargar el catálogo de marcas.</Alert>}
    </Grid>
    <Grid size={{ xs: 12, sm: 6 }}>
      <VehicleChoice label="Modelo" value={modelId} options={models.data}
        current={Number(brandId) === Number(current?.vehicle_brand_id) ? currentModel : null} onChange={onModel}
        loading={models.loading} disabled={disabled || !available || !brandId || Boolean(models.error)} message={errors.vehicle_model_id} />
      {models.error && <Alert severity="warning" action={<Button onClick={models.retry}>Reintentar</Button>}>No se pudo cargar el catálogo de modelos.</Alert>}
    </Grid>
  </>;
}

const editable = ["customer_id", "vehicle_brand_id", "vehicle_model_id", "year", "plates", "vin", "latest_mileage"];
export const vehicleDraft = (record) => Object.fromEntries(editable.map((key) => [key, String(record?.[key] ?? "")]));

export function prepareVehicleWrite(draft, original) {
  const errors = {};
  const values = {};
  const initial = vehicleDraft(original);
  for (const field of editable) {
    const value = draft[field].trim();
    if (original && value === initial[field].trim()) continue;
    if (field.endsWith("_id")) {
      if (!validVehicleId(value)) errors[field] = "Selecciona una opción válida.";
      else values[field] = Number(value);
    } else if (field === "year" || field === "latest_mileage") {
      const [min, max] = field === "year" ? [1886, 2200] : [0, 999999999];
      if (value && !integerRange(value, min, max)) errors[field] = `Ingresa un entero entre ${min} y ${max}.`;
      else values[field] = value === "" ? null : Number(value);
    } else {
      const max = field === "plates" ? 32 : 50;
      if (value.length > max) errors[field] = `Máximo ${max} caracteres.`;
      else values[field] = value || null;
    }
  }
  if (original && (values.vehicle_brand_id || values.vehicle_model_id)) {
    if (!validVehicleId(draft.vehicle_model_id)) errors.vehicle_model_id = "Selecciona un modelo de la marca elegida.";
    else {
      values.vehicle_brand_id = Number(draft.vehicle_brand_id);
      values.vehicle_model_id = Number(draft.vehicle_model_id);
    }
  }
  return { values, errors };
}

export default function VehicleRecordForm({ record, canReadCatalog, onCancel, onSaved }) {
  const [draft, setDraft] = useState(() => vehicleDraft(record));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const customers = useVehicleCustomers();
  const mutation = useVehicleMutation();
  const [newCustomer, setNewCustomer] = useState(false);
  const [addedCustomer, setAddedCustomer] = useState(null);
  const change = (key, value) => setDraft((old) => ({ ...old, [key]: value, ...(key === "vehicle_brand_id" ? { vehicle_model_id: "" } : {}) }));
  const save = (event) => {
    event.preventDefault();
    if (newCustomer) return;
    const { values, errors: issues } = prepareVehicleWrite(draft, record);
    setError("");
    setErrors(issues);
    if (Object.keys(issues).length) return;
    if (!Object.keys(values).length) { onCancel(); return; }
    void mutation.run(async (signal) => {
      try {
        const result = await (record ? vehicleRecords.update(record.id, values, signal) : vehicleRecords.create(values, signal));
        if (signal.aborted) return;
        const id = result.data?.data?.id;
        if (!validVehicleId(id) || (record && Number(id) !== Number(record.id))) {
          setError("Laravel devolvió una confirmación sin el identificador esperado. Verifica el listado antes de volver a guardar.");
          return;
        }
        onSaved(id);
      } catch (failure) {
        if (signal.aborted) return;
        const fields = failure.response?.status === 422 ? failure.response.data?.errors : {};
        setErrors(Object.fromEntries(Object.entries(fields ?? {}).map(([key, messages]) => [key, Array.isArray(messages) ? messages[0] : messages])));
        setError(failure.response?.status === 422 && Object.keys(fields ?? {}).length ?
          "Revisa los campos señalados." : failure.response?.data?.message || "No se pudo guardar el expediente.");
      }
    });
  };
  return <Stack component="form" noValidate onSubmit={save} spacing={2}>
    <Typography variant="h6">{record ? "Editar vehículo" : "Registrar vehículo"}</Typography>
    {error && <Alert severity="error">{error}{errors.vehicle && <div>{errors.vehicle}</div>}</Alert>}
    {!canReadCatalog && <Alert severity="info">El catálogo de marcas y modelos no está disponible en este contexto. Puedes conservar la marca y el modelo registrados al editar.</Alert>}
    {customers.error && <Alert severity="error" action={<Button onClick={customers.retry}>Reintentar</Button>}>No se pudo cargar el directorio de clientes.</Alert>}
    <Grid container spacing={2}>
      <Grid size={12}><VehicleChoice label="Cliente" options={customers.data} current={addedCustomer ?? record?.customer ?? (record?.customer_id ? { id: record.customer_id } : null)}
        value={draft.customer_id} onChange={(value) => change("customer_id", value)}
        disabled={mutation.busy || Boolean(newCustomer) || Boolean(customers.error)} message={errors.customer_id} loading={customers.loading} />
        <QuickCustomerRegistration open={newCustomer} setOpen={setNewCustomer} disabled={mutation.busy} onCreated={(customer) => { setAddedCustomer(customer); change("customer_id", String(customer.id)); }} />
      </Grid>
      <VehicleCatalogChoices available={canReadCatalog} current={record} brandId={draft.vehicle_brand_id} modelId={draft.vehicle_model_id}
        onBrand={(value) => change("vehicle_brand_id", value)} onModel={(value) => change("vehicle_model_id", value)} errors={errors} disabled={mutation.busy} />
      {[["year", "Año"], ["plates", "Placas"], ["vin", "VIN"], ["latest_mileage", "Kilometraje (km)"]].map(([key, label]) =>
        <Grid key={key} size={{ xs: 12, sm: 6 }}>
          <TextField label={label} size="small" fullWidth value={draft[key]} disabled={mutation.busy}
            onChange={(event) => change(key, event.target.value)} error={Boolean(errors[key])}
            helperText={errors[key] || (key === "latest_mileage" ? "Vacío significa desconocido. Esta edición no agrega un evento de visita." : undefined)} />
        </Grid>
      )}
    </Grid>
    <Stack direction="row" spacing={1}>
      <Button variant="contained" type="submit" disabled={mutation.busy || Boolean(newCustomer) || (!record && (!canReadCatalog || !draft.customer_id || !draft.vehicle_brand_id || !draft.vehicle_model_id))}>Guardar expediente</Button>
      <Button type="button" onClick={onCancel} disabled={mutation.busy || newCustomer}>Cancelar</Button>
      {mutation.busy && <CircularProgress size={25} aria-label="Guardando expediente" />}
    </Stack>
  </Stack>;
}

export function QuickCustomerRegistration({ open, setOpen, onCreated, disabled }) {
  const customerMutation = useVehicleMutation();
  const [newCustomer, setNewCustomer] = useState({ nombre_alias: "", telefono: "" });
  const [customerError, setCustomerError] = useState("");
  const createCustomer = () => {
    const nombre_alias = newCustomer.nombre_alias.trim();
    const telefono = newCustomer.telefono.trim();
    if (!nombre_alias || !telefono || nombre_alias.length > 150 || telefono.length > 20) {
      setCustomerError("Ingresa el nombre del cliente y un teléfono de hasta 20 caracteres."); return;
    }
    setCustomerError("");
    void customerMutation.run(async (signal) => {
      try {
        const { data } = await vehicleRecords.createCustomer({ nombre_alias, telefono }, signal);
        if (signal.aborted) return;
        if (!validVehicleId(data?.cliente?.id)) {
          setCustomerError("No se recibió el identificador. Actualiza el directorio antes de volver a crear el cliente."); return;
        }
        onCreated(data.cliente);
        setOpen(false);
      } catch (failure) {
        if (!signal.aborted) {
          const body = failure.response?.data;
          setCustomerError(Object.values(body?.errors ?? {}).flat().join(" ") || body?.message || "No se pudo registrar el cliente.");
        }
      }
    });
  };
  if (!open) return <Button type="button" size="small" disabled={disabled} onClick={() => { setNewCustomer({ nombre_alias: "", telefono: "" }); setCustomerError(""); setOpen(true); }}>Registrar cliente</Button>;
  return <Stack spacing={1.5}>
        {customerError && <Alert severity="error">{customerError}</Alert>}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField fullWidth size="small" label="Nombre del cliente" value={newCustomer.nombre_alias} disabled={customerMutation.busy}
            onChange={(event) => setNewCustomer({ ...newCustomer, nombre_alias: event.target.value })} slotProps={{ htmlInput: { maxLength: 150 } }} />
          <TextField fullWidth size="small" type="tel" label="Teléfono del cliente" value={newCustomer.telefono} disabled={customerMutation.busy}
            onChange={(event) => setNewCustomer({ ...newCustomer, telefono: event.target.value })} slotProps={{ htmlInput: { maxLength: 20 } }} />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button type="button" disabled={customerMutation.busy} onClick={createCustomer}>Guardar cliente</Button>
          <Button type="button" disabled={customerMutation.busy} onClick={() => { setOpen(false); setCustomerError(""); }}>Cancelar cliente</Button>
        </Stack>
      </Stack>;
}
