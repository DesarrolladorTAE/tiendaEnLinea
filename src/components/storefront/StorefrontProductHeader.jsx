import React from "react";
import PropTypes from "prop-types";
import { Box, Container, Stack, Typography } from "@mui/material";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";

const resolveImage = (value) => value || null;

export default function StorefrontProductHeader({ site, store, branch, storePath, colors, theme }) {
  const branding = site?.branding || {};
  const identity = site?.identity || {};
  const logo = resolveImage(branding.logo || site?.logo);
  const cover = resolveImage(branding.cover || branding.img_portada || site?.img_portada);
  const title = identity.title || site?.titulo_1 || site?.hero?.title || store?.name || "Tienda";
  const description = identity.description || site?.descripcion || site?.hero?.subtitle || "";
  const hasGallery = Array.isArray(site?.carousel) && site.carousel.some(Boolean);
  const hasMessages = Array.isArray(site?.phrases) && site.phrases.some((phrase) => String(phrase || "").trim());
  return <Box component="header" className="sf-product-page-header">
    <Container maxWidth="xl">
      <Box className="sf-product-facebook" sx={{ bgcolor: colors.background, borderColor: colors.secondary, borderRadius: `${theme.radiusValue}px`, boxShadow: theme.shadowValue }}>
        <Box className="sf-product-cover" sx={{ bgcolor: colors.background }}>{cover && <Box component="img" src={cover} alt={`Portada de ${title}`} />}</Box>
        <Box className="sf-product-profile">
          <Box className="sf-product-logo" sx={{ bgcolor: colors.background, borderColor: colors.background }}>{logo ? <Box component="img" src={logo} alt={`Logo de ${title}`} /> : <StorefrontRoundedIcon sx={{ color: colors.accent, fontSize: 70 }} />}</Box>
          <Box><Typography component="h1" sx={{ color: colors.text }}>{title}</Typography>{description && <Typography sx={{ color: colors.secondary }}>{description}</Typography>}</Box>
        </Box>
        <Stack className="sf-product-tabs" direction="row" spacing={0} sx={{ borderColor: colors.secondary }}>
          <Box component="a" href={`${storePath}#catalog`} sx={{ color: colors.accent, borderColor: colors.accent }}>Productos</Box>
          {hasGallery && <Box component="a" href={`${storePath}#carousel`} sx={{ color: colors.secondary }}>Galería</Box>}
          {hasMessages && <Box component="a" href={`${storePath}#phrases`} sx={{ color: colors.secondary }}>Mensajes</Box>}
          <Typography sx={{ ml: "auto!important", color: colors.secondary }}>{branch?.name}</Typography>
        </Stack>
      </Box>
    </Container>
  </Box>;
}

StorefrontProductHeader.propTypes = { site: PropTypes.object, store: PropTypes.object, branch: PropTypes.object, storePath: PropTypes.string.isRequired, colors: PropTypes.object.isRequired, theme: PropTypes.object.isRequired };
