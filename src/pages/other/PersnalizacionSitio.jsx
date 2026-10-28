import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Chip, Container, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import FacebookRoundedIcon from "@mui/icons-material/FacebookRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import FormatQuoteOutlinedIcon from "@mui/icons-material/FormatQuoteOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import TiendaNoDisponible from "./TiendaNoDisponible";
import Catalogo from "../shop/Catalogo";
import StoreGallery from "../../components/storefront/StoreGallery";
import CustomerSales from "../../components/storefront/CustomerSales";
import { hasCurrentInvoiceComplement } from "../../utils/customerSales";
import PublicProductDetail from "../../components/storefront/PublicProductDetail";
import { getPublicStoreProducts, getPublicStorefront, getStorefrontBranches } from "../../services/public/storefrontService";
import "./storefront-themes.css";
import StorefrontLoading from "../../components/storefront/StorefrontLoading";
import StorefrontMetadata from "../../components/storefront/StorefrontMetadata";
import { getStorefrontBrand, rememberStorefrontBrand } from "../../utils/storefrontBranding";

const DEFAULT_SECTIONS = ["hero", "identity", "catalog", "carousel", "phrases", "socials"];
const parseStructured = (value, fallback) => { if (value && typeof value === "object") return value; try { return typeof value === "string" && value.trim() ? JSON.parse(value) : fallback; } catch { return fallback; } };
const asBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "string") return !["0", "false", "off", "no"].includes(value.trim().toLowerCase());
  return Boolean(value);
};
const asObject = (value) => { const parsed = parseStructured(value, {}); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}; };
const API_ORIGIN = (() => { try { return new URL(import.meta.env.VITE_API_URL || "https://mitiendaenlineamx.com.mx/api").origin; } catch { return "https://mitiendaenlineamx.com.mx"; } })();
const resolveAssetUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  const markdownUrl = value.match(/^\[[^\]]*\]\((https?:\/\/[^)]+)\)$/i)?.[1];
  const clean = markdownUrl || value.trim();
  try { return new URL(clean, API_ORIGIN).href; } catch { return clean; }
};
const normalizeSections = (value) => {
  const sections = parseStructured(value, []);
  return Array.isArray(sections) && sections.length
  ? sections.filter((item) => (item?.id || item?.type) && asBoolean(item.visible ?? item.enabled, true)).sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0)).map((item) => ({ ...item, id: item.id || item.type, visible: true }))
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

export default function PersonalizacionSitio({ customStoreSlug = null }) {
  const { storeSlug: routeStoreSlug, productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const storeSlug = customStoreSlug || routeStoreSlug;
  const requestedBranch = params.get("branch") || "";
  const [branches, setBranches] = useState([]);
  const [branchSlug, setBranchSlug] = useState(params.get("branch") || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadingBrand, setLoadingBrand] = useState(null);
  const [activeSection, setActiveSection] = useState("catalog");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  useEffect(() => {
    if (!location.hash) { setActiveSection("catalog"); return undefined; }
    const section = location.hash.slice(1);
    setActiveSection(section);
    const frame = window.requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView({ block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.search]);

  useEffect(() => {
    const controller = new AbortController();
    const config = { signal: controller.signal, timeout: 15000 };
    setLoading(true);
    setLoadError("");
    setData(null);

    async function loadStorefront() {
      try {
        if (!storeSlug) return;
        let list = [];
        try {
          const { data: response } = await getStorefrontBranches(storeSlug, config);
          if (controller.signal.aborted) return;
          const payload = response?.data || response;
          list = Array.isArray(payload?.branches) ? payload.branches : [];
          const brand = getStorefrontBrand(payload);
          if (brand.logo) setLoadingBrand({ slug: storeSlug, branch: requestedBranch, brand });
        } catch {
          if (controller.signal.aborted) return;
          // The store endpoint also resolves slugs when branch discovery fails.
        }
        const resolvedBranch = list.find((branch) => branch.slug === requestedBranch)?.slug || list[0]?.slug || requestedBranch || storeSlug;
        setBranches(list);
        setBranchSlug(resolvedBranch);
        // Fetch in this same lifecycle, even if resolvedBranch did not change.
        const { data: response } = await getPublicStorefront(resolvedBranch, config);
        if (controller.signal.aborted) return;
        const payload = response?.sitio || response?.store ? response : response?.data || response;
        setData(payload);
        const brand = rememberStorefrontBrand(storeSlug, requestedBranch, payload);
        setLoadingBrand({ slug: storeSlug, branch: requestedBranch, brand });
      } catch (error) {
        if (controller.signal.aborted) return;
        if ([403, 404].includes(error.response?.status)) setData({ ok: false });
        else setLoadError(error.code === "ECONNABORTED" || error.code === "ETIMEDOUT"
          ? "La tienda tardó demasiado en responder. Vuelve a intentarlo."
          : "No pudimos conectar con la tienda. Revisa tu conexión y vuelve a intentarlo.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadStorefront();
    return () => controller.abort();
  }, [storeSlug, requestedBranch, loadAttempt]);
  useEffect(() => { let alive = true; if (!productId || !storeSlug) { setSelectedProduct(null); setProductLoading(false); return undefined; } setProductLoading(true); getPublicStoreProducts(storeSlug).then(({ data: response }) => { if (!alive) return; const products = Array.isArray(response) ? response : response?.data || []; setSelectedProduct(products.find((product) => String(product.id) === String(productId)) || null); }).catch(() => { if (alive) setSelectedProduct(null); }).finally(() => { if (alive) setProductLoading(false); }); return () => { alive = false; }; }, [productId, storeSlug]);

  const site = data?.sitio || data?.site || {};
  const theme = useMemo(() => resolveTheme(site.theme), [site.theme]);
  const sections = useMemo(() => normalizeSections(site.sections), [site.sections]);
  if (loading) return <StorefrontLoading storeSlug={storeSlug} brand={loadingBrand?.slug === storeSlug && loadingBrand.branch === (params.get("branch") || "") ? loadingBrand.brand : undefined} />;
  if (loadError) return <Container maxWidth="sm" sx={{ py: 8 }}><Stack spacing={2}><Typography variant="h5" fontWeight={800}>No pudimos cargar la tienda</Typography><Alert severity="error">{loadError}</Alert><Button variant="contained" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Reintentar</Button></Stack></Container>;
  if (!data?.ok || data?.expired) return <TiendaNoDisponible />;

  const store = data.store || {};
  const branch = data.branch || {};
  const rawBranding = asObject(site.branding);
  const branding = {
    logo: getStorefrontBrand(data).logo,
    cover: resolveAssetUrl(rawBranding.cover || rawBranding.img_portada || site.img_portada || data.img_portada),
  };
  const identity = site.identity || {};
  const hero = site.hero || {};
  const rawSettings = asObject(site.settings);
  const planId = Number(data?.plan?.id || 2);
  const professionalAccess = planId === 1 || planId >= 3;
  const advancedAccess = planId === 1 || planId >= 4;
  const sectionOrder = Array.isArray(rawSettings.section_order) ? rawSettings.section_order : [];
  const sectionVisibility = asObject(rawSettings.section_visibility);
  const hasGallery = Array.isArray(site.carousel) && site.carousel.some(Boolean);
  const hasPhrases = Array.isArray(site.phrases) && site.phrases.some((phrase) => String(phrase || "").trim());
  const hasHero = [hero.title, hero.subtitle, hero.button_text]
    .some((value) => String(value || "").trim());
  const hasIdentity = [identity.title, identity.description, site.titulo_1, site.descripcion]
    .some((value) => String(value || "").trim());
  const hasSocials = [site.social?.facebook, site.social?.instagram, site.social?.twitter, site.social?.tiktok]
    .some((value) => String(value || "").trim());
  const publicComplements = data.complementos ?? store.complementos;
  const publicInvoiceAccess = data.capabilities?.autofacturacion ?? data.plan?.capabilities?.autofacturacion;
  const savedExpiry = rawSettings.customer_sales_expires_at;
  const savedExpiryTime = savedExpiry ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(savedExpiry) ? savedExpiry + "T23:59:59.999" : savedExpiry).getTime() : Infinity;
  const hasLiveInvoiceAccess = publicInvoiceAccess !== undefined || publicComplements !== undefined;
  const customerSalesEnabled = (hasLiveInvoiceAccess || Date.now() <= savedExpiryTime) && planId >= 3 && asBoolean(rawSettings.customer_sales_enabled)
    && (publicComplements === undefined || hasCurrentInvoiceComplement(publicComplements))
    && (publicInvoiceAccess === undefined || asBoolean(publicInvoiceAccess));
  const publicSections = [...sections.filter((section) => section.id !== "customer_sales"), ...(customerSalesEnabled ? [{ id: "customer_sales", visible: true }] : [])];
  const sectionsForPlan = publicSections.filter((section) => {
    if (section.id === "socials" && !advancedAccess) return false;
    if (section.id === "hero" && !hasHero) return false;
    if (section.id === "identity" && !hasIdentity) return false;
    if (section.id === "socials" && !hasSocials) return false;
    if (planId === 2 && !["catalog", "carousel", "phrases"].includes(section.id)) return false;
    if (section.id === "carousel" && !hasGallery) return false;
    if (section.id === "phrases" && !hasPhrases) return false;
    if (sectionVisibility[section.id] !== undefined && !asBoolean(sectionVisibility[section.id], true)) return false;
    return true;
  }).sort((a, b) => {
    const aIndex = sectionOrder.indexOf(a.id);
    const bIndex = sectionOrder.indexOf(b.id);
    return (aIndex < 0 ? 999 : aIndex) - (bIndex < 0 ? 999 : bIndex);
  });
  const freeSorts = ["newest", "oldest", "name_asc", "name_desc"];
  const professionalSorts = [...freeSorts, "price_asc", "price_desc", "stock_desc"];
  const requestedColumns = Number(rawSettings.catalog_columns || 3);
  const requestedPageSize = Number(rawSettings.products_per_page || 12);
  const requestedSort = rawSettings.product_sort || "newest";
  const settings = {
    ...rawSettings,
    navigation_mode: professionalAccess ? (rawSettings.navigation_mode || "landing") : "landing",
    product_view: professionalAccess ? (rawSettings.product_view || "modal") : "modal",
    show_share: advancedAccess && asBoolean(rawSettings.show_share),
    product_legend: professionalAccess ? (rawSettings.product_legend || "") : "",
    phrase_style: professionalAccess ? (rawSettings.phrase_style || "editorial") : "minimal",
    phrase_alignment: professionalAccess ? (rawSettings.phrase_alignment || "alternating") : "left",
    advanced_hero: advancedAccess && asBoolean(rawSettings.advanced_hero),
    variant_search_enabled: professionalAccess && asBoolean(rawSettings.variant_search_enabled),
    catalog_columns: professionalAccess ? Math.min(4, requestedColumns) : Math.min(3, requestedColumns),
    products_per_page: advancedAccess ? Math.min(48, requestedPageSize) : professionalAccess ? Math.min(24, requestedPageSize) : 12,
    product_sort: (professionalAccess ? professionalSorts : freeSorts).includes(requestedSort) ? requestedSort : "newest",
    show_sort_selector: advancedAccess && asBoolean(rawSettings.show_sort_selector),
  };
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
  const isSalesPage = !productId && customerSalesEnabled && (params.get("vista") === "compras" || location.hash === "#customer_sales");
  const isGalleryPage = !productId && !isSalesPage && sectionsForPlan.some((section) => section.id === "carousel") && (params.get("vista") === "galeria" || location.hash === "#carousel");
  const activePageSection = isSalesPage ? "customer_sales" : isGalleryPage ? "carousel" : null;
  const pageHref = (section) => {
    const nextParams = new URLSearchParams(location.search);
    nextParams.delete("vista");
    if (section === "customer_sales") nextParams.set("vista", "compras");
    if (section === "carousel") nextParams.set("vista", "galeria");
    const query = nextParams.toString();
    return `${customStoreSlug ? "/" : `/tienda/${storeSlug}`}${query ? `?${query}` : ""}#${section}`;
  };

  const FacebookHeader = () => {
    const image = branding.cover;
    if (template === "profesional") return <Box component="section" id="hero" className="sf-hero sf-hero--editorial" sx={sectionSx}><Container {...containerProps}><Box className="sf-hero-frame" sx={{ bgcolor: card, borderRadius: `${theme.radiusValue}px`, boxShadow: theme.shadowValue, animation }}><Box className="sf-hero-copy"><Typography className="sf-kicker">{branch.name || "Nueva colección"}</Typography><Typography component="h1">{hero.title || store.name}</Typography>{hero.subtitle && <Typography className="sf-lead">{hero.subtitle}</Typography>}{hero.button_text && <Button component="a" href={hero.button_url || "#catalog"} variant={theme.button_style === "outline" ? "outlined" : "contained"} endIcon={<ArrowForwardRoundedIcon />} sx={{ borderRadius: buttonRadius, bgcolor: theme.button_style === "outline" ? "transparent" : colors.accent, borderColor: colors.accent }}>{hero.button_text}</Button>}</Box>{image && <Box className="sf-hero-visual"><Box component="img" src={image} alt={hero.title || store.name} /></Box>}<Typography className="sf-hero-index">01 / STORY</Typography></Box></Container></Box>;
    if (template === "avanzado") return <Box component="section" id="hero" className="sf-hero sf-hero--immersive" sx={sectionSx}><Container {...containerProps}><Box className="sf-hero-frame" sx={{ borderRadius: `${theme.radiusValue}px`, boxShadow: theme.shadowValue, animation }}><Box className="sf-hero-orb" />{image && <Box className="sf-hero-visual"><Box component="img" src={image} alt={hero.title || store.name} /></Box>}<Box className="sf-hero-copy"><Chip icon={<AutoAwesomeRoundedIcon />} label="Experiencia digital" /><Typography component="h1">{hero.title || store.name}</Typography>{hero.subtitle && <Typography className="sf-lead">{hero.subtitle}</Typography>}{hero.button_text && <Button component="a" href={hero.button_url || "#catalog"} endIcon={<ArrowForwardRoundedIcon />} sx={{ borderRadius: buttonRadius, bgcolor: colors.accent, color: "white" }}>{hero.button_text}</Button>}</Box></Box></Container></Box>;
    const linkLabels = { hero: "Conócenos", identity: "Información", catalog: "Productos", carousel: "Galería", phrases: "Mensajes", socials: "Redes", customer_sales: "Mis Compras" };
    const linkIcons = { hero: StorefrontOutlinedIcon, identity: InfoOutlinedIcon, catalog: Inventory2OutlinedIcon, carousel: PhotoLibraryOutlinedIcon, phrases: FormatQuoteOutlinedIcon, socials: ShareOutlinedIcon, customer_sales: ReceiptLongOutlinedIcon };
    const heroLinks = sectionsForPlan.filter((section) => linkLabels[section.id]).map((section) => { const Icon = linkIcons[section.id]; return { id: section.id, label: linkLabels[section.id], icon: <Icon fontSize="small" aria-hidden="true" /> }; });
    const identityTitle = identity.title || site.titulo_1 || hero.title || store.name;
    const identityDescription = identity.description || site.descripcion || hero.subtitle || "";
    return <Box component="header" className="sf-hero sf-hero--facebook" sx={{ ...sectionSx, pt: { xs: 2, md: 3 } }}><Container {...containerProps}><Box className="sf-facebook-page" sx={{ bgcolor: card, borderRadius: `${theme.radiusValue}px`, boxShadow: theme.shadowValue, animation }}><Box className="sf-facebook-cover">{image ? <Box component="img" src={image} alt={identityTitle} /> : <Box className="sf-facebook-cover-empty" />}</Box><Box className="sf-facebook-profile"><BrandMark branding={branding} store={store} colors={colors} large /><Box className="sf-facebook-copy"><Typography component="h1">{identityTitle}</Typography>{identityDescription && <Typography>{identityDescription}</Typography>}</Box></Box>{heroLinks.length > 0 && <Box className="sf-facebook-tabs">{heroLinks.map((link) => <a key={link.id} href={pageHref(link.id)} aria-current={!productId && (activePageSection ? link.id === activePageSection : settings.navigation_mode === "tabs" && activeSection === link.id) ? "page" : undefined} className={!productId && (activePageSection ? link.id === activePageSection : settings.navigation_mode === "tabs" && activeSection === link.id) ? "is-active" : ""} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); setActiveSection(link.id); navigate(pageHref(link.id)); }}>{link.icon}{link.label}</a>)}<span>{branch.name}</span></Box>}</Box></Container></Box>;
  };

  const FeaturedIdentity = () => {
    if (!professionalAccess || (!hero.title && !hero.subtitle && !hero.button_text)) return null;
    const carouselImages = Array.isArray(site.carousel) ? site.carousel.filter(Boolean).slice(0, 2).map(resolveAssetUrl) : [];
    const featuredImages = carouselImages.length ? carouselImages : (branding.cover ? [branding.cover] : []);
    return <Box component="section" id="hero" className="sf-hero sf-hero--editorial sf-featured-identity" sx={sectionSx}><Container {...containerProps}><Box className="sf-hero-frame" sx={{ bgcolor: card, borderRadius: `${theme.radiusValue}px`, boxShadow: theme.shadowValue, animation }}><Box className="sf-hero-copy"><Typography className="sf-kicker">CONÓCENOS</Typography>{hero.title && <Typography component="h2">{hero.title}</Typography>}{hero.subtitle && <Typography className="sf-lead">{hero.subtitle}</Typography>}{advancedAccess && hero.button_text && <Button component="a" href={hero.button_url || "#catalog"} variant="contained" endIcon={<ArrowForwardRoundedIcon />} sx={{ borderRadius: buttonRadius, bgcolor: colors.accent }}>{hero.button_text}</Button>}</Box>{featuredImages.length > 0 && <Box className={`sf-featured-media sf-featured-media--${featuredImages.length}`}>{featuredImages.map((image, index) => <Box component="img" key={`${image}-${index}`} src={image} alt={`Conoce ${store.name} ${index + 1}`} />)}</Box>}</Box></Container></Box>;
  };

  const Identity = () => template === "profesional"
    ? <Box component="section" id="identity" className="sf-identity sf-identity--editorial" sx={sectionSx}><Container {...containerProps}><Box className="sf-identity-mark"><BrandMark branding={branding} store={store} colors={colors} large /></Box><Box><Typography className="sf-kicker">La firma detrás de la tienda</Typography><Typography variant="h2">{store.name}</Typography><Typography className="sf-lead">{hero.subtitle || `Una selección creada desde ${branch.name || "nuestra sucursal"}.`}</Typography></Box></Container></Box>
    : template === "avanzado"
      ? <Box component="section" id="identity" className="sf-identity sf-identity--signal" sx={sectionSx}><Container {...containerProps}><Box className="sf-identity-panel" sx={{ borderRadius: `${theme.radiusValue}px` }}><BrandMark branding={branding} store={store} colors={colors} large /><Box><Typography className="sf-kicker">IDENTIDAD / 02</Typography><Typography variant="h2">{store.name}</Typography><Typography className="sf-lead">{hero.subtitle || `Conectado desde ${branch.name || "nuestra sucursal"}.`}</Typography></Box><Box className="sf-signal"><i /><span>ONLINE</span></Box></Box></Container></Box>
      : <Box component="section" id="identity" className="sf-identity sf-identity--facebook" sx={sectionSx}><Container {...containerProps}><Box className="sf-facebook-about" sx={{ bgcolor: card, borderRadius: `${theme.radiusValue}px`, boxShadow: theme.shadowValue }}><Box><Typography className="sf-kicker">INFORMACIÓN</Typography><Typography variant="h2">Acerca de {store.name}</Typography><Typography className="sf-lead">{hero.subtitle || `Compra fácil y directo en ${branch.name || "nuestra sucursal"}.`}</Typography></Box><Stack spacing={1.25}><Typography fontWeight={900}>Sucursal</Typography><Stack direction="row" spacing={1} alignItems="center"><LocationOnRoundedIcon sx={{ color: colors.accent }} /><Typography>{[branch.address?.line1, branch.address?.city, branch.address?.state].filter(Boolean).join(", ") || branch.name}</Typography></Stack></Stack></Box></Container></Box>;

  const renderers = {
    customer_sales: () => <Box component="main" id="customer_sales" sx={sectionSx}><Container {...containerProps}><CustomerSales key={store.slug || storeSlug} storeSlug={store.slug || storeSlug} colors={colors} storefrontTheme={{ ...theme, mode: isDark ? "dark" : "light" }} fontFamily={site.font_family} onBack={() => navigate(pageHref("catalog"))} /></Container></Box>,
    hero: () => <FeaturedIdentity />,
    identity: () => <Identity />,
    catalog: () => <Box component="section" id="catalog" sx={sectionSx}><Container {...containerProps}><Stack direction="row" justifyContent="space-between" alignItems="end" sx={{ mb: 1 }}><Box><Typography className="sf-kicker">SELECCIÓN / CATÁLOGO</Typography><Typography variant="h2" fontWeight={950}>Encuentra lo tuyo</Typography></Box><GridViewRoundedIcon sx={{ color: colors.accent, fontSize: 34 }} /></Stack></Container><Catalogo storeId={store.id} storeSlug={store.slug || storeSlug} storefrontSettings={settings} storefrontTemplate={template} storefrontTheme={theme} storefrontColors={colors} storefrontBrand={getStorefrontBrand(data)} /></Box>,
    carousel: () => <Box component="main" id="carousel" sx={sectionSx}><Container {...containerProps}><StoreGallery key={branchSlug} images={(site.carousel || []).map(resolveAssetUrl).filter(Boolean)} theme={theme} colors={colors} storeName={store.name} fontFamily={site.font_family} onBack={() => navigate(pageHref("catalog"))} /></Container></Box>,
    phrases: () => site.phrases?.filter(Boolean).length ? <Box component="section" id="phrases" className={`sf-phrases sf-phrases--${settings.phrase_style}`} data-align={settings.phrase_alignment} sx={sectionSx}><Container {...containerProps}><Stack spacing={2}>{site.phrases.filter(Boolean).map((phrase, index) => <Typography key={index} className="sf-phrase" sx={{ animation, animationDelay: `${index * 80}ms` }}>“{phrase}”</Typography>)}</Stack></Container></Box> : null,
    socials: () => <Box component="footer" id="socials" sx={{ ...sectionSx, bgcolor: colors.primary, color: "white" }}><Container {...containerProps}><Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={3}><Box><Typography variant="h4" fontWeight={950}>{store.name}</Typography><Stack direction="row" alignItems="center" spacing={.75} sx={{ mt: 1, opacity: .8 }}><LocationOnRoundedIcon fontSize="small" /><Typography variant="body2">{[branch.address?.line1, branch.address?.city, branch.address?.state].filter(Boolean).join(", ") || branch.name}</Typography></Stack></Box><SocialLinks social={site.social} accent="#fff" /></Stack></Container></Box>,
  };

  return <Box className="storefront-shell" data-page={isSalesPage ? "customer-sales" : isGalleryPage ? "gallery" : "store"} data-template={template} data-mode={isDark ? "dark" : "light"} data-navigation={settings.navigation_mode || "landing"} data-advanced-hero={asBoolean(settings.advanced_hero) ? "true" : "false"} data-header={theme.header_style} data-button={theme.button_style} data-width={theme.content_width} data-animation={theme.animation} data-spacing={theme.spacing} data-radius={theme.radius} data-shadow={theme.shadow} style={{ "--sf-primary": colors.primary, "--sf-secondary": colors.secondary, "--sf-accent": colors.accent, "--sf-background": background, "--sf-text": text, "--sf-radius": `${theme.radiusValue}px`, "--sf-shadow": theme.shadowValue }} sx={{ minHeight: "100vh", bgcolor: background, color: text, fontFamily: site.font_family || "Inter,Arial,sans-serif", scrollBehavior: asBoolean(theme.smooth_scroll, true) ? "smooth" : "auto", "@keyframes storefrontReveal": { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "none" } } }}>
    {branches.length > 1 && <Box className="sf-branch-picker"><FormControl size="small"><InputLabel>Sucursal</InputLabel><Select value={branchSlug} label="Sucursal" onChange={(e) => { setBranchSlug(e.target.value); setParams((current) => { const next = new URLSearchParams(current); next.set("branch", e.target.value); return next; }); }}>{branches.map((item) => <MenuItem key={item.id} value={item.slug}>{item.name}</MenuItem>)}</Select></FormControl></Box>}
    <StorefrontMetadata payload={data} product={productId && !productLoading ? selectedProduct : null} />
    <FacebookHeader />
    {productId ? (productLoading ? <StorefrontLoading storeSlug={storeSlug} brand={getStorefrontBrand(data)} compact /> : selectedProduct ? <PublicProductDetail product={selectedProduct} colors={colors} radius={theme.radiusValue} shadow={theme.shadowValue} legend={settings.product_legend || ""} showShare={advancedAccess && settings.show_share} showBack={advancedAccess} onBack={() => navigate(customStoreSlug ? "/#catalog" : `/tienda/${storeSlug}#catalog`)} /> : <Box sx={{ minHeight: 420, display: "grid", placeItems: "center" }}><Typography>Producto no disponible.</Typography></Box>) : isSalesPage ? renderers.customer_sales() : isGalleryPage ? renderers.carousel() : sectionsForPlan.filter((section) => section.id !== "customer_sales" && section.id !== "carousel" && (settings.navigation_mode !== "tabs" || section.id === activeSection)).map((section) => <React.Fragment key={section.id}>{renderers[section.id]?.()}</React.Fragment>)}
  </Box>;
}
