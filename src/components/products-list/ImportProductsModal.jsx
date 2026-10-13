import React, { useRef, useState } from "react";
import {
  Alert, Box, Button, ButtonBase, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, LinearProgress, Stack, Typography,
} from "@mui/material";
import { FiCheckCircle, FiDatabase, FiDownload, FiFileText, FiUploadCloud } from "react-icons/fi";
import axiosClient from "../../config/axiosClient";
import { summarizeProductCsv } from "./importPreview.mjs";
import { normalizeImportResult } from "./importResult.mjs";
import ImportResultSummary from "./ImportResultSummary";

const OPTIONS = [
  { id: "normal", title: "Importación normal", description: "Carga tus productos con nuestra plantilla CSV.", color: "#6d28d9", background: "#f5f3ff", icon: FiFileText },
  { id: "sicar", title: "Desde SICAR", description: "Sube el archivo de productos que exportaste de SICAR.", color: "#0f766e", background: "#f0fdfa", icon: FiDatabase },
];

export default function ImportProductsModal({ open, onClose, branch, onImported }) {
  const [mode, setMode] = useState("normal");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState("preparing");
  const [uploadProgress, setUploadProgress] = useState(null);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);
  const submitting = useRef(false);
  const selected = OPTIONS.find((option) => option.id === mode);

  const clearFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const selectMode = (value) => {
    setMode(value);
    clearFile();
    setNotice(null);
    setResult(null);
  };

  const importProducts = async () => {
    if (!file || !branch?.id || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setNotice(null);
    setResult(null);
    setPhase("preparing");
    setUploadProgress(null);
    setPreview(null);
    const data = new FormData();
    data.append("archivo", file);
    const resultContext = {
      date: new Date().toISOString(), mode: mode === "sicar" ? "SICAR" : "Normal",
      filename: file.name, branch: branch.name || `#${branch.id}`,
    };
    try {
      // Preview failures must never prevent uploading the original file.
      if (/\.csv$/i.test(file.name) && file.size <= 10 * 1024 * 1024) {
        try { setPreview(summarizeProductCsv(await file.text())); } catch { /* Preview unavailable. */ }
      }
      setPhase("uploading");
      const response = await axiosClient.post(
        mode === "sicar" ? "/productos/importar-sicar" : "/cargar/importarDesdeCSV",
        data,
        {
          params: { branch_id: branch.id },
          onUploadProgress: ({ loaded, total }) => {
            if (total > 0) {
              setUploadProgress(Math.min(100, Math.round((loaded / total) * 100)));
              if (loaded >= total) setPhase("processing");
            }
          },
        },
      );
      setPhase("refreshing");
      clearFile();
      setResult({ ...normalizeImportResult(response?.data), ...resultContext });
      try {
        await onImported();
      } catch {
        setNotice({ severity: "warning", message: "El resultado de la importación está disponible, pero no se pudo actualizar la tabla." });
      }
    } catch (error) {
      setResult({ ...normalizeImportResult(error.response?.data || { message: "No se pudo confirmar el resultado. Revisa tu conexión y el catálogo antes de volver a intentarlo." }, true), ...resultContext });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} fullWidth maxWidth="sm"
      aria-labelledby="import-products-title" PaperProps={{ sx: { borderRadius: 4, bgcolor: "#fff", color: "#172033" } }}>
      <DialogTitle id="import-products-title" sx={{ p: 3, background: "linear-gradient(120deg, #ede9fe, #ccfbf1)" }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ display: "flex", p: 1.5, borderRadius: 3, bgcolor: "white", color: "#6d28d9" }}><FiUploadCloud size={28} /></Box>
          <Box>
            <Typography component="span" sx={{ display: "block", fontSize: 23, fontWeight: 800 }}>Importar productos</Typography>
            <Typography variant="body2">Elige cómo quieres cargar tu catálogo.</Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {busy ? (
          <Box sx={{ py: 3, textAlign: "center" }} aria-busy="true">
            <Typography sx={{ fontSize: 22, fontWeight: 800 }}>
              {preview ? `${preview.total.toLocaleString("es-MX")} productos en el archivo` : "Importación de productos"}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: "#526077" }}>Sucursal: {branch?.name || `#${branch?.id}`}</Typography>
            <Box sx={{ position: "relative", width: 152, height: 152, mx: "auto", my: 3 }}>
              <CircularProgress variant="determinate" value={100} size={152} thickness={2.5} sx={{ color: selected.background, position: "absolute", inset: 0 }} aria-hidden="true" />
              <CircularProgress variant={phase === "uploading" && uploadProgress !== null ? "determinate" : "indeterminate"}
                value={uploadProgress || 0} size={152} thickness={2.5} aria-label={phase === "uploading" ? "Progreso de subida del archivo" : "Procesando productos"}
                sx={{ color: selected.color, position: "absolute", inset: 0, "& .MuiCircularProgress-circle": { strokeLinecap: "round" }, "@media (prefers-reduced-motion: reduce)": { animation: "none", "& circle": { animation: "none" } } }} />
              <Box sx={{ position: "absolute", inset: 13, borderRadius: "50%", bgcolor: "white", boxShadow: "0 8px 30px #17203312", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <Box component="img" src="/assets/logo1.png" alt="Mi Tienda en Línea MX" sx={{ width: "80%", height: "80%", objectFit: "contain" }} />
              </Box>
            </Box>
            <Box role="status" aria-live="polite">
              <Typography sx={{ fontWeight: 750, color: selected.color }}>
                {phase === "preparing" ? "Leyendo tu archivo..." : phase === "uploading" ? `Subiendo archivo${uploadProgress !== null ? ` · ${uploadProgress}%` : "..."}` : phase === "refreshing" ? "Actualizando tu catálogo..." : "Importando tus productos..."}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: "#526077" }}>
                {phase === "processing" ? "El archivo ya se subió. Estamos esperando el resultado de la importación." : "Mantén esta ventana abierta hasta que termine."}
              </Typography>
            </Box>
            <LinearProgress variant={phase === "uploading" && uploadProgress !== null ? "determinate" : "indeterminate"} value={uploadProgress || 0}
              aria-label="Estado de la carga" sx={{ my: 2, mx: "auto", maxWidth: 280, height: 5, borderRadius: 4, bgcolor: selected.background, "& .MuiLinearProgress-bar": { bgcolor: selected.color, "@media (prefers-reduced-motion: reduce)": { animation: "none" } } }} />
            {!!preview?.names.length && (
              <Box sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: selected.background, textAlign: "left" }}>
                <Typography variant="body2" sx={{ fontWeight: 750, mb: 1 }}>Productos detectados en tu archivo</Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5, maxHeight: 132, overflowY: "auto", color: "#526077" }}>
                  {preview.names.map((name, index) => <Typography component="li" variant="body2" key={index} sx={{ py: 0.3, overflowWrap: "anywhere" }}>{name}</Typography>)}
                </Box>
                <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#526077" }}>Vista previa{preview.total > preview.names.length ? ` · mostrando ${preview.names.length} de ${preview.total}` : ""}. La importación se confirma al terminar.</Typography>
              </Box>
            )}
          </Box>
        ) : (
        <>
        {result && <ImportResultSummary result={result} />}
        <Typography variant="body2" sx={{ mt: 2, mb: 2, color: "#526077" }}>
          Sucursal de destino: <strong>{branch?.name || `#${branch?.id}`}</strong>
        </Typography>
        <Box role="group" aria-label="Tipo de importación" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          {OPTIONS.map(({ id, title, description, color, background, icon: Icon }) => (
            <ButtonBase key={id} disabled={busy} onClick={() => selectMode(id)} aria-pressed={mode === id}
              sx={{ p: 2, borderRadius: 3, textAlign: "left", alignItems: "stretch", border: "2px solid", borderColor: mode === id ? color : "#e2e8f0", bgcolor: mode === id ? background : "#fff", "&.Mui-focusVisible": { outline: `3px solid ${color}`, outlineOffset: 3 } }}>
              <Box sx={{ width: "100%" }}>
                <Stack direction="row" justifyContent="space-between" sx={{ color, mb: 1.5 }}>
                  <Icon size={26} />{mode === id && <FiCheckCircle size={20} />}
                </Stack>
                <Typography sx={{ fontWeight: 750, mb: 0.5 }}>{title}</Typography>
                <Typography variant="body2" sx={{ color: "#526077" }}>{description}</Typography>
              </Box>
            </ButtonBase>
          ))}
        </Box>
        <Box sx={{ my: 2.5, p: 2, bgcolor: selected.background, borderRadius: 3 }}>
          <Typography variant="body2" sx={{ mb: mode === "normal" ? 1 : 0 }}>
            {mode === "normal" ? "1. Descarga la plantilla y completa tus productos. Después, selecciona tu archivo CSV." : "1. Exporta tus productos desde SICAR. Después, selecciona ese archivo para importarlo aquí."}
          </Typography>
          {mode === "normal" && <Button component="a" href="/assets/ejemploCSV/CSVejemplo.csv" download startIcon={<FiDownload />} sx={{ color: selected.color, textTransform: "none" }}>Descargar CSV de ejemplo</Button>}
        </Box>
        <Box sx={{ p: 3, border: "2px dashed #cbd5e1", borderRadius: 3, textAlign: "center" }}>
          <FiUploadCloud size={32} color={selected.color} aria-hidden="true" />
          <Typography sx={{ mt: 1, mb: 1.5, fontWeight: 600, overflowWrap: "anywhere" }}>{file ? file.name : "2. Selecciona tu archivo de productos"}</Typography>
          <input ref={inputRef} type="file" accept={mode === "normal" ? ".csv" : undefined} hidden onChange={(event) => {
            const next = event.target.files?.[0];
            setNotice(null);
            if (!next) return;
            if (!next.size || (mode === "normal" && !/\.csv$/i.test(next.name))) {
              clearFile();
              setNotice({ severity: "error", message: !next.size ? "El archivo está vacío." : "Selecciona un archivo CSV para la importación normal." });
              return;
            }
            setFile(next);
          }} />
          <Button variant="outlined" disabled={busy} onClick={() => inputRef.current?.click()} sx={{ color: selected.color, borderColor: selected.color, textTransform: "none" }}>{file ? "Cambiar archivo" : "Seleccionar archivo"}</Button>
        </Box>
        {notice && <Alert severity={notice.severity} sx={{ mt: 2 }}>{notice.message}</Alert>}
        </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} disabled={busy} sx={{ color: "#526077", textTransform: "none" }}>Cerrar</Button>
        <Button variant="contained" onClick={importProducts} disabled={!file || busy || !branch?.id}
          startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <FiUploadCloud />}
          sx={{ bgcolor: selected.color, "&:hover": { bgcolor: selected.color }, borderRadius: 2, textTransform: "none", px: 3 }}>
          {busy ? "Importando..." : mode === "sicar" ? "Importar desde SICAR" : "Importar productos"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
