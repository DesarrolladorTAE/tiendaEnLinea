import React, { useEffect, useState } from "react";
import {
  Alert, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, Stack, Typography,
  useMediaQuery, Tooltip, Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import xml from "react-syntax-highlighter/dist/esm/languages/hljs/xml";
import atomOneDark from "react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { formatXml } from "../../utils/formatXml";

SyntaxHighlighter.registerLanguage("xml", xml);

export default function FacturaXmlDialog({ open, onClose, xmlUrl, folio, fileName }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [blobUrl, setBlobUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState("");
  const currentDocument = document?.url === xmlUrl ? document : null;

  useEffect(() => {
    const controller = new AbortController();
    setDocument(null);
    setCopied(false);
    setActionError("");
    setError("");
    setLoading(false);
    if (!open || !xmlUrl) return () => controller.abort();

    setLoading(true);
    (async () => {
      try {
        const response = await fetch(xmlUrl, { signal: controller.signal });
        if (!response.ok) throw new Error(`No se pudo cargar el XML (HTTP ${response.status}).`);
        const text = await response.text();
        const parsed = new DOMParser().parseFromString(text, "application/xml");
        if (!text.trim() || parsed.getElementsByTagName("parsererror").length || parsed.documentElement?.localName.toLowerCase() === "html") {
          throw new Error("El archivo recibido no es un XML válido.");
        }
        if (!controller.signal.aborted) setDocument({ url: xmlUrl, text, formattedText: formatXml(text) });
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message || "No se pudo cargar el XML.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [open, xmlUrl, attempt]);

  useEffect(() => {
    if (!open || !currentDocument) { setBlobUrl(""); return; }
    const url = URL.createObjectURL(new Blob([currentDocument.text], { type: "application/xml;charset=utf-8" }));
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [open, currentDocument]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1200);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleDownload = () => {
    if (!currentDocument || !blobUrl) return;
    const link = window.document.createElement("a");
    link.href = blobUrl;
    link.download = fileName || "factura_" + (folio || "documento") + ".xml";
    window.document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const openInNew = () => {
    if (currentDocument && blobUrl) window.open(blobUrl, "_blank", "noopener,noreferrer");
  };

  const copyToClipboard = async () => {
    if (!currentDocument) return;
    try {
      await navigator.clipboard.writeText(currentDocument.formattedText);
      setCopied(true);
      setActionError("");
    } catch {
      setActionError("No se pudo copiar el XML. Intenta seleccionarlo y copiarlo manualmente.");
    }
  };

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth={false} fullScreen={fullScreen}
    PaperProps={{ sx: { width: { xs: "100%", sm: "92vw", md: "82vw", lg: "78vw" }, maxWidth: { xs: "none", sm: 1100 }, height: { xs: "100%", sm: "72dvh" }, m: { xs: 0, sm: 2 }, borderRadius: { xs: 0, sm: 3 }, overflow: "hidden" } }}>
    <DialogTitle sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1.5, sm: 1 } }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <CodeRoundedIcon color="primary" />
        <Typography component="span" variant="subtitle1" fontWeight={800} sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>XML de factura {folio ? "#" + folio : ""}</Typography>
        <Stack direction="row" spacing={0.25} alignItems="center">
          <Tooltip title={copied ? "Copiado" : "Copiar XML"}><span><IconButton size="small" aria-label={copied ? "XML copiado" : "Copiar XML"} onClick={copyToClipboard} disabled={!currentDocument || loading}>{copied ? <CheckRoundedIcon color="success" /> : <ContentCopyRoundedIcon />}</IconButton></span></Tooltip>
          <Tooltip title="Abrir en pestaña"><span><IconButton size="small" aria-label="Abrir XML en otra pestaña" onClick={openInNew} disabled={!currentDocument || !blobUrl || loading}><OpenInNewRoundedIcon /></IconButton></span></Tooltip>
          <Tooltip title="Descargar XML"><span><IconButton size="small" aria-label="Descargar XML" onClick={handleDownload} disabled={!currentDocument || !blobUrl || loading}><DownloadRoundedIcon /></IconButton></span></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <IconButton size="small" onClick={onClose} aria-label="Cerrar visor XML"><CloseRoundedIcon /></IconButton>
        </Stack>
      </Stack>
    </DialogTitle>
    {actionError && <Alert severity="warning" onClose={() => setActionError("")}>{actionError}</Alert>}
    <DialogContent dividers sx={{ p: 0, flex: 1, minHeight: 0, bgcolor: "#0b1020", color: "#abb2bf", "& > .MuiStack-root, & > .MuiAlert-root": { m: 2 } }}>
      {!xmlUrl ? <Alert severity="info">No hay XML disponible para esta factura.</Alert>
        : loading ? <Stack alignItems="center" spacing={2} sx={{ py: 5 }}><CircularProgress /><Typography>Cargando XML...</Typography></Stack>
        : error ? <Stack spacing={2}>
          <Alert severity="error">{error}</Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button onClick={() => setAttempt(value => value + 1)}>Reintentar</Button>
            <Button component="a" href={xmlUrl} target="_blank" rel="noopener noreferrer">Abrir archivo original</Button>
          </Stack>
        </Stack>
        : currentDocument && <SyntaxHighlighter
            language="xml"
            style={atomOneDark}
            showLineNumbers={false}
            wrapLines={fullScreen}
            wrapLongLines={fullScreen}
            customStyle={{ margin: 0, padding: fullScreen ? 12 : 16, background: "transparent", borderRadius: 0, fontSize: fullScreen ? 12 : 13, lineHeight: 1.6, overflowWrap: "anywhere" }}
            codeTagProps={{ style: { whiteSpace: fullScreen ? "pre-wrap" : "pre", overflowWrap: fullScreen ? "anywhere" : "normal" } }}
            aria-label="Contenido XML de la factura"
          >{currentDocument.formattedText}</SyntaxHighlighter>}
    </DialogContent>
    <DialogActions sx={{ p: { xs: 2, sm: 1.25 }, flexDirection: { xs: "column", sm: "row" }, alignItems: "stretch", justifyContent: "flex-start", gap: 1.5, "& > :not(style) ~ :not(style)": { ml: 0 } }}>
      <Button onClick={onClose} variant="outlined" fullWidth={fullScreen}>Cerrar</Button>
      <Button onClick={openInNew} variant="contained" startIcon={<OpenInNewRoundedIcon />} disabled={!currentDocument || !blobUrl || loading} fullWidth={fullScreen}>Abrir en pestaña</Button>
      <Button onClick={handleDownload} variant="contained" color="secondary" startIcon={<DownloadRoundedIcon />} disabled={!currentDocument || !blobUrl || loading} fullWidth={fullScreen}>Descargar XML</Button>
    </DialogActions>
  </Dialog>;
}
