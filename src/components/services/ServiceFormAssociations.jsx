import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Checkbox, CircularProgress, FormControlLabel, Pagination, Paper, Stack, Typography } from "@mui/material";
import { serviceService } from "../../services/admin/serviceService";
import { SetupFeedback } from "./ScheduleFields";
import { setupError, useServiceSetupEditor } from "./useServiceSetupEditor";

const sameId = (first, second) => Number(first) === Number(second);
const toDraft = (value) => value.forms.map(({ template_id, required, sort_order }) => ({ template_id, required, sort_order }));

export default function ServiceFormAssociations({ branchId, serviceId }) {
  const [known, setKnown] = useState({});
  const [catalog, setCatalog] = useState({ loading: true, rows: [] });
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const read = useCallback(async (signal) => {
    const { data } = await serviceService.getForms(branchId, serviceId, signal);
    if (!Array.isArray(data?.data?.forms) || !Array.isArray(data.data.templates)) throw new Error("Invalid form associations");
    if (!signal?.aborted) setKnown((old) => ({ ...old, ...Object.fromEntries(data.data.templates.map((template) => [template.id, template])) }));
    return data.data;
  }, [branchId, serviceId]);
  const { draft, setDraft, load, feedback, save, saving, reload } = useServiceSetupEditor(read, toDraft);
  const canList = !load.loading && !load.message;

  useEffect(() => {
    if (!canList) return undefined;
    const controller = new AbortController();
    setCatalog({ loading: true, rows: [] });
    serviceService.listFormTemplates({ page, per_page: 20 }, controller.signal).then(({ data }) => {
      if (!controller.signal.aborted) {
        if (!Array.isArray(data?.data)) throw new Error("Invalid form template page");
        setKnown((old) => ({ ...old, ...Object.fromEntries(data.data.map((template) => [template.id, template])) }));
        setCatalog({ rows: data.data, pages: data.last_page, page: data.current_page });
      }
    }).catch((error) => {
      if (!controller.signal.aborted) setCatalog({ rows: [], ...setupError(error, "No se pudieron cargar las plantillas.") });
    });
    return () => controller.abort();
  }, [branchId, serviceId, page, revision, canList]);

  const add = (template) => setDraft((rows) => [...rows, {
    template_id: template.id, required: false,
    sort_order: Math.min(1000, Math.max(0, ...rows.map((row) => row.sort_order)) + 1),
  }]);
  const submit = (event) => {
    event.preventDefault();
    void save({
      validate: (rows) => {
        if (rows.some((row) => known[row.template_id]?.is_active !== true)) {
          return { forms: "Quita o sustituye las plantillas inactivas antes de guardar." };
        }
        return {};
      },
      write: async (rows) => {
        const { data } = await serviceService.saveForms(branchId, serviceId, rows.map((row) => ({
          template_id: Number(row.template_id), required: row.required, sort_order: row.sort_order,
        })));
        if (!Array.isArray(data?.data?.forms)) throw new Error("Invalid form associations");
        return data.data;
      },
    });
  };

  if (load.loading) return <CircularProgress aria-label="Cargando formularios asociados" />;
  if (load.message) return <Alert severity="error" action={<Button onClick={reload}>Reintentar</Button>}>{load.message}</Alert>;
  return <Stack component="form" onSubmit={submit} spacing={2}>
    <Typography variant="h5">Formularios asociados</Typography>
    <SetupFeedback feedback={feedback} />
    <Typography variant="h6">Selección del servicio</Typography>
    {draft.length === 0 && <Typography>Sin formularios asociados.</Typography>}
    {draft.map((row, index) => {
      const template = known[row.template_id];
      return <Paper key={row.template_id} variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={1}>
          <TemplateLabel template={template} fallback={row.template_id} />
          <FormControlLabel label="Obligatorio" control={<Checkbox disabled={saving} checked={row.required}
            onChange={(event) => setDraft((rows) => rows.map((item, i) => i === index ? { ...item, required: event.target.checked } : item))} />} />
          <Button type="button" color="error" disabled={saving} onClick={() => setDraft((rows) => rows.filter((_, i) => i !== index))}
            aria-label={`Quitar ${template?.name || row.template_id}`}>Quitar</Button>
        </Stack>
      </Paper>;
    })}
    <Typography variant="h6">Plantillas disponibles</Typography>
    {catalog.loading && <CircularProgress aria-label="Cargando plantillas" />}
    {catalog.message && <Alert severity="error" action={<Button onClick={() => setRevision((n) => n + 1)}>Reintentar</Button>}>{catalog.message}</Alert>}
    {!catalog.loading && !catalog.message && !catalog.rows.length && <Typography>Sin plantillas disponibles.</Typography>}
    {catalog.rows.map((template) => <Paper key={template.id} variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
        <TemplateLabel template={template} />
        <Button type="button" disabled={saving || !template.is_active || draft.length >= 20 || draft.some((row) => sameId(row.template_id, template.id))}
          onClick={() => add(template)} aria-label={`Agregar ${template.name}`}>Agregar</Button>
      </Stack>
    </Paper>)}
    {catalog.pages > 1 && <Pagination count={catalog.pages} page={catalog.page} onChange={(_, value) => setPage(value)} />}
    <Button type="submit" variant="contained" disabled={saving} sx={{ alignSelf: { sm: "start" } }}>
      {saving ? "Guardando…" : "Guardar formularios"}
    </Button>
  </Stack>;
}

function TemplateLabel({ template, fallback }) {
  return <Stack sx={{ flex: 1 }}>
    <Typography fontWeight={700}>{template?.name ?? `Plantilla #${fallback}`}</Typography>
    {template && <Typography variant="body2">{template.is_active ? "Activa" : "Inactiva"} · Versión {template.version}</Typography>}
  </Stack>;
}
