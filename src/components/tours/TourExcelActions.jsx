import React, { useRef, useState } from "react";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography, useMediaQuery } from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import { exportToursExcel, importToursExcel } from "../../services/tours/tourService";
import { alertFromAxiosError, showToastSuccess } from "../../utils/alerts";

const importColor = "#1565c0";
const exportColor = "#15803d";
const colorButton = (color) => ({ bgcolor: color, color: "#fff", minHeight: 44, textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: color, filter: "brightness(.9)" } });
const dialogStyle = {
  "& .MuiDialog-paper": { boxSizing: "border-box", display: "flex", flexDirection: "column", minWidth: 0, width: "calc(100% - 32px)", maxWidth: 600, maxHeight: "calc(100dvh - 32px)", m: 2, borderRadius: 3, overflow: "hidden" },
  "& .MuiDialogTitle-root": { flexShrink: 0, px: 2, py: 2, fontSize: "1.2rem", lineHeight: 1.4, overflowWrap: "anywhere", pt: "max(16px, env(safe-area-inset-top))" },
  "& .MuiDialogContent-root": { flex: "1 1 auto", minHeight: 0, minWidth: 0, px: 2, py: 2, overflowY: "auto", overflowX: "hidden", overflowWrap: "anywhere", WebkitOverflowScrolling: "touch" },
  "& .MuiDialogContent-root .MuiStack-root": { minWidth: 0 },
  "& .MuiDialogContent-root .MuiButton-root": { minHeight: 48, whiteSpace: "normal", textAlign: "center" },
  "& .MuiAlert-message": { minWidth: 0, overflowWrap: "anywhere" },
  "& .MuiDialogActions-root": { flexShrink: 0, bgcolor: "background.paper", borderTop: 1, borderColor: "divider", p: 2, pb: "max(16px, env(safe-area-inset-bottom))", gap: 1, "& .MuiButton-root": { minHeight: 48, ml: 0 } },
  "@media (max-width: 599.95px)": {
    "& .MuiDialog-container": { alignItems: "stretch" },
    "& .MuiDialog-paper": { m: 0, width: "100%", maxWidth: "100%", height: "100dvh", maxHeight: "100dvh", borderRadius: 0 },
    "& .MuiDialogActions-root": { flexDirection: "column-reverse", alignItems: "stretch", "& .MuiButton-root": { width: "100%", ml: 0 } },
  },
};
const MAX_SIZE = 20 * 1024 * 1024;
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|avif|heif|heic|svg|bmp|tif|tiff)$/i;

function downloadName(disposition, branchId) {
  const encoded = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition || "");
  const plain = /filename\s*=\s*(?:"([^"]+)"|([^;]+))/i.exec(disposition || "");
  let name = plain?.[1] || plain?.[2]?.trim();
  if (encoded) { try { name = decodeURIComponent(encoded[1]); } catch { /* Use the plain filename. */ } }
  return name?.split(/[\\/]/).pop() || `tours_sucursal_${branchId}.xlsx`;
}

export default function TourExcelActions({ branchId, onImported }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const pending = useRef(false);
  const exportPending = useRef(false);
  const mobile = useMediaQuery("(max-width: 599.95px)");
  const validBranch = Number.isSafeInteger(Number(branchId)) && Number(branchId) > 0;

  const exportExcel = async () => {
    if (!validBranch || exportPending.current) return;
    exportPending.current = true; setExporting(true);
    try {
      const response = await exportToursExcel(branchId);
      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      try {
        link.href = url; link.download = downloadName(response.headers["content-disposition"], branchId);
        document.body.appendChild(link); link.click();
      } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
      showToastSuccess("Excel de tours descargado");
    } catch (err) { alertFromAxiosError(err, "No se pudo exportar el Excel de tours"); }
    finally { exportPending.current = false; setExporting(false); }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (pending.current || !validBranch || result) return;
    setError("");
    if (!file || !/\.xlsx$/i.test(file.name)) return setError("Selecciona un archivo XLSX.");
    if (file.size > MAX_SIZE) return setError("El Excel debe pesar como máximo 20 MB.");
    if (images.length > 50) return setError("Selecciona como máximo 50 imágenes.");
    const invalid = images.find((image) => image.size > MAX_SIZE || !IMAGE_EXTENSIONS.test(image.name));
    if (invalid) return setError(`La imagen ${invalid.name} debe tener un formato permitido y pesar como máximo 20 MB.`);
    pending.current = true; setBusy(true);
    try {
      const { data, status } = await importToursExcel(branchId, file, images);
      const created = Array.isArray(data.created) ? data.created : [];
      const duplicates = Array.isArray(data.duplicates) ? data.duplicates : [];
      const errors = Array.isArray(data.errors) ? data.errors : [];
      const summary = { created: data.summary?.created ?? created.length, duplicates: data.summary?.duplicates ?? duplicates.length, errors: data.summary?.errors ?? errors.length };
      if (data.success === false && status !== 207 && !summary.created && !duplicates.length && !errors.length) {
        setError(data.message || "No se pudo importar el archivo."); return;
      }
      setResult({ summary, duplicates, errors, partial: status === 207, message: data.message });
      if (summary.created > 0) await onImported();
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      const details = Array.isArray(data?.errors) ? data.errors.map((row) => `Fila ${row.row ?? ""}${row.name ? ` · ${row.name}` : ""}: ${row.message || "Error de validación"}`).join(" ") : data?.errors ? Object.values(data.errors).flat().join(" ") : "";
      setError([status === 401 ? "Tu sesión expiró. Inicia sesión nuevamente." : status === 403 ? "No tienes permiso para importar tours." : data?.message || "No se pudo importar el Excel. Intenta nuevamente.", details].filter(Boolean).join(" "));
    } finally { pending.current = false; setBusy(false); }
  };

  const accent = action === "export" ? exportColor : importColor;

  return <>
    <Typography variant="subtitle2" fontWeight={800} mb={1}>Importación y exportación de servicios</Typography>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mb={2}>
      <Button variant="contained" startIcon={<UploadFileRoundedIcon />} sx={colorButton(importColor)} disabled={!validBranch || exporting || open} onClick={() => setAction("import")}>Importar Excel</Button>
      <Button variant="contained" startIcon={<FileDownloadRoundedIcon />} sx={colorButton(exportColor)} disabled={!validBranch || exporting || open} onClick={() => setAction("export")}>Exportar Excel</Button>
    </Stack>
    {action && <Dialog open fullWidth maxWidth="sm" fullScreen={mobile} sx={dialogStyle} onClose={exporting ? undefined : () => setAction(null)}>
      <DialogTitle sx={{ bgcolor: accent, color: "#fff", fontWeight: 800 }}>{action === "import" ? "Importar Excel de servicios" : "Exportar Excel de servicios"}</DialogTitle>
      <DialogContent dividers><Stack spacing={2} pt={1}>
        <Typography variant="overline" fontWeight={800}>Servicios disponibles</Typography><Typography color="text.secondary">Selecciona el tipo de servicio.</Typography>
        <Box sx={{ borderLeft: "4px solid #9333ea", bgcolor: "action.hover", p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={1}><Stack direction="row" spacing={1} alignItems="center"><DirectionsBusRoundedIcon sx={{ color: "#9333ea" }} /><Typography variant="h6">Tours</Typography></Stack><Chip label="Disponible" color="success" size="small" /></Stack>
          <Typography variant="body2" color="text.secondary" mb={2}>Tours y paradas de esta sucursal.</Typography>
          <Button fullWidth variant="contained" sx={colorButton(accent)} startIcon={action === "export" ? <FileDownloadRoundedIcon /> : <UploadFileRoundedIcon />} disabled={!validBranch || exporting} onClick={async () => {
            if (action === "export") { await exportExcel(); }
            else { setAction(null); setFile(null); setImages([]); setError(""); setResult(null); setOpen(true); }
          }}>{exporting ? "Exportando…" : action === "import" ? "Importar tours" : "Exportar tours"}</Button>
        </Box>
        <Typography variant="overline" fontWeight={800}>Próximamente</Typography><Box sx={{ borderLeft: "4px solid #64748b", p: 2, bgcolor: "action.hover" }}>
          <Typography fontWeight={700}>Más servicios próximamente</Typography>
          <Typography variant="body2" color="text.secondary">Aquí estarán disponibles otros tipos de servicios.</Typography>
        </Box>
      </Stack></DialogContent>
      <DialogActions><Button disabled={exporting} onClick={() => setAction(null)}>Cerrar</Button></DialogActions>
    </Dialog>}
    {open && <Dialog key={branchId} open fullWidth maxWidth="sm" fullScreen={mobile} sx={dialogStyle} onClose={busy ? undefined : () => setOpen(false)} PaperProps={{ component: "form", onSubmit: submit }}>
      <DialogTitle sx={{ bgcolor: importColor, color: "#fff", fontWeight: 800 }}>Importar tours desde Excel</DialogTitle>
      <DialogContent dividers><Stack spacing={2} pt={1}>
        {error && <Alert severity="error">{error}</Alert>}
        {!result ? <>
          <Typography variant="overline" fontWeight={800}>1. Archivo de tours</Typography>
          <Button component="label" variant="outlined" startIcon={<UploadFileRoundedIcon />} sx={{ minHeight: 44 }} disabled={busy}>Seleccionar Excel<input hidden type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Button>
          <Typography variant="body2">{file?.name || "Ningún XLSX seleccionado"} · Máximo 20 MB</Typography>
          <Typography variant="overline" fontWeight={800}>2. Imágenes opcionales</Typography><Button component="label" variant="outlined" startIcon={<ImageRoundedIcon />} sx={{ minHeight: 44 }} disabled={busy}>Seleccionar imágenes (opcional)<input hidden type="file" multiple accept=".jpg,.jpeg,.png,.webp,.gif,.avif,.heif,.heic,.svg,.bmp,.tif,.tiff" onChange={(e) => setImages(Array.from(e.target.files || []))} /></Button>
          <Typography variant="body2">{images.length} imágenes seleccionadas · Máximo 50 archivos, 20 MB por imagen</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>{images.map((image, index) => <Chip sx={{ maxWidth: "100%", "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }} key={`${image.name}-${index}`} label={image.name} onDelete={busy ? undefined : () => setImages((current) => current.filter((_, i) => i !== index))} />)}</Box>
          <Alert severity="info"><Typography fontWeight={700}>Formato esperado</Typography><Typography variant="body2">Las columnas deben seguir este orden.</Typography><Typography variant="body2"><b>Tours:</b> Nombre, Descripción, Precio, Fecha, Hora, Origen, Destino, Capacidad, Anticipo, Imagen, Visible.</Typography><Typography variant="body2"><b>Paradas:</b> Tour, Fecha, Parada, Hora, Referencia.</Typography><Typography variant="body2" mt={1}>El nombre indicado en la columna Imagen debe coincidir con el nombre del archivo de imagen seleccionado. Las paradas se relacionan por Tour y Fecha. El anticipo va de 0 a 100; Visible acepta Sí o No.</Typography></Alert>
        </> : <>
          <Alert severity={result.partial || result.summary.errors || result.summary.duplicates ? "warning" : "success"}>{result.partial ? "Importación parcial" : "Importación finalizada"}{result.message && <Typography variant="body2">{result.message}</Typography>}</Alert>
          <Stack direction={{ xs: "column", sm: "row" }} gap={2}><Typography>Creados: {result.summary.created}</Typography><Typography>Duplicados: {result.summary.duplicates}</Typography><Typography>Errores: {result.summary.errors}</Typography></Stack>
          {[["Duplicado", result.duplicates, "warning"], ["Error", result.errors, "error"]].flatMap(([label, rows, severity]) => rows.map((row, index) => <Alert key={`${label}-${index}`} severity={severity}><Typography fontWeight={700}>Fila {row.row}{row.name ? ` · ${row.name}` : ""}</Typography>{label}: {row.message}{row.date && <Typography variant="body2">{row.date} {row.time}</Typography>}</Alert>))}
        </>}
      </Stack></DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setOpen(false)}>{result ? "Cerrar" : "Cancelar"}</Button>{!result && <Button type="submit" variant="contained" startIcon={<UploadFileRoundedIcon />} sx={colorButton(importColor)} disabled={busy || !file || !validBranch}>{busy ? "Importando…" : "Importar"}</Button>}</DialogActions>
    </Dialog>}
  </>;
}
