import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, CircularProgress, FormControlLabel, Grid, MenuItem, Paper, Stack, Switch, Typography } from "@mui/material";
import { serviceService } from "../../services/admin/serviceService";
import { bookingDraft, bookingNumbers, bookingPayload, isDate, validateBooking } from "./serviceSchedule";
import { ScheduleExceptionsFields, ScheduleField, SetupFeedback, WeeklyScheduleFields } from "./ScheduleFields";
import { setupError, useServiceSetupEditor } from "./useServiceSetupEditor";

export default function ServiceBookingConfig({ branchId, serviceId, duration, active = true }) {
  const read = useCallback(async (signal) => {
    const { data } = await serviceService.getBookingConfig(branchId, serviceId, signal);
    if (!data || !Object.hasOwn(data, "data") || (data.data !== null &&
        (!Array.isArray(data.data.weekly_schedules) || !Array.isArray(data.data.schedule_exceptions)))) {
      throw new Error("Invalid booking config");
    }
    return data.data;
  }, [branchId, serviceId]);
  const initialDuration = useRef(duration === "" ? null : duration);
  const toDraft = useCallback((config) => bookingDraft(config, initialDuration.current), []);
  const { draft, setDraft, load, feedback, saving, save, reload } = useServiceSetupEditor(read, toDraft);
  const change = (key) => (value) => setDraft((previous) => ({ ...previous, [key]: value }));
  const errors = feedback?.fields || {};
  const submit = (event) => {
    event.preventDefault();
    void save({
      validate: validateBooking,
      checkLatest: true,
      write: async (value) => {
        const { data } = await serviceService.saveBookingConfig(branchId, serviceId, bookingPayload(value));
        if (!Array.isArray(data?.data?.weekly_schedules) || !Array.isArray(data.data.schedule_exceptions)) {
          throw new Error("Invalid booking config");
        }
        return data.data;
      },
    });
  };

  return <Stack spacing={3}>
    <Typography variant="h5">Configuración de agenda</Typography>
    {load.loading ? <CircularProgress aria-label="Cargando agenda" /> : load.message ? (
      <Alert severity="error" action={<Button onClick={reload}>Reintentar</Button>}>{load.message}</Alert>
    ) : draft && (
      <Stack component="form" noValidate onSubmit={submit} spacing={2}>
        <SetupFeedback feedback={feedback} />
        <Stack component="fieldset" disabled={saving} spacing={2} sx={{ minWidth: 0, border: 0, m: 0, p: 0 }}>
          <Stack direction={{ xs: "column", sm: "row" }}>
            <FormControlLabel label="Agenda activa" control={<Switch checked={draft.is_active} onChange={(event) => change("is_active")(event.target.checked)} />} />
            <FormControlLabel label="Requiere confirmación" control={<Switch checked={draft.requires_confirmation} onChange={(event) => change("requires_confirmation")(event.target.checked)} />} />
          </Stack>
          <Grid container spacing={1.5}>
            {bookingNumbers.map(([key, label]) => <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
              <ScheduleField path={key} errors={errors} label={label} value={draft[key]} onChange={change(key)} type="number" />
            </Grid>)}
          </Grid>
          <WeeklyScheduleFields rows={draft.weekly_schedules} onChange={change("weekly_schedules")} errors={errors} withCapacity />
          <ScheduleExceptionsFields rows={draft.exceptions} onChange={change("exceptions")} errors={errors} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? "Guardando…" : "Guardar agenda"}</Button>
            <Button type="button" onClick={reload} disabled={saving}>Descartar borrador y recargar</Button>
          </Stack>
        </Stack>
      </Stack>
    )}
    <AvailabilityPreview branchId={branchId} serviceId={serviceId} active={active} />
  </Stack>;
}

function AvailabilityPreview({ branchId, serviceId, active }) {
  const pending = useRef();
  const [date, setDate] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [resources, setResources] = useState([]);
  const [resourceError, setResourceError] = useState("");
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState({});
  useEffect(() => {
    if (!active) return undefined;
    const controller = new AbortController();
    setResourceError("");
    serviceService.getResources(branchId, serviceId, controller.signal).then(({ data }) => {
      if (!controller.signal.aborted) {
        const activeResources = data.resources.filter((row) => row.is_active && row.pivot?.is_active);
        setResources(activeResources);
        setResourceId((id) => activeResources.some((row) => Number(row.id) === Number(id)) ? id : "");
      }
    }).catch((error) => {
      if (!controller.signal.aborted) {
        setResources([]);
        setResourceId("");
        setResourceError(setupError(error, "No se pudieron cargar los recursos asociados.").message);
      }
    });
    return () => controller.abort();
  }, [active, branchId, serviceId, revision]);
  useEffect(() => () => pending.current?.abort(), []);
  const clearResult = () => {
    pending.current?.abort();
    setResult({});
  };
  const search = async (event) => {
    event.preventDefault();
    if (!isDate(date)) {
      setResult({ message: "Selecciona una fecha válida." });
      return;
    }
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setResult({ loading: true });
    try {
      const { data } = await serviceService.availability(branchId, serviceId, { date, resource_id: resourceId || undefined }, controller.signal);
      if (!Array.isArray(data?.data?.slots)) throw new Error("Invalid availability");
      if (!controller.signal.aborted) setResult({ data: data.data });
    } catch (error) {
      if (!controller.signal.aborted) setResult(setupError(error, "No se pudo consultar la disponibilidad."));
    }
  };
  return <Paper variant="outlined" sx={{ p: 2 }}>
    <Stack component="form" onSubmit={search} noValidate spacing={1.5}>
      <Typography variant="h6">Vista previa de disponibilidad</Typography>
      <Typography variant="body2">Consulta la agenda guardada para la fecha indicada.</Typography>
      {resourceError && <Alert severity="warning" action={<Button onClick={() => setRevision((n) => n + 1)}>Reintentar</Button>}>{resourceError}</Alert>}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <ScheduleField errors={{}} label="Fecha de consulta" type="date" value={date} onChange={(value) => { setDate(value); clearResult(); }} />
        <ScheduleField errors={{}} label="Recurso" value={resourceId} onChange={(value) => { setResourceId(value); clearResult(); }}>
          <MenuItem value="">Sin filtro de recurso</MenuItem>
          {resources.map((row) => <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>)}
        </ScheduleField>
        <Button variant="outlined" type="submit" disabled={result.loading} sx={{ flexShrink: 0 }}>Consultar</Button>
      </Stack>
      {result.loading && <CircularProgress size={24} aria-label="Consultando disponibilidad" />}
      <SetupFeedback feedback={result.message ? result : null} />
      {result.data && <Stack spacing={0.5} aria-live="polite">
        <Typography variant="body2">Zona horaria: {result.data.timezone}</Typography>
        {result.data.slots.length === 0 ? <Typography>Sin horarios disponibles</Typography> :
          result.data.slots.map((slot, index) => <Typography key={index}>{slot.start_time} – {slot.end_time}
            {slot.resource_ids?.length > 0 && ` · ${slot.resource_ids.map((id) => resources.find((row) => row.id === id)?.name || `#${id}`).join(", ")}`}
          </Typography>)}
      </Stack>}
    </Stack>
  </Paper>;
}
