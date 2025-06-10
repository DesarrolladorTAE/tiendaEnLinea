import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress } from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// Función para formatear XML con saltos de línea y sangría
function formatXML(xml) {
  let formatted = '';
  const reg = /(>)(<)(\/*)/g;
  xml = xml.replace(reg, '$1\r\n$2$3');
  let pad = 0;
  xml.split('\r\n').forEach((node) => {
    let indent = 0;
    if (node.match(/.+<\/\w[^>]*>$/)) {
      indent = 0;
    } else if (node.match(/^<\/\w/)) {
      if (pad !== 0) pad -= 2;
    } else if (node.match(/^<\w([^>]*[^/])?>.*$/)) {
      indent = 2;
    } else {
      indent = 0;
    }
    formatted += ' '.repeat(pad) + node + '\r\n';
    pad += indent;
  });
  return formatted;
}

const ModalXMLPreview = ({ open, onClose, xmlUrl, nombreArchivo }) => {
  const [xmlContent, setXmlContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && xmlUrl) {
      setLoading(true);
      fetch(xmlUrl)
        .then((res) => res.text())
        .then((text) => setXmlContent(text))
        .catch(() => setXmlContent("Error al cargar el XML"))
        .finally(() => setLoading(false));
    }
  }, [open, xmlUrl]);

  const handleDescargar = async () => {
    try {
      const response = await fetch(xmlUrl, { mode: "cors" });
      if (!response.ok) throw new Error("No se pudo descargar el XML");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", nombreArchivo || "factura.xml");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("No se pudo descargar el XML");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Vista previa XML</DialogTitle>
      <DialogContent dividers sx={{ height: "80vh", overflowY: "auto" }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <SyntaxHighlighter language="xml" style={vscDarkPlus} customStyle={{ fontSize: 14 }}>
            {formatXML(xmlContent)}
          </SyntaxHighlighter>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDescargar} variant="contained" color="success">
          Descargar XML
        </Button>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalXMLPreview;