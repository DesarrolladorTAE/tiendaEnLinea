import React from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import { FiDownload } from "react-icons/fi";
import { saveAs } from "file-saver";
import { createImportReport, SUMMARY_LABELS } from "./importResult.mjs";

export default function ImportResultSummary({ result }) {
  const download = () => {
    saveAs(new Blob(["\uFEFF", createImportReport(result)], { type: "text/plain;charset=utf-8" }), `reporte-importacion-${result.mode === "SICAR" ? "sicar" : "normal"}-${result.date.slice(0, 10)}.txt`);
  };
  return (
    <Box sx={{ mt: 2, mb: 3 }}>
      <Alert severity={result.severity}>
        <Typography sx={{ fontWeight: 800 }}>{result.title}</Typography>
        {result.message && <Typography variant="body2">{result.message}</Typography>}
      </Alert>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(5, 1fr)" }, gap: 1, my: 2 }}>
        {Object.entries(result.summary).map(([key, value]) => (
          <Box key={key} sx={{ p: 1.25, borderRadius: 2, bgcolor: key === "errores" && value > 0 ? "#fef2f2" : "#f1f5f9", textAlign: "center" }}>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: key === "errores" && value > 0 ? "#b91c1c" : "#172033" }}>{value.toLocaleString("es-MX")}</Typography>
            <Typography variant="caption">{SUMMARY_LABELS[key]}</Typography>
          </Box>
        ))}
      </Box>
      {result.reasons.length > 0 && <>
        <Typography sx={{ fontWeight: 750, mb: 1 }}>Qué necesitas revisar</Typography>
        <Box sx={{ maxHeight: 160, overflowY: "auto" }}>
          {result.reasons.map(({ reason, count }) => <Typography key={reason} variant="body2" sx={{ mb: 1, overflowWrap: "anywhere" }}><strong>{count.toLocaleString("es-MX")} incidencia(s):</strong> {reason}</Typography>)}
        </Box>
        {result.reasons.some(({ reason }) => reason.includes("SERVICIO (S/N)")) && <Alert severity="info" sx={{ my: 1 }}>Revisa la columna SERVICIO (S/N) del archivo: cada valor debe ser S o N según corresponda al producto. Guarda las correcciones antes de volver a importarlo.</Alert>}
        <Box component="details" sx={{ my: 2 }}>
          <Box component="summary" sx={{ cursor: "pointer", fontWeight: 700 }}>Ver detalle de errores</Box>
          <Box sx={{ maxHeight: 220, overflowY: "auto", mt: 1 }}>
            {result.errors.slice(0, 20).map((error, index) => <Box key={index} sx={{ py: 1, borderBottom: "1px solid #e2e8f0", overflowWrap: "anywhere" }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Fila {error.fila} · {result.entity === "clientes" ? "Cliente/RFC" : result.entity === "proveedores" ? "Proveedor/RFC" : "SKU"} {error.sku}</Typography>
              <Typography variant="body2">{error.motivo}</Typography>
            </Box>)}
          </Box>
          <Typography variant="caption">Mostrando {Math.min(20, result.errors.length)} de {result.errors.length.toLocaleString("es-MX")} errores. El TXT incluye todos los detalles recibidos.</Typography>
        </Box>
      </>}
      {result.severity !== "success" && !result.errors.length && <Typography variant="body2" sx={{ mb: 2 }}>El servidor no devolvió el detalle por fila. El reporte incluye el mensaje y el resumen disponibles.</Typography>}
      <Button variant="outlined" startIcon={<FiDownload />} onClick={download} sx={{ textTransform: "none" }}>Descargar reporte TXT</Button>
    </Box>
  );
}
