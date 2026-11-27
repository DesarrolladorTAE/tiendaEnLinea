import { usePOSOperations } from "../../context/POSOperationsContext";
import React, { useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { posVehicleEnabled } from "../../utils/posVehicle";
import ModalPDFPreview from "../tickets/ModalPDFPreview";
import { VehicleChoice } from "../vehicles/VehicleRecordFields";
import { integerRange, vehicleRecordsUrl as adminVehicleRecordsUrl } from "../../services/admin/vehicleRecords";
import { formPdfPath } from "../../services/admin/dynamicForms";
import { operations as adminOperations, operationUrl as adminOperationUrl, orderActions, orderPdf, statusLabels } from "../../services/admin/serviceOperations";
import { showConfirm } from "../../utils/alerts";
import OperationIntake, { useOperationChoices } from "./OperationIntake";

export default function OperationOrder({ branch, response, access, forms, busy, mutate, onBooking }) {
  const pos = usePOSOperations();
  const operations = pos?.operations ?? adminOperations;
  const operationUrl = pos?.operationUrl ?? adminOperationUrl;
  const vehicleRecordsUrl = pos?.vehicleRecordsUrl ?? adminVehicleRecordsUrl;
  const { data: row, forms_progress: progress } = response;
  const id = row.id;
  const status = row.status?.code;
  const actions = orderActions(status);
  const [resource, setResource] = useState(String(row.resource_id ?? ""));
  const [mileage, setMileage] = useState(String(row.visit_mileage ?? ""));
  const [sale, setSale] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState(row.priority ?? "normal");
  const [description, setDescription] = useState(row.description ?? "");
  const [diagnosis, setDiagnosis] = useState(row.diagnosis ?? "");
  const [resolution, setResolution] = useState(row.resolution ?? "");
  const [pdf, setPdf] = useState(null);
  const [thermal, setThermal] = useState(null);
  const [paper, setPaper] = useState(80);
  const [next, setNext] = useState(false);
  const { resources } = useOperationChoices(branch, actions.edit ? row.service_id : null, false);
  const pending = progress?.required_pending;
  const submissions = row.form_submissions ?? [];
  const history = [...(row.history ?? [])].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id - b.id);
  const act = (method, ...args) => mutate((signal) => operations[method](branch, id, ...args, signal));
  const cancel = async () => {
    if (await showConfirm("¿Cancelar la orden y liberar el horario de su cita asociada?", "Cancelar orden")) act("cancelOrder", reason.trim());
  };
  const section = (label, content) => <Accordion disableGutters><AccordionSummary expandIcon={<span aria-hidden>⌄</span>}>{label}</AccordionSummary>
    <AccordionDetails><Stack spacing={2}>{content}</Stack></AccordionDetails></Accordion>;
  return <Stack spacing={2}>
    <Typography variant="h5">{row.order_code}</Typography>
    {(pos ? pos.canSell : posVehicleEnabled) && !row.sale_id && <Button component={Link} to={pos?.saleUrl ?? "/prueba/pos?seccion=venta"} state={{ serviceOrderId: row.id, ...(pos ? { returnToOrder: operationUrl("orders/" + id, branch) } : {}) }}>Abrir punto de venta</Button>}
    <Typography fontWeight={700}>{statusLabels[status] ?? status}</Typography>
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      {actions.start && <Button variant="contained" disabled={busy} onClick={() => act("start")}>Iniciar atención</Button>}
      {actions.complete && <Button variant="contained" disabled={busy || !Array.isArray(pending) || pending.length > 0}
        onClick={async () => { if (await showConfirm("¿Finalizar la orden y liberar la capacidad operativa?", "Finalizar orden")) act("complete"); }}>Finalizar orden</Button>}
    </Stack>
    {actions.complete && <Alert severity="info">
      {pending?.length ? `Formularios obligatorios pendientes: ${pending.join(", ")}.` : "Revisa la recepción antes de finalizar."}
      {" "}Kilometraje: {row.visit_mileage ?? "sin registrar"}. Recurso: {row.resource?.name ?? "sin asignar"}.
    </Alert>}
    {section("General", <>
      <Typography>{row.service?.name ?? row.service_id}</Typography>
      {[[ "Descripción", description, setDescription], ["Diagnóstico", diagnosis, setDiagnosis], ["Resolución", resolution, setResolution]].map(([label, value, update]) =>
        <TextField key={label} label={label} multiline value={value} disabled={busy || !actions.edit} onChange={(e) => update(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 10000 } }} />)}
      <TextField select label="Prioridad" value={priority} disabled={busy || !actions.edit} onChange={(e) => setPriority(e.target.value)}>
        {[["low","Baja"],["normal","Normal"],["high","Alta"],["urgent","Urgente"]].map(([code,label]) => <MenuItem key={code} value={code}>{label}</MenuItem>)}
      </TextField>
      {actions.edit && <><Button disabled={busy} onClick={() => act("editOrder", { description: description || null, diagnosis: diagnosis || null,
        resolution: resolution || null, priority })}>Guardar información</Button>
        <TextField label="Motivo de cancelación" value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} slotProps={{ htmlInput: { maxLength: 2000 } }} />
        <Button color="error" disabled={busy || reason.trim().length < 5} onClick={cancel}>Cancelar orden</Button></>}
    </>)}
    {section("Cliente y vehículo", <>
      <Typography>{row.customer_snapshot?.name ?? "Sin nombre histórico"} {row.customer_snapshot?.phone}</Typography>
      <Typography>{[row.vehicle_snapshot?.brand, row.vehicle_snapshot?.model, row.vehicle_snapshot?.year, row.vehicle_snapshot?.plates, row.vehicle_snapshot?.vin].filter(Boolean).join(" · ") || "Sin datos históricos de vehículo"}</Typography>
      <Typography>Kilometraje de visita: {row.visit_mileage ?? "Sin registrar"}</Typography>
      {row.vehicle_id && access.canRead && <Button component={Link} to={vehicleRecordsUrl(branch, `/${row.vehicle_id}`)}>Abrir expediente</Button>}
      {row.vehicle_id && access.canWrite && actions.edit && <>
        <TextField label="Kilometraje de visita" value={mileage} onChange={(e) => setMileage(e.target.value)} disabled={busy} />
        <Button disabled={busy || !integerRange(mileage, 0, 999999999)} onClick={() => mutate((signal) => operations.mileage(row.vehicle_id, id, Number(mileage), signal))}>Registrar kilometraje</Button>
      </>}
    </>)}
    {section("Técnico o recurso", <>
      <Typography>{row.resource?.name ?? "Sin asignar"}</Typography>
      {actions.edit && <>
        <VehicleChoice label="Recurso asignado" value={resource} options={resources.data} current={row.resource}
          loading={resources.loading} disabled={busy || Boolean(resources.error)} onChange={setResource} />
        {resources.error && <Alert severity="error" action={<Button onClick={resources.retry}>Reintentar</Button>}>No se pudieron consultar los recursos asociados.</Alert>}
        <Button disabled={busy || resources.loading || Boolean(resources.error) || (!resource && row.service?.requires_resource)}
          onClick={() => act("resource", Number(resource) || null)}>Guardar recurso</Button>
      </>}
    </>)}
    {(!pos || forms) && section("Formularios e inspecciones", <>
      {(row.form_requirements_snapshot ?? []).map((form) => <Typography key={form.template_id}>
        {form.name} · {form.required ? "Obligatorio" : "Opcional"} · Versión {form.version}
      </Typography>)}
      {submissions.map((form) => <Stack key={form.id} direction="row" alignItems="center" spacing={1}>
        <Typography>{form.folio} · {({draft:"Borrador",completed:"Completado",cancelled:"Cancelado"})[form.status] ?? form.status}</Typography>
        {forms && <Button onClick={() => setPdf({ path: formPdfPath(branch, id, form.id), name: `formulario-${form.folio}.pdf` })}>PDF de inspección</Button>}
      </Stack>)}
      {forms && <Button component={Link} to={operationUrl(`orders/${id}/forms`, branch)}>Abrir capturas</Button>}
    </>)}
    {section("Venta vinculada", row.sale_id ? <Typography>Venta ID {row.sale_id}{row.sale?.status && ` · Estado: ${row.sale.status}`}{!pos && row.sale?.total_amount != null && ` · Total: ${row.sale.total_amount}`}</Typography> : <>
      <TextField label="ID de la venta existente" value={sale} onChange={(e) => setSale(e.target.value)} disabled={busy} />
      <Button disabled={busy || !integerRange(sale, 1, Number.MAX_SAFE_INTEGER)} onClick={() => act("sale", Number(sale))}>Vincular venta</Button>
    </>)}
    {section("Historial", history.length ? history.map((event) => <Stack key={event.id} spacing={0.5}>
      <Typography fontWeight={700}>{event.description || event.event_type}</Typography>
      <Typography variant="body2">{event.created_at} · {event.metadata?.actor_type} {event.metadata?.actor_id}</Typography>
      {event.metadata?.technician_snapshot && <Typography variant="body2">{event.metadata.technician_snapshot}</Typography>}
      {event.metadata?.visit_mileage != null && <Typography variant="body2">{event.metadata.visit_mileage} km</Typography>}
      {event.metadata?.sale_id && <Typography variant="body2">Venta #{event.metadata.sale_id}</Typography>}
      {!pos && event.metadata && <details><summary>Datos registrados</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(event.metadata, null, 2)}</pre></details>}
    </Stack>) : <Typography>Sin eventos registrados.</Typography>)}
    {section("Documentos", <>
      <Button onClick={() => setPdf({ path: orderPdf(branch, id), name: `orden-${row.order_code}.pdf` })}>Vista previa y descarga PDF</Button>
      <TextField select label="Ancho de comprobante térmico" value={paper} onChange={(e) => { setPaper(Number(e.target.value)); setThermal(null); }}>
        <MenuItem value={58}>58 mm</MenuItem><MenuItem value={80}>80 mm</MenuItem>
      </TextField>
      <Button disabled={busy} onClick={() => mutate(async (signal) => {
        const result = await operations.thermal(branch, id, paper, signal);
        if (!result?.ok || !result.payload) throw new Error("Comprobante no reconocido.");
        if (!signal.aborted) setThermal(result.payload);
      }, false)}>Consultar comprobante</Button>
      {thermal && <pre style={{ whiteSpace: "pre-wrap" }}>{thermal.textBeforeQr}{thermal.textAfterQr}</pre>}
    </>)}
    {section("Próxima visita", next ? <OperationIntake branch={branch} mode="booking" origin={row} access={access} onSaved={onBooking} />
      : <Button onClick={() => setNext(true)}>Programar próxima visita</Button>)}
    {pdf && <ModalPDFPreview open privateDocument httpClient={pos?.client} endpoint={pdf.path} nombreArchivo={pdf.name} onClose={() => setPdf(null)} />}
  </Stack>;
}

