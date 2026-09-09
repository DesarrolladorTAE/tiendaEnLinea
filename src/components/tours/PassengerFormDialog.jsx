import React, { useRef, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, useMediaQuery, useTheme } from "@mui/material";
import { createPassenger } from "../../services/tours/tourService";
import { passengerError } from "./passengerUtils";

export default function PassengerFormDialog({ context, onClose, onCreated, onSessionExpired }) {
  const mobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", email: "", birth_date: "", gender: "", emergency_contact_name: "", emergency_contact_phone: "", notes: "" });
  const [saving, setSaving] = useState(false); const pending = useRef(false);
  const [error, setError] = useState(""); const [errors, setErrors] = useState({});
  const field = (name, label, props = {}) => <TextField fullWidth name={name} label={label} value={form[name]} onChange={(event) => { const value = event.target.value; setForm((prev) => ({ ...prev, [name]: value })); }} error={!!errors[name]} helperText={[].concat(errors[name] || []).join(" ")} {...props} />;
  const submit = async (event) => {
    event.preventDefault(); if (pending.current) return;
    if (!form.first_name.trim()) { setErrors({ first_name: "El nombre es obligatorio." }); return; }
    pending.current = true; setSaving(true); setError(""); setErrors({});
    try {
      const { data } = await createPassenger(context, { ...form, first_name: form.first_name.trim(), birth_date: form.birth_date || null, gender: form.gender || null });
      const passenger = data?.passenger ?? data?.data;
      // Do not allow another POST if a successful response omits its record.
      onCreated(passenger?.id ? passenger : null, form.first_name.trim());
    } catch (err) {
      setError(passengerError(err)); setErrors(err?.response?.data?.errors || {});
      if (err?.response?.status === 401) onSessionExpired();
    } finally { pending.current = false; setSaving(false); }
  };
  return <Dialog open fullScreen={mobile} fullWidth maxWidth="sm" onClose={saving ? undefined : onClose} PaperProps={{ component: "form", onSubmit: submit }}>
    <DialogTitle>Crear pasajero</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      {error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{error}</Alert>}
      <fieldset disabled={saving} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}><Stack spacing={2}>
        {field("first_name", "Nombre", { required: true })}{field("last_name", "Apellidos")}
        {field("phone", "Teléfono", { type: "tel" })}{field("email", "Correo", { type: "email" })}
        {field("birth_date", "Fecha de nacimiento", { type: "date", InputLabelProps: { shrink: true } })}{field("gender", "Género")}
        {field("emergency_contact_name", "Contacto de emergencia")}{field("emergency_contact_phone", "Teléfono de emergencia", { type: "tel" })}
        {field("notes", "Notas", { multiline: true, minRows: 2 })}
      </Stack></fieldset>
    </Stack></DialogContent><DialogActions><Button disabled={saving} onClick={onClose}>Volver al buscador</Button><Button size="large" variant="contained" type="submit" disabled={saving}>{saving ? "Guardando…" : "Crear y seleccionar"}</Button></DialogActions>
  </Dialog>;
}
