import React, { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Pagination, Paper, Stack, TextField, Typography } from "@mui/material";
import ShipmentFields from "../checkout/ShipmentFields";
import { buildShipment, safeShippingUrl } from "../../utils/shipping.mjs";
import { privateShippingConfig, shipmentStatuses, shipmentTransitions, shippingError } from "../../utils/privateShipping";

const emptyEvent = { status: "", title: "", description: "", location: "", tracking_number: "", tracking_url: "" };
const notificationLabels = { none: "No solicitado", pending: "Pendiente", sent: "Aceptado por proveedor", failed: "Falló" };
const date = value => value ? new Date(value).toLocaleString("es-MX") : "";

export default function ShipmentManager({ open, onClose, client, saleId, branchId, onUpdated, validateSale }) {
  const [filters, setFilters] = useState({ status: "", branch_id: "", sale_id: "", page: 1 });
  const [collection, setCollection] = useState(null);
  const [detail, setDetail] = useState(null);
  const [config, setConfig] = useState(null);
  const [delivery, setDelivery] = useState({ notification_consent: false });
  const [event, setEvent] = useState(emptyEvent);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const lock = useRef(false);
  const pendingRequest = useRef(null);
  const generation = useRef(0);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    const current = ++generation.current;
    setLoading(true); setDetail(null); setCollection(null); setError(""); setNotice(""); setForbidden(false);
    setDelivery({ notification_consent: false }); setEvent(emptyEvent); pendingRequest.current = null;
    const params = { ...filters, status: filters.status || undefined, branch_id: branchId || filters.branch_id || undefined, sale_id: saleId || filters.sale_id || undefined, per_page: 20 };
    // Existing shipments remain operable even when new registrations are disabled.
    client.get("/shipping/config", { signal: controller.signal }).then(response => {
      if (!controller.signal.aborted) setConfig(privateShippingConfig(response.data.data, branchId));
    }).catch(() => { if (!controller.signal.aborted) setConfig(null); });
    client.get("/shipments", { params, signal: controller.signal }).then(async response => {
      if (controller.signal.aborted) return;
      setCollection(response.data.data);
      const first = response.data.data?.data?.[0];
      if (saleId && first) {
        const result = await client.get(`/shipments/${first.id}`, { signal: controller.signal });
        if (!controller.signal.aborted) { setDetail(result.data.data); setEvent({ ...emptyEvent, status: result.data.data.status }); }
      }
    }).catch(failure => { if (!controller.signal.aborted) setError(shippingError(failure)); })
      .finally(() => { if (generation.current === current && !controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); generation.current += 1; };
  }, [open, client, saleId, branchId, filters, reload]);

  async function view(id) {
    const current = generation.current;
    setLoading(true); setError(""); setNotice("");
    try {
      if (validateSale && !await validateSale()) return;
      const response = await client.get(`/shipments/${id}`);
      if (generation.current !== current) return;
      setDetail(response.data.data);
      if (detail?.id !== response.data.data.id) {
        setEvent({ ...emptyEvent, status: response.data.data.status }); pendingRequest.current = null;
      }
      setForbidden(false);
    } catch (failure) { if (generation.current === current) setError(shippingError(failure)); }
    finally { if (generation.current === current) setLoading(false); }
  }

  async function mutate(kind) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setNotice("");
    try {
      if (validateSale && !await validateSale()) return;
      let response;
      if (kind === "create") {
        if (!config?.enabled) throw new Error("La configuración no permite crear envíos desde el panel privado/POS.");
        const payload = buildShipment(config, delivery);
        if (!payload) throw new Error("Selecciona una modalidad de entrega.");
        response = await client.post(`/sales/${saleId}/shipment`, payload);
      } else {
        if (!(shipmentTransitions[detail.status] || []).includes(event.status)) throw new Error("La transición seleccionada no está permitida.");
        if (event.tracking_url && !safeShippingUrl(event.tracking_url)) throw new Error("La URL de rastreo debe ser HTTP(S).");
        const payload = Object.fromEntries(Object.entries(event).filter(([, value]) => value !== ""));
        const content = JSON.stringify(payload);
        if (!pendingRequest.current || pendingRequest.current.content !== content) pendingRequest.current = { content, payload: { ...payload, idempotency_key: uuid() } };
        response = await client.post(`/shipments/${detail.id}/events`, pendingRequest.current.payload);
        pendingRequest.current = null;
      }
      setDetail(response.data.data); setEvent({ ...emptyEvent, status: response.data.data.status });
      setNotice(kind === "create" ? "Envío registrado." : "Seguimiento actualizado."); onUpdated?.(response.data.data);
    } catch (failure) {
      setError(shippingError(failure));
      if (failure.response?.status === 403) setForbidden(true);
      if (failure.response?.status === 409) {
        // Preserve the form and key: a failed response can follow a committed event.
        try {
          const id = detail?.id;
          if (id) { const response = await client.get(`/shipments/${id}`); setDetail(response.data.data); }
          else setReload(value => value + 1);
        } catch { /* Keep the original conflict and offer explicit reload. */ }
      }
    } finally { lock.current = false; setBusy(false); }
  }

  const choices = shipmentTransitions[detail?.status] || [];
  const filter = key => e => setFilters(previous => ({ ...previous, [key]: e.target.value, page: 1 }));
  return <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="md">
    <DialogTitle>{saleId ? `Entrega de la venta #${saleId}` : "Bandeja de envíos"}</DialogTitle>
    <DialogContent dividers><Stack spacing={2}>
      <Alert severity="info">El seguimiento es independiente del pago. Cancelar un envío no cancela ni reembolsa la venta.</Alert>
      {error && <Alert severity="error">{error}</Alert>}{notice && <Alert severity="success">{notice}</Alert>}
      {!saleId && !detail && <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField select fullWidth label="Estado de envío" value={filters.status} onChange={filter("status")}><MenuItem value="">Todos</MenuItem>{Object.entries(shipmentStatuses).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
        {!branchId && <TextField label="Sucursal (ID)" type="number" value={filters.branch_id} onChange={filter("branch_id")} inputProps={{ min: 1 }} />}
        <TextField label="Venta (ID)" type="number" value={filters.sale_id} onChange={filter("sale_id")} inputProps={{ min: 1 }} />
      </Stack>}
      {loading ? <CircularProgress aria-label="Cargando envíos" /> : detail ? <>
        <Stack direction="row" spacing={1} flexWrap="wrap"><Typography variant="h6">{detail.shipment_code}</Typography><Chip label={detail.status_label || shipmentStatuses[detail.status] || detail.status} /></Stack>
        <Typography>Venta #{detail.sale_id} · Sucursal #{detail.branch_id} · {detail.method_name} · {detail.channel?.name}</Typography>
        {safeShippingUrl(detail.channel?.logo_url) && <Box component="img" src={safeShippingUrl(detail.channel.logo_url)} alt={detail.channel.name || "Canal de envío"} referrerPolicy="no-referrer" sx={{ width: 64, height: 64, objectFit: "contain" }} />}
        <Typography>{[detail.recipient?.name, detail.recipient?.phone, detail.recipient?.email].filter(Boolean).join(" · ")}</Typography>
        <Typography>{detail.destination_address || detail.delivery_point?.address}</Typography>
        {detail.delivery_point && <Typography>{[detail.delivery_point.name, detail.delivery_point.hours, detail.delivery_point.instructions].filter(Boolean).join(" · ")}</Typography>}
        <Typography>Costo informado: ${Number(detail.shipping_cost || 0).toFixed(2)} MXN. No confirma un cobro.</Typography>
        {detail.tracking_number && <Typography>Guía de paquetería: {detail.tracking_number}</Typography>}
        {detail.scheduled_at && <Typography>Entrega programada: {date(detail.scheduled_at)}</Typography>}
        {detail.delivered_at && <Typography>Entregado: {date(detail.delivered_at)}</Typography>}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {safeShippingUrl(detail.public_url) && <><Button component="a" href={safeShippingUrl(detail.public_url)} target="_blank" rel="noopener noreferrer">Abrir seguimiento público</Button><Button onClick={async () => { try { await navigator.clipboard.writeText(detail.public_url); setNotice("Enlace copiado."); } catch { setError("No se pudo copiar el enlace. Abre el seguimiento para compartirlo."); } }}>Copiar enlace</Button></>}
          {safeShippingUrl(detail.carrier_tracking_url) && <Button component="a" href={safeShippingUrl(detail.carrier_tracking_url)} target="_blank" rel="noopener noreferrer">Rastrear paquetería</Button>}
        </Stack>
        <Typography variant="h6">Historial público</Typography>
        {(detail.events || []).map((item, index) => <Paper variant="outlined" sx={{ p: 2 }} key={item.id || index}><Typography fontWeight={700}>{item.title || shipmentStatuses[item.status]}</Typography><Typography>{item.description}</Typography><Typography variant="caption">{item.location} · {date(item.event_at || item.created_at)}</Typography></Paper>)}
        <Typography fontWeight={700}>Avisos por WhatsApp</Typography>
        {(detail.notifications || []).length === 0 && <Typography>Sin avisos registrados.</Typography>}
        {(detail.notifications || []).map(item => <Typography key={item.id}>Aviso #{item.id}: {notificationLabels[item.notification_status] || item.notification_status} {date(item.notification_sent_at)}</Typography>)}
        {choices.length > 0 && !forbidden ? <Box component="form" onSubmit={e => { e.preventDefault(); void mutate("event"); }}><Stack spacing={2}>
          <Typography variant="h6">Actualizar seguimiento</Typography><Alert severity="warning">El título, descripción y ubicación serán públicos.</Alert>
          <TextField select required label="Nuevo estado" value={choices.includes(event.status) ? event.status : ""} onChange={e => setEvent(previous => ({ ...previous, status: e.target.value }))} disabled={busy}><MenuItem value="" disabled>Selecciona un estado</MenuItem>{choices.map(value => <MenuItem key={value} value={value}>{shipmentStatuses[value]}</MenuItem>)}</TextField>
          {[["title", "Título", 191], ["description", "Descripción", 2000], ["location", "Ubicación", 191], ["tracking_number", "Guía de paquetería", 191], ["tracking_url", "URL de rastreo (HTTP/S)", 2000]].map(([key, label, maxLength]) => <TextField key={key} label={label} value={event[key]} disabled={busy} multiline={key === "description"} inputProps={{ maxLength }} onChange={e => setEvent(previous => ({ ...previous, [key]: e.target.value }))} />)}
          <Button type="submit" variant="contained" disabled={busy}>Guardar actualización</Button>
        </Stack></Box> : <Alert severity="info">{forbidden ? "No tienes permiso para actualizar este envío." : "Envío cerrado. No admite nuevas actualizaciones."}</Alert>}
      </> : <>
        {(collection?.data || []).map(row => <Paper variant="outlined" sx={{ p: 2 }} key={row.id}><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}><Box><Typography fontWeight={700}>{row.shipment_code} · Venta #{row.sale_id}</Typography><Typography>{row.status_label || shipmentStatuses[row.status]} · {row.method_name}</Typography></Box><Button onClick={() => view(row.id)}>Ver seguimiento</Button></Stack></Paper>)}
        {collection && !collection.data?.length && <Typography>No hay envíos registrados.</Typography>}
        {!saleId && collection?.last_page > 1 && <Pagination count={collection.last_page} page={collection.current_page} onChange={(_, page) => setFilters(previous => ({ ...previous, page }))} />}
        {saleId && collection && !collection.data?.length && (config?.enabled && !forbidden ? <Box component="form" onSubmit={e => { e.preventDefault(); void mutate("create"); }}><Stack spacing={2}><ShipmentFields config={config} value={delivery} onChange={setDelivery} disabled={busy} /><Button type="submit" variant="contained" disabled={busy}>Registrar envío para esta venta</Button></Stack></Box> : <Alert severity="info">No está habilitada la creación de envíos para esta venta. Revisa la configuración de envíos y la sucursal del POS.</Alert>)}
      </>}
    </Stack></DialogContent>
    <DialogActions>{detail && !saleId && <Button disabled={busy} onClick={() => { setDetail(null); setReload(value => value + 1); }}>Volver a la bandeja</Button>}<Button disabled={busy || loading} onClick={() => detail ? view(detail.id) : setReload(value => value + 1)}>Recargar</Button><Button disabled={busy} onClick={onClose}>Cerrar</Button></DialogActions>
  </Dialog>;
}
