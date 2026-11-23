import React from "react";
import { Box, Typography } from "@mui/material";

export default function TourReportView({ html, title }) {
  return <Box sx={{ minWidth: 0 }}>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Desplaza la tabla horizontalmente para consultar todas las columnas.</Typography>
    <Box component="iframe" title={title} srcDoc={html} sandbox="" referrerPolicy="no-referrer"
      sx={{ display: "block", width: "100%", height: "72vh", minHeight: 420, border: "1px solid #d9dde3", borderRadius: 2, bgcolor: "#fff" }} />
  </Box>;
}
