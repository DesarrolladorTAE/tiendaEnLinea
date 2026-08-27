import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import StorefrontProductHeader from "../../components/storefront/StorefrontProductHeader";
import PublicProductDetail from "../../components/storefront/PublicProductDetail";
import { getPublicStoreProducts, getPublicStorefront, getStorefrontBranches } from "../../services/public/storefrontService";
import "./storefront-themes.css";

const parseObject = (value) => { if (value && typeof value === "object") return value; try { return JSON.parse(value || "{}"); } catch { return {}; } };
const resolveTheme = (value) => { const theme = parseObject(value); const radii = { none: 0, small: 8, medium: 16, large: 28 }; const shadows = { none: "none", soft: "0 10px 30px rgba(15,23,42,.08)", medium: "0 18px 48px rgba(15,23,42,.14)", strong: "0 24px 70px rgba(15,23,42,.22)" }; return { ...theme, radiusValue: radii[theme.radius] ?? 16, shadowValue: shadows[theme.shadow] ?? shadows.soft }; };

export default function PublicProductPage({ customStoreSlug = null }) {
  const { storeSlug: routeStoreSlug, productId } = useParams();
  const storeSlug = customStoreSlug || routeStoreSlug;
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, product: null, site: {}, store: {}, branch: {}, plan: {} });
  useEffect(() => { let alive = true; Promise.all([getPublicStoreProducts(storeSlug), getStorefrontBranches(storeSlug)]).then(async ([productsResponse, branchesResponse]) => { const products = Array.isArray(productsResponse.data) ? productsResponse.data : productsResponse.data?.data || []; const branch = branchesResponse.data?.branches?.[0] || {}; const siteResponse = await getPublicStorefront(branch.slug || storeSlug).catch(() => ({ data: {} })); const payload = siteResponse.data?.sitio ? siteResponse.data : siteResponse.data?.data || siteResponse.data || {}; if (alive) setState({ loading: false, product: products.find((item) => String(item.id) === String(productId)) || null, site: payload.sitio || payload.site || {}, store: payload.store || branchesResponse.data?.store || {}, branch: payload.branch || branch, plan: payload.plan || {} }); }).catch(() => { if (alive) setState((current) => ({ ...current, loading: false })); }); return () => { alive = false; }; }, [storeSlug, productId]);
  if (state.loading) return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  if (!state.product) return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><Typography>Producto no disponible.</Typography></Box>;
  const colors = { primary: "#111827", secondary: "#475569", accent: "#2563eb", background: "#fff", text: "#111827", ...parseObject(state.site.colors) };
  const theme = resolveTheme(state.site.theme); const settings = parseObject(state.site.settings); const storePath = customStoreSlug ? "/" : `/tienda/${storeSlug}`; const advancedAccess = Number(state.plan?.id) === 1 || Number(state.plan?.id) >= 4;
  return <Box className="sf-product-public-page storefront-shell" data-radius={theme.radius || "medium"} data-shadow={theme.shadow || "soft"} data-button={theme.button_style || "rounded"} data-spacing={theme.spacing || "comfortable"} data-width={theme.content_width || "wide"} data-animation={theme.animation || "subtle"} style={{ "--sf-primary": colors.primary, "--sf-secondary": colors.secondary, "--sf-accent": colors.accent, "--sf-background": colors.background, "--sf-text": colors.text, "--sf-radius": `${theme.radiusValue}px`, "--sf-shadow": theme.shadowValue }} sx={{ minHeight: "100vh", bgcolor: colors.background, color: colors.text, fontFamily: state.site.font_family || "Inter, Arial, sans-serif" }}><StorefrontProductHeader site={state.site} store={state.store} branch={state.branch} storePath={storePath} colors={colors} theme={theme} /><PublicProductDetail product={state.product} colors={colors} radius={theme.radiusValue} shadow={theme.shadowValue} legend={settings.product_legend || ""} showShare={advancedAccess && [true, 1, "1", "true"].includes(settings.show_share)} showBack={advancedAccess} onBack={() => navigate(`${storePath}#catalog`)} /></Box>;
}
