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
  Divider
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StarRoundedIcon from "@mui/icons-material/StarRounded";

const DEFAULT_IMG = "/assets/img/defaultproduct.png";

/* Helper: usa CSS vars con fallback (string) para sx */
const V = (name, fallback) => `var(${name}, ${fallback})`;

/* Paleta basada en variables del tema (bianni u otros) */
const PALETTE = {
  /* fondos claros salvia */
  bg1: V("--void-1", "#F7F8F5"),
  bg2: V("--void-2", "#E9EEE7"),
  bg3: V("--void-3", "#DDE4D7"),

  /* bordes/sombra suave */
  stroke: V("--void-stroke", "rgba(80,100,80,0.25)"),
  shadow: V("--void-shadow", "rgba(160,180,160,0.35)"),

  /* textos */
  txt: V("--void-text", "#3E4A3E"),
  muted: V("--void-muted", "#738072"),

  /* acentos del tema */
  accent: V("--void-accent", "#A8B7A0"),  // verde salvia
  pop: V("--void-pop", "#EAC8D3"),        // blush
  warn: V("--void-warn", "#FF8FA3"),      // rosa vivo
  amber: V("--void-amber", "#E8C27E"),

  /* helpers derivados (soft y glow con color-mix; buen soporte moderno) */
  accentSoft: `color-mix(in srgb, ${V("--void-accent", "#A8B7A0")} 16%, transparent)`,
  popSoft: `color-mix(in srgb, ${V("--void-pop", "#EAC8D3")} 16%, transparent)`,
  warnSoft: `color-mix(in srgb, ${V("--void-warn", "#FF8FA3")} 16%, transparent)`,
  glow: `0 10px 38px color-mix(in srgb, ${V("--void-accent", "#A8B7A0")} 35%, transparent)`
};

function normalizeImages(value) {
  const arr =
    Array.isArray(value)
      ? value
      : typeof value === "string" && value.trim() !== ""
      ? [value.trim()]
      : [];
  const clean = arr.filter(Boolean).slice(0, 5);
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
    year: "numeric"
  }).format(d);
}

export default function ProductModal({
  product,
  images: imagesProp,
  currency,
  discountedPrice,
  finalProductPrice,
  finalDiscountedPrice,
  show,
  onHide,
  onWhatsapp
}) {
  const symbol = currency?.currencySymbol ?? "MX$";
  const hasDiscount = discountedPrice !== null && discountedPrice !== undefined;

  const images = React.useMemo(() => {
    const fromProp = normalizeImages(imagesProp);
    if (fromProp.length && fromProp[0] !== DEFAULT_IMG) return fromProp;
    const fromProduct = normalizeImages(product?.image);
    return fromProduct;
  }, [imagesProp, product]);

  const categoryNames = React.useMemo(() => {
    const c = product?.category;
    if (!Array.isArray(c)) return [];
    return c.map((x) => (typeof x === "string" ? x : x?.name)).filter(Boolean);
  }, [product]);

  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (show) setIndex(0);
  }, [show]);

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const select = (i) => setIndex(i);

  React.useEffect(() => {
    if (!show) return;
    const h = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [show, images.length]);

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
          /* fondo claro con gradiente de las vars */
          backgroundImage: `linear-gradient(180deg, ${PALETTE.bg1} 0%, ${PALETTE.bg2} 100%)`,
          border: `1px solid ${PALETTE.stroke}`,
          boxShadow: `0 40px 120px ${PALETTE.shadow}, inset 0 0 0 1px color-mix(in srgb, ${PALETTE.stroke} 35%, transparent)`
        }
      }}
    >
      {/* Header */}
      <Box sx={{ px: { xs: 2, sm: 2.5, md: 3 }, pt: { xs: 2, sm: 2.5 }, pb: 1.5 }}>
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{ color: PALETTE.txt, fontWeight: 900, letterSpacing: ".2px" }}
              noWrap
              title={product?.name}
            >
              {product?.name}
            </Typography>

            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mt: 0.5, flexWrap: "wrap" }}>
              {product?.rating > 0 ? (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <StarRoundedIcon sx={{ fontSize: 18, color: PALETTE.accent }} />
                  <Typography variant="body2" sx={{ color: PALETTE.muted }}>
                    {Number(product.rating).toFixed(1)}
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: PALETTE.muted }}>
                  Sin calificaciones
                </Typography>
              )}

              {product?.discount ? (
                <Chip
                  label={`-${product.discount}%`}
                  size="small"
                  sx={{
                    height: 24,
                    color: PALETTE.txt,
                    borderRadius: 999,
                    bgcolor: PALETTE.warnSoft,
                    border: `1px solid ${PALETTE.warn}`,
                    "& .MuiChip-label": { px: 1, fontWeight: 800 }
                  }}
                />
              ) : null}

              {product?.new ? (
                <Chip
                  label="Nuevo"
                  size="small"
                  sx={{
                    height: 24,
                    color: PALETTE.accent,
                    borderRadius: 999,
                    bgcolor: PALETTE.accentSoft,
                    border: `1px solid ${PALETTE.accent}`,
                    "& .MuiChip-label": { px: 1, fontWeight: 800 }
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
              bgcolor: `color-mix(in srgb, ${PALETTE.bg3} 60%, transparent)`,
              border: `1px solid ${PALETTE.stroke}`,
              "&:hover": { bgcolor: `color-mix(in srgb, ${PALETTE.bg3} 75%, transparent)` }
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
          alignItems={{ xs: "stretch", md: "flex-start" }}
        >
          {/* GALERÍA */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                position: "relative",
                borderRadius: 3,
                overflow: "hidden",
                border: `1px solid ${PALETTE.stroke}`,
                bgcolor: PALETTE.bg1
              }}
            >
              {images.length > 1 && (
                <IconButton
                  onClick={prev}
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: 8,
                    transform: "translateY(-50%)",
                    zIndex: 2,
                    bgcolor: `color-mix(in srgb, ${PALETTE.bg3} 50%, transparent)`,
                    color: PALETTE.txt,
                    "&:hover": { bgcolor: `color-mix(in srgb, ${PALETTE.bg3} 70%, transparent)` }
                  }}
                  aria-label="Anterior"
                >
                  <ChevronLeftIcon />
                </IconButton>
              )}

              <Box
                component="img"
                src={images[index]}
                alt={product?.name}
                loading="lazy"
                onError={onImgError}
                data-fallback="0"
                sx={{
                  width: "100%",
                  height: { xs: 260, sm: 320, md: 380 },
                  objectFit: "contain",
                  display: "block",
                  background: PALETTE.bg1
                }}
              />

              {images.length > 1 && (
                <IconButton
                  onClick={next}
                  sx={{
                    position: "absolute",
                    top: "50%",
                    right: 8,
                    transform: "translateY(-50%)",
                    zIndex: 2,
                    bgcolor: `color-mix(in srgb, ${PALETTE.bg3} 50%, transparent)`,
                    color: PALETTE.txt,
                    "&:hover": { bgcolor: `color-mix(in srgb, ${PALETTE.bg3} 70%, transparent)` }
                  }}
                  aria-label="Siguiente"
                >
                  <ChevronRightIcon />
                </IconButton>
              )}
            </Box>

            {/* Miniaturas */}
            {images.length > 1 && (
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
                    background: `color-mix(in srgb, ${PALETTE.stroke} 70%, transparent)`,
                    borderRadius: 999
                  }
                }}
              >
                {images.map((src, i) => {
                  const active = i === index;
                  return (
                    <Box
                      key={i}
                      role="button"
                      onClick={() => select(i)}
                      sx={{
                        width: 68,
                        height: 68,
                        flex: "0 0 auto",
                        borderRadius: 2,
                        overflow: "hidden",
                        border: `2px solid ${active ? PALETTE.accent : "transparent"}`,
                        boxShadow: active ? PALETTE.glow : "none",
                        cursor: "pointer",
                        opacity: active ? 1 : 0.9,
                        transition: "all .18s ease",
                        "&:hover": { opacity: 1 }
                      }}
                    >
                      <Box
                        component="img"
                        src={src}
                        alt={`thumb-${i + 1}`}
                        loading="lazy"
                        onError={onImgError}
                        data-fallback="0"
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>

          {/* INFO / PRECIO / CTA */}
          <Box
            sx={{
              width: { xs: "100%", md: 340 },
              flexShrink: 0,
              p: 2,
              borderRadius: 3,
              border: `1px solid ${PALETTE.stroke}`,
              bgcolor: PALETTE.bg1
            }}
          >
            <Typography variant="subtitle2" sx={{ color: PALETTE.muted, mb: 0.5 }}>
              Precio
            </Typography>

            <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ mb: 1.5 }}>
              {finalDiscountedPrice != null ? (
                <>
                  <Typography variant="h5" sx={{ color: PALETTE.accent, fontWeight: 900, lineHeight: 1 }}>
                    {symbol}
                    {finalDiscountedPrice}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: PALETTE.muted, textDecoration: "line-through", opacity: 0.8 }}
                  >
                    {symbol}
                    {finalProductPrice}
                  </Typography>
                </>
              ) : (
                <Typography variant="h5" sx={{ color: PALETTE.accent, fontWeight: 900, lineHeight: 1 }}>
                  {symbol}
                  {finalProductPrice}
                </Typography>
              )}
            </Stack>

            {categoryNames.length > 0 && (
              <Typography variant="body2" sx={{ color: PALETTE.muted, mb: 0.5 }}>
                <strong style={{ color: PALETTE.txt }}>Categoría: </strong>
                {categoryNames.join(" / ")}
              </Typography>
            )}

            {product?.sku && (
              <Typography variant="body2" sx={{ color: PALETTE.muted, mb: 0.5 }}>
                <strong style={{ color: PALETTE.txt }}>SKU: </strong>
                {product.sku}
              </Typography>
            )}

            {"stock" in (product || {}) && product.stock !== undefined && (
              <Typography variant="body2" sx={{ color: PALETTE.muted, mb: 0.5 }}>
                <strong style={{ color: PALETTE.txt }}>En existencia: </strong>
                <span style={{ color: "var(--stock-color, #2e7d32)", fontWeight: 800 }}>
                  {product.stock}
                </span>
              </Typography>
            )}

            {product?.shortDescription && (
              <>
                <Typography variant="subtitle2" sx={{ color: PALETTE.muted, mt: 1 }}>
                  Descripción
                </Typography>
                <Typography variant="body2" sx={{ color: PALETTE.txt, mb: 1 }}>
                  {product.shortDescription}
                </Typography>
              </>
            )}

            {product?.fullDescription && (
              <>
                <Typography variant="subtitle2" sx={{ color: PALETTE.muted }}>
                  Más Detalles
                </Typography>
                <Typography variant="body2" sx={{ color: PALETTE.txt, mb: 1 }}>
                  {product.fullDescription}
                </Typography>
              </>
            )}

            {typeof product?.discount === "number" && product.discount > 0 && (
              <Typography variant="body2" sx={{ color: PALETTE.muted, mb: 1 }}>
                <strong style={{ color: PALETTE.txt }}>Descuento: </strong>-{product.discount}%
              </Typography>
            )}

            {product?.offerEnd && (
              <Typography variant="body2" sx={{ color: PALETTE.muted }}>
                <strong style={{ color: PALETTE.txt }}>La oferta termina el: </strong>
                {formatFechaMX(product.offerEnd)}
              </Typography>
            )}

            <Stack direction="row" spacing={1} sx={{ mt: 1.75 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<ShoppingCartIcon />}
                onClick={() => {
                  onWhatsapp?.(product);
                  onHide?.();
                }}
                sx={{
                  fontWeight: 900,
                  borderRadius: 2,
                  color: "#0B0E12",
                  bgcolor: "#fff",
                  boxShadow: "0 14px 34px color-mix(in srgb, #000 0%, transparent)",
                  "&:hover": {
                    bgcolor: "#fff",
                    boxShadow: "0 20px 48px color-mix(in srgb, #000 0%, transparent)"
                  }
                }}
              >
                Añadir al Carrito
              </Button>
            </Stack>
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
  finalDiscountedPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  finalProductPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onHide: PropTypes.func.isRequired,
  onWhatsapp: PropTypes.func,
  product: PropTypes.shape({
    name: PropTypes.string,
    sku: PropTypes.string,
    image: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    rating: PropTypes.number,
    discount: PropTypes.number,
    offerEnd: PropTypes.string,
    stock: PropTypes.number,
    shortDescription: PropTypes.string,
    fullDescription: PropTypes.string,
    category: PropTypes.array
  }).isRequired,
  show: PropTypes.bool.isRequired
};
