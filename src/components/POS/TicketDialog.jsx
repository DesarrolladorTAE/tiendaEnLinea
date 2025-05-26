// components/POS/TicketDialog.jsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from "@mui/material";

export default function TicketDialog({ open, onClose, sale, ticketUrl, onPrint, onSend }) {
  const [phone, setPhone] = useState("");

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
        <Button onClick={onPrint}>🖨️ Imprimir</Button>
        <Button onClick={() => onSend(phone)} disabled={!phone.match(/^\+?[0-9]{10,}$/)}>
          ✉️ Enviar
        </Button>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
