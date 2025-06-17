import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import axiosClient from "../../config/axiosClient";

const ModalPDFPreview = ({ open, onClose, endpoint, nombreArchivo = "documento.pdf" }) => {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (!open) return;

    const fetchPDF = async () => {
      try {
        const response = await axiosClient.get(endpoint, {
          responseType: "blob",
        });

        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        alert("❌ No autenticado o error al generar vista previa");
        setPdfUrl(null);
      }
    };

    fetchPDF();

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [open]);

  const handleDescargar = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = nombreArchivo;
    a.click();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Vista previa del ticket</DialogTitle>
      <DialogContent dividers sx={{ height: "80vh" }}>
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            title="Vista previa del ticket"
            width="100%"
            height="100%"
          />
        ) : (
          <p>Cargando PDF...</p>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDescargar} disabled={!pdfUrl}>
          Descargar
        </Button>
        <Button onClick={onClose} color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalPDFPreview;
