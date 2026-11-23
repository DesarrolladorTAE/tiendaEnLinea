import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  useMediaQuery,
  useTheme,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import CodeIcon from "@mui/icons-material/Code";

import axiosSuperadmin from "../../../config/axiosSuperadmin"; // AJUSTA la ruta si aplica

// ✅ Librería para que se vea bonito
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import xml from "react-syntax-highlighter/dist/esm/languages/hljs/xml";
import atomOneDark from "react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark";

SyntaxHighlighter.registerLanguage("xml", xml);

// ✅ Formateo XML (indentado simple y útil)
const formatXml = (rawXml) => {
  try {
    if (!rawXml) return "";
    const PADDING = "  ";
    const reg = /(>)(<)(\/*)/g;
    let pad = 0;

    const xmlWithLines = rawXml.replace(reg, "$1\r\n$2$3");

    return xmlWithLines
      .split("\r\n")
      .map((node) => {
        let indent = 0;

        if (node.match(/.+<\/\w[^>]*>$/)) indent = 0;
        else if (node.match(/^<\/\w/)) {
          if (pad !== 0) pad -= 1;
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) indent = 1;

        const line = PADDING.repeat(pad) + node;
        pad += indent;
        return line;
      })
      .join("\r\n");
  } catch (e) {
    return rawXml || "";
  }
};

export default function ModalXML({
  open,
  onClose,
  xmlUrl,
  fileName = "factura.xml",
  titulo = "Vista previa XML",
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blobUrl, setBlobUrl] = useState("");
  const [xmlText, setXmlText] = useState("");
  const [copied, setCopied] = useState(false);

  // ✅ Preview bonito (formateado)
  const prettyXml = useMemo(() => formatXml(xmlText), [xmlText]);

  useEffect(() => {
    let alive = true;

    const cleanup = () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl("");
      setXmlText("");
    };

    if (!open || !xmlUrl) {
      cleanup();
      setError("");
      setLoading(false);
      return;
    }

    const loadXml = async () => {
      setLoading(true);
      setError("");
      setCopied(false);
      cleanup();

      try {
        const res = await axiosSuperadmin.get(xmlUrl, { responseType: "blob" });
        if (!alive) return;

        const url = URL.createObjectURL(res.data);
        setBlobUrl(url);

        // Mostrar preview como texto
        try {
          const text = await res.data.text();
          if (!alive) return;
          setXmlText(text);
        } catch (e) {
          if (!alive) return;
          setXmlText("");
        }
      } catch (err) {
        if (!alive) return;
        console.error("Error al cargar XML:", err);
        setError(
          "No se pudo cargar el XML. Revisa que la suscripción tenga folio_factura y permisos."
        );
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    loadXml();

    return () => {
      alive = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, xmlUrl]);

  const handleDownload = async () => {
    try {
      setError("");
      setLoading(true);

      if (blobUrl) {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      const res = await axiosSuperadmin.get(xmlUrl, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar XML:", err);
      setError("No se pudo descargar el XML.");
    } finally {
      setLoading(false);
    }
  };

  const openInNew = () => {
    if (blobUrl) {
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setError("Primero carga el XML para poder abrirlo en pestaña.");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(prettyXml || xmlText || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      console.error("No se pudo copiar el XML", e);
    }
  };

  const handleClose = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl("");
    setXmlText("");
    setError("");
    setLoading(false);
    setCopied(false);
    onClose?.();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          width: isMobile ? "96%" : "78%",
          height: isMobile ? "88%" : "82%",
          mx: "auto",
          my: isMobile ? "2%" : "4%",
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            px: 2,
            py: 1.25,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "grey.50",
          }}
        >
          <CodeIcon color="primary" fontSize="small" />
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {titulo}
          </Typography>

          <Stack direction="row" spacing={0.5}>
            <Tooltip title={copied ? "Copiado" : "Copiar"}>
              <span>
                <IconButton
                  size="small"
                  onClick={copyToClipboard}
                  disabled={!prettyXml || loading}
                >
                  {copied ? (
                    <CheckIcon fontSize="small" />
                  ) : (
                    <ContentCopyIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Abrir en pestaña">
              <span>
                <IconButton
                  size="small"
                  onClick={openInNew}
                  disabled={!blobUrl || loading}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Descargar">
              <span>
                <IconButton
                  size="small"
                  onClick={handleDownload}
                  disabled={!xmlUrl || loading}
                >
                  <FileDownloadIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {/* Mensaje de error / loader */}
        {(loading || error) && (
          <Box sx={{ px: 2, py: 1 }}>
            {loading && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2">Cargando XML…</Typography>
              </Stack>
            )}
            {error && (
              <Alert severity="error" sx={{ mt: loading ? 1 : 0 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}

        {/* Preview bonito */}
        <Box sx={{ flex: 1, overflow: "auto", bgcolor: "#0b1020" }}>
          <SyntaxHighlighter
            language="xml"
            style={atomOneDark}
            customStyle={{
              margin: 0,
              padding: "18px 20px",
              background: "transparent",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            {loading
              ? "Cargando XML..."
              : prettyXml ||
                "No hay XML para mostrar (o no tienes permisos / no existe folio_factura)."}
          </SyntaxHighlighter>
        </Box>

        {/* Footer */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}
        >
          <Button variant="outlined" onClick={handleClose} fullWidth={isMobile}>
            Cerrar
          </Button>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ width: "100%" }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={openInNew}
              startIcon={<OpenInNewIcon />}
              fullWidth={isMobile}
              disabled={!blobUrl || loading}
            >
              Abrir en pestaña
            </Button>

            <Button
              variant="contained"
              color="secondary"
              onClick={handleDownload}
              startIcon={<FileDownloadIcon />}
              fullWidth={isMobile}
              disabled={!xmlUrl || loading}
            >
              Descargar XML
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}
