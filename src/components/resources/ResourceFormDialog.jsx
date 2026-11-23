import React, { useEffect, useState } from "react";
import {
  Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, Grid, MenuItem, Switch, TextField,
} from "@mui/material";
import { RESOURCE_TYPES } from "./ResourceList";

const EMPTY = {
  resource_code: "", type: "employee", name: "", description: "", capacity: 1,
  user_id: "", is_active: true, config: {},
};

const CONFIG_FIELDS = {
  vehicle: [["plate", "Placa"], ["brand", "Marca"], ["model", "Modelo"], ["color", "Color"]],
  room: [["number", "Número de habitación"], ["location", "Ubicación"]],
  space: [["location", "Ubicación"]],
  equipment: [["brand", "Marca"], ["model", "Modelo"], ["serial_number", "Número de serie"]],
  other: [["location", "Ubicación"]],
};

export default function ResourceFormDialog({ open, resource, saving, apiErrors = {}, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY, ...(resource || {}), user_id: resource?.user_id ?? "", config: resource?.config || {} });
    setErrors({});
  }, [open, resource]);

  const setField = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const setConfig = (key) => (event) => setForm((current) => ({
    ...current, config: { ...(current.config || {}), [key]: event.target.value },
  }));
  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (!String(form.name).trim()) next.name = "El nombre es obligatorio.";
    if (!form.type) next.type = "Selecciona un tipo.";
    if (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) < 1) next.capacity = "La capacidad debe ser un entero mayor a cero.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({
      ...form,
      name: form.name.trim(),
      resource_code: form.resource_code.trim() || null,
      description: form.description.trim() || null,
      capacity: Number(form.capacity),
      user_id: form.type === "employee" && form.user_id !== "" ? Number(form.user_id) : null,
      config: Object.keys(form.config || {}).length ? form.config : null,
      is_active: !!form.is_active,
    });
  };
  const fieldError = (key) => errors[key] || (Array.isArray(apiErrors[key]) ? apiErrors[key][0] : apiErrors[key]);

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" PaperProps={{ component: "form", onSubmit: submit, sx: { bgcolor: "#fff", color: "#000", border: "1px solid rgba(0,0,0,.08)", borderRadius: 3, "& .MuiInputBase-root": { bgcolor: "#fff" }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,.18)" }, "& .MuiButton-contained": { bgcolor: "#000", color: "#fff", fontWeight: 900, "&:hover": { bgcolor: "rgba(0,0,0,.85)" } } } }}>
      <DialogTitle fontWeight={900}>{resource ? "Editar recurso" : "Crear recurso"}</DialogTitle>
      <DialogContent dividers sx={{ bgcolor: "#fafafa", borderColor: "rgba(0,0,0,.08)" }}>
        {apiErrors.general && <Alert severity="error" sx={{ mb: 2 }}>{apiErrors.general}</Alert>}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}><TextField autoFocus label="Nombre" value={form.name} onChange={setField("name")} error={!!fieldError("name")} helperText={fieldError("name")} required fullWidth /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><TextField label="Código" value={form.resource_code} onChange={setField("resource_code")} error={!!fieldError("resource_code")} helperText={fieldError("resource_code")} fullWidth /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><TextField select label="Tipo" value={form.type} onChange={setField("type")} error={!!fieldError("type")} helperText={fieldError("type")} required fullWidth>{RESOURCE_TYPES.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField></Grid>
          <Grid size={{ xs: 12, md: 6 }}><TextField label="Capacidad" type="number" inputProps={{ min: 1, step: 1 }} value={form.capacity} onChange={setField("capacity")} error={!!fieldError("capacity")} helperText={fieldError("capacity")} fullWidth /></Grid>
          {form.type === "employee" && <Grid size={{ xs: 12 }}><TextField label="ID del usuario/trabajador" type="number" value={form.user_id} onChange={setField("user_id")} error={!!fieldError("user_id")} helperText={fieldError("user_id") || "Opcional. Vincula este recurso con un usuario existente."} fullWidth /></Grid>}
          <Grid size={{ xs: 12 }}><TextField label="Descripción" value={form.description} onChange={setField("description")} multiline minRows={3} error={!!fieldError("description")} helperText={fieldError("description")} fullWidth /></Grid>
          {(CONFIG_FIELDS[form.type] || []).map(([key, label]) => <Grid key={key} size={{ xs: 12, sm: 6 }}><TextField label={label} value={form.config?.[key] || ""} onChange={setConfig(key)} fullWidth /></Grid>)}
          <Grid size={{ xs: 12 }}><FormControlLabel control={<Switch checked={!!form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />} label="Recurso activo" /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: "#000", fontWeight: 900 }}>Cancelar</Button>
        <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}>{saving ? "Guardando…" : "Guardar"}</Button>
      </DialogActions>
    </Dialog>
  );
}
