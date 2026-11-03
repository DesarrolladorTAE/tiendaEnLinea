import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { getPublicShipment } from "../../services/public/shippingService";
import { retryAfterMs, safeShippingUrl, validTrackingCode } from "../../utils/shipping.mjs";

const dateLabel = (value) => {
  const date = new Date(value);
  return value && Number.isFinite(date.getTime()) ? date.toLocaleString("es-MX") : "";
};

export default function ShipmentTracking() {
  const [params] = useSearchParams();
  const token = params.get("tracking_token") || "";
  const [code, setCode] = useState(token);
  const [shipment, setShipment] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const request = useRef(null);
  const blockedUntil = useRef(0);

  async function lookup(value) {
    if (Date.now() < blockedUntil.current) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setError("");
    setShipment(null);
    if (!validTrackingCode(value)) {
      setLoading(false);
      setError("Introduce un folio ENV- seguido de 12 letras o números en mayúsculas, o utiliza tu enlace de seguimiento.");
      return;
    }
    setLoading(true);
    try {
      const response = await getPublicShipment(value, controller.signal);
      if (!controller.signal.aborted) setShipment(response.data.data);
    } catch (failure) {
      if (controller.signal.aborted) return;
      const status = failure.response?.status;
      if (status === 429) {
        const until = Date.now() + retryAfterMs(failure.response.headers?.["retry-after"]);
        blockedUntil.current = until;
        setRetryAt(until);
        setClock(Date.now());
        setError("Se alcanzó el límite de consultas. Espera antes de actualizar.");
      } else setError(status === 404 ? "Este enlace o folio no está disponible." : "No se pudo consultar el envío. Intenta nuevamente.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    setCode(token);
    setShipment(null);
    setError("");
    setLoading(false);
    if (token) void lookup(token);
    return () => request.current?.abort();
  }, [token]); // Manual refresh only; never repeats a purchase.

  useEffect(() => {
    if (!retryAt) return undefined;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setClock(now);
      if (now >= retryAt) setRetryAt(0);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  const carrierUrl = safeShippingUrl(shipment?.carrier_tracking_url);
  const logoUrl = safeShippingUrl(shipment?.channel?.logo_url);
  const events = [...(shipment?.events || [])].sort((a, b) => new Date(a.event_at) - new Date(b.event_at));
  const waiting = retryAt > clock;
  return <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
    <HelmetProvider><Helmet><title>Seguimiento de envío</title><meta name="referrer" content="no-referrer" /><meta name="robots" content="noindex, nofollow" /></Helmet></HelmetProvider>
    <Stack spacing={3}>
      <Box><Typography variant="h4" component="h1" fontWeight={800}>Sigue tu pedido</Typography><Typography color="text.secondary">Consulta las novedades que registra la tienda sobre tu entrega.</Typography></Box>
      <Box component="form" onSubmit={(event) => { event.preventDefault(); void lookup(code.trim()); }}>
        <Stack spacing={2}>
          <TextField fullWidth label="Folio de envío" value={code} onChange={(event) => { request.current?.abort(); setLoading(false); setShipment(null); setCode(event.target.value); }} inputProps={{ maxLength: 48 }} helperText="Ejemplo: ENV-ABC123DEF456" />
          <Button type="submit" variant="contained" disabled={loading || waiting || !code.trim()}>{loading ? "Consultando…" : waiting ? `Espera ${Math.ceil((retryAt - clock) / 1000)} s` : "Consultar / Actualizar"}</Button>
        </Stack>
      </Box>
      {error && <Alert severity="error" role="alert">{error}</Alert>}
      {shipment && <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}><Stack spacing={2}>
        <Typography component="h2" variant="h5">{shipment.status_label}</Typography>
        <Typography fontWeight={700}>{shipment.shipment_code}</Typography>
        {shipment.method_name && <Typography>{shipment.method_name}</Typography>}
        {shipment.channel?.name && <Stack direction="row" spacing={1} alignItems="center">{logoUrl && <Box component="img" src={logoUrl} alt="" referrerPolicy="no-referrer" sx={{ width: 40, height: 40, objectFit: "contain" }} />}<Typography>{shipment.channel.name}</Typography></Stack>}
        {shipment.delivery_point && <Box><Typography fontWeight={700}>{shipment.delivery_point.name}</Typography>{["address", "instructions", "hours"].map((key) => shipment.delivery_point[key] && <Typography key={key}>{shipment.delivery_point[key]}</Typography>)}</Box>}
        {shipment.tracking_number && <Typography>Guía: {shipment.tracking_number}</Typography>}
        {carrierUrl && <Button component="a" href={carrierUrl} target="_blank" rel="noopener noreferrer">Consultar paquetería</Button>}
        {shipment.scheduled_at && <Typography>Entrega programada: {dateLabel(shipment.scheduled_at)}</Typography>}
        {shipment.delivered_at && <Typography>Entregado: {dateLabel(shipment.delivered_at)}</Typography>}
        <Typography component="h3" variant="h6">Historial</Typography>
        {!events.length && <Typography>Aún no hay novedades.</Typography>}
        {events.map((event) => <Box key={event.id} sx={{ pl: 2, borderLeft: "3px solid", borderColor: "primary.main" }}><Typography fontWeight={700}>{event.title || event.status}</Typography><Typography variant="body2" color="text.secondary">{dateLabel(event.event_at)}</Typography>{event.description && <Typography>{event.description}</Typography>}{event.location && <Typography variant="body2">{event.location}</Typography>}</Box>)}
        <Typography variant="body2" color="text.secondary">Las actualizaciones las registra la tienda. El estado del envío es independiente de la confirmación del pago.</Typography>
      </Stack></Paper>}
    </Stack>
  </Container>;
}
