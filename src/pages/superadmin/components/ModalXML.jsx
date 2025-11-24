import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CodeIcon from "@mui/icons-material/Code";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import xml from "react-syntax-highlighter/dist/esm/languages/hljs/xml";
import atomOneDark from "react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark";

SyntaxHighlighter.registerLanguage("xml", xml);

const formatXml = (xml) => {
  const PADDING = "  ";
  const reg = /(>)(<)(\/*)/g;
  let pad = 0;
  xml = xml.replace(reg, "$1\r\n$2$3");
  return xml
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
};

export default function ModalXML({
  open,
  onClose,
  downloadUrl,
  fileName = "factura.xml",
  titulo = "Vista previa XML",
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [xmlContent, setXmlContent] = useState("Cargando...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Si no hay URL, mostramos mensaje directo
    if (!downloadUrl) {
      setXmlContent("No se encontró la ruta para descargar el XML.");
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(downloadUrl, { credentials: "include" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} al cargar XML`);
        }

        const text = await res.text();
        setXmlContent(formatXml(text));
      } catch (err) {
        console.error("Error al cargar XML:", err);
        setXmlContent("Error al cargar el XML desde el servidor.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, downloadUrl]);

  const handleDownload = async () => {
    if (!downloadUrl) return;
    try {
      const res = await fetch(downloadUrl, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status} al descargar XML`);
      const blob = await res.blob();
      const a = document.createElement("a");
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar XML:", err);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(xmlContent || "");
    } catch (e) {
      console.error("No se pudo copiar el XML", e);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          width: isMobile ? "96%" : "78%",
          height: isMobile ? "90%" : "84%",
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
          <CodeIcon color="secondary" fontSize="small" />
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
            <IconButton
              size="small"
              onClick={copyToClipboard}
              disabled={loading || !downloadUrl}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleDownload}
              disabled={loading || !downloadUrl}
            >
              <FileDownloadIcon fontSize="small" />
            </IconButton>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {/* XML */}
        <Box sx={{ flex: 1, overflow: "auto", bgcolor: "#0b1020" }}>
          <SyntaxHighlighter
            language="xml"
            style={atomOneDark}
            customStyle={{
              margin: 0,
              padding: "18px 20px",
              background: "transparent",
              fontSize: "0.9rem",
              lineHeight: 1.6,
            }}
          >
            {loading ? "Cargando XML..." : xmlContent}
          </SyntaxHighlighter>
        </Box>

        {/* Footer */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}
        >
          <Button variant="outlined" onClick={onClose} fullWidth={isMobile}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleDownload}
            startIcon={<FileDownloadIcon />}
            disabled={loading || !downloadUrl}
            fullWidth={isMobile}
          >
            Descargar XML
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}
