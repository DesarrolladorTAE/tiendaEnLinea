import React from "react";
import { Alert, Checkbox, FormControlLabel, MenuItem, Stack, TextField, Typography } from "@mui/material";

export default function ShipmentFields({ config, value, onChange, disabled = false }) {
  if (!config?.enabled) return null;
  const method = config.methods?.find((item) => String(item.id) === String(value.shipping_method_id));
  const pickup = ["pickup", "delivery_point"].includes(method?.fulfillment_type);
  const change = (key) => (event) => onChange({ ...value, [key]: event.target.value });
  return <Stack spacing={1.5}>
    <Typography variant="h6">Entrega de tu pedido</Typography>
    <TextField select label="Modalidad de entrega" value={value.shipping_method_id || ""} disabled={disabled} onChange={(event) => onChange({ ...value, shipping_method_id: event.target.value, delivery_point_id: "", destination_address: "" })}>
      <MenuItem value="">Sin envío solicitado</MenuItem>
      {(config.methods || []).map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
    </TextField>
    {method && <>
      <Alert severity="info">Costo de envío informado: {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(method.base_cost) || 0)}. No está incluido como cobro en el total de esta compra.</Alert>
      {method.estimated_days_min != null && method.estimated_days_max != null && <Typography>Plazo estimado: {method.estimated_days_min}–{method.estimated_days_max} días.</Typography>}
      <TextField required label="Nombre del destinatario" value={value.recipient_name || ""} onChange={change("recipient_name")} inputProps={{ maxLength: 191 }} disabled={disabled} />
      <TextField required label="Teléfono del destinatario" type="tel" value={value.recipient_phone || ""} onChange={change("recipient_phone")} inputProps={{ maxLength: 16 }} disabled={disabled} />
      <TextField label="Correo del destinatario (opcional)" type="email" value={value.recipient_email || ""} onChange={change("recipient_email")} inputProps={{ maxLength: 191 }} disabled={disabled} />
      {pickup ? <TextField select required label="Punto de entrega" value={value.delivery_point_id || ""} onChange={change("delivery_point_id")} disabled={disabled}>
        {(config.delivery_points || []).map((point) => <MenuItem key={point.id} value={point.id}>{point.name} — {point.address}</MenuItem>)}
      </TextField> : <TextField required multiline label="Domicilio completo de entrega" value={value.destination_address || ""} onChange={change("destination_address")} inputProps={{ maxLength: 2000 }} disabled={disabled} />}
      {pickup && (() => { const point = config.delivery_points?.find((item) => String(item.id) === String(value.delivery_point_id)); return point ? <Typography>{[point.hours, point.instructions].filter(Boolean).join(" · ")}</Typography> : null; })()}
      {config.notifications_available && <FormControlLabel control={<Checkbox checked={value.notification_consent === true} disabled={disabled} onChange={(event) => onChange({ ...value, notification_consent: event.target.checked })} />} label="Quiero recibir avisos de este envío por WhatsApp (opcional)." />}
    </>}
  </Stack>;
}
