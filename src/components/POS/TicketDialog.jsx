import React, { useState, useEffect } from "react";
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
import { showSuccess, showError } from "../../utils/alerts";

export default function TicketDialog({
  open,
  onClose,
  sale,
  ticketUrl,
  onPrint,
  onSend,
}) {
  const [phone, setPhone] = useState("");
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingPrint, setLoadingPrint] = useState(false);

  // Limpia campos cada vez que se abre o cambia la venta
  useEffect(() => {
    if (open) {
      setPhone("");
      setLoadingSend(false);
      setLoadingPrint(false);
    }
  }, [open, sale?.id]);

  // Limpia también al cerrar definitivamente (por si el padre mantiene montado el dialog)
  const handleClose = () => {
    setPhone("");
    setLoadingSend(false);
    setLoadingPrint(false);
    onClose?.();
  };

  const digitsOnly = (v) => v.replace(/\D/g, "");
  const isValidPhone = /^\d{10}$/.test(phone); // ajusta si usas otro formato

  const handleSend = async () => {
    if (!isValidPhone) return;
    setLoadingSend(true);
    try {
      await onSend(digitsOnly(phone));
      showSuccess("📨 Ticket enviado por WhatsApp");
      // Si quieres cerrar después de enviar, descomenta:
      // handleClose();
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
    const text = [
      "TAE PRINT TEST",
      "------------------------------",
      "Ticket #000123",
      `Fecha: ${new Date().toLocaleString()}`,
      "",
      "Producto A     1 x 50.00  50.00",
      "Producto B     2 x 25.00  50.00",
      "------------------------------",
      "TOTAL:                 100.00",
      "",
      "GRACIAS POR SU COMPRA",
      "",
      "",
    ].join("\n");

    if (window.AndroidPrintBridge?.print) {
      window.AndroidPrintBridge.print(JSON.stringify({ text, cut: true }));
      showSuccess("🖨️ Enviado a imprimir (USB)");
      return;
    }

    throw new Error("No estas dentro de la app TaePrintBridge (WebView).");
  } catch (err) {
    console.error(err);
    showError(`❌ Error al imprimir: ${err.message || err}`);
  } finally {
    setLoadingPrint(false);
  }
};



  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
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
          onChange={(e) => setPhone(digitsOnly(e.target.value))}
          placeholder="5512345678"
          inputProps={{ maxLength: 10, inputMode: "numeric", pattern: "\\d{10}" }}
          helperText="Ingresa 10 dígitos (MX)."
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handlePrint} disabled={loadingPrint}>
          {loadingPrint ? <CircularProgress size={20} /> : "🖨️ Imprimir"}
        </Button>
        <Button onClick={handleSend} disabled={!isValidPhone || loadingSend}>
          {loadingSend ? <CircularProgress size={20} /> : "✉️ Enviar"}
        </Button>
        <Button onClick={handleClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
