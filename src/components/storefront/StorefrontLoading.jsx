import React from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { readStorefrontBrand } from "../../utils/storefrontBranding";

export default function StorefrontLoading({ storeSlug, brand, compact = false }) {
  const branch = new URLSearchParams(window.location.search).get("branch") || "";
  const current = brand || readStorefrontBrand(storeSlug, branch);
  return <Stack role="status" aria-live="polite" alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: compact ? 240 : "70vh", p: 3 }}>
    {current?.logo && <Box component="img" src={current.logo} alt={`Logo de ${current.name || "la tienda"}`} sx={{ width: 104, height: 104, objectFit: "contain" }} />}
    <CircularProgress size={28} />
    <Typography color="text.secondary">Cargando {current?.name && current.name !== "Tienda" ? current.name : "tienda"}…</Typography>
  </Stack>;
}
