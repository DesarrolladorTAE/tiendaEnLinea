import React, { useState } from "react";
import { Alert, Button, Card, Chip, CircularProgress, Grid, MenuItem, Pagination, Stack, TextField, Typography } from "@mui/material";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import useDynamicFormsAccess from "../../hooks/useDynamicFormsAccess";
import { dynamicForms, formError, formLink, formsPath, positiveId } from "../../services/admin/dynamicForms";
import { useVehicleMutation as useMutation, useVehicleRequest as useRequest } from "../../components/vehicles/VehicleRecordFields";
import DynamicForm from "../../components/services/DynamicForm";
import FormTemplateEditor, { FormIssues } from "../../components/services/FormTemplateEditor";
import OrderFormCapture, { OrderFormList, orderFormsUrl } from "../../components/services/OrderFormCapture";
import { showConfirm } from "../../utils/alerts";
import { previewAnswers } from "../../components/services/formSchema";

export default function DynamicFormsPage({ mode = "list" }) {
  const access = useDynamicFormsAccess();
  const { templateId, orderId, submissionId } = useParams();
  const [params] = useSearchParams();
  const branchId = access.branch?.id;
  const context = `${access.storeId}:${branchId}:${mode}:${templateId}:${orderId}:${submissionId}`;
  const invalidId = [templateId, orderId, submissionId].some((value) => value != null && !positiveId(value));
  return <Stack spacing={2} sx={{ maxWidth: 1200, mx: "auto" }}>
    <Card variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderLeft: "5px solid #f9b233" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
        <div><Typography variant="h4" fontWeight={800}>Formularios e inspecciones</Typography>
          {branchId && <Typography color="text.secondary">Sucursal: {access.branch.name || `#${branchId}`}</Typography>}</div>
        <Button component={Link} to={branchId ? formLink("/admin/services", branchId) : "/admin/sucursales"}>Volver a {branchId ? "servicios" : "sucursales"}</Button>
      </Stack>
    </Card>
    <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
      {!branchId ? <Alert severity="info">Selecciona una sucursal para comprobar el acceso.</Alert> :
        access.loading ? <CircularProgress aria-label="Comprobando acceso a formularios" /> :
        access.error ? <Alert severity="error" action={<Button onClick={access.retry}>Reintentar</Button>}>{access.error}</Alert> :
        !access.read || (["new", "edit"].includes(mode) && !access.configure) ? <Alert severity="warning">No tienes permiso para esta operación de formularios.</Alert> :
        invalidId ? <Alert severity="error">Identificador inválido.</Alert> :
        <FormsContent key={context} {...{ branchId, mode, templateId, orderId, submissionId }} access={access} historical={params.get("history") === "1"} />}
    </Card>
  </Stack>;
}

function FormsContent({ mode, branchId, templateId, orderId, submissionId, access, historical }) {
  const navigate = useNavigate();
  const templates = formLink(formsPath, branchId);
  const toDetail = (item) => navigate(formLink(`${formsPath}/${item.id}`, branchId), { replace: true });
  if (mode === "new") return <FormTemplateEditor onCancel={() => navigate(templates)} onSaved={toDetail} />;
  if (orderId) return submissionId ?
    <OrderFormCapture {...{ branchId, orderId, submissionId, historical }} canCapture={access.capture} /> :
    <OrderFormList {...{ branchId, orderId }} canCapture={access.capture} />;
  if (templateId) return <TemplateDetail branchId={branchId} id={templateId} editing={mode === "edit"} canConfigure={access.configure} />;
  return <TemplateList branchId={branchId} canConfigure={access.configure} />;
}

function TemplateList({ branchId, canConfigure }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState({});
  const [orderId, setOrderId] = useState("");
  const [issue, setIssue] = useState("");
  const { busy, run } = useMutation();
  const navigate = useNavigate();
  const request = useRequest((signal) => dynamicForms.list({ ...filters, page }, signal), JSON.stringify([page, filters]));
  const install = () => run(async (signal) => {
    setIssue("");
    try {
      const result = await dynamicForms.install(signal);
      if (signal.aborted) return;
      if (!positiveId(result?.id)) throw new Error("No se pudo confirmar la plantilla instalada.");
      navigate(formLink(`${formsPath}/${result.id}`, branchId));
    } catch (error) { if (!signal.aborted) setIssue(Object.values(formError(error).fields).join(" ") || formError(error).text); }
  });
  return <Stack spacing={2}>
    <Stack direction={{ xs: "column", sm: "row" }} useFlexGap flexWrap="wrap" spacing={1}>
      {canConfigure && <>
        <Button component={Link} variant="contained" to={formLink(`${formsPath}/new`, branchId)}>Nueva plantilla</Button>
        <Button variant="outlined" disabled={busy} onClick={install}>Instalar inspección de 25 puntos</Button>
      </>}
      <Button component={Link} to={formLink("/admin/services", branchId)}>Buscar servicio para asociar</Button>
    </Stack>
    <Stack component="form" direction={{ xs: "column", sm: "row" }} spacing={1} onSubmit={(event) => {
      event.preventDefault(); setPage(1); setFilters({ ...(search.trim() ? { search: search.trim() } : {}), ...(status ? { is_active: Number(status) } : {}) });
    }}>
      <TextField size="small" label="Buscar por nombre o clave" value={search} fullWidth onChange={(event) => setSearch(event.target.value)} slotProps={{ htmlInput: { maxLength: 191 } }} />
      <TextField select size="small" label="Estado" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 130 }}>
        <MenuItem value="">Todos</MenuItem><MenuItem value="1">Activas</MenuItem><MenuItem value="0">Inactivas</MenuItem>
      </TextField>
      <Button type="submit" variant="outlined">Buscar</Button>
    </Stack>
    <Stack component="form" direction={{ xs: "column", sm: "row" }} spacing={1} onSubmit={(event) => {
      event.preventDefault();
      if (positiveId(orderId)) navigate(orderFormsUrl(branchId, orderId));
    }}>
      <TextField size="small" label="ID de orden existente" value={orderId} onChange={(event) => setOrderId(event.target.value)} />
      <Button type="submit" disabled={!positiveId(orderId)}>Abrir formularios de la orden</Button>
    </Stack>
    {issue && <Alert severity="error">{issue}</Alert>}
    {request.loading && <CircularProgress aria-label="Cargando plantillas" />}
    {request.error && <Alert severity="error" action={<Button onClick={request.retry}>Reintentar</Button>}>{formError(request.error).text}</Alert>}
    {request.data && <>
      {!request.data.data.length && <Typography>Sin plantillas para esta consulta.</Typography>}
      <Grid container spacing={1.5}>{request.data.data.map((item) => <Grid key={item.id} size={{ xs: 12, md: 6 }}>
        <Card variant="outlined" sx={{ p: 2, height: "100%" }}><Stack spacing={1}>
          <Typography fontWeight={700}>{item.name}</Typography>
          <Typography variant="body2">{item.key} · Versión {item.version}</Typography>
          <Chip size="small" label={item.is_active ? "Activa" : "Inactiva"} sx={{ alignSelf: "flex-start" }} />
          <Button component={Link} to={formLink(`${formsPath}/${item.id}`, branchId)}>Ver plantilla</Button>
        </Stack></Card>
      </Grid>)}</Grid>
      {request.data.last_page > 1 && <Pagination count={request.data.last_page} page={page} onChange={(_, value) => setPage(value)} />}
    </>}
  </Stack>;
}

function TemplateDetail({ branchId, id, editing, canConfigure }) {
  const request = useRequest((signal) => dynamicForms.template(id, signal), id);
  const [replacement, setReplacement] = useState(null);
  const [duplicate, setDuplicate] = useState(null);
  const [issue, setIssue] = useState({});
  const [preview, setPreview] = useState(false);
  const [answers, setAnswers] = useState({});
  const { busy, run } = useMutation();
  const navigate = useNavigate();
  const detail = formLink(`${formsPath}/${id}`, branchId);
  if (request.loading) return <CircularProgress aria-label="Cargando plantilla" />;
  if (request.error) return <Alert severity="error" action={<Button onClick={request.retry}>Reintentar</Button>}>{formError(request.error).text}</Alert>;
  const template = replacement ?? request.data;
  if (Number(template?.id) !== Number(id) || !Array.isArray(template.schema?.sections)) {
    return <Alert severity="error">La plantilla devuelta no corresponde a la consulta o su esquema está incompleto.</Alert>;
  }
  const mutate = (action) => run(async (signal) => {
    setIssue({});
    try { await action(signal); }
    catch (error) { if (!signal.aborted) setIssue(formError(error)); }
  });
  if (editing) return <FormTemplateEditor template={template} onCancel={() => navigate(detail)} onSaved={() => navigate(detail, { replace: true })} />;
  return <Stack spacing={2}>
    <Typography variant="h5">{template.name}</Typography>
    <Typography>{template.key} · Versión vigente {template.version} · {template.is_active ? "Activa" : "Inactiva"}</Typography>
    {template.description && <Typography>{template.description}</Typography>}
    <Alert severity="info">Las versiones anteriores se consultan en las capturas que guardaron su snapshot.</Alert>
    <FormIssues message={issue.text} fields={issue.fields} />
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
      <Button variant="outlined" onClick={() => {
        setPreview(!preview);
        setAnswers(previewAnswers(template.schema));
      }}>{preview ? "Cerrar vista previa" : "Vista previa"}</Button>
      {canConfigure && <>
        <Button component={Link} to={formLink(`${formsPath}/${id}/edit`, branchId)}>Editar plantilla</Button>
        <Button disabled={busy} onClick={() => mutate(async (signal) => {
          const next = !template.is_active;
          if (!await showConfirm(next ? "¿Activar plantilla?" : "¿Desactivar plantilla? Se conservarán las capturas existentes.", next ? "Activar" : "Desactivar") || signal.aborted) return;
          const result = await dynamicForms.status(id, next, signal);
          if (!signal.aborted) {
            if (Number(result?.id) !== Number(id) || result.is_active !== next) throw new Error("No se pudo confirmar el estado actualizado.");
            setReplacement(result);
          }
        })}>{template.is_active ? "Desactivar" : "Activar"}</Button>
        <Button disabled={busy} onClick={() => setDuplicate({ name: "", key: "" })}>Duplicar</Button>
      </>}
      <Button component={Link} to={formLink(formsPath, branchId)}>Volver a plantillas</Button>
    </Stack>
    {duplicate && <Stack component="form" spacing={1.5} onSubmit={(event) => {
      event.preventDefault();
      if (!duplicate.name.trim() || !/^[a-z][a-z0-9-]*$/.test(duplicate.key)) { setIssue({ text: "Ingresa un nombre y una clave válida." }); return; }
      void mutate(async (signal) => {
        const result = await dynamicForms.duplicate(id, { name: duplicate.name.trim(), key: duplicate.key }, signal);
        if (!signal.aborted) {
          if (!positiveId(result?.id)) throw new Error("No se pudo confirmar la copia.");
          navigate(formLink(`${formsPath}/${result.id}`, branchId));
        }
      });
    }}>
      <TextField label="Nombre de la copia" value={duplicate.name} disabled={busy} onChange={(event) => setDuplicate({ ...duplicate, name: event.target.value })} slotProps={{ htmlInput: { maxLength: 191 } }} />
      <TextField label="Clave de la copia" value={duplicate.key} disabled={busy} onChange={(event) => setDuplicate({ ...duplicate, key: event.target.value })} slotProps={{ htmlInput: { maxLength: 100 } }} />
      <Stack direction="row"><Button type="submit" disabled={busy}>Guardar copia</Button><Button disabled={busy} onClick={() => setDuplicate(null)}>Cancelar</Button></Stack>
    </Stack>}
    {preview && <DynamicForm schema={template.schema} answers={answers} onChange={(field, value) => setAnswers((previous) => ({ ...previous, [field]: value }))} />}
  </Stack>;
}
