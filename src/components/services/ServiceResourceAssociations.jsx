import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, CircularProgress, FormControlLabel, Pagination, Paper, Stack, Switch, Typography } from "@mui/material";
import { serviceService } from "../../services/admin/serviceService";
import { resourceService } from "../../services/admin/resourceService";
import { showConfirm } from "../../utils/alerts";
import { ScheduleField, SetupFeedback } from "./ScheduleFields";
import { integerIn, numberOrNull } from "./serviceSchedule";
import { setupError } from "./useServiceSetupEditor";

export default function ServiceResourceAssociations({ branchId, serviceId }) {
  const [assigned, setAssigned] = useState({ loading: true, rows: [] });
  const [available, setAvailable] = useState({ loading: true, rows: [] });
  const [added, setAdded] = useState(null);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [catalogRevision, setCatalogRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setAssigned({ loading: true, rows: [] });
    serviceService.getResources(branchId, serviceId, controller.signal).then(({ data }) => {
      if (!Array.isArray(data?.resources)) throw new Error("Invalid service resources");
      if (!controller.signal.aborted) setAssigned({ rows: data.resources });
    }).catch((error) => {
      if (!controller.signal.aborted) setAssigned({ rows: [], ...setupError(error, "No se pudieron cargar las asociaciones.") });
    });
    return () => controller.abort();
  }, [branchId, serviceId, revision]);

  useEffect(() => {
    const controller = new AbortController();
    setAvailable({ loading: true, rows: [] });
    resourceService.list(branchId, { available: 1, page }, controller.signal).then(({ data }) => {
      if (!Array.isArray(data?.resources?.data)) throw new Error("Invalid resource page");
      if (!controller.signal.aborted) setAvailable({ rows: data.resources.data, pages: data.resources.last_page });
    }).catch((error) => {
      if (!controller.signal.aborted) setAvailable({ rows: [], ...setupError(error, "No se pudo cargar el catálogo de recursos.") });
    });
    return () => controller.abort();
  }, [branchId, page, catalogRevision]);

  const associate = async (resource, values) => {
    await serviceService.associateResource(branchId, serviceId, { resource_id: Number(resource.id), ...values });
    setAssigned((previous) => ({ rows: [...previous.rows, { ...resource, pivot: values }] }));
    setAdded(null);
  };
  if (assigned.loading) return <CircularProgress aria-label="Cargando recursos asociados" />;
  if (assigned.message) return <Alert severity="error" action={<Button onClick={() => setRevision((n) => n + 1)}>Reintentar</Button>}>{assigned.message}</Alert>;
  return <Stack spacing={2}>
    <Typography variant="h5">Recursos del servicio</Typography>
    {assigned.rows.length === 0 && <Typography>Sin recursos asociados.</Typography>}
    {assigned.rows.map((resource) => <ResourceAssociation key={resource.id} resource={resource}
      onSave={(values) => serviceService.updateResource(branchId, serviceId, resource.id, values)}
      onRemove={() => serviceService.removeResource(branchId, serviceId, resource.id)} />)}
    <Typography variant="h6">Recursos activos de la sucursal</Typography>
    {available.loading && <CircularProgress aria-label="Cargando catálogo de recursos" />}
    {available.message && <Alert severity="error" action={<Button onClick={() => setCatalogRevision((n) => n + 1)}>Reintentar</Button>}>{available.message}</Alert>}
    {!available.loading && !available.message && available.rows.length === 0 && <Typography>Sin recursos activos.</Typography>}
    {added && <ResourceAssociation key={added.id} resource={added}
      onSave={(values) => associate(added, values)} onCancel={() => setAdded(null)} />}
    {available.rows.map((resource) => {
      const isAssigned = assigned.rows.some((row) => Number(row.id) === Number(resource.id));
      return <Stack key={resource.id} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Typography>{resource.name}</Typography>
        <Button type="button" disabled={isAssigned || Boolean(added)} onClick={() => setAdded(resource)}>{isAssigned ? "Ya asociado" : "Seleccionar"}</Button>
      </Stack>;
    })}
    {available.pages > 1 && <Pagination page={page} count={available.pages} onChange={(_, value) => setPage(value)} />}
  </Stack>;
}

function ResourceAssociation({ resource, onSave, onRemove, onCancel }) {
  const [draft, setDraft] = useState({
    duration_override: resource.pivot?.duration_override ?? "",
    price_override: resource.pivot?.price_override ?? "",
    is_active: resource.pivot?.is_active ?? true,
  });
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const locked = useRef(false);
  const change = (key) => (value) => setDraft((previous) => ({ ...previous, [key]: value }));
  const run = async (action, message) => {
    if (locked.current) return;
    locked.current = true;
    setSaving(true);
    setFeedback(null);
    try {
      if (await action() !== false) setFeedback({ success: true, message });
    } catch (error) {
      setFeedback(setupError(error, "No se pudo guardar la asociación."));
    } finally {
      locked.current = false;
      setSaving(false);
    }
  };
  const submit = (event) => {
    event.preventDefault();
    if (locked.current) return;
    const fields = {};
    const duration = numberOrNull(draft.duration_override);
    const price = numberOrNull(draft.price_override);
    if (duration !== null && !integerIn(duration, 1, Number.MAX_SAFE_INTEGER)) fields.duration_override = "Ingresa un entero mayor a cero.";
    if (price !== null && (!Number.isFinite(price) || price < 0)) fields.price_override = "Ingresa un precio mayor o igual a cero.";
    if (Object.keys(fields).length) {
      setFeedback({ message: "Revisa los datos del recurso.", fields });
      return;
    }
    void run(() => onSave({ duration_override: duration, price_override: price, is_active: draft.is_active }), "Asociación guardada.");
  };
  const remove = () => run(async () => {
    if (!await showConfirm(`¿Desasociar “${resource.name}” de este servicio?`, "Desasociar")) return false;
    await onRemove();
    change("is_active")(false);
    return true;
  }, "Recurso desasociado.");
  const errors = feedback?.fields ?? {};
  return <Paper variant="outlined" sx={{ p: 1.5 }}>
    <Stack component="form" onSubmit={submit} noValidate spacing={1.5}>
      <Typography fontWeight={700}>{resource.name}</Typography>
      {resource.is_active === false && <Alert severity="info">Este recurso está inactivo en la sucursal.</Alert>}
      {feedback?.message && <SetupFeedback feedback={feedback} />}
      <Stack component="fieldset" disabled={saving} spacing={1.5} sx={{ minWidth: 0, p: 0, m: 0, border: 0 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <ScheduleField path="duration_override" errors={errors} label="Duración particular (minutos)" type="number" value={draft.duration_override} onChange={change("duration_override")} />
          <ScheduleField path="price_override" errors={errors} label="Precio particular" type="number" value={draft.price_override} onChange={change("price_override")} />
          <FormControlLabel label="Asociación activa" control={<Switch checked={draft.is_active} onChange={(event) => change("is_active")(event.target.checked)} />} />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button type="submit" variant="contained">{onRemove ? "Guardar asociación" : "Asociar recurso"}</Button>
          {onRemove && draft.is_active && <Button type="button" color="error" onClick={remove}>Desasociar</Button>}
          {onCancel && <Button type="button" onClick={onCancel}>Cancelar</Button>}
        </Stack>
      </Stack>
    </Stack>
  </Paper>;
}
