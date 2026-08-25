import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Box, Button, Chip, CircularProgress, Container, Dialog, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import FacebookRoundedIcon from "@mui/icons-material/FacebookRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import TiendaNoDisponible from "./TiendaNoDisponible";
import Catalogo from "../shop/Catalogo";
import { getPublicStorefront, getStorefrontBranches } from "../../services/public/storefrontService";
import "./storefront-themes.css";

const DEFAULT_SECTIONS = ["hero", "identity", "catalog", "carousel", "phrases", "socials"];
const parseStructured = (value, fallback) => { if (value && typeof value === "object") return value; try { return typeof value === "string" && value.trim() ? JSON.parse(value) : fallback; } catch { return fallback; } };
const asObject = (value) => { const parsed = parseStructured(value, {}); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}; };
const normalizeSections = (value) => {
  const sections = parseStructured(value, []);
  return Array.isArray(sections) && sections.length
  ? sections.filter((item) => (item?.id || item?.type) && item.visible !== false && item.enabled !== false).sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0)).map((item) => ({ ...item, id: item.id || item.type }))
  : DEFAULT_SECTIONS.map((id) => ({ id, visible: true }));
};

function resolveTheme(value) {
  const theme = asObject(value);
  const radii = { none: 0, small: 8, medium: 16, large: 28 };
  const shadows = { none: "none", soft: "0 10px 30px rgba(15,23,42,.08)", medium: "0 18px 48px rgba(15,23,42,.14)", strong: "0 24px 70px rgba(15,23,42,.22)" };
  const widths = { compact: "960px", normal: "1120px", wide: "1280px", full: "100%" };
  const spaces = { compact: { section: 4, gap: 2 }, comfortable: { section: 7, gap: 3 }, spacious: { section: 11, gap: 4 } };
  return { mode: "light", content_width: "wide", radius: "medium", shadow: "soft", spacing: "comfortable", header_style: "standard", button_style: "rounded", animation: "subtle", ...theme, radiusValue: radii[theme.radius] ?? 16, shadowValue: shadows[theme.shadow] ?? shadows.soft, widthValue: widths[theme.content_width] ?? widths.wide, space: spaces[theme.spacing] ?? spaces.comfortable };
}

function SocialLinks({ social, accent }) {
  const links = [["facebook", FacebookRoundedIcon, "Facebook"], ["instagram", InstagramIcon, "Instagram"], ["twitter", XIcon, "X"], ["tiktok", MusicNoteRoundedIcon, "TikTok"]];
  return <Stack direction="row" spacing={1}>{links.map(([key, Icon, label]) => social?.[key] ? <IconButton key={key} component="a" href={social[key]} target="_blank" rel="noreferrer" aria-label={label} sx={{ color: accent, border: "1px solid currentColor", "&:hover": { bgcolor: accent, color: "white", transform: "translateY(-3px)" } }}><Icon /></IconButton> : null)}</Stack>;
}

function BrandMark({ branding, store, colors, large = false }) {
  return branding.logo
    ? <Box component="img" src={branding.logo} alt={`Logo de ${store.name}`} sx={{ width: large ? 156 : 44, height: large ? 156 : 44, objectFit: "contain", borderRadius: large ? "32%" : 2, bgcolor: "white", p: large ? 1.5 : .4, border: `1px solid ${colors.accent}35` }} />
    : <StorefrontRoundedIcon sx={{ fontSize: large ? 100 : 40, color: colors.accent }} />;
}

function StoreGallery({ images, theme }) {
  const [active, setActive] = useState(0);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [viewerOpen, setViewerOpen] = useState(false);
  const safeImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const maxStart = Math.max(0, safeImages.length - visibleCount);
  const move = (direction) => setActive((current) => direction > 0 ? (current >= maxStart ? 0 : current + 1) : (current <= 0 ? maxStart : current - 1));
  const moveViewer = (direction) => setViewerIndex((current) => (current + direction + safeImages.length) % safeImages.length);

  useEffect(() => { const update = () => setVisibleCount(window.innerWidth < 600 ? 1 : window.innerWidth < 900 ? 2 : window.innerWidth < 1200 ? 3 : 4); update(); window.addEventListener("resize", update); return () => window.removeEventListener("resize", update); }, []);

  useEffect(() => {
    if (safeImages.length < 2 || viewerOpen || theme.animation === "none") return undefined;
    const timer = window.setInterval(() => move(1), theme.animation === "dynamic" ? 3200 : 4800);
    return () => window.clearInterval(timer);
  }, [safeImages.length, viewerOpen, theme.animation, visibleCount]);

  if (!safeImages.length) return null;
  return <>
    <Box className="sf-carousel" sx={{ borderRadius: `${theme.radiusValue}px`, boxShadow: theme.shadowValue }}>
      <Box className="sf-carousel-viewport">
        <Box className="sf-carousel-track" style={{ transform: `translateX(calc(-${active} * (var(--slide-width) + var(--slide-gap))))` }}>
          {safeImages.map((image, index) => <button type="button" key={`${image}-${index}`} className="sf-carousel-card" onClick={() => { setViewerIndex(index); setViewerOpen(true); }} aria-label={`Ampliar imagen ${index + 1}`}><img src={image} alt={`Galería ${index + 1}`} /><span><GridViewRoundedIcon fontSize="small" /> Ver</span></button>)}
        </Box>
      </Box>
      {safeImages.length > 1 && <><IconButton className="sf-carousel-arrow is-prev" onClick={() => move(-1)} aria-label="Imagen anterior"><ChevronLeftRoundedIcon /></IconButton><IconButton className="sf-carousel-arrow is-next" onClick={() => move(1)} aria-label="Imagen siguiente"><ChevronRightRoundedIcon /></IconButton></>}
      <Box className="sf-carousel-counter">{String(Math.min(active + visibleCount, safeImages.length)).padStart(2, "0")} / {String(safeImages.length).padStart(2, "0")}</Box>
      <Stack className="sf-carousel-dots" direction="row" spacing={.75}>{safeImages.slice(0, maxStart + 1).map((_, index) => <button type="button" key={index} className={index === active ? "is-active" : ""} onClick={() => setActive(index)} aria-label={`Mover carrusel a la posición ${index + 1}`} />)}</Stack>
    </Box>
    <Dialog open={viewerOpen} onClose={() => setViewerOpen(false)} fullScreen PaperProps={{ sx: { bgcolor: "rgba(3,6,15,.96)", color: "white" } }}>
      <Box className="sf-lightbox"><IconButton className="sf-lightbox-close" onClick={() => setViewerOpen(false)} aria-label="Cerrar galería"><CloseRoundedIcon /></IconButton><Box component="img" src={safeImages[viewerIndex]} alt={`Galería ampliada ${viewerIndex + 1}`} />{safeImages.length > 1 && <><IconButton className="sf-lightbox-prev" onClick={() => moveViewer(-1)}><ChevronLeftRoundedIcon /></IconButton><IconButton className="sf-lightbox-next" onClick={() => moveViewer(1)}><ChevronRightRoundedIcon /></IconButton></>}<Typography>{viewerIndex + 1} de {safeImages.length}</Typography></Box>
    </Dialog>
  </>;
}

export default function PersonalizacionSitio({ customStoreSlug = null }) {
  const { storeSlug: routeStoreSlug } = useParams();
  const [params, setParams] = useSearchParams();
  const storeSlug = customStoreSlug || routeStoreSlug;
  const [branches, setBranches] = useState([]);
  const [branchSlug, setBranchSlug] = useState(params.get("branch") || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { let alive = true; if (!storeSlug) { setLoading(false); return undefined; } setLoading(true); getStorefrontBranches(storeSlug).then(({ data: response }) => { if (!alive) return; const list = response?.branches || []; setBranches(list); const requested = params.get("branch"); setBranchSlug(list.find((b) => b.slug === requested)?.slug || list[0]?.slug || storeSlug); }).catch(() => { if (alive) setBranchSlug(storeSlug); }); return () => { alive = false; }; }, [storeSlug]);
  useEffect(() => { let alive = true; if (!branchSlug) return undefined; setLoading(true); getPublicStorefront(branchSlug).then(({ data: response }) => { if (alive) setData(response); }).catch(() => { if (alive) setData({ ok: false, expired: true }); }).finally(() => { if (alive) setLoading(false); }); return () => { alive = false; }; }, [branchSlug]);

  const site = data?.sitio || {};
  const theme = useMemo(() => resolveTheme(site.theme), [site.theme]);
  const sections = useMemo(() => normalizeSections(site.sections), [site.sections]);
  if (loading) return <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center" }}><Stack alignItems="center" spacing={2}><CircularProgress /><Typography color="text.secondary">Preparando la tienda…</Typography></Stack></Box>;
  if (!data?.ok || data?.expired) return <TiendaNoDisponible />;

  const store = data.store || {};
  const branch = data.branch || {};
  const branding = site.branding || {};
  const hero = site.hero || {};
  const settings = asObject(site.settings);
  // Los planes conservan sus capacidades, pero comparten la experiencia visual
  // tipo página de Facebook solicitada para el storefront público.
  const template = "negocio";
  const colors = { primary: "#111827", secondary: "#475569", accent: "#2563EB", background: "#FFFFFF", text: "#111827", ...(site.colors || {}) };
  const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const isDark = theme.mode === "dark" || (theme.mode === "auto" && prefersDark);
  const background = colors.background;
  const text = colors.text;
  const card = colors.background;
  const animation = theme.animation === "none" ? "none" : `storefrontReveal ${theme.animation === "dynamic" ? ".8s cubic-bezier(.16,1,.3,1)" : ".5s ease"} both`;
  const sectionSx = { py: theme.space.section, scrollMarginTop: 100 };
  const containerProps = { maxWidth: false, sx: { maxWidth: theme.widthValue, mx: "auto", px: { xs: 2, md: theme.content_width === "full" ? 4 : 3 } } };
  const buttonRadius = theme.button_style === "pill" ? 99 : theme.button_style === "square" ? 0 : theme.radiusValue;

  const Hero = () => {
    const image = branding.cover;
    if (template === "profesional") return <Box component="section" id="hero" className="sf-hero sf-hero--editorial" sx={sectionSx}><Container {...containerProps}><Box className="sf-hero-frame" sx={{ bgcolor: card, borderRadius: `${theme.radiusValue}px`, boxShadow: theme.shadowValue, animation }}><Box className="sf-hero-copy"><Typography className="sf-kicker">{branch.name || "Nueva colección"}</Typography><Typography component="h1">{hero.title || store.name}</Typography>{hero.subtitle && <Typography className="sf-lead">{hero.subtitle}</Typography>}{hero.button_text && <Button component="a" href={hero.button_url || "#catalog"} variant={theme.button_style === "outline" ? "outlined" : "contained"} endIcon={<ArrowForwardRoundedIcon />} sx={{ borderRadius: buttonRadius, bgcolor: theme.button_style === "outline" ? "transparent" : colors.accent, borderColor: colors.accent }}>{hero.button_text}</Button>}</Box>{image && <Box className="sf-hero-visual"><Box component="img" src={image} alt={hero.title || store.name} /></Box>}<Typography className="sf-hero-index">01 / STORY</Typography></Box></Container></Box>;
    if (template === "avanzado") return <Box component="section" id="hero" className="sf-hero sf-hero--immersive" sx={sectionSx}><Container {...containerProps}><Box className="sf-hero-frame" sx={{ borderRadius: `${theme.radiusValue}px`, boxShadow: theme.shadowValue, animation }}><Box className="sf-hero-orb" />{image && <Box className="sf-hero-visual"><Box component="img" src={image} alt={hero.title || store.name} /></Box>}<Box className="sf-hero-copy"><Chip icon={<AutoAwesomeRoundedIcon />} label="Experiencia digital" /><Typography component="h1">{hero.title || store.name}</Typography>{hero.subtitle && <Typography className="sf-lead">{hero.subtitle}</Typography>}{hero.button_text && <Button component="a" href={hero.button_url || "#catalog"} endIcon={<ArrowForwardRoundedIcon />} sx={{ borderRadius: buttonRadius, bgcolor: colors.accent, color: "white" }}>{hero.button_text}</Button>}</Box></Box></Container></Box>;
    return <Box component="section" id="hero" className="sf-hero sf-hero--facebook" sx={{ ...sectionSx, pt: { xs: 2, md: 3 } }}><Container {...containerProps}><Box className="sf-facebook-page" sx={{ bgcolor: card, borderRadius: `${theme.radiusValue}px`, boxShadow: theme.shadowValue, animation }}><Box className="sf-facebook-cover">{image ? <Box component="img" src={image} alt={hero.title || store.name} /> : <Box className="sf-facebook-cover-empty" />}</Box><Box className="sf-facebook-profile"><BrandMark branding={branding} store={store} colors={colors} large /><Box className="sf-facebook-copy"><Typography component="h1">{hero.title || store.name}</Typography><Typography>{hero.subtitle || branch.name}</Typography></Box>{hero.button_text && <Button component="a" href={hero.button_url || "#catalog"} variant="contained" endIcon={<ArrowForwardRoundedIcon />} sx={{ borderRadius: buttonRadius, bgcolor: colors.accent }}>{hero.button_text}</Button>}</Box><Box className="sf-facebook-tabs"><a href="#identity">Información</a><a href="#catalog">Productos</a><a href="#carousel">Galería</a><span>{branch.name}</span></Box></Box></Container></Box>;
  };

  const Identity = () => template === "profesional"
    ? <Box component="section" id="identity" className="sf-identity sf-identity--editorial" sx={sectionSx}><Container {...containerProps}><Box className="sf-identity-mark"><BrandMark branding={branding} store={store} colors={colors} large /></Box><Box><Typography className="sf-kicker">La firma detrás de la tienda</Typography><Typography variant="h2">{store.name}</Typography><Typography className="sf-lead">{hero.subtitle || `Una selección creada desde ${branch.name || "nuestra sucursal"}.`}</Typography></Box></Container></Box>
    : template === "avanzado"
      ? <Box component="section" id="identity" className="sf-identity sf-identity--signal" sx={sectionSx}><Container {...containerProps}><Box className="sf-identity-panel" sx={{ borderRadius: `${theme.radiusValue}px` }}><BrandMark branding={branding} store={store} colors={colors} large /><Box><Typography className="sf-kicker">IDENTIDAD / 02</Typography><Typography variant="h2">{store.name}</Typography><Typography className="sf-lead">{hero.subtitle || `Conectado desde ${branch.name || "nuestra sucursal"}.`}</Typography></Box><Box className="sf-signal"><i /><span>ONLINE</span></Box></Box></Container></Box>
      : <Box component="section" id="identity" className="sf-identity sf-identity--facebook" sx={sectionSx}><Container {...containerProps}><Box className="sf-facebook-about" sx={{ bgcolor: card, borderRadius: `${theme.radiusValue}px`, boxShadow: theme.shadowValue }}><Box><Typography className="sf-kicker">INFORMACIÓN</Typography><Typography variant="h2">Acerca de {store.name}</Typography><Typography className="sf-lead">{hero.subtitle || `Compra fácil y directo en ${branch.name || "nuestra sucursal"}.`}</Typography></Box><Stack spacing={1.25}><Typography fontWeight={900}>Sucursal</Typography><Stack direction="row" spacing={1} alignItems="center"><LocationOnRoundedIcon sx={{ color: colors.accent }} /><Typography>{[branch.address?.line1, branch.address?.city, branch.address?.state].filter(Boolean).join(", ") || branch.name}</Typography></Stack></Stack></Box></Container></Box>;

  const renderers = {
    hero: () => <Hero />,
    identity: () => <Identity />,
    catalog: () => <Box component="section" id="catalog" sx={sectionSx}><Container {...containerProps}><Stack direction="row" justifyContent="space-between" alignItems="end" sx={{ mb: 1 }}><Box><Typography className="sf-kicker">SELECCIÓN / CATÁLOGO</Typography><Typography variant="h2" fontWeight={950}>Encuentra lo tuyo</Typography></Box><GridViewRoundedIcon sx={{ color: colors.accent, fontSize: 34 }} /></Stack></Container><Catalogo storeId={store.id} storeSlug={store.slug || storeSlug} storefrontSettings={settings} storefrontTemplate={template} storefrontTheme={theme} storefrontColors={colors} /></Box>,
    carousel: () => site.carousel?.length ? <Box component="section" id="carousel" sx={sectionSx}><Container {...containerProps}><Stack direction="row" justifyContent="space-between" alignItems="end" sx={{ mb: 2.5 }}><Typography variant="h2" fontWeight={950}>Conoce más sobre {store.name}</Typography><Typography variant="body2" sx={{ opacity: .7 }}>Galería</Typography></Stack><StoreGallery images={site.carousel} theme={theme} /></Container></Box> : null,
    phrases: () => site.phrases?.length ? <Box component="section" id="phrases" sx={sectionSx}><Container {...containerProps}><Stack spacing={2}>{site.phrases.map((phrase, index) => <Typography key={index} className="sf-phrase" sx={{ animation, animationDelay: `${index * 80}ms` }}>“{phrase}”</Typography>)}</Stack></Container></Box> : null,
    socials: () => <Box component="footer" id="socials" sx={{ ...sectionSx, bgcolor: colors.primary, color: "white" }}><Container {...containerProps}><Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={3}><Box><Typography variant="h4" fontWeight={950}>{store.name}</Typography><Stack direction="row" alignItems="center" spacing={.75} sx={{ mt: 1, opacity: .8 }}><LocationOnRoundedIcon fontSize="small" /><Typography variant="body2">{[branch.address?.line1, branch.address?.city, branch.address?.state].filter(Boolean).join(", ") || branch.name}</Typography></Stack></Box><SocialLinks social={site.social} accent="#fff" /></Stack></Container></Box>,
  };

  return <Box className="storefront-shell" data-template={template} data-mode={isDark ? "dark" : "light"} data-header={theme.header_style} data-button={theme.button_style} data-width={theme.content_width} data-animation={theme.animation} data-spacing={theme.spacing} data-radius={theme.radius} data-shadow={theme.shadow} style={{ "--sf-primary": colors.primary, "--sf-secondary": colors.secondary, "--sf-accent": colors.accent, "--sf-background": background, "--sf-text": text, "--sf-radius": `${theme.radiusValue}px`, "--sf-shadow": theme.shadowValue }} sx={{ minHeight: "100vh", bgcolor: background, color: text, fontFamily: site.font_family || "Inter,Arial,sans-serif", scrollBehavior: theme.smooth_scroll === false ? "auto" : "smooth", "@keyframes storefrontReveal": { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "none" } } }}>
    {branches.length > 1 && <Box className="sf-branch-picker"><FormControl size="small"><InputLabel>Sucursal</InputLabel><Select value={branchSlug} label="Sucursal" onChange={(e) => { setBranchSlug(e.target.value); setParams({ branch: e.target.value }); }}>{branches.map((item) => <MenuItem key={item.id} value={item.slug}>{item.name}</MenuItem>)}</Select></FormControl></Box>}
    {sections.map((section) => <React.Fragment key={section.id}>{renderers[section.id]?.()}</React.Fragment>)}
  </Box>;
}
