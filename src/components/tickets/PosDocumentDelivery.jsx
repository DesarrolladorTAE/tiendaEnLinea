import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField, Typography } from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import axiosClient from "../../config/axiosClient";
import { DOCUMENT_TYPES, enabled } from "../../services/admin/salesDocumentSettings";

const emptyForm = { document_type: "ticket", delivery_method: "print", is_enabled: false, auto_send_whatsapp: false, auto_send_payload: false, app_type: "" };
const apps = [["windows_usb", "Windows · USB"], ["windows_ip", "Windows · red"], ["android_usb", "Android · USB"], ["android_ip", "Android · red"], ["ios_ip", "iPhone · red"], ["ios_ble", "iPhone · Bluetooth BLE"]];

export default function PosDocumentDelivery({ branchId, onDirtyChange, onBusyChange }) {
  const [rows, setRows] = useState([]);
  const [posId, setPosId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSetting, setLoadingSetting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [configured, setConfigured] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [dirty, setDirty] = useState(false);
  const [revision, setRevision] = useState(0);
  const [settingsRevision, setSettingsRevision] = useState(0);
  const submitting = useRef(false);
  const thermal = form.document_type === "ticket" && form.delivery_method === "print";

  useEffect(() => { onDirtyChange?.(dirty); return () => onDirtyChange?.(false); }, [dirty, onDirtyChange]);
  useEffect(() => { onBusyChange?.(saving); return () => onBusyChange?.(false); }, [saving, onBusyChange]);
  useEffect(() => {
    let active = true;
    setRows([]); setPosId(""); setError(""); setNotice(null); setDirty(false);
    if (!branchId) return;
    setLoading(true);
    axiosClient.get(`/branches/${branchId}/pos`).then(({ data }) => {
      if (!active) return;
      const list = Array.isArray(data) ? data : data?.list ?? data?.data;
      if (!Array.isArray(list)) throw new Error("No se pudo leer el listado de puntos de venta.");
      setRows(list); setPosId(list[0]?.id ? String(list[0].id) : "");
    }).catch(err => { if (active) setError(err.response?.data?.message || "No se pudieron cargar los puntos de venta."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [branchId, revision]);

  useEffect(() => {
    if (!posId) return;
    let active = true;
    setLoadingSetting(true); setError(""); setNotice(null); setDirty(false);
    axiosClient.get(`/pos/print-settings/${posId}`).then(({ data }) => {
      if (!active) return;
      const setting = data?.data ?? data;
      const documents = data?.document_settings ?? setting?.document_settings ?? rows.find(row => String(row.id) === posId)?.document_settings ?? {};
      setConfigured(enabled(documents.configured ?? data.configured));
      setForm({
        document_type: documents.document_type || "ticket",
        delivery_method: documents.delivery_method || "print",
        is_enabled: enabled(documents.is_enabled ?? setting?.is_enabled),
        auto_send_whatsapp: enabled(documents.auto_send_whatsapp),
        auto_send_payload: enabled(setting?.auto_send_payload),
        app_type: setting?.app_type || "",
      });
    }).catch(err => { if (active) setError(err.response?.data?.message || "No se pudo cargar la configuración del POS."); })
      .finally(() => { if (active) setLoadingSetting(false); });
    return () => { active = false; };
  }, [posId, rows, settingsRevision]);

  const update = (name, value) => {
    setForm(previous => {
      const next = { ...previous, [name]: value };
      const isThermal = next.document_type === "ticket" && next.delivery_method === "print";
      if (!isThermal) { next.auto_send_payload = false; next.app_type = next.delivery_method === "whatsapp" ? "whatsapp" : ""; }
      else if (next.app_type === "whatsapp") next.app_type = "";
      return next;
    });
    setDirty(true); setNotice(null);
  };
  const save = async event => {
    event.preventDefault();
    if (!posId || submitting.current || !dirty) return;
    if (thermal && form.is_enabled && !apps.some(([value]) => value === form.app_type)) { setNotice({ severity: "error", message: "Selecciona la conexión de la impresora térmica." }); return; }
    submitting.current = true; setSaving(true); setNotice(null);
    try {
      await axiosClient.put(`/pos/print-settings/${posId}`, {
        document_type: form.document_type, delivery_method: form.delivery_method,
        is_enabled: form.is_enabled, auto_send_whatsapp: form.auto_send_whatsapp,
        auto_send_payload: thermal && form.auto_send_payload,
        app_type: thermal ? form.app_type || null : form.delivery_method === "whatsapp" ? "whatsapp" : null,
      });
      setConfigured(true); setDirty(false); setNotice({ severity: "success", message: "Preferencias guardadas para este punto de venta." });
    } catch (err) { setNotice({ severity: "error", message: err.response?.data?.message || "No se pudieron guardar las preferencias." }); }
    finally { submitting.current = false; setSaving(false); }
  };

  if (!branchId) return <Alert severity="info">Selecciona una sucursal arriba para configurar sus puntos de venta.</Alert>;
  return <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
    <Typography component="h2" variant="h6" fontWeight={800}>Qué entrega cada punto de venta</Typography>
    <Typography color="text.secondary" variant="body2" sx={{ mt: 1, mb: 3 }}>Elige el documento habitual y cómo se entrega. El diseño y el logo se personalizan en la otra sección.</Typography>
    {loading ? <CircularProgress aria-label="Cargando puntos de venta" /> : error ? <Alert severity="error" action={<Button onClick={() => setRevision(n => n + 1)}>Reintentar</Button>}>{error}</Alert> : !rows.length ? <Alert severity="info">Esta sucursal todavía no tiene puntos de venta.</Alert> : <>
      <TextField select label="Punto de venta" fullWidth value={posId} disabled={saving || dirty} onChange={event => setPosId(event.target.value)}>{rows.map(row => <MenuItem key={row.id} value={String(row.id)}>{row.name || `POS #${row.id}`}</MenuItem>)}</TextField>
      {dirty && <Typography variant="caption" color="text.secondary">Guarda o descarta tus cambios antes de elegir otro punto de venta.</Typography>}
      {loadingSetting ? <Box sx={{ p: 4 }}><CircularProgress aria-label="Cargando preferencias del POS" /></Box> : <Box component="form" onSubmit={save} sx={{ mt: 3 }}>
        <Chip size="small" label={configured ? "Preferencia propia del POS" : "Comportamiento anterior"} sx={{ mb: 2 }} />
        {!configured && <Alert severity="info" sx={{ mb: 2 }}>Este POS conserva su comportamiento anterior. Al guardar se creará su preferencia explícita; revisa también el envío automático de WhatsApp.</Alert>}
        <Box component="fieldset" disabled={saving} sx={{ p: 0, m: 0, border: 0, minWidth: 0 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", md: "repeat(2,minmax(0,1fr))" }, gap: 2 }}>
            <TextField select fullWidth label="Documento predeterminado" value={form.document_type} onChange={event => update("document_type", event.target.value)}>{DOCUMENT_TYPES.map(item => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField>
            <TextField select fullWidth label="Entrega principal" value={form.delivery_method} onChange={event => update("delivery_method", event.target.value)}>{[["print", "Imprimir"], ["pdf", "Descargar PDF"], ["whatsapp", "Enviar por WhatsApp"]].map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
          </Box>
          <Stack spacing={1} sx={{ my: 2 }}>
            <FormControlLabel control={<Switch checked={form.is_enabled} onChange={event => update("is_enabled", event.target.checked)} />} label="Habilitar la entrega configurada" />
            <FormControlLabel control={<Switch checked={form.auto_send_whatsapp} onChange={event => update("auto_send_whatsapp", event.target.checked)} />} label="Enviar también por WhatsApp al registrar la venta" />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>El envío automático requiere un teléfono válido del cliente. Es independiente de la entrega principal y no se realiza si la entrega está deshabilitada.</Typography>
          {thermal ? <>
            <TextField select fullWidth label="Conexión de impresora térmica" value={form.app_type === "whatsapp" ? "" : form.app_type} onChange={event => update("app_type", event.target.value)}><MenuItem value="">Seleccionar conexión</MenuItem>{apps.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
            <FormControlLabel sx={{ mt: 1 }} control={<Switch checked={form.auto_send_payload} onChange={event => update("auto_send_payload", event.target.checked)} />} label="Enviar automáticamente a la aplicación de impresión" />
          </> : <Alert severity="info">{form.delivery_method === "print" ? "La nota y el comprobante se imprimen desde su PDF en el navegador, en carta o A4." : form.delivery_method === "pdf" ? "El POS entregará el PDF del documento elegido." : "El PDF del documento elegido se enviará por WhatsApp."} La conexión térmica no se utiliza en esta entrega.</Alert>}
        </Box>
        {notice && <Alert severity={notice.severity} sx={{ mt: 2 }}>{notice.message}</Alert>}
        <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} mt={3}>
          <Button type="submit" variant="contained" disabled={saving || !dirty} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveOutlinedIcon />}>{saving ? "Guardando..." : "Guardar preferencias del POS"}</Button>
          {dirty && <Button disabled={saving} onClick={() => setSettingsRevision(n => n + 1)}>Descartar cambios</Button>}
        </Stack>
      </Box>}
    </>}
  </Paper>;
}
