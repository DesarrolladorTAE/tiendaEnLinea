import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Stack,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import CloseIcon from "@mui/icons-material/Close";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import axiosClient from "../config/axiosClientPOS";
import { showSuccess, showError } from "../utils/alerts";

export default function ModalTicketVenta({ open, onClose, ventaId }) {
  const [numero, setNumero] = useState("");
  const [sending, setSending] = useState(false);

  if (!ventaId) return null;

  const baseUrl = window.location.origin.includes("localhost")
    ? "https://mitiendaenlineamx.com.mx"
    : window.location.origin;

  const url = `${baseUrl}/api/sales/${ventaId}/ticket.pdf`;

  const handlePrint = () => {
    const iframe = document.getElementById("iframe-ticket");
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  const handleNumeroChange = (e) => {
    const input = e.target.value.replace(/\D/g, "").slice(0, 10);
    setNumero(input);
  };

  const handleEnviarWhatsapp = async () => {
    if (numero.length !== 10) {
      showError("Ingresa un número válido de 10 dígitos.");
      return;
    }

    setSending(true);
    try {
      await axiosClient.post(`/sales/${ventaId}/send-whatsapp`, { phone : numero });
      showSuccess("Ticket enviado por WhatsApp correctamente.");
      setNumero(""); // <-- Limpia el input después del envío
    } catch (error) {
      console.error("Error al enviar WhatsApp:", error);
      showError("No se pudo enviar el ticket.");
    } finally {
      setSending(false);
    }
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

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Stack spacing={1} direction="row" alignItems="center" sx={{ flexGrow: 1 }}>
          <TextField
            label="Número para WhatsApp"
            value={numero}
            onChange={handleNumeroChange}
            placeholder="5522334455"
            size="small"
            inputProps={{ inputMode: "numeric", maxLength: 10 }}
          />
          <Button
            variant="contained"
            color="success"
            startIcon={<WhatsAppIcon />}
            onClick={handleEnviarWhatsapp}
            disabled={sending || numero.length !== 10}
          >
            {sending ? <CircularProgress size={20} color="inherit" /> : "Enviar"}
          </Button>
        </Stack>

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
