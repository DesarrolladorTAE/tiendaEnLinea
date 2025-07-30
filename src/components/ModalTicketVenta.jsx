import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import CloseIcon from "@mui/icons-material/Close";

export default function ModalTicketVenta({ open, onClose, ventaId }) {
  if (!ventaId) return null;

  const baseUrl = window.location.origin.includes("localhost")
    ? "https://mitiendaenlineamx.com.mx"
    : window.location.origin;

  const url = `${baseUrl}/api/sales/${ventaId}/ticket.pdf`;

  const handlePrint = () => {
    const iframe = document.getElementById("iframe-ticket");
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        Ticket de Venta #{ventaId}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <iframe
          id="iframe-ticket"
          title="Ticket PDF"
          src={url}
          style={{
            width: "100%",
            height: "600px",
            border: "none",
          }}
        />
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintIcon />}
          color="primary"
        >
          Imprimir
        </Button>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
