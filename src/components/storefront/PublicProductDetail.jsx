import React from "react";
import PropTypes from "prop-types";
import { Box, Button, Chip, Container, Divider, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";

const imagesOf = (product) => { const raw = product?.image; if (Array.isArray(raw)) return raw.filter(Boolean); if (typeof raw === "string") { try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed.filter(Boolean) : [raw]; } catch { return [raw]; } } return []; };

export default function PublicProductDetail({ product, colors, radius, shadow, legend, onBack }) {
  const images = imagesOf(product);
  const categories = [...(Array.isArray(product.category) ? product.category : []), ...(Array.isArray(product.categories) ? product.categories.map((item) => item?.name) : [])].filter(Boolean);
  const stock = Number(product.stock || 0);
  const share = async () => { if (navigator.share) await navigator.share({ title: product.name, url: window.location.href }); else await navigator.clipboard?.writeText(window.location.href); };
  return <Container maxWidth="xl" sx={{ py: { xs: 3, md: 6 } }}>
    <Button onClick={onBack} startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 2.5, color: colors.text, textTransform: "none", fontWeight: 800 }}>Volver a productos</Button>
    <Box className="sf-full-product" sx={{ bgcolor: colors.background, color: colors.text, borderColor: colors.secondary, borderRadius: `${radius}px`, boxShadow: shadow }}>
      <Box className="sf-full-product-media" sx={{ borderColor: colors.secondary }}>{images[0] ? <Box component="img" src={images[0]} alt={product.name} /> : <Inventory2RoundedIcon sx={{ color: colors.accent, fontSize: 110 }} />}</Box>
      <Stack className="sf-full-product-info" spacing={2.25}>
        {legend && <Typography variant="overline" sx={{ color: colors.accent, fontWeight: 900 }}>{legend}</Typography>}
        <Typography component="h2">{product.name}</Typography>
        <Typography className="sf-full-product-price" sx={{ color: colors.accent }}>MX${Number(product.price || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {categories.map((category) => <Chip key={category} icon={<CategoryRoundedIcon />} label={category} sx={{ color: colors.text, borderColor: colors.secondary }} variant="outlined" />)}
          {product.sku && <Chip icon={<QrCode2RoundedIcon />} label={`SKU ${product.sku}`} sx={{ color: colors.text, borderColor: colors.secondary }} variant="outlined" />}
          <Chip icon={<Inventory2RoundedIcon />} label={stock > 0 ? `${stock} disponibles` : "Sin existencia"} sx={{ color: stock > 0 ? colors.accent : colors.secondary, borderColor: colors.secondary }} variant="outlined" />
        </Stack>
        <Divider sx={{ borderColor: colors.secondary, opacity: .35 }} />
        {product.shortDescription && <Box><Stack direction="row" spacing={1} alignItems="center"><LocalOfferRoundedIcon sx={{ color: colors.accent }} /><Typography fontWeight={900}>Descripción breve</Typography></Stack><Typography sx={{ mt: 1, color: colors.text, lineHeight: 1.75 }}>{product.shortDescription}</Typography></Box>}
        {product.fullDescription && <Box><Typography fontWeight={900}>Detalles del producto</Typography><Typography sx={{ mt: 1, color: colors.text, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{product.fullDescription}</Typography></Box>}
        <Button onClick={share} variant="contained" startIcon={<ShareRoundedIcon />} sx={{ alignSelf: "flex-start", bgcolor: colors.accent, borderRadius: `${Math.min(radius, 18)}px`, textTransform: "none", fontWeight: 900 }}>Compartir producto</Button>
      </Stack>
    </Box>
  </Container>;
}

PublicProductDetail.propTypes = { product: PropTypes.object.isRequired, colors: PropTypes.object.isRequired, radius: PropTypes.number, shadow: PropTypes.string, legend: PropTypes.string, onBack: PropTypes.func.isRequired };
