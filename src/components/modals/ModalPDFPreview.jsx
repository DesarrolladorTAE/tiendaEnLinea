import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

const ModalPDFPreview = ({ open, onClose, pdfUrl, nombreArchivo = "factura.pdf" }) => {
  const handleDescargar = async () => {
    try {
      const response = await fetch(pdfUrl, { mode: "cors" });
      if (!response.ok) throw new Error("No se pudo descargar el PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", nombreArchivo);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("No se pudo descargar el PDF");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Vista previa PDF</DialogTitle>
      <DialogContent dividers sx={{ height: "80vh" }}>
        <iframe
          src={pdfUrl}
          title="Factura PDF"
          width="100%"
          height="100%"
          style={{ border: "none" }}
        ></iframe>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDescargar} variant="contained" color="error">
          Descargar PDF
        </Button>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalPDFPreview;