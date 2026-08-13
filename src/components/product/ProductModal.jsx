// src/components/shop/ProductModal.jsx
import PropTypes from "prop-types";
import React from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Stack,
  Chip,
  Button,
  Divider,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import StyleRoundedIcon from "@mui/icons-material/StyleRounded";

const DEFAULT_IMG = "/assets/img/defaultproduct.png";

/* Helper: usa CSS vars con fallback (string) para sx */
const V = (name, fallback) => `var(${name}, ${fallback})`;

/* Paleta basada en variables del tema */
const PALETTE = {
  bg1: V("--void-1", "#0f1318"),
  bg2: V("--void-2", "#0b0e12"),
  bg3: V("--void-3", "#121822"),

  stroke: V("--void-stroke", "rgba(255,255,255,0.10)"),
  shadow: V("--void-shadow", "rgba(0,0,0,0.65)"),

  txt: V("--void-text", "#EAF0FF"),
  muted: V("--void-muted", "rgba(234,240,255,0.68)"),

  accent: V("--void-accent", "#7DD3FC"),
  pop: V("--void-pop", "#FBCFE8"),
  warn: V("--void-warn", "#FB7185"),

  accentSoft: `color-mix(in srgb, ${V("--void-accent", "#7DD3FC")} 16%, transparent)`,
  popSoft: `color-mix(in srgb, ${V("--void-pop", "#FBCFE8")} 16%, transparent)`,
  warnSoft: `color-mix(in srgb, ${V("--void-warn", "#FB7185")} 16%, transparent)`,
  glow: `0 10px 38px color-mix(in srgb, ${V("--void-accent", "#7DD3FC")} 35%, transparent)`,
};

function normalizeImages(value) {
  const arr = Array.isArray(value)
    ? value
    : typeof value === "string" && value.trim() !== ""
      ? [value.trim()]
      : [];
  const clean = arr.filter(Boolean).slice(0, 6);
  return clean.length ? clean : [DEFAULT_IMG];
}

function onImgError(e) {
  if (e.currentTarget.dataset.fallback !== "1") {
    e.currentTarget.src = DEFAULT_IMG;
    e.currentTarget.dataset.fallback = "1";
  }
}

function formatFechaMX(v) {
  const d = new Date(v);
  if (isNaN(d)) return "";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function normalizeAttrs(attrs) {
  const arr = Array.isArray(attrs) ? attrs : [];
  return arr
    .map((a) => ({
      name: String(a?.name ?? "").trim(),
      value: String(a?.value ?? "").trim(),
    }))
    .filter((x) => x.name || x.value);
}

function pickOptionLabel(v) {
  const name = String(v?.name ?? "").trim();
  if (name) return name;
  const sku = String(v?.sku ?? "").trim();
  if (sku) return sku;
  return `Opción #${v?.id}`;
}

function buildOptionButtonLabel(v) {
  const attrs = Array.isArray(v?.variant_attributes)
    ? v.variant_attributes
    : Array.isArray(v?.attributes)
      ? v.attributes
      : [];

  const sizeAttr = attrs.find((a) => {
    const n = String(a?.name ?? "").toLowerCase();
    return (
      n === "talla" || n === "size" || n.includes("talla") || n.includes("size")
    );
  });

  const sizeVal = String(sizeAttr?.value ?? "").trim();
  if (sizeVal) return sizeVal.toUpperCase();

  const first = attrs.find((a) => String(a?.value ?? "").trim() !== "");
  const firstVal = String(first?.value ?? "").trim();
  if (firstVal)
    return firstVal.length <= 12 ? firstVal : firstVal.slice(0, 12) + "…";

  const n = String(v?.name ?? "").trim();
  if (n && n.length <= 12) return n;

  return "Opción";
}

function money(n) {
  const x = Number(n) || 0;
  return x.toFixed(2);
}

function getOptionTotalStock(v, useWh) {
  if (!v) return 0;
  if (
    useWh &&
    Array.isArray(v?.warehouse_stocks) &&
    v.warehouse_stocks.length
  ) {
    return v.warehouse_stocks.reduce((a, r) => a + (Number(r?.stock) || 0), 0);
  }
  return Number(v?.stock) || 0;
}

function computeEffectiveUnitPrice({ hasOptions, product, selectedOption }) {
  const discount = Number(product?.discount) || 0;
  const base = hasOptions
    ? Number(selectedOption?.price ?? product?.price ?? 0)
    : Number(product?.price ?? 0);

  const out = discount > 0 ? base * (1 - discount / 100) : base;
  return Number(out.toFixed(2));
}

/**
 * ✅ Título del bloque (sale de atributos dominantes)
 * Ej: "Tamaño", "Color", "Presentación", etc.
 */
function guessOptionsTitle(variants) {
  const map = new Map(); // name -> count
  (variants || []).forEach((v) => {
    const attrs = normalizeAttrs(v?.variant_attributes || v?.attributes);
    attrs.forEach((a) => {
      if (!a.name) return;
      const key = a.name.trim();
      map.set(key, (map.get(key) || 0) + 1);
    });
  });

  if (!map.size) return "Opciones";

  const arr = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  const [topName, topCount] = arr[0];
  if (topCount >= Math.max(2, Math.floor((variants.length || 0) * 0.6)))
    return topName;
  return "Opciones";
}

function countWarehousesWithStockFromOption(option) {
  const rows = Array.isArray(option?.warehouse_stocks)
    ? option.warehouse_stocks
    : [];
  return rows.filter((r) => (Number(r?.stock) || 0) > 0).length;
}

function countWarehousesWithStockFromProduct(product) {
  const rows = Array.isArray(product?.warehouse_inventories)
    ? product.warehouse_inventories
    : [];
  return rows.filter((r) => (Number(r?.qty ?? r?.stock) || 0) > 0).length;
}

export default function ProductModal({
  product,
  images: imagesProp,
  currency,
  finalProductPrice, // legacy (simple)
  finalDiscountedPrice, // legacy (simple)
  discountedPrice, // legacy (simple)
  show,
  onHide,
  onWhatsapp,
}) {
  const symbol = currency?.currencySymbol ?? "MX$";

  const storeId = Number(
    product?.store_id ?? product?.store?.id ?? product?.storeId,
  );

  const isStore464 = storeId === 464;

  const hasOptions =
    Boolean(product?.has_variants) ||
    (Array.isArray(product?.variants) && product.variants.length > 0);

  const useWh = Boolean(product?.use_warehouse_inventory);

  // ✅ imágenes SOLO del producto
  const productImages = React.useMemo(() => {
    const fromProp = normalizeImages(imagesProp);
    if (fromProp.length && fromProp[0] !== DEFAULT_IMG) return fromProp;
    return normalizeImages(product?.image);
  }, [imagesProp, product]);

  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    if (show) setIndex(0);
  }, [show]);

  const next = React.useCallback(
    () => setIndex((i) => (i + 1) % productImages.length),
    [productImages.length],
  );
  const prev = React.useCallback(
    () =>
      setIndex((i) => (i - 1 + productImages.length) % productImages.length),
    [productImages.length],
  );

  React.useEffect(() => {
    if (!show) return;
    const h = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [show, next, prev]);

  // ✅ categorías
  const categoryNames = React.useMemo(() => {
    const legacy = Array.isArray(product?.category) ? product.category : [];
    const fromNew = Array.isArray(product?.categories)
      ? product.categories.map((c) => c?.name).filter(Boolean)
      : [];
    const merged = [...legacy, ...fromNew]
      .map((x) => String(x))
      .filter(Boolean);
    return Array.from(new Set(merged));
  }, [product]);

  // ✅ opciones
  const options = React.useMemo(() => {
    const arr = Array.isArray(product?.variants) ? product.variants : [];
    return arr.filter((v) => v?.is_active !== false);
  }, [product]);

  const optionsTitle = React.useMemo(
    () => guessOptionsTitle(options),
    [options],
  );

  const [selectedOptionId, setSelectedOptionId] = React.useState("");

  React.useEffect(() => {
    if (!show) return;
    if (hasOptions) {
      const first = options[0] || null;
      setSelectedOptionId(first ? String(first.id) : "");
    } else {
      setSelectedOptionId("");
    }
  }, [show, hasOptions, options]);

  const selectedOption = React.useMemo(() => {
    if (!selectedOptionId) return null;
    return (
      options.find((v) => String(v.id) === String(selectedOptionId)) || null
    );
  }, [options, selectedOptionId]);

  const selectedOptionLabel = React.useMemo(() => {
    return selectedOption ? pickOptionLabel(selectedOption) : "";
  }, [selectedOption]);

  const selectedOptionAttrs = React.useMemo(() => {
    return normalizeAttrs(
      selectedOption?.variant_attributes || selectedOption?.attributes,
    );
  }, [selectedOption]);

  // ✅ imagen opción aparte
  const optionImage = React.useMemo(() => {
    const vimg = selectedOption?.image_url || selectedOption?.image || null;
    if (vimg && typeof vimg === "string") return vimg;
    return null;
  }, [selectedOption]);

  // ✅ stock totals
  const optionStockTotal = React.useMemo(() => {
    if (!selectedOption) return 0;
    return getOptionTotalStock(selectedOption, useWh);
  }, [selectedOption, useWh]);

  const productStockTotal = React.useMemo(() => {
    if (useWh && !hasOptions) {
      return countWarehousesWithStockFromProduct(product) > 0
        ? Array.isArray(product?.warehouse_inventories)
          ? product.warehouse_inventories.reduce(
              (a, r) => a + (Number(r?.qty ?? r?.stock) || 0),
              0,
            )
          : 0
        : 0;
    }
    return Number(product?.stock) || 0;
  }, [useWh, hasOptions, product]);

  // ✅ texto multi-almacén (sin pedir seleccionar)
  const availabilityText = React.useMemo(() => {
    if (!useWh) return null;

    let count = 0;
    if (hasOptions) {
      count = selectedOption
        ? countWarehousesWithStockFromOption(selectedOption)
        : 0;
    } else {
      count = countWarehousesWithStockFromProduct(product);
    }

    if (count >= 2) return "Disponible en más de un almacén";
    if (count === 1) return "Disponible en 1 almacén";
    return "Sin disponibilidad en almacenes";
  }, [useWh, hasOptions, selectedOption, product]);

  // ✅ precios
  const effectiveUnitPrice = React.useMemo(() => {
    return computeEffectiveUnitPrice({ hasOptions, product, selectedOption });
  }, [hasOptions, product, selectedOption]);

  const baseOptionPrice = React.useMemo(() => {
    return Number(selectedOption?.price ?? product?.price ?? 0);
  }, [selectedOption, product]);

  // ✅ Agregar: catálogo (NO forzar almacén)
  const canAdd = React.useMemo(() => {
    if (hasOptions) return Boolean(selectedOptionId) && optionStockTotal > 0;
    return productStockTotal > 0;
  }, [hasOptions, selectedOptionId, optionStockTotal, productStockTotal]);

  const handleAdd = () => {
    if (!product?.id) return;

    const productId = Number(product.id);
    const variant_id =
      hasOptions && selectedOptionId ? Number(selectedOptionId) : null;

    const display_name = hasOptions
      ? `${product?.name} — ${selectedOptionLabel}`
      : `${product?.name}`;

    onWhatsapp?.({
      cart_key: hasOptions ? `p${productId}-o${variant_id}` : `p${productId}`,
      product_id: productId,
      variant_id,
      warehouse_id: null, // catálogo: no forzamos
      warehouse_name: null,
      name: product?.name,
      display_name,
      price: effectiveUnitPrice,
      qty: 1,
      meta: {
        discount: Number(product?.discount) || 0,
        option_label: selectedOptionLabel || null,
        option_attributes: selectedOptionAttrs,
      },
    });
  };

  return (
    <Dialog
      open={!!show}
      onClose={onHide}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          backgroundImage: `linear-gradient(180deg, ${PALETTE.bg1} 0%, ${PALETTE.bg2} 100%)`,
          border: `1px solid ${PALETTE.stroke}`,
          boxShadow: `0 40px 120px ${PALETTE.shadow}, inset 0 0 0 1px color-mix(in srgb, ${PALETTE.stroke} 35%, transparent)`,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{ px: { xs: 2, sm: 2.5, md: 3 }, pt: { xs: 2, sm: 2.5 }, pb: 1.25 }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                color: PALETTE.txt,
                fontWeight: 950,
                letterSpacing: ".2px",
                overflow: "hidden",
                whiteSpace: { xs: "normal", sm: "nowrap" },
                textOverflow: { xs: "clip", sm: "ellipsis" },
              }}
              title={product?.name}
            >
              {product?.name}
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mt: 0.6, flexWrap: "wrap" }}
            >
              {product?.rating > 0 ? (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <StarRoundedIcon
                    sx={{ fontSize: 18, color: PALETTE.accent }}
                  />
                  <Typography variant="body2" sx={{ color: PALETTE.muted }}>
                    {Number(product.rating).toFixed(1)}
                  </Typography>
                </Stack>
              ) : null}

              {product?.new ? (
                <Chip
                  label="Nuevo"
                  size="small"
                  sx={{
                    height: 22,
                    color: PALETTE.txt,
                    borderRadius: 999,
                    bgcolor: PALETTE.accentSoft,
                    border: `1px solid ${PALETTE.stroke}`,
                    "& .MuiChip-label": {
                      px: 1,
                      fontWeight: 900,
                      fontSize: 12,
                    },
                  }}
                />
              ) : null}

              {hasOptions ? (
                <Chip
                  icon={
                    <TuneRoundedIcon
                      sx={{ fontSize: 18, color: PALETTE.txt }}
                    />
                  }
                  label="Opciones"
                  size="small"
                  sx={{
                    height: 22,
                    color: PALETTE.txt,
                    borderRadius: 999,
                    bgcolor: PALETTE.popSoft,
                    border: `1px solid ${PALETTE.stroke}`,
                    "& .MuiChip-label": {
                      px: 1,
                      fontWeight: 900,
                      fontSize: 12,
                    },
                  }}
                />
              ) : null}
            </Stack>
          </Box>

          <IconButton
            onClick={onHide}
            edge="end"
            sx={{
              color: PALETTE.txt,
              bgcolor: "rgba(255,255,255,0.06)",
              border: `1px solid ${PALETTE.stroke}`,
              "&:hover": { bgcolor: "rgba(255,255,255,0.10)" },
            }}
            aria-label="Cerrar"
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      <Divider sx={{ borderColor: PALETTE.stroke }} />

      {/* Body */}
      <DialogContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 2, md: 3 }}
        >
          {/* Imagen principal del producto */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                position: "relative",
                borderRadius: 3,
                overflow: "hidden",
                border: `1px solid ${PALETTE.stroke}`,
                bgcolor: "rgba(255,255,255,0.03)",
              }}
            >
              {productImages.length > 1 && (
                <IconButton
                  onClick={prev}
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: 8,
                    transform: "translateY(-50%)",
                    zIndex: 2,
                    bgcolor: "rgba(0,0,0,0.35)",
                    color: "#fff",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.55)" },
                  }}
                  aria-label="Anterior"
                >
                  <ChevronLeftIcon />
                </IconButton>
              )}

              <Box
                component="img"
                src={productImages[index] || DEFAULT_IMG}
                alt={product?.name}
                loading="lazy"
                onError={onImgError}
                data-fallback="0"
                sx={{
                  width: "100%",
                  height: { xs: 260, sm: 320, md: 380 },
                  objectFit: "contain",
                  display: "block",
                  background: "rgba(0,0,0,0.25)",
                }}
              />

              {productImages.length > 1 && (
                <IconButton
                  onClick={next}
                  sx={{
                    position: "absolute",
                    top: "50%",
                    right: 8,
                    transform: "translateY(-50%)",
                    zIndex: 2,
                    bgcolor: "rgba(0,0,0,0.35)",
                    color: "#fff",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.55)" },
                  }}
                  aria-label="Siguiente"
                >
                  <ChevronRightIcon />
                </IconButton>
              )}
            </Box>

            {/* Miniaturas */}
            {productImages.length > 1 && (
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="nowrap"
                sx={{
                  mt: 1.25,
                  overflowX: "auto",
                  pb: 0.5,
                  "&::-webkit-scrollbar": { height: 6 },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(255,255,255,0.18)",
                    borderRadius: 999,
                  },
                }}
              >
                {productImages.map((src, i) => {
                  const active = i === index;
                  return (
                    <Box
                      key={i}
                      role="button"
                      onClick={() => setIndex(i)}
                      sx={{
                        width: 68,
                        height: 68,
                        flex: "0 0 auto",
                        borderRadius: 2,
                        overflow: "hidden",
                        border: `2px solid ${active ? PALETTE.accent : "transparent"}`,
                        boxShadow: active ? PALETTE.glow : "none",
                        cursor: "pointer",
                        opacity: active ? 1 : 0.85,
                        transition: "all .18s ease",
                        "&:hover": { opacity: 1 },
                      }}
                    >
                      <Box
                        component="img"
                        src={src}
                        alt={`thumb-${i + 1}`}
                        loading="lazy"
                        onError={onImgError}
                        data-fallback="0"
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            )}

            {/* Imagen de la opción seleccionada (aparte) */}
            {hasOptions && optionImage && (
              <Paper
                variant="outlined"
                sx={{
                  mt: 1.25,
                  p: 1,
                  borderRadius: 3,
                  borderColor: PALETTE.stroke,
                  bgcolor: "rgba(255,255,255,0.04)",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: PALETTE.muted, fontWeight: 950, mb: 0.75 }}
                >
                  Imagen de la opción seleccionada
                </Typography>

                <Box
                  component="img"
                  src={optionImage}
                  alt="opción"
                  onError={onImgError}
                  data-fallback="0"
                  sx={{
                    width: "100%",
                    height: 160,
                    objectFit: "contain",
                    borderRadius: 2,
                    border: `1px solid ${PALETTE.stroke}`,
                    bgcolor: "rgba(0,0,0,0.25)",
                    display: "block",
                  }}
                />
              </Paper>
            )}
          </Box>

          {/* Panel derecho */}
          <Box
            sx={{
              width: { xs: "100%", md: 380 },
              flexShrink: 0,
              p: 2,
              borderRadius: 3,
              border: `1px solid ${PALETTE.stroke}`,
              bgcolor: "rgba(255,255,255,0.03)",
            }}
          >
            <Typography variant="body2" sx={{ color: PALETTE.muted, mb: 0.5 }}>
              Precio
            </Typography>

            <Box sx={{ mb: 1.25 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <Typography
                  variant="h5"
                  sx={{
                    color: PALETTE.accent,
                    fontWeight: 950,
                    lineHeight: 1,
                    fontSize: 26,
                  }}
                >
                  {symbol}
                  {money(effectiveUnitPrice)}
                </Typography>

                {Number(product?.discount) > 0 && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: PALETTE.muted,
                      textDecoration: "line-through",
                      opacity: 0.85,
                    }}
                  >
                    {symbol}
                    {money(baseOptionPrice)}
                  </Typography>
                )}

                {isStore464 && (
                  <Chip
                    label="1 pieza · Playera + shorts"
                    size="small"
                    sx={{
                      height: 24,
                      color: PALETTE.accent,
                      bgcolor: PALETTE.accentSoft,
                      border: `1px solid color-mix(
            in srgb,
            ${PALETTE.accent} 35%,
            transparent
          )`,
                      borderRadius: 999,
                      "& .MuiChip-label": {
                        px: 1.15,
                        fontSize: 11,
                        lineHeight: 1,
                        fontWeight: 900,
                      },
                    }}
                  />
                )}
              </Stack>

              {isStore464 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 1.25,
                    px: 1.25,
                    py: 1,
                    borderRadius: 2,
                    color: PALETTE.accent,
                    bgcolor: PALETTE.accentSoft,
                    border: `1px solid color-mix(
          in srgb,
          ${PALETTE.accent} 28%,
          transparent
        )`,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        color: PALETTE.accent,
                        fontSize: 11,
                        lineHeight: 1.2,
                        fontWeight: 950,
                        textTransform: "uppercase",
                        letterSpacing: ".35px",
                      }}
                    >
                      Precio de mayoreo
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.3,
                        color: PALETTE.muted,
                        fontSize: 11,
                        lineHeight: 1.35,
                        fontWeight: 700,
                      }}
                    >
                      Desde 7 piezas · Incluye playera, shorts, nombre, número y
                      calcetas
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      color: PALETTE.accent,
                      fontSize: { xs: 15, sm: 17 },
                      lineHeight: 1,
                      fontWeight: 950,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {symbol}320.00
                  </Typography>
                </Box>
              )}
            </Box>
            {categoryNames.length > 0 && (
              <Typography
                variant="body2"
                sx={{ color: PALETTE.muted, mb: 0.75 }}
              >
                <strong style={{ color: PALETTE.txt }}>Categorías:</strong>{" "}
                {categoryNames.join(" / ")}
              </Typography>
            )}

            {product?.sku && (
              <Typography
                variant="body2"
                sx={{ color: PALETTE.muted, mb: 0.5 }}
              >
                <strong style={{ color: PALETTE.txt }}>SKU:</strong>{" "}
                {product.sku}
              </Typography>
            )}

            <Typography variant="body2" sx={{ color: PALETTE.muted, mb: 0.5 }}>
              <strong style={{ color: PALETTE.txt }}>En existencia:</strong>{" "}
              <span style={{ color: "#22c55e", fontWeight: 950 }}>
                {hasOptions ? optionStockTotal : productStockTotal}
              </span>
            </Typography>

            {/* ✅ Multi-almacén: mensaje simple, sin "selecciona" */}
            {useWh && (
              <Stack
                direction="row"
                spacing={0.8}
                alignItems="center"
                sx={{ mt: 0.5, mb: 0.75 }}
              >
                <WarehouseRoundedIcon
                  sx={{ fontSize: 18, color: PALETTE.muted }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: PALETTE.muted, fontWeight: 900 }}
                >
                  {availabilityText}
                </Typography>
              </Stack>
            )}

            {/* ✅ Opciones */}
            {hasOptions && (
              <Paper
                variant="outlined"
                sx={{
                  mt: 1.1,
                  p: 1.25,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.04)",
                  borderColor: PALETTE.stroke,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: PALETTE.muted, fontWeight: 950 }}
                >
                  OPCIONES
                </Typography>

                <Typography
                  variant="caption"
                  sx={{ color: PALETTE.muted, display: "block", mt: 0.25 }}
                >
                  Elige una opción para comparar precio y disponibilidad
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 1 }}
                  flexWrap="wrap"
                  useFlexGap
                >
                  {options.length ? (
                    options.map((v) => {
                      const idStr = String(v.id);
                      const selected = idStr === String(selectedOptionId);
                      const st = getOptionTotalStock(v, useWh);
                      const disabled = st <= 0;

                      return (
                        <Button
                          key={v.id}
                          variant="outlined"
                          disabled={disabled}
                          onClick={() => setSelectedOptionId(idStr)}
                          sx={{
                            minWidth: 72,
                            height: 40,
                            borderRadius: 1.25,
                            px: 1.2,
                            fontWeight: 950,
                            fontSize: 13,
                            letterSpacing: ".35px",
                            border: `2px solid ${selected ? "#fff" : "rgba(255,255,255,0.14)"}`,
                            bgcolor: selected
                              ? "rgba(255,255,255,0.10)"
                              : "transparent",
                            color: "#fff",
                            boxShadow: selected
                              ? "0 0 0 1px rgba(255,255,255,0.2), 0 10px 30px rgba(0,0,0,0.35)"
                              : "none",
                            opacity: disabled ? 0.45 : 1,
                            "&:hover": {
                              bgcolor: selected
                                ? "rgba(255,255,255,0.12)"
                                : "rgba(255,255,255,0.06)",
                            },
                          }}
                          title={pickOptionLabel(v)}
                        >
                          {buildOptionButtonLabel(v)}
                        </Button>
                      );
                    })
                  ) : (
                    <Typography sx={{ color: PALETTE.muted, fontSize: 13 }}>
                      No hay opciones disponibles
                    </Typography>
                  )}
                </Stack>

                {/* Info opción */}
                {selectedOption && (
                  <Stack spacing={0.5} sx={{ mt: 1.15 }}>
                    <Typography variant="body2" sx={{ color: PALETTE.muted }}>
                      <strong style={{ color: "#fff" }}>Seleccionada:</strong>{" "}
                      {selectedOptionLabel}
                    </Typography>

                    {!!selectedOption?.sku && (
                      <Typography variant="body2" sx={{ color: PALETTE.muted }}>
                        <strong style={{ color: "#fff" }}>SKU opción:</strong>{" "}
                        {selectedOption.sku}
                      </Typography>
                    )}

                    {!!selectedOptionAttrs.length && (
                      <>
                        <Typography
                          variant="body2"
                          sx={{
                            color: PALETTE.muted,
                            fontWeight: 950,
                            mt: 0.5,
                          }}
                        >
                          Características
                        </Typography>

                        {/* ✅ Chips en BLANCO */}
                        <Stack
                          direction="row"
                          spacing={0.75}
                          sx={{ mt: 0.75 }}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {selectedOptionAttrs.slice(0, 12).map((a, idx) => (
                            <Chip
                              key={`attr-${idx}`}
                              icon={
                                <StyleRoundedIcon
                                  sx={{ fontSize: 16, color: "#fff" }}
                                />
                              }
                              label={`${a.name}${a.value ? `: ${a.value}` : ""}`}
                              variant="outlined"
                              sx={{
                                height: 28,
                                fontWeight: 950,
                                fontSize: 12,
                                color: "#fff",
                                borderColor: "rgba(255,255,255,0.20)",
                                bgcolor: "rgba(255,255,255,0.06)",
                                "& .MuiChip-label": { color: "#fff" },
                              }}
                            />
                          ))}
                          {selectedOptionAttrs.length > 12 && (
                            <Chip
                              label={`+${selectedOptionAttrs.length - 12}`}
                              size="small"
                              sx={{
                                fontWeight: 950,
                                height: 28,
                                color: "#fff",
                                borderColor: "rgba(255,255,255,0.20)",
                                bgcolor: "rgba(255,255,255,0.06)",
                                "& .MuiChip-label": { color: "#fff" },
                              }}
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </>
                    )}
                  </Stack>
                )}
              </Paper>
            )}

            {/* Descripciones */}
            {product?.shortDescription && (
              <>
                <Typography
                  variant="body2"
                  sx={{ color: PALETTE.muted, fontWeight: 950, mt: 1.15 }}
                >
                  Descripción corta
                </Typography>
                <Typography variant="body2" sx={{ color: "#fff", mb: 0.75 }}>
                  {product.shortDescription}
                </Typography>
              </>
            )}

            {product?.fullDescription && (
              <>
                <Typography
                  variant="body2"
                  sx={{ color: PALETTE.muted, fontWeight: 950 }}
                >
                  Descripción completa
                </Typography>
                <Typography variant="body2" sx={{ color: "#fff", mb: 0.75 }}>
                  {product.fullDescription}
                </Typography>
              </>
            )}

            {product?.offerEnd && (
              <Typography variant="body2" sx={{ color: PALETTE.muted }}>
                <strong style={{ color: "#fff" }}>Oferta hasta:</strong>{" "}
                {formatFechaMX(product.offerEnd)}
              </Typography>
            )}

            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<ShoppingCartIcon />}
                onClick={() => {
                  handleAdd();
                  onHide?.();
                }}
                disabled={!canAdd}
                sx={{
                  fontWeight: 950,
                  borderRadius: 2,
                  color: "#0B0E12",
                  bgcolor: "#fff",
                  boxShadow: "0 14px 34px rgba(0,0,0,0.35)",
                  "&:hover": {
                    bgcolor: "#fff",
                    boxShadow: "0 20px 48px rgba(0,0,0,0.45)",
                  },
                }}
              >
                Añadir al carrito
              </Button>
            </Stack>

            {!canAdd && (
              <Typography
                sx={{
                  mt: 1,
                  fontSize: 12,
                  color: PALETTE.warn,
                  fontWeight: 950,
                }}
              >
                {hasOptions
                  ? "Elige una opción con existencia para poder agregar."
                  : "Sin stock disponible."}
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

ProductModal.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string),
  currency: PropTypes.shape({ currencySymbol: PropTypes.string }),

  discountedPrice: PropTypes.number,
  finalDiscountedPrice: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  finalProductPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

  onHide: PropTypes.func.isRequired,
  onWhatsapp: PropTypes.func,

  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    sku: PropTypes.string,
    image: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.string,
    ]),
    rating: PropTypes.number,
    discount: PropTypes.number,
    offerEnd: PropTypes.string,
    stock: PropTypes.number,
    shortDescription: PropTypes.string,
    fullDescription: PropTypes.string,

    category: PropTypes.array,
    categories: PropTypes.array,

    has_variants: PropTypes.bool,
    use_warehouse_inventory: PropTypes.bool,
    warehouse_inventories: PropTypes.array,
    variants: PropTypes.array,

    store_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    storeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    store: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  }).isRequired,

  show: PropTypes.bool.isRequired,
};
