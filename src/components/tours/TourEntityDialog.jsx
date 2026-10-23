import { tourDialogSx, tourMenuProps } from "./tourFormStyles.mjs";
import React, { useRef, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Switch, TextField } from "@mui/material";
import { createTourRoute, createTourStop, updateTourRoute, updateTourStop } from "../../services/tours/tourService";
import { tourEntityRecord, tourFormError as departureError } from "./tourFormData.mjs";

export default function TourEntityDialog({ context, entity, record, onClose, onSaved }) {
  const isRoute = entity === "route";
  const [form, setForm] = useState(() => isRoute ? {
    name: record?.name || "", origin: record?.origin || "", destination: record?.destination || "", description: record?.description || "", is_active: record?.is_active == null ? true : Boolean(Number(record.is_active)),
  } : {
    name: record?.name || "", address: record?.address || "", reference: record?.reference || "", lat: record?.lat ?? "", lng: record?.lng ?? "", is_active: record?.is_active == null ? true : Boolean(Number(record.is_active)),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const pending = useRef(false);
  const submit = async (event) => {
    event.preventDefault(); event.stopPropagation();
    if (pending.current) return;
    const validation = {};
    if (!form.name.trim() || form.name.length > 191) validation.name = "Escribe un nombre de hasta 191 caracteres.";
    if (isRoute) {
      ["origin", "destination"].forEach((key) => { if (form[key].length > 191) validation[key] = "Máximo 191 caracteres."; });
    } else {
      [["lat", 90], ["lng", 180]].forEach(([key, limit]) => {
        if (form[key] !== "" && (!Number.isFinite(Number(form[key])) || Math.abs(Number(form[key])) > limit)) validation[key] = `Ingresa un valor entre -${limit} y ${limit}.`;
      });
    }
    setErrors(validation); setError("");
    if (Object.keys(validation).length) return;
    pending.current = true; setSaving(true);
    try {
      const values = { ...form, name: form.name.trim() };
      if (!isRoute) { values.lat = form.lat === "" ? null : Number(form.lat); values.lng = form.lng === "" ? null : Number(form.lng); }
      const response = isRoute
        ? await (record ? updateTourRoute(context, record.id, values) : createTourRoute(context, values))
        : await (record ? updateTourStop(context, record.id, values) : createTourStop(context, values));
      let savedRecord = record ? { ...record, ...values } : null;
      if (!record) {
        try { savedRecord = { ...values, ...tourEntityRecord(response.data, entity) }; }
        catch { /* The write succeeded. Refresh catalogs rather than risk creating a duplicate. */ }
      }
      onSaved(savedRecord, savedRecord ? response.data?.message || "Cambios guardados." : "El registro se guardó, pero la respuesta no incluyó un ID reconocible. Actualiza el catálogo y selecciónalo antes de continuar.");
    } catch (err) { setError(departureError(err)); setErrors(err.response?.data?.errors || {}); }
    finally { pending.current = false; setSaving(false); }
  };
  const field = (key, label, props = {}) => <TextField SelectProps={{ MenuProps: tourMenuProps }} key={key} fullWidth label={label} value={form[key]} onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))} error={!!errors[key]} helperText={Array.isArray(errors[key]) ? errors[key].join(" ") : errors[key]} disabled={saving} {...props} />;
  return <Dialog sx={tourDialogSx} open fullWidth maxWidth="sm" onClose={saving ? undefined : onClose} PaperProps={{ component: "form", onSubmit: submit, sx: { bgcolor: "#fff", color: "#172033", borderRadius: 3 } }}>
    <DialogTitle>{record ? "Editar" : "Crear"} {isRoute ? "ruta" : "parada"}</DialogTitle>
    <DialogContent><Stack spacing={2} pt={1}>
      {error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{error}</Alert>}
      {record && <Alert severity="warning">{isRoute ? "Esta ruta puede utilizarse en varias salidas. Sus cambios afectan a todas ellas." : "Esta parada puede utilizarse en varias rutas. Cambiar su nombre, dirección o referencia afecta a todas ellas."}</Alert>}
      {field("name", "Nombre", { required: true, inputProps: { maxLength: 191 } })}
      {isRoute ? <>{field("origin", "Origen", { inputProps: { maxLength: 191 } })}{field("destination", "Destino", { inputProps: { maxLength: 191 } })}{field("description", "Descripción", { multiline: true, minRows: 2 })}</> : <>
        {field("address", "Dirección", { multiline: true })}
        {field("reference", "Referencia", { multiline: true, minRows: 2 })}
        {field("lat", "Latitud", { type: "number", inputProps: { min: -90, max: 90, step: "any" } })}
        {field("lng", "Longitud", { type: "number", inputProps: { min: -180, max: 180, step: "any" } })}
      </>}
      <FormControlLabel control={<Switch checked={form.is_active} disabled={saving} onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))} />} label="Activo" />
    </Stack></DialogContent>
    <DialogActions><Button disabled={saving} onClick={onClose}>Cancelar</Button><Button variant="contained" type="submit" disabled={saving}>{saving ? "Guardando…" : isRoute ? "Guardar ruta" : "Guardar parada"}</Button></DialogActions>
  </Dialog>;
}
