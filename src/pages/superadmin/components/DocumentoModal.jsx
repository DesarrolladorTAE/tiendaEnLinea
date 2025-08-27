import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, IconButton, CircularProgress, Box
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function DocumentoModal({ open, onClose, type, url, title = "Documento" }) {
  const [xmlText, setXmlText] = useState("");
  const [loading, setLoading] = useState(false);
  const isPDF = type === "pdf";
  const isXML = type === "xml";

  useEffect(() => {
    if (open && isXML && url) {
      setLoading(true);
      setXmlText("");
      fetch(url)
        .then(res => res.text())
        .then(text => {
          // pretty print rápido
          try {
            const formatted = new XMLSerializer().serializeToString(
              new DOMParser().parseFromString(text, "application/xml")
            );
            setXmlText(formatted);
          } catch {
            setXmlText(text);
          }
        })
        .catch(() => setXmlText("No se pudo cargar el XML."))
        .finally(() => setLoading(false));
    }
  }, [open, isXML, url]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: "85vh" } }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        {title}
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {isPDF && url && (
          <Box sx={{ height: "calc(85vh - 64px)" }}>
            {/* Iframe para PDF; si tu servidor sirve con cabeceras correctas se verá inline */}
            <iframe
              title="PDF"
              src={url}
              style={{ border: 0, width: "100%", height: "100%" }}
            />
          </Box>
        )}

        {isXML && (
          <Box sx={{ p: 2, height: "calc(85vh - 64px)", overflow: "auto", bgcolor: "#0b1020" }}>
            {loading ? (
              <CircularProgress />
            ) : (
              <pre style={{ color: "#e6edf3", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {xmlText}
              </pre>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
