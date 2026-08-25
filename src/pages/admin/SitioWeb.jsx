import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Card, Chip, CircularProgress, Container,
  Grid, LinearProgress, Stack, Typography,
} from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DesignServicesRoundedIcon from "@mui/icons-material/DesignServicesRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

import { useAdminUi } from "../../context/AdminUiContext";
import { getBranchSite, getMyStore, upsertBranchSite } from "../../services/admin/branchSiteService";
import { alertFromAxiosError, showSuccess } from "../../utils/alerts";
import SiteEditorModal from "./modals/SiteEditorModal";

const PLANS = {
  1: { name: "Demo", tagline: "Explora todas las herramientas", description: "Prueba la experiencia completa y prepara la imagen digital de tu negocio.", gradient: "linear-gradient(135deg,#334155,#0f766e)", icon: RocketLaunchRoundedIcon },
  2: { name: "Negocio", tagline: "Tu presencia digital esencial", description: "Publica una identidad clara con logo, portada y colores de tu marca.", gradient: "linear-gradient(135deg,#0f766e,#14b8a6)", icon: StorefrontRoundedIcon },
  3: { name: "Profesional", tagline: "Una vitrina con más impacto", description: "Enriquece tu sitio con tipografía, secciones y una galería más amplia.", gradient: "linear-gradient(135deg,#4338ca,#7c3aed)", icon: WorkspacePremiumRoundedIcon },
  4: { name: "Avanzado", tagline: "Control creativo completo", description: "Personaliza la experiencia, el tema y hasta diez imágenes de carrusel.", gradient: "linear-gradient(135deg,#9f1239,#ea580c)", icon: RocketLaunchRoundedIcon },
};

const CAPS = {
  1: { max_carousel: 10, max_phrases: 10, custom_font: true, advanced_theme: true },
  2: { max_carousel: 3, max_phrases: 1, custom_font: false, advanced_theme: false },
  3: { max_carousel: 6, max_phrases: 4, custom_font: true, advanced_theme: false },
  4: { max_carousel: 10, max_phrases: 10, custom_font: true, advanced_theme: true },
};

const templateFor = (planId) => planId === 4 ? "avanzado" : planId === 3 ? "profesional" : "negocio";

export default function SitioWeb({ onSelect }) {
  const navigate = useNavigate();
  const { selectedBranch } = useAdminUi();
  const [store, setStore] = useState(null);
  const [site, setSite] = useState(null);
  const [apiPlan, setApiPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const branchId = selectedBranch?.id;
  const planId = Number(apiPlan?.id || store?.plan_id || 2);
  const plan = PLANS[planId] || PLANS[2];
  const capabilities = apiPlan?.capabilities || CAPS[planId] || CAPS[2];
  const expiration = planId === 1 ? store?.trial_ends_at : store?.plan_expiration;
  const expired = expiration ? new Date(expiration).getTime() < Date.now() : store?.is_active === false;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: storeData } = await getMyStore();
      setStore(storeData);
      if (!branchId || !storeData?.id) return;
      const { data } = await getBranchSite(storeData.id, branchId);
      setSite(data?.data || null);
      setApiPlan(data?.plan || data?.data?.plan || null);
    } catch (error) {
      alertFromAxiosError(error, "No se pudo cargar la configuración del sitio.");
    } finally { setLoading(false); }
  }, [branchId]);

  useEffect(() => { load(); }, [load]);

  const features = useMemo(() => [
    `${capabilities.max_carousel} imágenes de carrusel`,
    `${capabilities.max_phrases} frases destacadas`,
    capabilities.custom_font ? "Tipografía personalizada" : "Tipografía predeterminada",
    capabilities.advanced_theme ? "Tema avanzado" : "Diseño guiado",
  ], [capabilities]);

  const save = async (formData) => {
    if (!store?.id || !branchId) return;
    setSaving(true);
    try {
      if (!formData.has("template")) formData.append("template", templateFor(planId));
      const { data } = await upsertBranchSite(store.id, branchId, formData);
      setSite(data?.data || null);
      setApiPlan(data?.data?.plan || apiPlan);
      setEditorOpen(false);
      await showSuccess(data?.message || "Sitio web guardado correctamente.");
    } catch (error) {
      alertFromAxiosError(error, error?.response?.data?.message || "No se pudo guardar el sitio web.");
      throw error;
    } finally { setSaving(false); }
  };

  if (loading) return (
    <Box sx={{ minHeight: 420, display: "grid", placeItems: "center" }}>
      <Stack spacing={2} alignItems="center"><CircularProgress size={34} /><Typography color="text.secondary">Preparando tu sitio web…</Typography></Stack>
    </Box>
  );

  if (!branchId) return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Card variant="outlined" sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, textAlign: "center" }}>
        <StorefrontRoundedIcon color="primary" sx={{ fontSize: 52, mb: 1 }} />
        <Typography variant="h5" fontWeight={800}>Selecciona una sucursal</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>Cada sucursal tiene su propio sitio. Elige una para comenzar a configurarlo.</Typography>
        <Button variant="contained" onClick={() => navigate("/admin/sucursales")}>Ir a sucursales</Button>
      </Card>
    </Container>
  );

  const carouselCount = Array.from({ length: capabilities.max_carousel }, (_, i) => site?.carrusel?.[`imagen_${i + 1}`]).filter(Boolean).length;
  const socialCount = [site?.facebook, site?.instagram, site?.twitter, site?.tiktok].filter(Boolean).length;
  const phrasesCount = (site?.phrases || []).filter(Boolean).length;
  const configuredItems = [site?.logo, site?.img_portada, site?.titulo_1, site?.descripcion, site?.hero_title, site?.hero_subtitle, site?.hero_button_text, ...Array(carouselCount).fill(true), ...Array(socialCount).fill(true), ...Array(phrasesCount).fill(true)].filter(Boolean).length;
  const totalItems = 7 + capabilities.max_carousel + 4 + capabilities.max_phrases;
  const progress = site ? Math.round((configuredItems / totalItems) * 100) : 0;
  const sections = [
    { title: "Identidad", detail: [site?.logo && "Logo", site?.titulo_1 && "título", site?.descripcion && "descripción"].filter(Boolean).join(", "), current: [site?.logo, site?.titulo_1, site?.descripcion].filter(Boolean).length, total: 3, icon: StorefrontRoundedIcon },
    { title: "Portada y hero", detail: [site?.img_portada && "Portada", site?.hero_title && "mensaje", site?.hero_button_text && "botón"].filter(Boolean).join(", "), current: [site?.img_portada, site?.hero_title, site?.hero_button_text].filter(Boolean).length, total: 3, icon: ImageRoundedIcon },
    { title: "Carrusel", detail: `${carouselCount} de ${capabilities.max_carousel} imágenes`, current: carouselCount, total: capabilities.max_carousel, icon: DesignServicesRoundedIcon },
    { title: "Redes sociales", detail: `${socialCount} de 4 conectadas`, current: socialCount, total: 4, icon: LanguageRoundedIcon },
    { title: "Diseño y frases", detail: `${phrasesCount} de ${capabilities.max_phrases} frases`, current: phrasesCount, total: capabilities.max_phrases, icon: PaletteRoundedIcon },
  ];
  return (
    <Box sx={{ minHeight: "100%", background: "linear-gradient(145deg,#f5f7ff 0%,#f8fafc 45%,#eefbf8 100%)", py: { xs: 2, md: 3 } }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2} sx={{ mb: 3 }}>
          <Box><Typography variant="h4" fontWeight={900}>Sitio Web</Typography><Typography color="text.secondary">Administra la presencia digital de <strong>{selectedBranch?.name || "tu sucursal"}</strong>.</Typography></Box>
          
        </Stack>

        {expired && <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>Tu plan está inactivo o vencido. Renueva tu suscripción para volver a editar el sitio.</Alert>}

        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            { label: "Estado", value: site ? (site.is_active ? "Publicado" : "Pausado") : "Sin publicar", color: site?.is_active ? "#059669" : "#d97706" },
            { label: "Configuración", value: `${progress}%`, color: "#2563eb" },
            { label: "Imágenes", value: `${carouselCount}/${capabilities.max_carousel}`, color: "#7c3aed" },
            { label: "Redes", value: `${socialCount}/4`, color: "#db2777" },
          ].map((metric) => <Grid item xs={6} md={3} key={metric.label}><Card sx={{ p: 2, borderRadius: 3, height: "100%", border: "1px solid rgba(148,163,184,.22)", boxShadow: "0 8px 24px rgba(15,23,42,.06)", position: "relative", overflow: "hidden", "&:before": { content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: metric.color } }}><Typography variant="caption" color="text.secondary" fontWeight={800}>{metric.label}</Typography><Typography variant="h6" fontWeight={900} sx={{ mt: .25, color: metric.color }}>{metric.value}</Typography></Card></Grid>)}
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 3, overflow: "hidden", height: "100%", border: "1px solid rgba(99,102,241,.16)", boxShadow: "0 12px 32px rgba(30,41,59,.08)" }}>
              <Box sx={{ p: 2.25, color: "white", background: "linear-gradient(120deg,#1e293b,#3730a3)" }}><Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography fontWeight={900} color="white" >Resumen de configuración</Typography><Typography variant="body2" sx={{ color: "rgba(255,255,255,.72)" }}>Revisa rápidamente qué está listo.</Typography></Box><Chip label={`Plan ${plan.name}`} size="small" sx={{ color: "white", bgcolor: "rgba(255,255,255,.14)", fontWeight: 800 }} /></Stack></Box>
              <Stack divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}>
                {sections.map((section) => { const Icon = section.icon; const complete = section.current >= section.total; const partial = section.current > 0 && !complete; return <Stack key={section.title} direction="row" alignItems="center" spacing={1.5} sx={{ px: 2.25, py: 1.55, transition: ".2s", "&:hover": { bgcolor: "#f8faff" } }}><Box sx={{ width: 38, height: 38, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: complete ? "#dcfce7" : partial ? "#fef3c7" : "#f1f5f9", color: complete ? "#059669" : partial ? "#d97706" : "text.disabled" }}><Icon fontSize="small" /></Box><Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="body2" fontWeight={850}>{section.title}</Typography><Typography variant="caption" color="text.secondary">{section.detail || "Sin información configurada"}</Typography></Box><Chip icon={complete ? <CheckCircleRoundedIcon /> : undefined} label={complete ? "Listo" : partial ? "En progreso" : "Pendiente"} size="small" color={complete ? "success" : partial ? "warning" : "default"} variant={partial ? "filled" : "outlined"} sx={{ fontWeight: 750 }} /></Stack>; })}
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3, height: "100%", overflow: "hidden", border: "1px solid rgba(20,184,166,.2)", boxShadow: "0 12px 32px rgba(30,41,59,.08)" }}>
              <Box sx={{ height: 150, position: "relative", bgcolor: "#dbeafe", background: site?.img_portada ? `linear-gradient(0deg,rgba(15,23,42,.48),rgba(15,23,42,.05)),url(${site.img_portada}) center/cover` : "linear-gradient(135deg,#1e293b,#0f766e)" }}>
                <Box sx={{ position: "absolute", left: 20, bottom: -25, width: 64, height: 64, borderRadius: 2.5, bgcolor: "white", p: .5, boxShadow: "0 8px 22px rgba(15,23,42,.25)", display: "grid", placeItems: "center", overflow: "hidden" }}>{site?.logo ? <Box component="img" src={site.logo} alt="Logo" sx={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 2 }} /> : <StorefrontRoundedIcon color="disabled" />}</Box>
                <Chip label={site?.img_portada ? "Portada cargada" : "Sin portada"} size="small" sx={{ position: "absolute", right: 14, top: 14, bgcolor: "rgba(255,255,255,.9)", fontWeight: 800 }} />
              </Box>
              <Box sx={{ p: 2.5, pt: 4.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Box><Typography fontWeight={900}>Avance del sitio</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .25 }}>{progress === 100 ? "Tu sitio está completo." : "Completa los elementos pendientes."}</Typography></Box><Typography variant="h4" fontWeight={900} color="primary">{progress}%</Typography></Stack>
              <LinearProgress variant="determinate" value={progress} sx={{ my: 2.5, height: 8, borderRadius: 8 }} />
              <Stack spacing={1.25}>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Sucursal</Typography><Typography variant="body2" fontWeight={800}>{selectedBranch?.name || `#${branchId}`}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Plantilla</Typography><Typography variant="body2" fontWeight={800} textTransform="capitalize">{site?.template || templateFor(planId)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Frases</Typography><Typography variant="body2" fontWeight={800}>{phrasesCount}/{capabilities.max_phrases}</Typography></Stack>
              </Stack>
              <Button fullWidth variant="contained" endIcon={<ArrowForwardRoundedIcon />} disabled={expired} onClick={() => { onSelect?.(planId); setEditorOpen(true); }} sx={{ mt: 3, borderRadius: 2, py: 1.1, textTransform: "none", fontWeight: 800 }}>{site ? "Continuar configurando" : "Comenzar configuración"}</Button>
              <Button fullWidth size="small" onClick={() => navigate("/admin/sucursales")} sx={{ mt: 1, textTransform: "none" }}>Cambiar sucursal</Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <SiteEditorModal
        open={editorOpen}
        onClose={() => !saving && setEditorOpen(false)}
        onSubmit={save}
        defaultValues={site || {}}
        capabilities={capabilities}
        planName={plan.name}
        sampleName={store?.name || selectedBranch?.name || "Mi tienda"}
        template={templateFor(planId)}
        saving={saving}
      />
    </Box>
  );
}
