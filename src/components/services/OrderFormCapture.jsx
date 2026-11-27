import { usePOSOperations } from "../../context/POSOperationsContext";
import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CircularProgress, Grid, Stack, TextField, Typography } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import DynamicForm from "./DynamicForm";
import { validateAnswers } from "./formSchema";
import { FormIssues } from "./FormTemplateEditor";
import { dynamicForms as adminDynamicForms, formError, formLink, formPdfPath, orderFormsPath, positiveId } from "../../services/admin/dynamicForms";
import { useVehicleMutation as useMutation, useVehicleRequest as useRequest } from "../vehicles/VehicleRecordFields";
import { showConfirm } from "../../utils/alerts";
import ModalPDFPreview from "../tickets/ModalPDFPreview";

export const submissionState = (value) => ({ draft: "Borrador", completed: "Completado", cancelled: "Cancelado" })[value] ?? value ?? "Sin estado";
const defaultOrderFormsUrl = (branch, order, submissionId, historical = false) => formLink(
  `${orderFormsPath}/${order}/forms${submissionId ? `/${submissionId}` : ""}`, branch,
) + (historical ? "&history=1" : "");

export { defaultOrderFormsUrl as orderFormsUrl };

export function OrderFormList({ branchId, orderId, canCapture }) {
  const pos = usePOSOperations();
  const dynamicForms = pos?.dynamicForms ?? adminDynamicForms;
  const orderFormsUrl = pos?.orderFormsUrl ?? defaultOrderFormsUrl;
  const request = useRequest((signal) => dynamicForms.assignments(orderId, signal), orderId);
  const { busy, run } = useMutation();
  const [issue, setIssue] = useState("");
  const navigate = useNavigate();
  const start = (templateId) => run(async (signal) => {
    setIssue("");
    try {
      const record = await dynamicForms.start(orderId, Number(templateId), signal);
      if (signal.aborted) return;
      if (!positiveId(record?.id) || Number(record.service_order_id) !== Number(orderId)) throw new Error("No se pudo confirmar la captura. Actualiza la orden antes de volver a iniciarla.");
      navigate(orderFormsUrl(branchId, orderId, record.id));
    } catch (error) {
      if (!signal.aborted) {
        setIssue(Object.values(formError(error).fields).join(" ") || formError(error).text);
        if (error.response?.status === 409) request.retry();
      }
    }
  });
  if (request.loading) return <CircularProgress aria-label="Cargando formularios" />;
  if (request.error) return <Alert severity="error" action={<Button onClick={request.retry}>Reintentar</Button>}>{formError(request.error).text}</Alert>;
  const data = request.data;
  if (Number(data?.order_id) !== Number(orderId) || !Array.isArray(data.forms) || !Array.isArray(data.submissions)) {
    return <Alert severity="error">Laravel devolvió un listado de formularios no reconocido.</Alert>;
  }
  const { forms, submissions } = data;
  const started = new Set(submissions.map((item) => Number(item.service_form_template_id)));
  return <Stack spacing={2}>
    <Typography variant="h6">Formularios de la orden #{orderId}</Typography>
    {issue && <Alert severity="error">{issue}</Alert>}
    {!forms.length && !submissions.length && <Typography>Esta orden no tiene formularios asociados.</Typography>}
    {submissions.map((item) => <Card variant="outlined" key={item.id} sx={{ p: 2 }}>
      <Typography fontWeight={700}>{item.schema_snapshot?.title || item.folio || `Formulario #${item.id}`}</Typography>
      <Typography>{submissionState(item.status)} · Versión {item.template_version}</Typography>
      <Button component={Link} to={orderFormsUrl(branchId, orderId, item.id)}>{item.status === "draft" && canCapture ? "Abrir borrador" : "Consultar captura"}</Button>
    </Card>)}
    {forms.filter((item) => !started.has(Number(item.template_id))).map((item) => <Card variant="outlined" key={item.template_id} sx={{ p: 2 }}>
      <Typography>{item.schema?.title || `Plantilla #${item.template_id}`} · {item.required ? "Obligatoria" : "Opcional"}</Typography>
      {canCapture && positiveId(item.template_id) && <Button disabled={busy} onClick={() => start(item.template_id)}>Iniciar captura</Button>}
    </Card>)}
  </Stack>;
}

export default function OrderFormCapture({ branchId, orderId, submissionId, canCapture, historical = false }) {
  const pos = usePOSOperations();
  const dynamicForms = pos?.dynamicForms ?? adminDynamicForms;
  const request = useRequest((signal) => dynamicForms.submission(orderId, submissionId, signal), `${orderId}:${submissionId}`);
  if (request.loading) return <CircularProgress aria-label="Cargando captura" />;
  if (request.error) return <Alert severity="error" action={<Button onClick={request.retry}>Reintentar</Button>}>{formError(request.error).text}</Alert>;
  if (Number(request.data?.id) !== Number(submissionId) || Number(request.data?.service_order_id) !== Number(orderId)) {
    return <Alert severity="error">La captura devuelta no corresponde a la orden solicitada.</Alert>;
  }
  return <SubmissionEditor initial={request.data} branchId={branchId} orderId={orderId} canCapture={canCapture} historical={historical} />;
}

function SubmissionEditor({ initial, branchId, orderId, canCapture, historical }) {
  const pos = usePOSOperations();
  const dynamicForms = pos?.dynamicForms ?? adminDynamicForms;
  const orderFormsUrl = pos?.orderFormsUrl ?? defaultOrderFormsUrl;
  const [record, setRecord] = useState(initial);
  const [answers, setAnswers] = useState(() => ({ ...initial.answers }));
  const [issue, setIssue] = useState({});
  const [notice, setNotice] = useState("");
  const [reason, setReason] = useState(null);
  const [pdf, setPdf] = useState(false);
  const { busy, run } = useMutation();
  const dirty = JSON.stringify(answers) !== JSON.stringify({ ...record.answers });
  const draft = record.status === "draft";
  const editable = !historical && canCapture && draft;
  const cancellable = !historical && canCapture && (draft || (!pos && record.status === "completed"));
  const schema = record.schema_snapshot;
  const context = record.context_snapshot;
  const apply = (next) => {
    if (Number(next?.id) !== Number(initial.id) || Number(next?.service_order_id) !== Number(orderId) ||
      !["draft", "completed", "cancelled"].includes(next?.status)) throw new Error("Respuesta de captura no reconocida. Verifica su estado antes de reintentar.");
    setRecord(next);
    setAnswers({ ...next.answers });
  };
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    const warnOnLink = (event) => {
      const link = event.target.closest?.("a[href]");
      if (!link || event.ctrlKey || event.metaKey || link.target === "_blank" || window.confirm("Hay cambios sin guardar. ¿Salir de la captura?")) return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", warnOnLink, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", warnOnLink, true); };
  }, [dirty]);
  const write = (action) => {
    if (!editable || !Array.isArray(schema?.sections)) return;
    const fields = validateAnswers(schema, answers, action === "complete");
    if (Object.keys(fields).length) { setIssue({ fields }); return; }
    void run(async (signal) => {
      if (action === "complete" && (!await showConfirm("La captura completada quedará inmutable. ¿Quieres finalizarla?", "Completar") || signal.aborted)) return;
      setIssue({}); setNotice("");
      try {
        if (action === "save" || dirty) {
          const saved = await dynamicForms.save(orderId, initial.id, answers, signal);
          if (signal.aborted) return;
          apply(saved);
        }
        if (action === "complete") {
          const completed = await dynamicForms.complete(orderId, initial.id, signal);
          if (signal.aborted) return;
          apply(completed);
        }
        setNotice(action === "complete" ? "Captura completada." : "Borrador guardado.");
      } catch (error) { if (!signal.aborted) setIssue(formError(error)); }
    });
  };
  const cancel = () => {
    if (!cancellable) return;
    if (reason.trim().length < 5 || reason.trim().length > 2000) { setIssue({ text: "Ingresa un motivo de 5 a 2000 caracteres." }); return; }
    void run(async (signal) => {
      if (!await showConfirm("Se conservarán las respuestas guardadas y el historial de la captura. ¿Quieres cancelarla?", "Cancelar captura") || signal.aborted) return;
      setIssue({}); setNotice("");
      try {
        const next = await dynamicForms.cancel(orderId, initial.id, reason.trim(), signal);
        if (signal.aborted) return;
        apply(next); setReason(null); setNotice("Captura cancelada.");
      } catch (error) { if (!signal.aborted) setIssue(formError(error)); }
    });
  };
  return <Stack spacing={2}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
      <Typography variant="h6">{record.folio || `Captura #${record.id}`} · {submissionState(record.status)} · Versión {record.template_version}</Typography>
      <Button component={Link} to={orderFormsUrl(branchId, orderId)}>Formularios de la orden</Button>
    </Stack>
    {context && <ContextSummary context={context} />}
    {(record.completed_at || record.cancelled_at || record.created_at) && <Typography variant="body2">
      Fecha: {new Date(record.cancelled_at || record.completed_at || record.created_at).toLocaleString("es-MX")}
    </Typography>}
    {record.cancellation_reason && <Typography>Motivo de cancelación: {record.cancellation_reason}</Typography>}
    {dirty && <Alert severity="warning">Hay cambios sin guardar.</Alert>}
    {notice && <Alert severity="success" role="status">{notice}</Alert>}
    <FormIssues message={issue.text} fields={issue.fields} />
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ position: "sticky", top: 0, p: 1, bgcolor: "background.paper", zIndex: 2 }}>
      {editable && <><Button disabled={busy} variant="outlined" onClick={() => write("save")}>Guardar borrador</Button>
        <Button disabled={busy} variant="contained" onClick={() => write("complete")}>Completar captura</Button></>}
      {cancellable && reason === null && <Button disabled={busy} color="error" onClick={() => setReason("")}>Cancelar captura</Button>}
      <Button disabled={busy} onClick={() => setPdf(true)}>Vista previa y descarga PDF</Button>
    </Stack>
    {reason !== null && <Stack spacing={1}>
      <TextField label="Motivo de cancelación" multiline value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} />
      <Stack direction="row" spacing={1}>
        <Button color="error" disabled={busy} onClick={cancel}>Confirmar cancelación</Button>
        <Button disabled={busy} onClick={() => setReason(null)}>Volver</Button>
      </Stack>
    </Stack>}
    {editable && schema?.kind === "inspection25" && context?.visit_mileage == null && <Alert severity="info">
      Laravel comprueba el kilometraje de visita de la orden al completar la inspección.
    </Alert>}
    <DynamicForm schema={schema} answers={answers} disabled={busy} readOnly={!editable} errors={issue.fields}
      onChange={(id, value) => setAnswers((previous) => ({ ...previous, [id]: value }))} />
    {pdf && <ModalPDFPreview open privateDocument httpClient={pos?.client} onClose={() => setPdf(false)} endpoint={formPdfPath(branchId, orderId, initial.id)}
      nombreArchivo={`formulario-${record.folio || record.id}.pdf`} title="Documento de la captura guardada" />}
  </Stack>;
}

function ContextSummary({ context }) {
  const vehicle = context.vehicle;
  const fields = [["Orden", context.order_code], ["Servicio", context.service], ["Sucursal", context.branch],
    ["Técnico", context.technician], ["Cliente", context.customer?.name],
    ["Vehículo", vehicle ? [vehicle.brand, vehicle.model, vehicle.year, vehicle.plates].filter(Boolean).join(" · ") : null],
    ["Kilometraje de visita", context.visit_mileage == null ? "Desconocido" : `${context.visit_mileage} km`]];
  return <Card variant="outlined" sx={{ p: 2 }}><Grid container spacing={1.5}>
    {fields.map(([label, value]) => <Grid key={label} size={{ xs: 6, md: 3 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography>{typeof value === "object" ? value?.name ?? "—" : value ?? "—"}</Typography>
    </Grid>)}
  </Grid></Card>;
}
