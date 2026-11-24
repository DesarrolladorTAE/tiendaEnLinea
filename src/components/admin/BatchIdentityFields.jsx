import React from "react";
import { Box, MenuItem, TextField } from "@mui/material";

export default function BatchIdentityFields({ value, onChange, exactOnly = false, optionalNumber = false, disabled }) {
  const precision = exactOnly ? "day" : value.expiry_precision ?? "day";
  return (
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" } }}>
      <TextField required={!optionalNumber} label="Número de lote" value={value.batch_number ?? ""} disabled={disabled}
        helperText={optionalNumber ? "Si lo dejas vacío, se genera al guardar la entrada." : undefined}
        inputProps={{ maxLength: 120 }} onChange={event => onChange({ batch_number: event.target.value })} />
      <TextField select label="Precisión de caducidad" value={precision} disabled={disabled || exactOnly}
        onChange={event => onChange({ expiry_precision: event.target.value, expires_on: "", expiry_raw: "" })}>
        <MenuItem value="day">Fecha exacta</MenuItem>
        <MenuItem value="month">Mes y año</MenuItem>
        <MenuItem value="unknown">Desconocida</MenuItem>
      </TextField>
      {precision !== "unknown" && (
        <TextField required label="Caducidad" type={precision === "month" ? "month" : "date"} InputLabelProps={{ shrink: true }}
          value={value.expires_on ?? ""} disabled={disabled} onChange={event => onChange({ expires_on: event.target.value })} />
      )}
      <TextField label="Fecha de fabricación" type="date" InputLabelProps={{ shrink: true }} value={value.manufactured_on ?? ""}
        disabled={disabled} onChange={event => onChange({ manufactured_on: event.target.value })} />
      {precision === "month" && <TextField label="Caducidad impresa (opcional)" value={value.expiry_raw ?? ""}
        disabled={disabled} onChange={event => onChange({ expiry_raw: event.target.value })} />}
    </Box>
  );
}
