import { tourDialogSx, tourMenuProps } from "./tourFormStyles.mjs";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from "@mui/material";
import { addTourRouteStop, getTourStops, updateTourRouteStop } from "../../services/tours/tourService";
import { validateRouteStop, tourFormError as departureError } from "./tourFormData.mjs";

export default function TourRouteStopDialog({ context, route, stop, initialStop, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ tour_stop_id: initialStop?.id || "", stop_order: stop?.order ?? route.stops.length + 1,
    default_departure_time: stop?.time?.slice(0, 5) || "", boarding_minutes: stop?.boardingMinutes ?? 0, price_adjustment: stop?.priceAdjustment ?? 0 }));
  const [catalog, setCatalog] = useState(() => initialStop ? [initialStop] : []);
  const [loading, setLoading] = useState(!stop);
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const pending = useRef(false);
  useEffect(() => {
    if (stop) return;
    let active = true; const controller = new AbortController();
    setLoading(true); setError("");
    getTourStops({ ...context, signal: controller.signal }).then((rows) => {
      if (active) setCatalog(initialStop && !rows.some((row) => String(row.id) === String(initialStop.id)) ? [...rows, initialStop] : rows);
    }).catch((err) => { if (active) setError(departureError(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [context.branchId, context.serviceId, context.mode, stop, initialStop, revision]);
  const submit = async (event) => {
    event.preventDefault(); event.stopPropagation();
    if (pending.current || loading) return;
    const validation = validateRouteStop(form);
    if (!stop && !catalog.some((item) => String(item.id) === String(form.tour_stop_id))) validation.tour_stop_id = "Selecciona una parada.";
    setErrors(validation); setError("");
    if (Object.keys(validation).length) return;
    pending.current = true; setSaving(true);
    const values = { stop_order: Number(form.stop_order), default_departure_time: form.default_departure_time || null,
      boarding_minutes: Number(form.boarding_minutes), price_adjustment: form.price_adjustment };
    try {
      const response = stop ? await updateTourRouteStop(context, route.id, stop.id, values) : await addTourRouteStop(context, route.id, form.tour_stop_id, values);
      onSaved(response.data?.message || "Parada guardada en la ruta.");
    } catch (err) { setError(departureError(err)); setErrors(err.response?.data?.errors || {}); }
    finally { pending.current = false; setSaving(false); }
  };
  const field = (key, label, props = {}) => <TextField SelectProps={{ MenuProps: tourMenuProps }} fullWidth key={key} label={label} value={form[key]} disabled={saving || loading} onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))} error={!!errors[key]} helperText={Array.isArray(errors[key]) ? errors[key].join(" ") : errors[key]} {...props} />;
  const available = catalog.filter((item) => !route.stops.some((existing) => String(existing.id) === String(item.id)));
  return <Dialog sx={tourDialogSx} open fullWidth maxWidth="sm" onClose={saving ? undefined : onClose} PaperProps={{ component: "form", onSubmit: submit, sx: { bgcolor: "#fff", color: "#172033", borderRadius: 3 } }}>
    <DialogTitle>{stop ? `Abordaje · ${stop.name}` : "Agregar parada existente"}</DialogTitle>
    <DialogContent><Stack spacing={2} pt={1}>
      {initialStop && <Alert severity="success">La parada ya se creó en el catálogo. Guarda el abordaje para agregarla a esta ruta.</Alert>}
      <Alert severity="info">La configuración se aplica a esta ruta y a todas las salidas que la utilizan.</Alert>
      {error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }} action={!stop && <Button disabled={saving || loading} onClick={() => setRevision((value) => value + 1)}>Reintentar</Button>}>{error}</Alert>}
      {!stop && field("tour_stop_id", "Parada", { select: true, children: [<MenuItem value="" key="none">Selecciona una parada</MenuItem>, ...available.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)] })}
      {!stop && !loading && !available.length && <Alert severity="info">No hay paradas disponibles para agregar. Crea una nueva desde la ruta.</Alert>}
      {field("stop_order", "Orden", { type: "number", required: true, inputProps: { min: 1, max: 4294967295, step: 1 } })}
      {field("default_departure_time", "Hora de abordaje", { type: "time", InputLabelProps: { shrink: true } })}
      {field("boarding_minutes", "Minutos de abordaje", { type: "number", required: true, inputProps: { min: 0, max: 4294967295, step: 1 } })}
      {field("price_adjustment", "Ajuste de precio", { type: "number", required: true, inputProps: { min: -9999999999.99, max: 9999999999.99, step: "0.01" } })}
    </Stack></DialogContent>
    <DialogActions><Button disabled={saving} onClick={onClose}>Cancelar</Button><Button variant="contained" type="submit" disabled={saving || loading || (!stop && !available.length)}>{saving ? "Guardando…" : "Guardar abordaje"}</Button></DialogActions>
  </Dialog>;
}
