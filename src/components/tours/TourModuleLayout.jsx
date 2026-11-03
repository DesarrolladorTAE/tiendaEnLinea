import React from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import { tourFormControlsSx } from "./tourFormStyles.mjs";

export const tourSurfaceSx = {
  ...tourFormControlsSx, width: "100%", minWidth: 0, boxSizing: "border-box",
  "& .MuiButton-contained": { bgcolor: "#ffc107", color: "#17191c", boxShadow: "none", "&:hover": { bgcolor: "#e0a800" } },
  "& .MuiTypography-h4": { fontSize: { xs: 25, md: 32 }, lineHeight: 1.2, overflowWrap: "anywhere" },
  "& .MuiCard-root": { borderRadius: 3, borderColor: "#e3e4e7", boxShadow: "0 6px 20px rgba(15,23,42,.04)", minWidth: 0 },
  "& .MuiPagination-ul": { flexWrap: "wrap" },
};

export default function TourModuleLayout({ title, description, onBack, backLabel = "Volver al POS", children }) {
  return <Box sx={{ ...tourSurfaceSx, maxWidth: 1400, mx: "auto" }}>
    <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 2.5, bgcolor: "#17191c", borderRadius: 3, border: "1px solid #30343b" }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box sx={{ bgcolor: "#ffc107", color: "#17191c", borderRadius: 2, p: 1.25, display: "flex", flexShrink: 0 }}><DirectionsBusRoundedIcon /></Box>
          <Box sx={{ minWidth: 0 }}><Typography component="h1" sx={{ color: "#fff !important", fontSize: { xs: 25, md: 32 }, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-.035em", overflowWrap: "anywhere" }}>{title}</Typography><Typography sx={{ mt: 1, color: "#c7cbd1 !important", fontSize: 14 }}>{description}</Typography></Box>
        </Stack>
        {onBack && <Button variant="contained" startIcon={<ArrowBackRoundedIcon />} onClick={onBack} sx={{ flexShrink: 0 }}>{backLabel}</Button>}
      </Stack>
    </Paper>
    {children}
  </Box>;
}
