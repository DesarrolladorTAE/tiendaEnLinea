import React, { useState } from "react";
import { Box, CircularProgress, LinearProgress, Stack, Typography } from "@mui/material";
import { readStorefrontBrand } from "../../utils/storefrontBranding";

export default function StorefrontLoading({ storeSlug, brand, compact = false, label }) {
  const branch = new URLSearchParams(window.location.search).get("branch") || "";
  const current = brand || readStorefrontBrand(storeSlug, branch);
  const [failedLogo, setFailedLogo] = useState(null);
  // Wait for identity before deciding that this store has no logo.
  const logo = current ? current.logo || "/assets/logo1.png" : null;
  const name = current?.name && current.name !== "Tienda" ? current.name : "la tienda";
  const color = "#6d28d9";
  return <Stack role="status" aria-live="polite" aria-busy="true" alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: compact ? 300 : "70vh", p: 3 }}>
    <Box sx={{ position: "relative", width: 152, height: 152 }}>
      <CircularProgress variant="determinate" value={100} size={152} thickness={2.5} aria-hidden="true" sx={{ color: "#ede9fe", position: "absolute", inset: 0 }} />
      <CircularProgress size={152} thickness={2.5} aria-label={label || "Cargando tienda"} sx={{ color, position: "absolute", inset: 0, "& circle": { strokeLinecap: "round" }, "@media (prefers-reduced-motion: reduce)": { animation: "none", "& circle": { animation: "none" } } }} />
      <Box sx={{ position: "absolute", inset: 13, borderRadius: "50%", bgcolor: "white", boxShadow: "0 8px 30px #17203312", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {logo && failedLogo !== logo ? <Box key={logo} component="img" src={logo} alt={current?.logo ? `Logo de ${name}` : "Mi Tienda en Línea MX"} onError={() => setFailedLogo(logo)} sx={{ width: "80%", height: "80%", objectFit: "contain" }} /> : <Typography aria-hidden="true" sx={{ color, fontSize: 40, fontWeight: 800 }}>{current?.name?.slice(0, 1).toUpperCase() || ""}</Typography>}
      </Box>
    </Box>
    <Typography sx={{ fontWeight: 700, textAlign: "center" }}>{label || `Cargando ${name}…`}</Typography>
    <LinearProgress aria-label="Carga en curso" sx={{ width: 200, maxWidth: "100%", height: 5, borderRadius: 4, bgcolor: "#ede9fe", "& .MuiLinearProgress-bar": { bgcolor: color, "@media (prefers-reduced-motion: reduce)": { animation: "none" } } }} />
  </Stack>;
}
