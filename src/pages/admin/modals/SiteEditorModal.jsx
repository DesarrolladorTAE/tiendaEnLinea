import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, Divider, FormControlLabel, Grid, IconButton, Stack,
  InputAdornment, MenuItem, Switch, Tab, Tabs, TextField, Typography, useMediaQuery, useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import ViewCarouselRoundedIcon from "@mui/icons-material/ViewCarouselRounded";
import FacebookRoundedIcon from "@mui/icons-material/FacebookRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import TitleRoundedIcon from "@mui/icons-material/TitleRounded";
import SubjectRoundedIcon from "@mui/icons-material/SubjectRounded";
import SmartButtonRoundedIcon from "@mui/icons-material/SmartButtonRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import WidthNormalRoundedIcon from "@mui/icons-material/WidthNormalRounded";
import RoundedCornerRoundedIcon from "@mui/icons-material/RoundedCornerRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import SpaceBarRoundedIcon from "@mui/icons-material/SpaceBarRounded";
import ViewHeadlineRoundedIcon from "@mui/icons-material/ViewHeadlineRounded";
import AnimationRoundedIcon from "@mui/icons-material/AnimationRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ViewDayRoundedIcon from "@mui/icons-material/ViewDayRounded";

const EMPTY_COLORS = {
  primary: "#111827", secondary: "#374151", accent: "#2563EB",
  background: "#FFFFFF", text: "#111827",
};

const SOCIALS = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/tu-negocio", color: "#1877F2", icon: FacebookRoundedIcon },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/tu-negocio", color: "#E4405F", icon: InstagramIcon },
  { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/tu-negocio", color: "#111827", icon: XIcon },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@tu-negocio", color: "#00B8A9", icon: MusicNoteRoundedIcon },
];

const FONT_OPTIONS = [
  { name: "Inter", family: "Inter, Arial, sans-serif" },
  { name: "Moderna", family: "Arial, Helvetica, sans-serif" },
  { name: "Elegante", family: "Georgia, 'Times New Roman', serif" },
  { name: "Amigable", family: "'Trebuchet MS', Arial, sans-serif" },
  { name: "Editorial", family: "'Times New Roman', Times, serif" },
  { name: "Monoespaciada", family: "'Courier New', monospace" },
];

const DEFAULT_SECTIONS = [
  { id: "hero", label: "Identidad destacada", visible: true },
  { id: "identity", label: "Identidad del negocio", visible: true },
  { id: "catalog", label: "Catálogo de productos", visible: true },
  { id: "carousel", label: "Carrusel", visible: true },
  { id: "phrases", label: "Frases destacadas", visible: true },
  { id: "socials", label: "Redes y contacto", visible: true },
];

const appendValue = (fd, key, value) => {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => appendValue(fd, `${key}[${index}]`, item));
    return;
  }
  if (typeof value === "object" && !(value instanceof File)) {
    Object.entries(value).forEach(([child, item]) => appendValue(fd, `${key}[${child}]`, item));
    return;
  }
  fd.append(key, typeof value === "boolean" ? (value ? "1" : "0") : value);
};

const parseJson = (value, fallback) => {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  try { return typeof value === "string" && value.trim() ? JSON.parse(value) : fallback; } catch { return null; }
};

const asBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "string") return !["0", "false", "off", "no"].includes(value.trim().toLowerCase());
  return Boolean(value);
};

const editorJson = (value, fallback) => JSON.stringify(parseJson(value, fallback) ?? fallback, null, 2);

function UploadCard({ title, subtitle, preview, ratio = "16 / 9", onFile, onRemove, disabled }) {
  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5, overflow: "hidden", bgcolor: "background.paper" }}>
      <Box sx={{ width: "100%", height: { xs: 180, sm: 200, md: 220 }, bgcolor: "#f1f5f9", display: "grid", placeItems: "center", overflow: "hidden", position: "relative" }}>
        {preview ? <Box component="img" src={preview} alt={title} sx={{ position: "absolute", inset: 0, display: "block", width: "100%", height: "100%", minWidth: 0, minHeight: 0, objectFit: "contain", objectPosition: "center" }} /> : <ImageRoundedIcon sx={{ fontSize: 38, color: "text.disabled" }} />}
      </Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1.5 }}>
        <Box sx={{ minWidth: 0 }}><Typography variant="body2" fontWeight={800}>{title}</Typography><Typography variant="caption" color="text.secondary">{subtitle}</Typography></Box>
        <Stack direction="row">
          {preview && <IconButton size="small" color="error" onClick={onRemove} disabled={disabled}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>}
          <IconButton size="small" component="label" color="primary" disabled={disabled}><CloudUploadRoundedIcon fontSize="small" /><input hidden type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] || null)} /></IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}

function ConfigSelectRow({ icon: Icon, title, subtitle, value, onChange, children, color = "#2563eb" }) {
  return <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} spacing={1.5} sx={{ p: 1.35, borderRadius: 2.25, border: "1px solid", borderColor: "divider", bgcolor: "#fbfdff", "&:hover": { borderColor: color, bgcolor: "#f8faff" } }}><Stack direction="row" spacing={1.25} alignItems="center" sx={{ flex: 1, minWidth: 0 }}><Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${color}14`, color, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon fontSize="small" /></Box><Box><Typography variant="body2" fontWeight={850}>{title}</Typography>{subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}</Box></Stack><TextField select value={value} onChange={onChange} size="small" sx={{ width: { xs: "100%", sm: 230 }, bgcolor: "white", "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: color } }}>{children}</TextField></Stack>;
}

function PlanConfigRow({ locked, unlockPlan, children }) {
  return <Box sx={{ position: "relative", opacity: locked ? .62 : 1, "& > :first-of-type": { pointerEvents: locked ? "none" : "auto" } }}>{children}{locked && <Chip icon={<LockRoundedIcon />} label={`Se desbloquea en ${unlockPlan}`} size="small" sx={{ position: "absolute", right: 12, top: 12, zIndex: 2, bgcolor: "#fff7ed", color: "#9a3412", fontWeight: 800 }} />}</Box>;
}

export default function SiteEditorModal({ open, onClose, onSubmit, defaultValues = {}, capabilities = {}, planName = "", template = "negocio", sampleName = "Mi tienda", saving = false }) {
  const supportsNativeSections = Boolean(capabilities.custom_sections);
  capabilities = { ...capabilities, custom_sections: true };
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({});
  const [files, setFiles] = useState({});
  const [removed, setRemoved] = useState({});
  const [jsonErrors, setJsonErrors] = useState({});
  const maxCarousel = Number(capabilities.max_carousel || 3);
  const maxPhrases = Number(capabilities.max_phrases || 1);
  const planLevel = String(planName).toLowerCase().includes("avanz") ? 4 : String(planName).toLowerCase().includes("prof") ? 3 : String(planName).toLowerCase().includes("demo") ? 4 : 2;

  useEffect(() => {
    if (!open) return;
    setTab(0);
    setFiles({});
    setRemoved({});
    setJsonErrors({});
    setForm({
      is_active: defaultValues.is_active ?? true,
      titulo_1: defaultValues.titulo_1 || "",
      descripcion: defaultValues.descripcion || "",
      hero_title: defaultValues.hero_title || "",
      hero_subtitle: defaultValues.hero_subtitle || "",
      hero_button_text: defaultValues.hero_button_text || "",
      hero_button_url: defaultValues.hero_button_url || "",
      facebook: defaultValues.facebook || "",
      instagram: defaultValues.instagram || "",
      twitter: defaultValues.twitter || "",
      tiktok: defaultValues.tiktok || "",
      font_family: defaultValues.font_family || "",
      colors: { ...EMPTY_COLORS, ...(defaultValues.colors || {}) },
      phrases: (defaultValues.phrases || []).filter(Boolean).slice(0, maxPhrases),
      sections: editorJson(defaultValues.sections, []),
      theme: editorJson(defaultValues.theme, {}),
      settings: editorJson(defaultValues.settings, {}),
    });
  }, [open, defaultValues, maxPhrases]);

  const previews = useMemo(() => {
    const result = {};
    ["logo", "img_portada", ...Array.from({ length: maxCarousel }, (_, i) => `imagen_${i + 1}`)].forEach((key) => {
      if (removed[key]) result[key] = "";
      else if (files[key]) result[key] = URL.createObjectURL(files[key]);
      else result[key] = key.startsWith("imagen_") ? defaultValues.carrusel?.[key] || "" : defaultValues[key] || "";
    });
    return result;
  }, [files, removed, defaultValues, maxCarousel]);

  useEffect(() => () => Object.entries(previews).forEach(([key, url]) => { if (files[key] && url) URL.revokeObjectURL(url); }), [previews, files]);

  const change = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const updateSetting = (key, value) => setForm((current) => {
    const parsed = parseJson(current.settings || "", {}) || {};
    return { ...current, settings: JSON.stringify({ ...parsed, [key]: value }, null, 2) };
  });
  const currentSections = () => {
    const saved = parseJson(form.sections || "", []);
    const storedSettings = parseJson(form.settings || "", {}) || {};
    const storedOrder = Array.isArray(storedSettings.section_order) ? storedSettings.section_order : [];
    const storedVisibility = storedSettings.section_visibility || {};
    const defaults = DEFAULT_SECTIONS.map((section) => ({ ...section, visible: storedVisibility[section.id] ?? section.visible })).sort((a, b) => { const ai = storedOrder.indexOf(a.id); const bi = storedOrder.indexOf(b.id); return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi); });
    const source = !Array.isArray(saved) || !saved.length ? defaults : saved;
    return source.map((item) => {
      const id = item.id || item.type;
      const advancedOnly = id === "socials";
      const locked = advancedOnly && planLevel < 4;
      const normalized = { ...DEFAULT_SECTIONS.find((section) => section.id === id), ...item, id };
      return { ...normalized, label: `${normalized.label || id}${locked ? " · 🔒 Avanzado" : ""}`, locked, visible: locked ? false : asBoolean(item.visible ?? item.enabled, true) };
    }).filter((item) => item.id && (planLevel !== 2 || ["catalog", "carousel", "phrases"].includes(item.id)));
  };
  const updateSection = (id, patch) => setForm((current) => {
    if (id === "socials" && planLevel < 4) return current;
    const saved = parseJson(current.sections || "", []);
    const list = Array.isArray(saved) && saved.length ? saved : DEFAULT_SECTIONS;
    return { ...current, sections: JSON.stringify(list.map((item) => (item.id || item.type) === id ? { ...item, id, type: id, ...patch, enabled: patch.visible ?? item.enabled } : item), null, 2) };
  });
  const moveSection = (index, direction) => setForm((current) => {
    const saved = parseJson(current.sections || "", []);
    const storedSettings = parseJson(current.settings || "", {}) || {};
    const storedOrder = Array.isArray(storedSettings.section_order) ? storedSettings.section_order : [];
    const storedVisibility = storedSettings.section_visibility || {};
    const defaults = DEFAULT_SECTIONS
      .map((section) => ({ ...section, visible: storedVisibility[section.id] ?? section.visible }))
      .sort((a, b) => {
        const ai = storedOrder.indexOf(a.id);
        const bi = storedOrder.indexOf(b.id);
        return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
      });
    const source = Array.isArray(saved) && saved.length ? saved : defaults;
    const list = source.filter((item) => planLevel !== 2 || ["catalog", "carousel", "phrases"].includes(item.id || item.type));
    const target = index + direction;
    if (target < 0 || target >= list.length) return current;
    [list[index], list[target]] = [list[target], list[index]];
    const normalized = list.map((item, position) => ({ ...item, id: item.id || item.type, type: item.id || item.type, position: position + 1 }));
    return { ...current, sections: JSON.stringify(normalized, null, 2) };
  });
  const updateTheme = (key, value) => setForm((current) => {
    const parsed = parseJson(current.theme || "", {}) || {};
    return { ...current, theme: JSON.stringify({ ...parsed, [key]: value }, null, 2) };
  });
  const chooseFile = (key, file) => { setFiles((current) => ({ ...current, [key]: file })); setRemoved((current) => ({ ...current, [key]: false })); };
  const removeFile = (key) => { setFiles((current) => ({ ...current, [key]: null })); setRemoved((current) => ({ ...current, [key]: true })); };

  const submit = async () => {
    const structured = {};
    const errors = {};
    ["sections", "theme", "settings"].forEach((key) => {
      const fallback = key === "sections" ? [] : {};
      structured[key] = parseJson(form[key], fallback);
      if (structured[key] === null) errors[key] = "El JSON no tiene un formato válido.";
    });
    setJsonErrors(errors);
    if (Object.keys(errors).length) { setTab(4); return; }

    const fd = new FormData();
    fd.append("template", template);
    fd.append("is_active", form.is_active ? "1" : "0");
    ["titulo_1", "descripcion", "hero_title", "hero_subtitle", "hero_button_text", "hero_button_url", "facebook", "instagram", "twitter", "tiktok"].forEach((key) => fd.append(key, form[key] || ""));
    if (capabilities.custom_font) fd.append("font_family", form.font_family || "");
    if (capabilities.custom_colors !== false) {
      fd.append("primary_color", form.colors.primary); fd.append("secondary_color", form.colors.secondary);
      fd.append("accent_color", form.colors.accent); fd.append("background_color", form.colors.background); fd.append("text_color", form.colors.text);
    }
    const phrases = form.phrases.filter(Boolean);
    if (phrases.length) phrases.forEach((phrase, index) => fd.append(`phrases[${index}]`, phrase));
    else fd.append("phrases[0]", "");
    const normalizedSections = currentSections().map((section, index) => ({
        id: section.id,
        type: section.id,
        label: String(section.label || section.id).replace(/ · 🔒 Avanzado$/, ""),
        visible: section.visible !== false,
        enabled: section.visible !== false,
        position: index + 1,
    }));
    if (supportsNativeSections) {
      appendValue(fd, "sections", normalizedSections);
    }
    if (capabilities.advanced_theme) appendValue(fd, "theme", structured.theme);
    const settingsToSave = supportsNativeSections ? structured.settings : { ...structured.settings, section_order: normalizedSections.map((section) => section.id), section_visibility: Object.fromEntries(normalizedSections.map((section) => [section.id, section.visible])) };
    appendValue(fd, "settings", settingsToSave);
    Object.entries(files).forEach(([key, file]) => { if (file) fd.append(key, file); });
    Object.entries(removed).forEach(([key, value]) => { if (value) fd.append(`remove_${key}`, "1"); });
    await onSubmit(fd);
  };

  const tabs = [
    { label: "Identidad", icon: <StorefrontRoundedIcon /> },
    { label: "Conócenos", icon: <ImageRoundedIcon /> },
    { label: "Carrusel", icon: <ViewCarouselRoundedIcon /> },
    { label: "Diseño", icon: <PaletteRoundedIcon /> },
    { label: "Avanzado", icon: <SettingsRoundedIcon /> },
  ];

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="lg" fullScreen={fullScreen} PaperProps={{ sx: { borderRadius: { md: 3 }, height: { md: "min(780px,92vh)" }, overflow: "hidden" } }}>
      <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center"><Avatar sx={{ bgcolor: "primary.main" }}><StorefrontRoundedIcon /></Avatar><Box><Stack direction="row" spacing={1} alignItems="center"><Typography variant="h6" fontWeight={900}>Editor del sitio</Typography><Chip label={`Plan ${planName}`} size="small" color="primary" variant="outlined" /></Stack><Typography variant="caption" color="text.secondary">Personaliza y publica los cambios de esta sucursal</Typography></Box></Stack>
          <IconButton onClick={onClose} disabled={saving}><CloseRoundedIcon /></IconButton>
        </Stack>
      </Box>

      <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: { xs: "column", md: "row" } }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} orientation={fullScreen ? "horizontal" : "vertical"} variant="scrollable" sx={{ width: { md: 190 }, flexShrink: 0, borderRight: { md: "1px solid" }, borderBottom: { xs: "1px solid", md: 0 }, borderColor: "divider", bgcolor: "#f8fafc", py: { md: 1.5 }, "& .MuiTab-root": { minHeight: 52, justifyContent: { md: "flex-start" }, textTransform: "none", fontWeight: 750 } }}>
          {tabs.map((item) => <Tab key={item.label} icon={item.icon} iconPosition="start" label={item.label} />)}
        </Tabs>

        <DialogContent sx={{ p: { xs: 2, md: 3 }, bgcolor: "#fbfcfe" }}>
          {tab === 0 && <Stack spacing={2.5}>
            <Box><Typography variant="h6" fontWeight={850}>Identidad del negocio</Typography><Typography variant="body2" color="text.secondary">Información principal, logotipo y canales sociales.</Typography></Box>
            <Box sx={{ pb: 5, border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "white", overflow: "hidden", boxShadow: "0 8px 28px rgba(15,23,42,.08)" }}>
              <Box sx={{ minHeight: { xs: 170, sm: 230 }, maxHeight: 360, position: "relative", bgcolor: "#e2e8f0", background: previews.img_portada ? "#e2e8f0" : "linear-gradient(135deg,#dbeafe,#e2e8f0)", display: "grid", placeItems: "center", overflow: "hidden" }}>
                {previews.img_portada && <Box component="img" src={previews.img_portada} alt="Portada completa" sx={{ display: "block", width: "100%", height: "auto", maxHeight: 360, objectFit: "contain", objectPosition: "center" }} />}
                {!previews.img_portada && <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", color: "text.secondary" }}><ImageRoundedIcon sx={{ fontSize: 42, opacity: .45 }} /><Typography variant="body2" fontWeight={700}>Agrega una imagen de portada</Typography></Stack>}
                <Stack direction="row" spacing={1} sx={{ position: "absolute", right: 14, bottom: 14 }}>
                  {previews.img_portada && <IconButton size="small" onClick={() => removeFile("img_portada")} disabled={saving} sx={{ bgcolor: "rgba(255,255,255,.92)", color: "error.main", "&:hover": { bgcolor: "white" } }}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>}
                  <Button component="label" size="small" variant="contained" startIcon={<CloudUploadRoundedIcon />} disabled={saving} sx={{ bgcolor: "rgba(15,23,42,.86)", textTransform: "none", fontWeight: 800, "&:hover": { bgcolor: "#0f172a" } }}>{previews.img_portada ? "Cambiar portada" : "Subir portada"}<input hidden type="file" accept="image/*" onChange={(e) => chooseFile("img_portada", e.target.files?.[0] || null)} /></Button>
                </Stack>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "center", sm: "flex-end" }} spacing={2} sx={{ px: { xs: 2, sm: 3 }, mt: -6, position: "relative" }}>
                <Box sx={{ width: 118, height: 118, borderRadius: "50%", border: "5px solid white", bgcolor: "#f1f5f9", boxShadow: "0 5px 18px rgba(15,23,42,.18)", display: "grid", placeItems: "center", overflow: "hidden", position: "relative", flexShrink: 0 }}>
                  {previews.logo ? <Box component="img" src={previews.logo} alt="Logo" sx={{ width: "100%", height: "100%", objectFit: "contain", bgcolor: "white" }} /> : <StorefrontRoundedIcon sx={{ fontSize: 42, color: "text.disabled" }} />}
                </Box>
                <Stack direction="row" spacing={1} sx={{ pb: { sm: .75 } }}>
                  <Button component="label" size="small" variant="outlined" startIcon={<CloudUploadRoundedIcon />} disabled={saving} sx={{ bgcolor: "white", textTransform: "none", fontWeight: 750 }}>{previews.logo ? "Cambiar logo" : "Agregar logo"}<input hidden type="file" accept="image/*" onChange={(e) => chooseFile("logo", e.target.files?.[0] || null)} /></Button>
                  {previews.logo && <Button size="small" color="error" onClick={() => removeFile("logo")} disabled={saving} startIcon={<DeleteOutlineRoundedIcon />} sx={{ textTransform: "none" }}>Quitar</Button>}
                </Stack>
              </Stack>
            </Box>

            <TextField label="Título del negocio" value={form.titulo_1 || ""} onChange={change("titulo_1")} fullWidth inputProps={{ maxLength: 190 }} helperText={`${(form.titulo_1 || "").length}/190 caracteres`} FormHelperTextProps={{ sx: { textAlign: "right", mr: 0 } }} />
            <TextField label="Descripción" value={form.descripcion || ""} onChange={change("descripcion")} fullWidth multiline minRows={3} placeholder="Cuéntales a tus clientes sobre tu negocio, historia, productos o servicios…" helperText="El campo crece automáticamente y no tiene límite de caracteres." />
            <Divider />
            <Box><Stack direction="row" alignItems="center" spacing={1}><Box sx={{ flex: 1 }}><Typography variant="subtitle1" fontWeight={850}>Redes sociales</Typography><Typography variant="body2" color="text.secondary">Disponibles exclusivamente en el plan Avanzado.</Typography></Box>{planLevel < 4 && <Chip icon={<LockRoundedIcon />} label="Avanzado" size="small" />}</Stack></Box>
            <Stack spacing={1.5}>{SOCIALS.map(({ key, label, placeholder, color, icon: SocialIcon }) => { const active = Boolean((form[key] || "").trim()); const locked = planLevel < 4; return <TextField disabled={locked} key={key} label={`${label}${locked ? " · 🔒 Avanzado" : ""}`} value={form[key] || ""} onChange={change(key)} fullWidth size="small" placeholder={placeholder} InputProps={{ startAdornment: <InputAdornment position="start"><SocialIcon sx={{ color: active && !locked ? color : "text.disabled", transition: ".2s" }} /></InputAdornment> }} sx={{ "& .MuiOutlinedInput-root": { bgcolor: locked ? "#f8fafc" : "white", "& fieldset": { borderColor: active && !locked ? color : undefined, borderWidth: active && !locked ? 2 : 1 }, "&:hover fieldset": { borderColor: active && !locked ? color : undefined }, "&.Mui-focused fieldset": { borderColor: color } }, "& .MuiInputLabel-root.Mui-focused": { color } }} />; })}</Stack>
          </Stack>}

          {tab === 1 && <Stack spacing={2.5}>
            <Box><Typography variant="h6" fontWeight={850}>Identidad destacada</Typography><Typography variant="body2" color="text.secondary">Crea la sección “Conócenos”. Utiliza automáticamente las dos primeras imágenes del carrusel; si no hay imágenes, muestra la portada.</Typography></Box>
            {planLevel < 3 && <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "#fff7ed", border: "1px solid #fed7aa" }}><Stack direction="row" spacing={1} alignItems="center"><LockRoundedIcon sx={{ color: "#9a3412" }} /><Box><Typography fontWeight={850} color="#9a3412">Identidad destacada bloqueada</Typography><Typography variant="caption" color="#9a3412">Se desbloquea en Profesional.</Typography></Box></Stack></Box>}
            <Grid container spacing={3} alignItems="flex-start">
              <Grid item xs={12} md={6}>
                <Box sx={{ border: "1px solid", borderColor: previews.img_portada ? "#2563eb" : "divider", borderRadius: 3, overflow: "hidden", bgcolor: "white", boxShadow: previews.img_portada ? "0 10px 30px rgba(37,99,235,.12)" : "none" }}>
                  <Box sx={{ width: "100%", minHeight: previews.img_portada ? 0 : { xs: 260, md: 390 }, bgcolor: "#f1f5f9", display: "grid", placeItems: "center", overflow: "hidden" }}>
                    {previews.img_portada ? <Box component="img" src={previews.img_portada} alt="Portada de identidad" sx={{ display: "block", width: "100%", height: "auto", maxHeight: 440, objectFit: "contain", objectPosition: "center" }} /> : <Stack alignItems="center" spacing={1} color="text.secondary"><ImageRoundedIcon sx={{ fontSize: 48, opacity: .4 }} /><Typography variant="body2" fontWeight={700}>Sin portada de identidad</Typography></Stack>}
                  </Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5 }}>
                    <Box><Typography variant="body2" fontWeight={850}>Portada de identidad</Typography><Typography variant="caption" color="text.secondary">Se muestra completa, sin recortes</Typography></Box>
                    <Stack direction="row" spacing={.5}>{previews.img_portada && <IconButton size="small" color="error" onClick={() => removeFile("img_portada")} disabled={saving}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>}<IconButton component="label" size="small" color="primary" disabled={saving}><CloudUploadRoundedIcon /><input hidden type="file" accept="image/*" onChange={(e) => chooseFile("img_portada", e.target.files?.[0] || null)} /></IconButton></Stack>
                  </Stack>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>Esta imagen también se utiliza como portada en Identidad.</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(12, minmax(0, 1fr))" }, gap: 2 }}>
                  {[
                    { key: "hero_title", label: "Título principal", limit: 190, icon: TitleRoundedIcon, multiline: false, placeholder: "Escribe el título principal", sm: 12 },
                    { key: "hero_subtitle", label: "Descripción", limit: 400, icon: SubjectRoundedIcon, multiline: true, placeholder: "Describe brevemente lo que ofrece tu sitio", sm: 12 },
                    { key: "hero_button_text", label: "Texto del botón", limit: 30, icon: SmartButtonRoundedIcon, multiline: false, placeholder: "Ej. Ver productos", sm: 5 },
                    { key: "hero_button_url", label: "Enlace del botón", limit: 190, icon: LinkRoundedIcon, multiline: false, placeholder: "https://", sm: 7 },
                  ].map(({ key, label, limit, icon: FieldIcon, multiline, placeholder, sm }) => { const value = form[key] || ""; const active = Boolean(value.trim()); const requiredPlan = key.startsWith("hero_button") ? 4 : 3; const locked = planLevel < requiredPlan; return <Box key={key} sx={{ gridColumn: { xs: "1 / -1", sm: `span ${sm}` } }}><TextField disabled={locked} label={`${label}${locked ? ` · 🔒 ${requiredPlan === 4 ? "Avanzado" : "Profesional"}` : ""}`} value={value} onChange={change(key)} fullWidth multiline={multiline} minRows={multiline ? 3 : undefined} placeholder={placeholder} inputProps={{ maxLength: limit }} helperText={locked ? `Se desbloquea en ${requiredPlan === 4 ? "Avanzado" : "Profesional"}` : `${value.length}/${limit} caracteres`} FormHelperTextProps={{ sx: { textAlign: "right", mr: 0 } }} InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: multiline ? "flex-start" : "center", mt: multiline ? 1.5 : 0 }}><FieldIcon sx={{ color: active && !locked ? "#2563eb" : "text.disabled", transition: ".2s" }} /></InputAdornment> }} sx={{ "& .MuiOutlinedInput-root": { bgcolor: locked ? "#f8fafc" : "white", alignItems: multiline ? "flex-start" : "center", "& fieldset": { borderColor: active && !locked ? "#2563eb" : undefined, borderWidth: active && !locked ? 2 : 1 }, "&:hover fieldset": { borderColor: active && !locked ? "#2563eb" : undefined }, "&.Mui-focused fieldset": { borderColor: "#2563eb" } }, "& .MuiInputLabel-root.Mui-focused": { color: "#2563eb" } }} /></Box>; })}
                </Box>
              </Grid>
            </Grid>
          </Stack>}

          {tab === 2 && <Stack spacing={2.5}>
            <Box><Stack direction="row" justifyContent="space-between"><Box><Typography variant="h6" fontWeight={850}>Carrusel</Typography><Typography variant="body2" color="text.secondary">Las imágenes 1 y 2 también se usan en “Conócenos”. Si ambas están vacías, se usa la portada.</Typography></Box><Chip label={`${maxCarousel} espacios`} color="primary" /></Stack></Box>
            <Grid container spacing={2}>{Array.from({ length: maxCarousel }, (_, i) => { const key = `imagen_${i + 1}`; return <Grid item xs={12} sm={6} md={4} key={key}><UploadCard title={`Imagen ${i + 1}`} subtitle="Máximo 20 MB" preview={previews[key]} onFile={(file) => chooseFile(key, file)} onRemove={() => removeFile(key)} disabled={saving} /></Grid>; })}</Grid>
          </Stack>}

          {tab === 3 && <Stack spacing={3}>
            <Box><Typography variant="h6" fontWeight={850}>Apariencia y mensajes</Typography><Typography variant="body2" color="text.secondary">Ajustes visuales permitidos por tu plan.</Typography></Box>
            <Grid container spacing={2}>{Object.entries({ primary: "Principal", secondary: "Secundario", accent: "Acento", background: "Fondo", text: "Texto" }).map(([key, label]) => <Grid item xs={6} sm={4} key={key}><Stack direction="row" spacing={1} alignItems="center"><Box component="input" type="color" value={form.colors?.[key] || EMPTY_COLORS[key]} onChange={(e) => setForm((current) => ({ ...current, colors: { ...current.colors, [key]: e.target.value } }))} sx={{ width: 38, height: 38, border: 0, bgcolor: "transparent", cursor: "pointer" }} /><Box><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="body2" fontWeight={700}>{form.colors?.[key]}</Typography></Box></Stack></Grid>)}</Grid>
            {capabilities.custom_font ? <Box><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}><Box><Typography variant="subtitle2" fontWeight={850}>Tipografía del sitio</Typography><Typography variant="caption" color="text.secondary">Selecciona una opción viendo el nombre de tu tienda.</Typography></Box>{form.font_family && <Chip label="Seleccionada" size="small" color="primary" />}</Stack><Grid container spacing={1.5}>{FONT_OPTIONS.map((font) => { const selected = form.font_family === font.family; return <Grid item xs={12} sm={6} key={font.name}><Button fullWidth onClick={() => setForm((current) => ({ ...current, font_family: font.family }))} sx={{ display: "block", textAlign: "left", p: 1.5, borderRadius: 2, border: "2px solid", borderColor: selected ? "primary.main" : "divider", bgcolor: selected ? "#eff6ff" : "white", color: "text.primary", textTransform: "none", "&:hover": { borderColor: "primary.main", bgcolor: "#eff6ff" } }}><Typography variant="caption" color={selected ? "primary" : "text.secondary"} fontWeight={800}>{font.name}</Typography><Typography noWrap sx={{ mt: .5, fontFamily: font.family, fontSize: "1.15rem", fontWeight: 700 }}>{sampleName}</Typography></Button></Grid>; })}</Grid></Box> : <Chip label="Tu plan utiliza la tipografía predeterminada" variant="outlined" />}
            <Divider />
            <Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography variant="subtitle2" fontWeight={850}>Frases destacadas</Typography><Typography variant="caption" color="text.secondary">Organizadas una por una, con máximo 250 caracteres.</Typography></Box><Chip label={`${form.phrases?.length || 0}/${maxPhrases}`} size="small" color="primary" variant="outlined" /></Stack>
            <Stack spacing={1.5}>
              {(form.phrases || []).map((phrase, index) => <Box key={index} sx={{ p: 1.5, border: "1px solid", borderColor: phrase ? "#2563eb" : "divider", borderRadius: 2.5, bgcolor: "white" }}><Stack direction="row" alignItems="flex-start" spacing={1.25}><Box sx={{ width: 30, height: 30, mt: .5, borderRadius: "50%", bgcolor: "primary.main", color: "white", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 900, flexShrink: 0 }}>{index + 1}</Box><TextField label={`Frase ${index + 1}`} value={phrase} onChange={(e) => setForm((current) => ({ ...current, phrases: current.phrases.map((item, i) => i === index ? e.target.value : item) }))} fullWidth multiline minRows={2} inputProps={{ maxLength: 250 }} helperText={`${phrase.length}/250 caracteres`} FormHelperTextProps={{ sx: { textAlign: "right", mr: 0 } }} /><IconButton color="error" onClick={() => setForm((current) => ({ ...current, phrases: current.phrases.filter((_, i) => i !== index) }))} aria-label={`Eliminar frase ${index + 1}`}><DeleteOutlineRoundedIcon /></IconButton></Stack></Box>)}
              {(form.phrases?.length || 0) < maxPhrases && <Button variant={(form.phrases?.length || 0) ? "outlined" : "contained"} startIcon={<AddRoundedIcon />} onClick={() => setForm((current) => ({ ...current, phrases: [...(current.phrases || []), ""] }))} sx={{ alignSelf: "flex-start", borderRadius: 2, textTransform: "none", fontWeight: 800 }}>{(form.phrases?.length || 0) ? `Agregar frase ${(form.phrases?.length || 0) + 1}` : "Agregar primera frase"}</Button>}
            </Stack>
          </Stack>}

          {tab === 4 && <Stack spacing={2.5}>
            <Box><Typography variant="h6" fontWeight={850}>Configuración avanzada</Typography><Typography variant="body2" color="text.secondary">Define cómo se organiza y funciona el catálogo para esta sucursal.</Typography></Box>
            <FormControlLabel control={<Switch checked={Boolean(form.is_active)} onChange={(e) => setForm((current) => ({ ...current, is_active: e.target.checked }))} />} label="Sitio publicado y visible" />
            {!capabilities.custom_sections && <Box sx={{ p: 2, borderRadius: 3, bgcolor: "white", border: "1px solid", borderColor: "divider" }}><Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography fontWeight={850}>Secciones del sitio</Typography><Typography variant="caption" color="text.secondary">Negocio incluye portada, productos y contacto.</Typography></Box><Chip icon={<LockRoundedIcon />} label="Más secciones en Profesional" size="small" sx={{ bgcolor: "#fff7ed", color: "#9a3412", fontWeight: 800 }} /></Stack><Stack spacing={1} sx={{ mt: 2 }}>{DEFAULT_SECTIONS.map((section, index) => { const included = ["hero", "catalog", "socials"].includes(section.id); return <Stack key={section.id} direction="row" alignItems="center" spacing={1} sx={{ p: 1, borderRadius: 2, border: "1px solid", borderColor: included ? "#bfdbfe" : "divider", bgcolor: included ? "#f8faff" : "#f8fafc", opacity: included ? 1 : .62 }}><Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: included ? "primary.main" : "grey.300", color: "white", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 900 }}>{index + 1}</Box><Typography variant="body2" fontWeight={800} sx={{ flex: 1 }}>{section.label}</Typography>{included ? <Chip label="Incluida" size="small" color="primary" variant="outlined" /> : <Chip icon={<LockRoundedIcon />} label="Profesional" size="small" />}</Stack>; })}</Stack></Box>}
            {!capabilities.advanced_theme && <Box sx={{ p: 2, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid", borderColor: "divider" }}><Stack direction="row" alignItems="center" spacing={1.5}><LockRoundedIcon color="action" /><Box sx={{ flex: 1 }}><Typography fontWeight={850}>Estilos avanzados bloqueados</Typography><Typography variant="caption" color="text.secondary">Apariencia, ancho, sombras, espaciado, botones y animaciones.</Typography></Box><Chip icon={<LockRoundedIcon />} label="Se desbloquea en Avanzado" size="small" sx={{ bgcolor: "#fff7ed", color: "#9a3412", fontWeight: 800 }} /></Stack></Box>}
            {capabilities.custom_sections && <Box sx={{ p: 2, borderRadius: 3, bgcolor: "white", border: "1px solid", borderColor: "divider" }}><Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography fontWeight={850}>Secciones del sitio</Typography><Typography variant="caption" color="text.secondary">Activa, oculta y ordena el contenido de arriba hacia abajo.</Typography></Box><Chip label={`${currentSections().filter((section) => section.visible !== false).length} visibles`} size="small" color="primary" variant="outlined" /></Stack><Stack spacing={1} sx={{ mt: 2 }}>{currentSections().map((section, index, list) => <Stack key={section.id} direction="row" alignItems="center" spacing={1} sx={{ p: 1, borderRadius: 2, border: "1px solid", borderColor: section.visible !== false ? "#bfdbfe" : "divider", bgcolor: section.visible !== false ? "#f8faff" : "#f8fafc" }}><Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: section.visible !== false ? "primary.main" : "grey.300", color: "white", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 900 }}>{index + 1}</Box><Typography variant="body2" fontWeight={800} sx={{ flex: 1 }}>{section.label || section.id}</Typography><Switch size="small" checked={section.visible !== false} onChange={(e) => updateSection(section.id, { visible: e.target.checked })} /><IconButton size="small" disabled={index === 0} onClick={() => moveSection(index, -1)}><ArrowUpwardRoundedIcon fontSize="small" /></IconButton><IconButton size="small" disabled={index === list.length - 1} onClick={() => moveSection(index, 1)}><ArrowDownwardRoundedIcon fontSize="small" /></IconButton></Stack>)}</Stack></Box>}
            {capabilities.advanced_theme && <Box sx={{ p: 2, borderRadius: 3, bgcolor: "white", border: "1px solid", borderColor: "divider" }}><Box sx={{ mb: 2 }}><Typography fontWeight={850}>Tema visual</Typography><Typography variant="caption" color="text.secondary">Define la personalidad y densidad visual de toda la página.</Typography></Box><Stack spacing={1}>
              {[
                { key: "mode", label: "Apariencia", icon: LightModeRoundedIcon, fallback: "light", options: [["light","Clara"],["dark","Oscura"],["auto","Según dispositivo"]] },
                { key: "content_width", label: "Ancho del contenido", icon: WidthNormalRoundedIcon, fallback: "wide", options: [["compact","Compacto"],["normal","Normal"],["wide","Amplio"],["full","Pantalla completa"]] },
                { key: "radius", label: "Bordes", icon: RoundedCornerRoundedIcon, fallback: "medium", options: [["none","Rectos"],["small","Suaves"],["medium","Redondeados"],["large","Muy redondeados"]] },
                { key: "shadow", label: "Sombras", icon: LayersRoundedIcon, fallback: "soft", options: [["none","Sin sombra"],["soft","Suave"],["medium","Media"],["strong","Marcada"]] },
                { key: "spacing", label: "Espaciado", icon: SpaceBarRoundedIcon, fallback: "comfortable", options: [["compact","Compacto"],["comfortable","Cómodo"],["spacious","Amplio"]] },
                { key: "header_style", label: "Encabezado", icon: ViewHeadlineRoundedIcon, fallback: "standard", options: [["minimal","Minimalista"],["standard","Estándar"],["centered","Centrado"],["floating","Flotante"]] },
                { key: "button_style", label: "Botones", icon: SmartButtonRoundedIcon, fallback: "rounded", options: [["square","Rectos"],["rounded","Redondeados"],["pill","Tipo píldora"],["outline","Contorno"]] },
                { key: "animation", label: "Animaciones", icon: AnimationRoundedIcon, fallback: "subtle", options: [["none","Desactivadas"],["subtle","Sutiles"],["smooth","Suaves"],["dynamic","Dinámicas"]] },
              ].map((control) => <ConfigSelectRow key={control.key} icon={control.icon} title={control.label} value={(parseJson(form.theme || "", {}) || {})[control.key] || control.fallback} onChange={(e) => updateTheme(control.key, e.target.value)}>{control.options.map(([value,label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</ConfigSelectRow>)}
            </Stack><Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}><FormControlLabel control={<Switch checked={(parseJson(form.theme || "", {}) || {}).sticky_header !== false} onChange={(e) => updateTheme("sticky_header", e.target.checked)} />} label="Encabezado fijo" /><FormControlLabel control={<Switch checked={(parseJson(form.theme || "", {}) || {}).smooth_scroll !== false} onChange={(e) => updateTheme("smooth_scroll", e.target.checked)} />} label="Desplazamiento suave" /></Stack></Box>}
            <Box sx={{ p: 2, borderRadius: 3, bgcolor: "white", border: "1px solid", borderColor: "divider" }}><Typography fontWeight={850} sx={{ mb: 2 }}>Productos</Typography><Stack spacing={1}>
              <ConfigSelectRow icon={SortRoundedIcon} title="Orden predeterminado" subtitle="Orden inicial del catálogo" value={(parseJson(form.settings || "", {}) || {}).product_sort || "newest"} onChange={(e) => updateSetting("product_sort", e.target.value)} color="#7c3aed"><MenuItem value="newest">Más recientes primero</MenuItem><MenuItem value="oldest">Más antiguos primero</MenuItem><MenuItem value="name_asc">Nombre A–Z</MenuItem><MenuItem value="name_desc">Nombre Z–A</MenuItem><MenuItem value="price_asc" disabled={planLevel < 3}>Precio menor a mayor {planLevel < 3 && "🔒 Profesional"}</MenuItem><MenuItem value="price_desc" disabled={planLevel < 3}>Precio mayor a menor {planLevel < 3 && "🔒 Profesional"}</MenuItem><MenuItem value="stock_desc" disabled={planLevel < 3}>Mayor existencia primero {planLevel < 3 && "🔒 Profesional"}</MenuItem></ConfigSelectRow>
              <ConfigSelectRow icon={FormatListNumberedRoundedIcon} title="Productos por página" value={(parseJson(form.settings || "", {}) || {}).products_per_page || 12} onChange={(e) => updateSetting("products_per_page", Number(e.target.value))} color="#7c3aed">{[12,24,36,48].map((value) => { const required = value === 24 ? 3 : value >= 36 ? 4 : 2; return <MenuItem value={value} key={value} disabled={planLevel < required}>{value} productos {planLevel < required && `🔒 ${required === 4 ? "Avanzado" : "Profesional"}`}</MenuItem>; })}</ConfigSelectRow>
              <ConfigSelectRow icon={GridViewRoundedIcon} title="Columnas del catálogo" value={(parseJson(form.settings || "", {}) || {}).catalog_columns || 3} onChange={(e) => updateSetting("catalog_columns", Number(e.target.value))} color="#7c3aed">{[2,3,4].map((value) => <MenuItem value={value} key={value} disabled={value === 4 && planLevel < 3}>{value} columnas {value === 4 && planLevel < 3 && "🔒 Profesional"}</MenuItem>)}</ConfigSelectRow>
              <ConfigSelectRow icon={Inventory2RoundedIcon} title="Productos agotados" value={(parseJson(form.settings || "", {}) || {}).out_of_stock || "last"} onChange={(e) => updateSetting("out_of_stock", e.target.value)} color="#7c3aed"><MenuItem value="show">Mostrar normalmente</MenuItem><MenuItem value="last">Mostrar al final</MenuItem><MenuItem value="hide">Ocultar</MenuItem></ConfigSelectRow>
            </Stack></Box>
            <Box sx={{ p: 2, borderRadius: 3, bgcolor: "white", border: "1px solid", borderColor: "divider" }}><Typography fontWeight={850}>Experiencia de navegación</Typography><Typography variant="caption" color="text.secondary">Define cómo recorre el cliente la tienda y abre cada producto.</Typography><Stack spacing={1} sx={{ mt: 2 }}>
              <PlanConfigRow locked={planLevel < 3} unlockPlan="Profesional"><ConfigSelectRow icon={ViewDayRoundedIcon} title="Navegación de secciones" subtitle="Landing continua o contenido por pestañas" value={(parseJson(form.settings || "", {}) || {}).navigation_mode || "landing"} onChange={(e) => updateSetting("navigation_mode", e.target.value)} color="#0f766e"><MenuItem value="landing">Landing continua</MenuItem><MenuItem value="tabs">Cambiar sección al hacer clic</MenuItem></ConfigSelectRow></PlanConfigRow>
              <PlanConfigRow locked={planLevel < 3} unlockPlan="Profesional"><ConfigSelectRow icon={OpenInNewRoundedIcon} title="Apertura de productos" subtitle="Vista rápida o página pública individual" value={(parseJson(form.settings || "", {}) || {}).product_view || "modal"} onChange={(e) => updateSetting("product_view", e.target.value)} color="#0f766e"><MenuItem value="modal">Modal dentro del catálogo</MenuItem><MenuItem value="page">Página independiente</MenuItem></ConfigSelectRow></PlanConfigRow>
              <PlanConfigRow locked={planLevel < 4} unlockPlan="Avanzado"><Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2.25 }}><FormControlLabel control={<Switch checked={asBoolean((parseJson(form.settings || "", {}) || {}).show_share)} onChange={(e) => updateSetting("show_share", e.target.checked)} />} label={<Stack direction="row" spacing={1} alignItems="center"><ShareRoundedIcon fontSize="small" /><span>Permitir compartir productos</span></Stack>} /></Box></PlanConfigRow>
              <PlanConfigRow locked={planLevel < 3} unlockPlan="Profesional"><TextField label="Leyenda general de los productos" placeholder="Ej. Personalizamos tu pedido; contáctanos para conocer opciones." value={(parseJson(form.settings || "", {}) || {}).product_legend || ""} onChange={(e) => updateSetting("product_legend", e.target.value)} multiline minRows={2} fullWidth inputProps={{ maxLength: 250 }} helperText="Aparece en las tarjetas y en el detalle. Máximo 250 caracteres." /></PlanConfigRow>
              <PlanConfigRow locked={planLevel < 3} unlockPlan="Profesional"><Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2.25 }}><Typography variant="subtitle2" fontWeight={850}>Mensajes y precio por cantidad</Typography><Typography variant="caption" color="text.secondary">Personaliza los dos mensajes del producto y la regla que se aplicará automáticamente en el carrito.</Typography><Stack spacing={1.5} sx={{ mt: 1.5 }}><TextField label="Mensaje de compra individual" placeholder="Ej. 1 pieza · Playera + shorts" value={(parseJson(form.settings || "", {}) || {}).single_unit_message || ""} onChange={(e) => updateSetting("single_unit_message", e.target.value)} fullWidth inputProps={{ maxLength: 120 }} /><TextField label="Mensaje de mayoreo" placeholder="Ej. Incluye playera, shorts, nombre, número y calcetas" value={(parseJson(form.settings || "", {}) || {}).wholesale_message || ""} onChange={(e) => updateSetting("wholesale_message", e.target.value)} multiline minRows={2} fullWidth inputProps={{ maxLength: 250 }} /><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><TextField label="Cantidad mínima para mayoreo" type="number" value={(parseJson(form.settings || "", {}) || {}).wholesale_min_quantity || ""} onChange={(e) => updateSetting("wholesale_min_quantity", Math.max(0, Number(e.target.value) || 0))} inputProps={{ min: 2, step: 1 }} fullWidth helperText="Al alcanzar esta cantidad se cambia el precio en el carrito." /><TextField label="Precio unitario de mayoreo" type="number" value={(parseJson(form.settings || "", {}) || {}).wholesale_unit_price || ""} onChange={(e) => updateSetting("wholesale_unit_price", Math.max(0, Number(e.target.value) || 0))} inputProps={{ min: 0, step: "0.01" }} fullWidth /></Stack></Stack></Box></PlanConfigRow>
              <PlanConfigRow locked={planLevel < 3} unlockPlan="Profesional"><ConfigSelectRow icon={TitleRoundedIcon} title="Estilo de frases" subtitle="Presentación de los mensajes destacados" value={(parseJson(form.settings || "", {}) || {}).phrase_style || "editorial"} onChange={(e) => updateSetting("phrase_style", e.target.value)} color="#0f766e"><MenuItem value="editorial">Editorial</MenuItem><MenuItem value="cards">Tarjetas</MenuItem><MenuItem value="banner">Banner destacado</MenuItem><MenuItem value="minimal">Minimalista</MenuItem></ConfigSelectRow></PlanConfigRow>
              <PlanConfigRow locked={planLevel < 3} unlockPlan="Profesional"><ConfigSelectRow icon={ViewHeadlineRoundedIcon} title="Alineación de frases" value={(parseJson(form.settings || "", {}) || {}).phrase_alignment || "alternating"} onChange={(e) => updateSetting("phrase_alignment", e.target.value)} color="#0f766e"><MenuItem value="left">Izquierda</MenuItem><MenuItem value="center">Centrada</MenuItem><MenuItem value="alternating">Alternada</MenuItem></ConfigSelectRow></PlanConfigRow>
              <PlanConfigRow locked={planLevel < 4} unlockPlan="Avanzado"><Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2.25 }}><FormControlLabel control={<Switch checked={asBoolean((parseJson(form.settings || "", {}) || {}).advanced_hero)} onChange={(e) => updateSetting("advanced_hero", e.target.checked)} />} label="Identidad destacada con profundidad y animación" /></Box></PlanConfigRow>
            </Stack></Box>
            <Box sx={{ p: 2, borderRadius: 3, bgcolor: "white", border: "1px solid", borderColor: "divider" }}><Typography fontWeight={850}>Variantes</Typography><Typography variant="caption" color="text.secondary">Configura cómo se consultan y muestran las variantes disponibles.</Typography><Stack sx={{ mt: 1 }}>
              <PlanConfigRow locked={planLevel < 3} unlockPlan="Profesional"><Box><FormControlLabel control={<Switch checked={asBoolean((parseJson(form.settings || "", {}) || {}).variant_search_enabled)} onChange={(e) => updateSetting("variant_search_enabled", e.target.checked)} />} label="Permitir búsqueda por variantes y cantidad" /></Box></PlanConfigRow>
              <FormControlLabel control={<Switch checked={(parseJson(form.settings || "", {}) || {}).only_available_variants !== false} onChange={(e) => updateSetting("only_available_variants", e.target.checked)} />} label="Mostrar solamente variantes con existencia" />
              <FormControlLabel control={<Switch checked={(parseJson(form.settings || "", {}) || {}).group_variants !== false} onChange={(e) => updateSetting("group_variants", e.target.checked)} />} label="Agrupar variantes dentro del producto" />
            </Stack></Box>
            <Box sx={{ p: 2, borderRadius: 3, bgcolor: "white", border: "1px solid", borderColor: "divider" }}><Typography fontWeight={850}>Elementos del catálogo</Typography><Stack sx={{ mt: 1 }}>{[["show_search","Mostrar buscador",true],["show_categories","Mostrar categorías",true],["show_whatsapp","Mostrar botón de WhatsApp",true]].map(([key,label,fallback]) => <FormControlLabel key={key} control={<Switch checked={asBoolean((parseJson(form.settings || "", {}) || {})[key], fallback)} onChange={(e) => updateSetting(key, e.target.checked)} />} label={label} />)}<PlanConfigRow locked={planLevel < 4} unlockPlan="Avanzado"><Box><FormControlLabel control={<Switch checked={asBoolean((parseJson(form.settings || "", {}) || {}).show_sort_selector)} onChange={(e) => updateSetting("show_sort_selector", e.target.checked)} />} label="Mostrar selector de ordenamiento en la tienda" /></Box></PlanConfigRow></Stack></Box>
          </Stack>}
        </DialogContent>
      </Box>

      <DialogActions sx={{ px: 3, py: 1.75, borderTop: "1px solid", borderColor: "divider" }}><Button onClick={onClose} disabled={saving} color="inherit">Cancelar</Button><Button onClick={submit} variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={17} color="inherit" /> : null} sx={{ px: 3, borderRadius: 2, textTransform: "none", fontWeight: 800 }}>{saving ? "Publicando…" : "Guardar y publicar"}</Button></DialogActions>
    </Dialog>
  );
}
