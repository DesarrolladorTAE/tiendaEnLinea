import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, ButtonBase, Chip, CircularProgress, createTheme, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField, ThemeProvider, Typography, useTheme } from "@mui/material";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useAdminUi } from "../../context/AdminUiContext";
import useReglaTaeconta from "../../hooks/useReglaTaeconta";
import { DOCUMENT_TYPES, DOCUMENT_CHANNELS, defaultConfig, documentSettingsService, logoUrl, readConfig, validateConfig, validateLogo } from "../../services/admin/salesDocumentSettings";
import DocumentDraftPreview from "./DocumentDraftPreview";
import ModalPDFPreview from "./ModalPDFPreview";
import PosDocumentDelivery from "./PosDocumentDelivery";
import LogoChannelPicker from "./LogoChannelPicker";

const icons = [ReceiptLongOutlinedIcon, DescriptionOutlinedIcon, ArticleOutlinedIcon];
const panel = { p: { xs: 2, sm: 3 }, border: "1px solid", borderColor: "divider", borderRadius: 3, minWidth: 0 };
const grid = { display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }, gap: 2 };

export default function SalesDocumentDesigner(props) {
  const { selectedBranch } = useAdminUi();
  const parentTheme = useTheme();
  const theme = useMemo(() => createTheme(parentTheme, {
    palette: { primary: { main: "#ffc107", dark: "#e0a800", light: "#ffe082", contrastText: "#17191c" } },
    components: {
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 10, fontWeight: 700 }, textPrimary: { color: parentTheme.palette.mode === "dark" ? "#ffe082" : "#665000" }, outlinedPrimary: { color: parentTheme.palette.mode === "dark" ? "#ffe082" : "#30343b", borderColor: parentTheme.palette.mode === "dark" ? "#62552d" : "#d6d7da", "&:hover": { borderColor: "#d5a000", backgroundColor: parentTheme.palette.mode === "dark" ? "#332c16" : "#fff8df" } } } },
      MuiInputLabel: { styleOverrides: { root: { "&.Mui-focused": { color: parentTheme.palette.mode === "dark" ? "#ffe082" : "#765900" } } } },
      MuiCircularProgress: { styleOverrides: { root: { color: "#b58a00" } } },
    },
  }), [parentTheme]);
  return <ThemeProvider theme={theme}>{selectedBranch?.id ? <BranchDocumentDesigner key={selectedBranch.id} branch={selectedBranch} {...props} /> : <Paper sx={panel}><Typography component="h1" variant="h5" fontWeight={800}>Tickets y comprobantes</Typography><Typography sx={{ my: 2 }}>Selecciona una sucursal desde el panel para personalizar sus formatos.</Typography><Button href="/admin/sucursales" variant="contained">Ir a mis sucursales</Button></Paper>}</ThemeProvider>;
}

function BranchDocumentDesigner({ branch, onSuccess, onClose }) {
  const { allowed, loading: gateLoading } = useReglaTaeconta(null, { ignorePOS: true });
  const [format, setFormat] = useState({ type: "ticket", channel: "pdf" });
  const selection = useMemo(() => ({ ...format, branchId: String(branch.id) }), [format, branch.id]);
  const setSelection = next => setFormat({ type: next.type, channel: next.type === "ticket" ? next.channel : "pdf" });
  const selectionKey = JSON.stringify([selection.type, selection.channel, selection.branchId]);
  const [loadedScope, setLoadedScope] = useState(null);
  const [tab, setTab] = useState("design");
  const [base, setBase] = useState(defaultConfig("ticket"));
  const [patch, setPatch] = useState({});
  const [file, setFile] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingLogo, setCheckingLogo] = useState(false);
  const [loadError, setLoadError] = useState("");
  const waiting = loading || (!loadError && loadedScope !== selectionKey);
  const [notice, setNotice] = useState(null);
  const [errors, setErrors] = useState({});
  const [revision, setRevision] = useState(0);
  const [pending, setPending] = useState(null);
  const [deliveryDirty, setDeliveryDirty] = useState(false);
  const [deliveryBusy, setDeliveryBusy] = useState(false);
  const [saleId, setSaleId] = useState("");
  const [preview, setPreview] = useState(false);
  const submitting = useRef(false);
  const form = { ...base, ...patch };
  const dirty = Object.keys(patch).length > 0 || !!file || removeLogo;
  const locked = saving || checkingLogo || deliveryBusy;
  const thermal = selection.type === "ticket";
  const documentLabel = DOCUMENT_TYPES.find(item => item.value === selection.type).label;
  const scopeLabel = branch.name || `Sucursal #${branch.id}`;

  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError(""); setPatch({}); setFile(null); setRemoveLogo(false); setErrors({}); setNotice(null); setPreview(false);
    documentSettingsService.get(selection).then(({ data }) => {
      if (active) { setBase(readConfig(data, selection.type)); setLoadedScope(selectionKey); }
    }).catch(err => {
      if (active) setLoadError(err.response?.data?.message || err.message || "No se pudo cargar el diseño. Reintenta antes de editar.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selection, selectionKey, revision]);

  useEffect(() => {
    if (!file) { setFileUrl(""); return; }
    const url = URL.createObjectURL(file); setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!dirty && !deliveryDirty) return;
    const beforeUnload = event => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty, deliveryDirty]);

  const update = (name, value) => {
    setPatch(previous => {
      const next = { ...previous, [name]: value };
      if (String(value) === String(base[name])) delete next[name];
      return next;
    });
    setErrors(previous => ({ ...previous, [name]: undefined })); setNotice(null);
  };
  const changeView = next => {
    if (locked) return;
    if (next.tab === tab && !next.selection) return;
    if (dirty || deliveryDirty) { setPending(next); return; }
    if (next.selection) setSelection(next.selection);
    if (next.tab) setTab(next.tab);
  };
  const discard = () => {
    setPatch({}); setFile(null); setRemoveLogo(false); setDeliveryDirty(false); setNotice(null);
    if (pending.selection) setSelection(pending.selection);
    if (pending.tab) setTab(pending.tab);
    setPending(null);
  };
  const selectLogo = async event => {
    const next = event.target.files?.[0]; event.target.value = "";
    if (!next || locked) return;
    setCheckingLogo(true);
    try { await validateLogo(next); setFile(next); setRemoveLogo(false); setErrors(previous => ({ ...previous, logo: undefined })); }
    catch (err) { setErrors(previous => ({ ...previous, logo: err.message })); }
    finally { setCheckingLogo(false); }
  };

  const save = async event => {
    event.preventDefault();
    if (submitting.current || waiting || loadError || !dirty || checkingLogo) return;
    const validation = validateConfig(form, selection.type, selection.channel);
    setErrors(validation);
    if (Object.keys(validation).length) { setNotice({ severity: "error", message: "Revisa los campos indicados antes de guardar." }); return; }
    submitting.current = true; setSaving(true); setNotice(null);
    let configSaved = false;
    try {
      if (Object.keys(patch).length) {
        await documentSettingsService.save(selection, patch);
        configSaved = true; setBase(form); setPatch({});
      }
      if (file) { await documentSettingsService.uploadLogo(selection, file); setFile(null); }
      else if (removeLogo) { await documentSettingsService.deleteLogo(selection); setRemoveLogo(false); }
      try {
        const { data } = await documentSettingsService.get(selection);
        setBase(readConfig(data, selection.type));
        setNotice({ severity: "success", message: `${documentLabel} guardado para ${scopeLabel}.` });
      } catch {
        setLoadError("Los cambios se guardaron, pero no se pudo volver a cargar el diseño. Reintenta la lectura para ver el resultado actual.");
      }
      onSuccess?.(); onClose?.();
    } catch (err) {
      const fields = err.response?.data?.errors || {};
      setErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key.replace(/^config\./, ""), Array.isArray(messages) ? messages.join(" ") : String(messages)])));
      setNotice({ severity: "error", message: `${configSaved ? "El diseño se guardó, pero el cambio de logo no terminó. " : ""}${err.response?.data?.message || "No se pudieron guardar los cambios. Puedes reintentar."}` });
    } finally { submitting.current = false; setSaving(false); }
  };

  const field = (name, label, extra = {}) => <TextField name={name} label={label} value={form[name] ?? ""} onChange={event => update(name, event.target.value)} fullWidth error={!!errors[name]} helperText={errors[name]} {...extra} />;
  const toggle = (name, label, disabled = false) => <FormControlLabel sx={{ m: 0, p: 1, border: "1px solid", borderColor: "divider", borderRadius: 2, alignItems: "center" }} control={<Switch name={name} checked={!!form[name]} onChange={event => update(name, event.target.checked)} disabled={disabled} />} label={label} />;
  const logo = removeLogo ? "" : fileUrl || logoUrl(base);
  const saleNumber = saleId.trim();
  const validSaleId = /^\d+$/.test(saleNumber) && Number.isSafeInteger(Number(saleNumber)) && Number(saleNumber) > 0;
  const invalidSaleId = !!saleNumber && !validSaleId;
  const previewEndpoint = validSaleId ? `/sales/${saleNumber}/documents/${selection.type}/pdf` : !saleNumber && thermal ? `/ticket/preview?branch_id=${selection.branchId}` : null;
  const canPreview = !waiting && !loadError && !dirty && !locked && !!previewEndpoint && selection.channel === "pdf";

  return <Box sx={{ width: "100%", minWidth: 0, maxWidth: 1500, mx: "auto", pb: 3, "& .MuiOutlinedInput-root": { borderRadius: 2.5 }, "& .MuiButton-root": { textTransform: "none", minHeight: 44 }, "& .MuiFormControl-root": { minWidth: 0 }, "& .MuiTypography-root": { overflowWrap: "anywhere" } }}>
    <Paper elevation={0} sx={{ ...panel, mb: 2.5, bgcolor: "#1d2025", color: "#fff", borderColor: "#30343b", borderTop: "3px solid #ffc107" }}>
      <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems={{ sm: "center" }} justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}><Typography component="h1" sx={{ color: "#fff !important", fontSize: { xs: 25, md: 32 }, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-.035em", overflowWrap: "anywhere" }}>Tickets y comprobantes</Typography><Typography sx={{ mt: 1, color: "#c7cbd1" }}>Diseña tus formatos y define cómo los recibe tu cliente.</Typography></Box>
        <Chip icon={<ReceiptLongOutlinedIcon />} label={scopeLabel} sx={{ maxWidth: "100%", alignSelf: { xs: "flex-start", sm: "center" }, bgcolor: "#303238", color: "#fff", "& .MuiChip-icon": { color: "#ffc107" }, "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }} />
      </Stack>
      <Box component="section" aria-label="Cómo funciona" sx={{ mt: 3, pt: 2, borderTop: "1px solid #3a3d42" }}>
        <Typography component="h2" sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: "#ffc107", mb: 1.5 }}>CÓMO FUNCIONA</Typography>
        <Box component="ol" sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", md: "repeat(3,minmax(0,1fr))" }, gap: 2, m: 0, p: 0, listStyle: "none" }}>{[
          ["Elige el formato", "Ticket, nota de venta o comprobante."],
          ["Personaliza y guarda", "Ajusta el diseño y el logo de cada formato."],
          ["Comprueba el resultado", "Escribe el número de una venta y abre su PDF."],
        ].map(([title, description], index) => <Box component="li" key={title} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start", minWidth: 0 }}><Box component="span" sx={{ width: 25, height: 25, display: "grid", placeItems: "center", flexShrink: 0, borderRadius: "50%", bgcolor: "#ffc107", color: "#17191c", fontSize: 12, fontWeight: 800 }}>{index + 1}</Box><Box sx={{ minWidth: 0 }}><Typography sx={{ fontSize: 14, fontWeight: 700, color: "#fff !important" }}>{title}</Typography><Typography sx={{ fontSize: 12, mt: .25, color: "#c7cbd1 !important" }}>{description}</Typography></Box></Box>)}</Box>
      </Box>
    </Paper>
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }} role="group" aria-label="Secciones de documentos">
      <Button variant={tab === "design" ? "contained" : "outlined"} aria-pressed={tab === "design"} disabled={locked} onClick={() => changeView({ tab: "design" })}>Diseño y logos</Button>
      <Button variant={tab === "delivery" ? "contained" : "outlined"} aria-pressed={tab === "delivery"} disabled={locked} onClick={() => changeView({ tab: "delivery" })}>Entrega en el POS</Button>
    </Box>
    {tab === "delivery" ? <PosDocumentDelivery branchId={selection.branchId} onDirtyChange={setDeliveryDirty} onBusyChange={setDeliveryBusy} /> : <>
      <Box role="group" aria-label="Tipo de documento" sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", md: "repeat(3,minmax(0,1fr))" }, gap: 1.5, mb: 2.5 }}>
        {DOCUMENT_TYPES.map((item, index) => { const Icon = icons[index], active = selection.type === item.value; return <ButtonBase key={item.value} disabled={locked || loading} aria-pressed={active} onClick={() => item.value !== selection.type && changeView({ selection: { ...selection, type: item.value } })} sx={{ textAlign: "left", justifyContent: "flex-start", gap: 1.5, p: 2, border: "1px solid", borderColor: active ? "#ffc107" : "divider", borderRadius: 2.5, boxShadow: active ? "inset 0 0 0 1px #ffc107" : "none", bgcolor: theme => active ? theme.palette.mode === "dark" ? "#2b281d" : "#fffbee" : "background.paper", "&.Mui-focusVisible": { outline: "3px solid #ffc107", outlineOffset: 2 } }}><Box sx={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 2, flexShrink: 0, bgcolor: active ? "#ffc107" : "action.hover", color: active ? "#17191c" : "text.secondary" }}><Icon fontSize="small" /></Box><Box><Typography fontWeight={800}>{item.label}</Typography><Typography variant="body2" color="text.secondary">{item.description}</Typography></Box></ButtonBase>; })}
      </Box>
      <Box sx={{ ...grid, alignItems: "start", gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "minmax(0,1.35fr) minmax(300px,1fr)" } }}>
        <Paper component="form" onSubmit={save} noValidate elevation={0} sx={panel}>
          {thermal ? <TextField select fullWidth label="Personalizar salida" value={selection.channel} disabled={locked || loading} onChange={event => changeView({ selection: { ...selection, channel: event.target.value } })}>
            {DOCUMENT_CHANNELS.map(item => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
          </TextField> : <Chip label="PDF y WhatsApp" variant="outlined" />}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, mb: 2.5 }}>{!thermal ? "Un mismo diseño y logo para el PDF y WhatsApp. Si necesitas papel, imprime el PDF desde las opciones nativas de tu dispositivo." : selection.channel === "pdf" ? "El PDF descargado y el enviado por WhatsApp comparten este diseño y logo." : "Diseño exclusivo de la impresión térmica. La conexión de cada impresora se conserva en su POS."}</Typography>
          {waiting ? <Box role="status" sx={{ textAlign: "center", p: 5 }}><CircularProgress aria-label="Cargando diseño" /></Box> : loadError ? <Alert severity="error" action={<Button onClick={() => setRevision(value => value + 1)}>Reintentar</Button>}>{loadError}</Alert> : <>
            <Box component="fieldset" disabled={locked} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
              <Typography component="h2" variant="h6" fontWeight={800} mb={2}>Presentación</Typography>
              <Stack spacing={2}>
                {!thermal && field("title", "Título del documento", { inputProps: { maxLength: 100 } })}
                <Box sx={grid}>{field("paper_size", "Tamaño de papel", { select: true, children: (thermal ? [["58", "58 mm"], ["80", "80 mm"]] : [["letter", "Carta"], ["a4", "A4"]]).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>) })}{!thermal && field("accent_color", "Color de acento", { placeholder: "#333333", inputProps: { maxLength: 7 } })}</Box>
                {field("direccion", "Dirección del negocio", { multiline: true, minRows: 2, inputProps: { maxLength: 300 } })}
                {field("mensaje_1", "Mensaje superior", { multiline: true, minRows: 2, inputProps: { maxLength: 125 } })}
                {field("mensaje_2", "Mensaje de cierre", { multiline: true, minRows: 2, inputProps: { maxLength: 125 } })}
                <Box sx={grid}>{toggle("mostrar_iva", "Mostrar IVA")}{toggle("show_logo", "Mostrar logo")}{!thermal && <>{toggle("show_customer", "Mostrar cliente")}{toggle("show_sku", "Mostrar SKU")}{toggle("show_oe", "Mostrar número OE")}</>}</Box>
              </Stack>
              <Divider sx={{ my: 3 }} />
              <Typography component="h2" variant="h6" fontWeight={800}>{selection.channel === "pdf" ? "Logo del PDF y WhatsApp" : "Logo de impresión"}</Typography>
              <LogoChannelPicker selection={selection} config={form} logo={logo} pending={!!file || removeLogo || "show_logo" in patch} disabled={locked} onSelect={channel => changeView({ selection: { ...selection, channel } })} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{thermal ? "Son logos independientes. Sube y guarda el de esta salida; después puedes elegir la otra. Mientras no tengan uno propio, ambas pueden mostrar el mismo logo heredado." : "Este logo se usa en el PDF, en su envío por WhatsApp y al imprimir ese archivo desde tu dispositivo."}</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>PNG o JPG · hasta 2 MB · máximo 4096 × 4096 px.</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                <Button component="label" variant="outlined" startIcon={<ImageOutlinedIcon />} disabled={locked}>{checkingLogo ? "Revisando imagen..." : file ? "Cambiar imagen seleccionada" : "Subir logo"}<input hidden type="file" accept="image/png,image/jpeg" aria-label="Subir logo del documento" onChange={selectLogo} disabled={locked} /></Button>
                <Button color="error" disabled={locked || (!logo && !file)} onClick={() => { setFile(null); setRemoveLogo(true); }}>Quitar logo</Button>
              </Stack>
              {file && <Typography variant="caption" sx={{ display: "block", mt: 1 }}>{file.name} · pendiente de guardar</Typography>}
              {removeLogo && <Alert severity="info" sx={{ mt: 1 }}>Al guardar se quitará el logo de esta combinación, incluido el heredado. Los otros documentos conservarán el suyo.</Alert>}
              {errors.logo && <Alert severity="error" sx={{ mt: 1 }}>{errors.logo}</Alert>}
              {thermal && <>
                <Divider sx={{ my: 3 }} /><Typography component="h2" variant="h6" fontWeight={800} mb={2}>QR y ajustes de impresión</Typography>
                <Box sx={grid}>{toggle("qr_factura", "QR de autofacturación", !allowed || gateLoading)}{toggle("qr_sitio", "QR de la tienda")}</Box>
                {!allowed && <Typography variant="caption" color="text.secondary">El QR de autofacturación requiere el plan y complemento Taeconta.</Typography>}
                <Box sx={{ ...grid, mt: 2 }}>{field("qr_factura_size", "Tamaño QR de factura", { type: "number", inputProps: { min: 1, max: 16 } })}{field("qr_sitio_size", "Tamaño QR de tienda", { type: "number", inputProps: { min: 1, max: 16 } })}{field("logo_max_width", "Ancho máximo del logo", { type: "number", inputProps: { min: 64, max: 1024 } })}
                  {selection.channel === "payload" && <>{field("chars_per_line", "Caracteres por línea", { type: "number", inputProps: { min: 16, max: 64 } })}{field("printer_ip", "IP de impresora (opcional)")}{field("printer_port", "Puerto (opcional)", { type: "number", inputProps: { min: 1, max: 65535 } })}</>}
                </Box>
              </>}
            </Box>
            {selection.type === "comprobante" && <Alert severity="info" sx={{ mt: 2 }}>Es un comprobante comercial. Este documento no genera ni timbra CFDI.</Alert>}
            {notice && <Alert severity={notice.severity} sx={{ mt: 2 }}>{notice.message}</Alert>}
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mt: 3 }}>
              <Button type="submit" variant="contained" disabled={locked || !dirty} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveOutlinedIcon />} sx={{ flex: { xs: "1 1 100%", sm: "0 1 auto" } }}>{saving ? "Guardando..." : "Guardar diseño"}</Button>
              <Typography variant="caption" color="text.secondary" role="status">{dirty ? "Cambios sin guardar" : "Diseño guardado"}</Typography>
            </Box>
          </>}
        </Paper>
        <Paper elevation={0} sx={{ ...panel, position: { lg: "sticky" }, top: { lg: 20 } }}>
          {!waiting && !loadError && <DocumentDraftPreview type={selection.type} channel={selection.channel} config={form} logo={logo} />}
          {selection.channel === "pdf" && <>
          <Divider sx={{ my: 2.5 }} />
          <Typography component="h2" variant="subtitle1" fontWeight={800}>Revisar con una venta</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ my: 1.5 }}>{thermal ? "Sin número de venta se muestra la plantilla de ejemplo. Para revisar el diseño real, indica una venta de esta sucursal." : "Indica una venta de esta sucursal para generar una vista previa con sus importes reales."}</Typography>
          <TextField fullWidth size="small" label="Número de venta" value={saleId} onChange={event => setSaleId(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && canPreview) { event.preventDefault(); setPreview(true); } }} error={invalidSaleId} inputProps={{ inputMode: "numeric" }} helperText={invalidSaleId ? "Escribe un número de venta válido, mayor que cero." : thermal ? "Opcional: vacío usa el ejemplo del ticket." : "Necesario para nota de venta y comprobante."} />
          <Button variant="outlined" fullWidth sx={{ mt: 2 }} startIcon={<VisibilityOutlinedIcon />} disabled={!canPreview} onClick={() => setPreview(true)}>Abrir vista previa PDF</Button>
          {dirty && <Typography variant="caption" color="text.secondary">Guarda el diseño antes de abrir el PDF del servidor.</Typography>}
          </>}
        </Paper>
      </Box>
    </>}
    <Dialog open={!!pending} onClose={() => setPending(null)} maxWidth="xs" fullWidth><DialogTitle>Hay cambios sin guardar</DialogTitle><DialogContent>Si cambias de sección, formato o salida, se descartarán los cambios pendientes.</DialogContent><DialogActions sx={{ flexWrap: "wrap" }}><Button onClick={() => setPending(null)}>Seguir editando</Button><Button color="error" onClick={discard}>Descartar y continuar</Button></DialogActions></Dialog>
    {selection.channel === "pdf" && <ModalPDFPreview open={preview} onClose={() => setPreview(false)} endpoint={previewEndpoint} downloadEndpoint={validSaleId ? `${previewEndpoint}?download=1` : undefined} title={`Vista previa · ${documentLabel}`} nombreArchivo={`${selection.type}-${saleId.trim() || "ejemplo"}.pdf`} />}
  </Box>;
}
