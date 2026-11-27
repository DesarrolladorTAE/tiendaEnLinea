import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Typography } from "@mui/material";
import axiosClient from "../../config/axiosClient";
import { blobHasSignature, readBlob } from "../../utils/readBlob";
import { saveAs } from "file-saver";

export default function ModalPDFPreview({ open, onClose, endpoint, downloadEndpoint, nombreArchivo = "documento.pdf", title = "Vista previa del documento", privateDocument = false, validateSignature = false, onAccessDenied, httpClient = axiosClient }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const accessHandler = useRef(onAccessDenied);
  accessHandler.current = onAccessDenied;
  useEffect(() => {
    if (!open || !endpoint) return;
    let active = true, url;
    const controller = new AbortController();
    setPdfUrl(null); setError(""); setDownloadError("");
    httpClient.get(endpoint, { responseType: "blob", signal: controller.signal, ...(privateDocument ? { __skipSupportIncident: true, ...(validateSignature ? { __skipAuthRedirect: true } : {}) } : {}) }).then(async ({ data }) => {
      if (!active) return;
      if (validateSignature && data instanceof Blob && /json/i.test(data.type)) {
        const body = JSON.parse(await readBlob(data, "text"));
        if (active) setError(body.message || "El servidor no devolvió un PDF válido.");
        return;
      }
      if (data.type && !/pdf|octet-stream/i.test(data.type)) throw new Error("El servidor no devolvió un PDF válido.");
      if (validateSignature) {
        if (!(data instanceof Blob)) throw new Error("El servidor no devolvió un PDF válido.");
        if (!await blobHasSignature(data, [37, 80, 68, 70])) throw new Error("El archivo recibido no tiene firma PDF.");
        if (!active) return;
      }
      url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      setPdfUrl(url);
    }).catch(async err => {
      if (!active || controller.signal.aborted) return;
      const privateErrors = { 401: "Inicia sesión para consultar el documento.", 403: "No tienes permiso para consultar este documento.",
        404: "El documento no está disponible en este contexto." };
      const accessError = privateErrors[err.response?.status];
      if (accessError) {
        accessHandler.current?.(err);
        if (privateDocument) { setError(accessError); return; }
      }
      let message = err.response?.data?.message || err.message;
      if (err.response?.data instanceof Blob) {
        try { message = JSON.parse(await readBlob(err.response.data, "text")).message; } catch { /* Use fallback. */ }
      }
      if (validateSignature && /PDF|firma|archivo/i.test(err.message) && !err.response && active) { setError(err.message); return; }
      if (active) setError(privateDocument ?
        (validateSignature && message) || "No se pudo cargar el documento privado. Inténtalo de nuevo." :
        message || "No se pudo generar el PDF. Revisa la venta y vuelve a intentar.");
    });
    return () => { active = false; controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [httpClient, open, endpoint, retry, privateDocument, validateSignature]);
  const download = async () => {
    if (!pdfUrl) return;
    if (downloadEndpoint) {
      setDownloading(true); setDownloadError("");
      try {
        const { data } = await httpClient.get(downloadEndpoint, { responseType: "blob" });
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
