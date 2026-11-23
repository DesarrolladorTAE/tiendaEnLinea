import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Card, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Paper, Stack, Switch, Tab, Tabs, TextField, Typography } from "@mui/material";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DocumentSettingsTheme from "../../components/admin/DocumentSettingsTheme";
import { Link } from "react-router-dom";
import { useAdminUi } from "../../context/AdminUiContext";
import { useTienda } from "../../context/TiendaContext";
import { getShippingConfig, getShippingBranches, saveShippingSettings, saveShippingResource, uploadShippingLogo } from "../../services/admin/shippingService";
import { safeShippingUrl } from "../../utils/shipping.mjs";

const defaults = { enabled: false, allow_pos: false, allow_public: false, notify_updates: false, whatsapp_provider: "auto", tracking_page_url: "" };
const bool = (value) => value === true || value === 1 || value === "1";
const panel = { p: { xs: 2, sm: 3 }, border: "1px solid", borderColor: "divider", borderRadius: 3, minWidth: 0 };
const toggleStyle = { m: 0, p: 1, border: "1px solid", borderColor: "divider", borderRadius: 2, alignItems: "center" };
const errorText = (error) => [error.response?.data?.message || "No se pudo completar la operación.", ...Object.values(error.response?.data?.errors || {}).flat().filter((value) => typeof value === "string")].join(" ");
const resources = {
  channels: { title: "Canales", singular: "canal", path: "channels", fields: [
    { key: "name", label: "Nombre", required: true, max: 191 }, { key: "code", label: "Código", required: true, max: 50 },
    { key: "has_tracking", label: "Permite seguimiento", type: "boolean" }, { key: "tracking_url_template", label: "URL de rastreo de paquetería (opcional)", max: 2000, help: "Puedes incluir {tracking_number} para insertar la guía." },
  ], defaults: { name: "", code: "", type: "manual", has_tracking: true, tracking_url_template: "", is_active: true } },
  methods: { title: "Métodos de entrega", singular: "método", path: "methods", fields: [
    { key: "name", label: "Nombre", required: true, max: 191 }, { key: "code", label: "Código", required: true, max: 50 },
    { key: "shipping_channel_id", label: "Canal", type: "channel", required: true },
    { key: "fulfillment_type", label: "Modalidad", required: true, options: [["home_delivery", "Reparto a domicilio"], ["shipping", "Paquetería / correo"], ["pickup", "Recogida"], ["delivery_point", "Punto de entrega"]] },
    { key: "base_cost", label: "Costo informado (MXN)", type: "number", required: true, min: 0, step: "0.01" },
    { key: "estimated_days_min", label: "Plazo mínimo en días (opcional)", type: "number", min: 0, max: 365 }, { key: "estimated_days_max", label: "Plazo máximo en días (opcional)", type: "number", min: 0, max: 365 },
  ], defaults: { name: "", code: "", shipping_channel_id: "", fulfillment_type: "home_delivery", base_cost: "0.00", estimated_days_min: "", estimated_days_max: "", is_active: true } },
  delivery_points: { title: "Puntos de entrega", singular: "punto", path: "delivery-points", fields: [
    { key: "name", label: "Nombre", required: true, max: 191 }, { key: "branch_id", label: "Sucursal", type: "branch", required: true },
    { key: "address", label: "Dirección del punto", required: true, max: 2000 }, { key: "instructions", label: "Instrucciones (opcional)", max: 2000 }, { key: "hours", label: "Horario (opcional)", max: 191 },
  ], defaults: { name: "", branch_id: "", address: "", instructions: "", hours: "", is_active: true } },
};

export default function ShippingSettings() {
  const { selectedBranch } = useAdminUi();
  const { tienda } = useTienda();
  const [branches, setBranches] = useState([]);
  const [branchError, setBranchError] = useState("");
  const [config, setConfig] = useState(null);
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("settings");
  const [editor, setEditor] = useState(null);
  const [editorError, setEditorError] = useState("");
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  async function load(signal) {
    setLoading(true);
    try {
      const response = await getShippingConfig(signal);
      if (signal?.aborted) return;
      const data = response.data.data;
      setConfig(data);
      const saved = data.settings || {};
      setSettings({ ...defaults, ...saved, ...Object.fromEntries(["enabled", "allow_pos", "allow_public", "notify_updates"].map((key) => [key, bool(saved[key])])), tracking_page_url: saved.tracking_page_url || "" });
      setError("");
    } catch (failure) {
      if (!signal?.aborted) setError(errorText(failure));
    } finally { if (!signal?.aborted) setLoading(false); }
  }
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, []);
  useEffect(() => {
    if (!tienda?.id) return undefined;
    const controller = new AbortController();
    getShippingBranches(tienda.id, controller.signal).then((rows) => { if (!controller.signal.aborted) { setBranches(rows); setBranchError(""); } }).catch(() => { if (!controller.signal.aborted) setBranchError("No se pudieron cargar las sucursales. Puedes usar la sucursal seleccionada o recargar la página."); });
    return () => controller.abort();
  }, [tienda?.id]);
  useEffect(() => {
    if (!logo) { setLogoPreview(""); return undefined; }
    const url = URL.createObjectURL(logo);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logo]);

  function begin(resource, row) {
    setEditorError(""); setLogo(null);
    const definition = resources[resource];
    const values = Object.fromEntries(Object.keys(definition.defaults).map((key) => [key, row?.[key] ?? definition.defaults[key]]));
    values.is_active = row ? bool(row.is_active) : true;
    if (resource === "channels") values.has_tracking = row ? bool(row.has_tracking) : true;
    if (resource === "delivery_points" && !row) values.branch_id = selectedBranch?.id || "";
    setEditor({ resource, id: row?.id || null, values, logoUrl: safeShippingUrl(row?.logo_url) });
  }
  async function saveSettings(event) {
    event.preventDefault();
    if (lock.current) return;
    setError(""); setNotice("");
    const url = settings.tracking_page_url.trim();
    if (url && (!safeShippingUrl(url) || new URL(url).hash || new URL(url).searchParams.has("tracking_token"))) {
      setError("La URL de seguimiento debe ser HTTP(S), sin fragmentos # ni parámetro tracking_token."); return;
    }
    lock.current = true; setBusy(true);
    try {
      const payload = Object.fromEntries(Object.keys(defaults).map((key) => [key, settings[key]]));
      await saveShippingSettings({ ...payload, tracking_page_url: url || null });
      setNotice("Configuración de envíos guardada.");
    } catch (failure) { setError(errorText(failure)); }
    finally { lock.current = false; setBusy(false); }
  }
  async function saveResource(event) {
    event.preventDefault();
    if (lock.current) return;
    const { resource, values } = editor;
    const payload = { ...values };
    if (resource === "channels") payload.tracking_url_template = payload.tracking_url_template.trim() || null;
    if (resource === "methods") {
      payload.shipping_channel_id = Number(payload.shipping_channel_id);
      for (const field of ["estimated_days_min", "estimated_days_max"]) payload[field] = payload[field] === "" ? null : Number(payload[field]);
      if ((payload.estimated_days_min == null) !== (payload.estimated_days_max == null) || (payload.estimated_days_min != null && payload.estimated_days_max < payload.estimated_days_min)) {
        setEditorError("Indica ambos plazos o deja ambos vacíos. El máximo debe ser mayor o igual al mínimo."); return;
      }
    }
    if (resource === "delivery_points") payload.branch_id = Number(payload.branch_id);
    lock.current = true; setBusy(true); setEditorError(""); setNotice("");
    let savedId = editor.id;
    try {
      const response = await saveShippingResource(resources[resource].path, savedId, payload);
      savedId = savedId || response.data?.data?.id;
      // Keep the created ID if a later logo upload fails; retry updates the
      // existing channel instead of creating a duplicate.
      if (savedId) setEditor((current) => ({ ...current, id: savedId }));
      if (logo) {
        if (!savedId) throw new Error("El canal se guardó, pero no se recibió su identificador para subir el logo. Recarga la lista antes de reintentar.");
        await uploadShippingLogo(savedId, logo);
      }
      setEditor(null); setLogo(null);
      setNotice("Cambios guardados.");
      await load();
    } catch (failure) { setEditorError(failure.response ? errorText(failure) : failure.message); }
    finally { lock.current = false; setBusy(false); }
  }
  function chooseLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setEditorError("El logo debe ser PNG, JPG o WebP y pesar como máximo 2 MB."); event.target.value = ""; return;
    }
    setEditorError(""); setLogo(file);
  }
  const definition = editor ? resources[editor.resource] : null;
  const rows = config?.[tab] || [];
  const branchChoices = [...new Map([...(config?.delivery_points || []).map((point) => ({ id: point.branch_id, name: point.branch?.name || `Sucursal ${point.branch_id}` })), ...branches, ...(selectedBranch ? [selectedBranch] : [])].filter((branch) => branch.id).map((branch) => [String(branch.id), branch])).values()];

  return <DocumentSettingsTheme><Box sx={{ width: "100%", minWidth: 0, maxWidth: 1500, mx: "auto", pb: 3, "& .MuiFormControl-root": { minWidth: 0 }, "& .MuiTypography-root": { overflowWrap: "anywhere" } }}>
    <Stack spacing={2.5}>
      <Paper elevation={0} sx={{ ...panel, bgcolor: "#1d2025", color: "#fff", borderColor: "#30343b", borderTop: "3px solid #ffc107" }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0 }}><Typography component="h1" sx={{ color: "#fff !important", fontSize: { xs: 25, md: 32 }, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-.035em" }}>Envíos de productos</Typography><Typography sx={{ mt: 1, color: "#c7cbd1" }}>Configura las entregas de tu tienda y los puntos de recogida de cada sucursal.</Typography></Box>
          <Chip icon={<LocalShippingOutlinedIcon />} label="Toda la tienda" sx={{ maxWidth: "100%", alignSelf: { xs: "flex-start", sm: "center" }, bgcolor: "#303238", color: "#fff", "& .MuiChip-icon": { color: "#ffc107" } }} />
        </Stack>
        <Box component="section" aria-label="Cómo funciona" sx={{ mt: 3, pt: 2, borderTop: "1px solid #3a3d42" }}>
          <Typography component="h2" sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: "#ffc107", mb: 1.5 }}>CÓMO FUNCIONA</Typography>
          <Box component="ol" sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", md: "repeat(3,minmax(0,1fr))" }, gap: 2, m: 0, p: 0, listStyle: "none" }}>{[
            ["Define tus canales", "Agrega reparto propio o las paqueterías que utilizas."],
            ["Prepara las entregas", "Configura modalidades, costos y puntos por sucursal."],
            ["Habilita y comparte", "Activa los envíos y la página de seguimiento para tus clientes."],
          ].map(([title, description], index) => <Box component="li" key={title} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start", minWidth: 0 }}><Box component="span" sx={{ width: 25, height: 25, display: "grid", placeItems: "center", flexShrink: 0, borderRadius: "50%", bgcolor: "#ffc107", color: "#17191c", fontSize: 12, fontWeight: 800 }}>{index + 1}</Box><Box><Typography sx={{ fontSize: 14, fontWeight: 700, color: "#fff !important" }}>{title}</Typography><Typography sx={{ fontSize: 12, mt: .25, color: "#c7cbd1 !important" }}>{description}</Typography></Box></Box>)}</Box>
        </Box>
      </Paper>
      <Alert severity="info">Los envíos en catálogos públicos requieren plan Profesional o Avanzado vigente, complemento de pasarela activo y un POS en la sucursal. La disponibilidad la valida el servidor.</Alert>
      {error && <Alert severity="error" action={<Button disabled={busy || loading} onClick={() => load()}>Recargar</Button>}>{error}</Alert>}
      {notice && <Alert severity="success">{notice}</Alert>}
      {loading ? <Stack alignItems="center" sx={{ py: 5 }}><CircularProgress /><Typography>Cargando envíos…</Typography></Stack> : config && <>
        <Tabs value={tab} onChange={(_, value) => { setTab(value); setNotice(""); }} variant="scrollable" allowScrollButtonsMobile aria-label="Secciones de envíos" sx={{ minHeight: 44, "& .MuiTabs-indicator": { display: "none" }, "& .MuiTabs-flexContainer": { gap: 1 }, "& .MuiTab-root": { minHeight: 44, minWidth: 0, px: 2, border: "1px solid", borderColor: "divider", borderRadius: "10px", textTransform: "none", fontWeight: 700, color: "text.primary", "&.Mui-selected": { bgcolor: "#ffc107", borderColor: "#ffc107", color: "#17191c" }, "&.Mui-focusVisible": { outline: "2px solid #b58a00", outlineOffset: -3 } } }}><Tab label="Configuración" value="settings" />{Object.entries(resources).map(([key, item]) => <Tab key={key} label={item.title} value={key} />)}</Tabs>
        {tab === "settings" ? <Paper elevation={0} sx={panel}><Box component="form" onSubmit={saveSettings}><Stack spacing={2.5}>
          <Typography component="h2" variant="h6" fontWeight={800}>Disponibilidad y avisos</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", md: "repeat(2,minmax(0,1fr))" }, gap: 2 }}>{[["enabled", "Habilitar nuevos envíos"], ["allow_pos", "Permitir envíos desde el punto de venta"], ["allow_public", "Permitir envíos en catálogos públicos"], ["notify_updates", "Enviar avisos con consentimiento del comprador"]].map(([key, label]) => <FormControlLabel key={key} sx={toggleStyle} control={<Switch checked={settings[key]} disabled={busy} onChange={(event) => setSettings({ ...settings, [key]: event.target.checked })} />} label={label} />)}</Box>
          <TextField select label="Proveedor de avisos por WhatsApp" value={settings.whatsapp_provider} disabled={busy} onChange={(event) => setSettings({ ...settings, whatsapp_provider: event.target.value })}>{[["auto", "Automático"], ["none", "Sin avisos"], ["ticket", "Gateway de tickets"], ["connection", "Conexión propia"]].map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
          <TextField label="URL pública de seguimiento" value={settings.tracking_page_url} disabled={busy} onChange={(event) => setSettings({ ...settings, tracking_page_url: event.target.value })} helperText="URL completa terminada en /seguimiento. El servidor agrega el token del envío." inputProps={{ maxLength: 2000 }} />
          <Button disabled={busy} onClick={() => setSettings({ ...settings, tracking_page_url: `${window.location.origin}/seguimiento` })}>Usar la página de seguimiento de este sitio</Button>
          <Alert severity="info">Deshabilitar nuevos envíos conserva el seguimiento de los existentes. El costo configurado no se suma automáticamente al cobro de la venta.</Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />} disabled={busy}>{busy ? "Guardando…" : "Guardar configuración"}</Button><Button component={Link} to="/seguimiento" target="_blank" rel="noopener noreferrer" variant="outlined">Ver seguimiento público</Button></Stack>
        </Stack></Box></Paper> : <Paper elevation={0} sx={panel}><Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ sm: "center" }}><Typography component="h2" variant="h6" fontWeight={800}>{resources[tab].title}</Typography><Button variant="contained" startIcon={<AddOutlinedIcon />} disabled={busy} onClick={() => begin(tab)}>Agregar {resources[tab].singular}</Button></Stack>
          {tab === "delivery_points" && <Typography color="text.secondary">Cada punto pertenece a una sucursal. Estos puntos son lugares públicos de recogida.</Typography>}
          {tab === "delivery_points" && branchError && <Alert severity="warning">{branchError}</Alert>}
          {!rows.length && <Alert severity="info">Todavía no hay registros. Agrega el primero para preparar tus opciones de entrega.</Alert>}
          {rows.map((row) => <Card key={row.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}><Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ sm: "center" }}><Box><Typography fontWeight={800}>{row.name}</Typography><Typography variant="body2" color="text.secondary">{tab === "delivery_points" ? row.address : row.code}{tab === "methods" ? ` · Costo informado: $${row.base_cost}` : ""}</Typography><Chip size="small" label={bool(row.is_active) ? "Activo" : "Inactivo"} color={bool(row.is_active) ? "success" : "default"} sx={{ mt: 1 }} /></Box><Button onClick={() => begin(tab, row)} disabled={busy}>Editar</Button></Stack></Card>)}
        </Stack></Paper>}
      </>}
    </Stack>
    <Dialog open={Boolean(editor)} onClose={() => { if (!busy) setEditor(null); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}><Box component="form" onSubmit={saveResource}>
      <DialogTitle sx={{ bgcolor: "#1d2025", color: "#fff", borderTop: "3px solid #ffc107", fontWeight: 800 }}>{editor?.id ? "Editar" : "Agregar"} {definition?.singular}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 3 }}>
        {editorError && <Alert severity="error">{editorError}</Alert>}
        {definition?.fields.map((field) => {
          const value = editor.values[field.key];
          const change = (next) => setEditor({ ...editor, values: { ...editor.values, [field.key]: next } });
          if (field.type === "boolean") return <FormControlLabel key={field.key} sx={toggleStyle} label={field.label} control={<Switch checked={Boolean(value)} disabled={busy} onChange={(event) => change(event.target.checked)} />} />;
          const options = field.type === "channel" ? (config.channels || []).map((item) => [item.id, `${item.name}${bool(item.is_active) ? "" : " (inactivo)"}`]) : field.type === "branch" ? branchChoices.map((item) => [item.id, item.name]) : field.options;
          return <TextField key={field.key} label={field.label} required={field.required} disabled={busy} value={value} onChange={(event) => change(event.target.value)} type={field.type === "number" ? "number" : "text"} select={Boolean(options)} inputProps={field.type === "number" ? { min: field.min, max: field.max, step: field.step || 1 } : { maxLength: field.max }} helperText={field.help}>{options?.map(([id, label]) => <MenuItem key={id} value={id}>{label}</MenuItem>)}</TextField>;
        })}
        {editor?.resource === "channels" && <>
          {(logoPreview || editor.logoUrl) && <Box component="img" alt="Vista previa del logo" src={logoPreview || editor.logoUrl} sx={{ width: 80, height: 80, objectFit: "contain" }} />}
          <Button component="label" disabled={busy}>Seleccionar logo (máximo 2 MB)<input type="file" hidden accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={chooseLogo} /></Button>
          {logo && <Typography variant="body2">{logo.name}</Typography>}
        </>}
        {editor && <FormControlLabel sx={toggleStyle} label="Activo" control={<Switch checked={editor.values.is_active} disabled={busy} onChange={(event) => setEditor({ ...editor, values: { ...editor.values, is_active: event.target.checked } })} />} />}
        <Typography variant="body2" color="text.secondary">Para dejar de ofrecer esta opción, desactívala y guarda. Los envíos anteriores se conservan.</Typography>
      </Stack></DialogContent>
      <DialogActions sx={{ p: 3, pt: 1, flexWrap: "wrap", gap: 1 }}><Button disabled={busy} onClick={() => setEditor(null)}>Cancelar</Button><Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />} disabled={busy || !editor}>{busy ? "Guardando…" : "Guardar"}</Button></DialogActions>
    </Box></Dialog>
  </Box></DocumentSettingsTheme>;
}
