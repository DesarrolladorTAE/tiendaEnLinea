import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
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
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (node.match(/^<\/\w/)) {
        if (pad !== 0) pad -= 1;
      } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
        indent = 1;
      }
      const line = PADDING.repeat(pad) + node;
      pad += indent;
      return line;
    })
    .join("\r\n");
};

const ModalXML = ({ open, onClose, downloadUrl, fileName = "factura.xml" }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [xmlContent, setXmlContent] = useState("Cargando...");

  useEffect(() => {
    if (open) fetchXml();
  }, [open]);

  const fetchXml = async () => {
    try {
      const res = await fetch(downloadUrl);
      const text = await res.text();
      setXmlContent(formatXml(text));
    } catch (err) {
      console.error("Error al cargar XML:", err);
      setXmlContent("Error al cargar el XML.");
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = fileName; // nombre personalizado
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar XML:", err);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          width: isMobile ? "95%" : "80%", // más chico
          height: isMobile ? "85%" : "70%", // altura menor
          mx: "auto",
          my: "5%",
          bgcolor: "background.paper",
          borderRadius: 2,
          p: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography variant="h6" mb={2}>
          🧾 Vista previa del XML
        </Typography>

        <Box
          sx={{
            flexGrow: 1,
            overflow: "auto",
            border: "1px solid #ccc",
            borderRadius: 1,
          }}
        >
          <SyntaxHighlighter
            language="xml"
            style={atomOneDark}
            customStyle={{
              margin: 0,
              padding: "1rem",
              background: "#1e1e1e",
              fontSize: "0.85rem",
            }}
          >
            {xmlContent}
          </SyntaxHighlighter>
        </Box>

        <Box
          mt={2}
          display="flex"
          flexDirection={isMobile ? "column" : "row"}
          justifyContent="space-between"
          gap={2}
        >
          <Button variant="outlined" onClick={onClose} fullWidth={isMobile}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleDownload}
            fullWidth={isMobile}
          >
            Descargar XML
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ModalXML;
