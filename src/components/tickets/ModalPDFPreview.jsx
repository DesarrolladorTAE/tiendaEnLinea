import React, { useEffect, useState } from "react";
import { Alert, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Typography } from "@mui/material";
import axiosClient from "../../config/axiosClient";
import { saveAs } from "file-saver";

export default function ModalPDFPreview({ open, onClose, endpoint, downloadEndpoint, nombreArchivo = "documento.pdf", title = "Vista previa del documento" }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  useEffect(() => {
    if (!open || !endpoint) return;
    let active = true, url;
    const controller = new AbortController();
    setPdfUrl(null); setError(""); setDownloadError("");
    axiosClient.get(endpoint, { responseType: "blob", signal: controller.signal }).then(({ data }) => {
      if (!active) return;
      if (data.type && !/pdf|octet-stream/i.test(data.type)) throw new Error("El servidor no devolvió un PDF válido.");
      url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      setPdfUrl(url);
    }).catch(async err => {
      if (!active || controller.signal.aborted) return;
      let message = err.response?.data?.message || err.message;
      if (err.response?.data instanceof Blob) {
        try { message = JSON.parse(await err.response.data.text()).message; } catch { /* Use fallback. */ }
      }
      if (active) setError(message || "No se pudo generar el PDF. Revisa la venta y vuelve a intentar.");
    });
    return () => { active = false; controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [open, endpoint, retry]);
  const download = async () => {
    if (!pdfUrl) return;
    if (downloadEndpoint) {
      setDownloading(true); setDownloadError("");
      try {
        const { data } = await axiosClient.get(downloadEndpoint, { responseType: "blob" });
        if (data.type && !/pdf|octet-stream/i.test(data.type)) throw new Error();
        saveAs(data, nombreArchivo);
      } catch { setDownloadError("No se pudo descargar el documento. Vuelve a intentar."); }
      finally { setDownloading(false); }
      return;
    }
    const link = document.createElement("a"); link.href = pdfUrl; link.download = nombreArchivo; link.click();
  };
  return <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth aria-labelledby="document-pdf-title">
    <DialogTitle id="document-pdf-title">{title}</DialogTitle>
    <DialogContent dividers sx={{ height: "75dvh", p: { xs: 1, sm: 2 } }}>
      {downloadError && <Alert severity="error" sx={{ mb: 1 }}>{downloadError}</Alert>}
      {error ? <Alert severity="error" action={<Button onClick={() => setRetry(n => n + 1)}>Reintentar</Button>}>{error}</Alert> : pdfUrl ? <>
        <Typography variant="caption" sx={{ display: { xs: "block", sm: "none" }, mb: 1 }}>Si tu navegador no muestra el documento, usa Descargar para abrirlo.</Typography>
        <iframe src={pdfUrl} title={title} width="100%" height="95%" style={{ border: 0 }} />
      </> : <Box role="status" sx={{ display: "grid", placeItems: "center", height: "100%" }}><CircularProgress aria-label="Cargando PDF" /></Box>}
    </DialogContent>
    <DialogActions sx={{ flexWrap: "wrap" }}><Button onClick={download} disabled={!pdfUrl || downloading}>{downloading ? "Descargando..." : "Descargar PDF"}</Button><Button onClick={onClose}>Cerrar</Button></DialogActions>
  </Dialog>;
}
