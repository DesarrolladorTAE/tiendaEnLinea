import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { showSuccess, showError } from "../../utils/alerts"; // ajusta si es necesario

export default function TicketDialog({ open, onClose, sale, ticketUrl, onPrint, onSend }) {
  const [phone, setPhone] = useState("");
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingPrint, setLoadingPrint] = useState(false);

  const handleSend = async () => {
    if (!phone.match(/^\+?[0-9]{10,}$/)) return;

    setLoadingSend(true);
    try {
      await onSend(phone); // debe ser una función async que devuelva una Promise
      showSuccess("📨 Ticket enviado por WhatsApp");
    } catch (err) {
      console.error(err);
      showError("❌ Error al enviar por WhatsApp");
    } finally {
      setLoadingSend(false);
    }
  };

  const handlePrint = async () => {
    setLoadingPrint(true);
    try {
      await onPrint(); // también se asume que devuelve una Promise
    } catch (err) {
      console.error(err);
      showError("❌ Error al imprimir ticket");
    } finally {
      setLoadingPrint(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Ticket #{sale?.id}</DialogTitle>
      <DialogContent dividers>
        <iframe
          src={ticketUrl}
          width="100%"
          height="400"
          title="Ticket preview"
          style={{ border: "none" }}
        />
        <TextField
          label="Número WhatsApp"
          fullWidth
          margin="dense"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="ej. 5512345678"
          inputProps={{
            maxLength: 10,
            inputMode: "numeric",
            pattern: "[0-9]{10}",
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handlePrint} disabled={loadingPrint}>
          {loadingPrint ? <CircularProgress size={20} /> : "🖨️ Imprimir"}
        </Button>
        <Button onClick={handleSend} disabled={!phone.match(/^\+?[0-9]{10,}$/) || loadingSend}>
          {loadingSend ? <CircularProgress size={20} /> : "✉️ Enviar"}
        </Button>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
