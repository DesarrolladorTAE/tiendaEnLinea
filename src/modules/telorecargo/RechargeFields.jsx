import React from "react";
import { Alert, Autocomplete, Box, Button, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import { money } from "./model";
import { customerPhone } from "./checkout";

export default function RechargeFields({ catalog, catalogBusy, catalogError, busy, product, onProduct, page, onPage, onRefresh, onQuote, quote, customers, customer, onCustomer, phone, onPhone, confirmPhone, onConfirmPhone }) {
  const rows = catalog?.rows || [];
  const options = product && !rows.some((row) => row.Codigo === product.Codigo) ? [product, ...rows] : rows;
  return <>
    <Box className="trc-recharge-steps" aria-label="Etapas de la recarga">{[[PhoneOutlinedIcon, "Ingresar datos"], [SyncOutlinedIcon, "Procesando recarga"], [DoneAllRoundedIcon, "Recarga completada"]].map(([Icon, label], index) => <Box className={`trc-recharge-step${index === 0 ? " is-active" : ""}`} key={label} aria-current={index === 0 ? "step" : undefined}><span><Icon /></span><Typography variant="body2" fontWeight={750}>{label}</Typography></Box>)}</Box>
    <Typography variant="body2" color="text.secondary">Validamos el número y el monto antes de enviar.</Typography>
    {catalogError && <Alert severity="error">{catalogError}</Alert>}
    {catalogBusy && <Typography role="status">Consultando montos y paquetes…</Typography>}
    <Box className="trc-recharge-fields">
      <TextField select fullWidth required label="Monto o paquete" value={product?.Codigo || ""} disabled={busy || catalogBusy || !options.length} onChange={(event) => onProduct(options.find((row) => String(row.Codigo) === String(event.target.value)))}>
        <MenuItem value="" disabled>Selecciona una recarga</MenuItem>{options.map((row) => <MenuItem key={row.Codigo} value={row.Codigo}>{money(row.Monto)} · {row.Nombre}</MenuItem>)}
      </TextField>
      <TextField fullWidth required label="Teléfono de la recarga" value={phone} onChange={(event) => onPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} inputProps={{ inputMode: "tel", pattern: "[0-9]{10}", maxLength: 10 }} />
      <Autocomplete options={customers} value={customer} onChange={(_, value) => onCustomer(value)} isOptionEqualToValue={(a, b) => a.id === b.id} getOptionLabel={(row) => `${row.nombre_alias || row.razon_social || row.name || "Cliente"}${row.telefono ? ` · ${row.telefono}` : ""}`} renderInput={(params) => <TextField {...params} label="Seleccionar contacto (opcional)" />} />
      <TextField fullWidth required label="Confirmar número" value={confirmPhone} onChange={(event) => onConfirmPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} error={Boolean(confirmPhone && confirmPhone !== phone)} helperText={confirmPhone && confirmPhone !== phone ? "Los números no coinciden." : "Escribe nuevamente los 10 dígitos."} inputProps={{ inputMode: "tel", pattern: "[0-9]{10}", maxLength: 10 }} />
    </Box>
    {customer && !customerPhone(customer) && <Alert severity="info">Este contacto no tiene un teléfono válido. Captura el número de esta recarga.</Alert>}
    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap"><Button disabled={busy || catalogBusy || page <= 1} onClick={() => onPage(page - 1)}>Anterior</Button><Typography variant="caption">Página {page}</Typography><Button disabled={busy || catalogBusy || !catalog?.hasMore} onClick={() => onPage(page + 1)}>Más montos y paquetes</Button><Button disabled={busy || catalogBusy} onClick={onRefresh}>Actualizar montos</Button></Stack>
    <Box className="trc-recharge-details"><Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap"><Typography component="h3" variant="h6" fontWeight={850}>Detalles del producto</Typography>{product && <Chip label={`Recarga: ${money(quote?.importe_recarga ?? product.Monto)}`} color="primary" variant="outlined" />}</Stack>
      {product ? <><Typography fontWeight={750}>{product.Nombre}</Typography><Stack direction="row" gap={2} flexWrap="wrap"><Typography>Comisión: <strong>{quote ? money(quote.comision) : "Consultando…"}</strong></Typography>{product.Vigencia && <Typography>Vigencia: <strong>{product.Vigencia}</strong></Typography>}</Stack>{product.Descripcion && <Typography variant="body2">{product.Descripcion}</Typography>}{quote ? <Box className="trc-recharge-total"><Typography fontWeight={750}>Total a cobrar</Typography><Typography variant="h5" fontWeight={850}>{money(quote.total_cobrar)}</Typography></Box> : <Button disabled={busy} onClick={onQuote}>{busy ? "Consultando total…" : "Volver a consultar total"}</Button>}</> : <Typography variant="body2" color="text.secondary">Elige un monto o paquete para consultar su comisión y total a cobrar.</Typography>}
    </Box>
  </>;
}
