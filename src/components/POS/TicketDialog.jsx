import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
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

  useEffect(() => {
    if (open) {
      setPhone("");
      setLoadingSend(false);
      setLoadingPrint(false);
    }
  }, [open, sale?.id]);

  const handleClose = () => {
    setPhone("");
    setLoadingSend(false);
    setLoadingPrint(false);
    onClose?.();
  };

  const digitsOnly = (v) => v.replace(/\D/g, "");
  const isValidPhone = /^\d{10}$/.test(phone);

  const handleSend = async () => {
    if (!isValidPhone) return;
    setLoadingSend(true);
    try {
      await onSend(digitsOnly(phone));
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

  // ✅ timeout en ms
  const TIMEOUT_MS = 8000;

  try {
    const text = [
      "ZAPATERIA CHUCHO",
      "RFC: XAXX010101000",
      "TEL: 55 0000 0000",
      "------------------------------",
      `Ticket #${sale?.id ?? "000123"}`,
      `Fecha: ${new Date().toLocaleString()}`,
      "------------------------------",
      "Producto y     1 x 50.00  50.00",
      "Producto tota     2 x 25.00  50.00",
      "------------------------------",
      "TOTAL:                 100.00",
      "",
      "GRACIAS POR SU COMPRA",
      "",
    ].join("\n");

    const payload = {
      transport: "usb",
      text,
      cut: true,
      openDrawer: true,
      drawerPin: 0,
      qrText: "https://mitiendaenlineamx.com.mx",
      qrSize: 8,
      qrEcc: 49,
    };

    // ✅ Caso 1: APP (WebView con JS Interface) => aquí NO necesitas timeout
    if (window.AndroidPrintBridge?.print) {
      window.AndroidPrintBridge.print(JSON.stringify(payload));
      showSuccess("🖨️ Enviado a imprimir (USB)");
      return;
    }

    // ✅ Caso 2: navegador normal => pegarle al server de la TABLET
    // (127.0.0.1 es el navegador mismo, NO la tablet si estás en otra máquina)
    const PRINTBRIDGE_HOST = "192.168.1.200";
    const url = `http://${PRINTBRIDGE_HOST}:9100/print`;

    // ✅ Timeout con AbortController
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(t));

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.ok === false) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }

    showSuccess("🖨️ Enviado a imprimir (PrintBridge)");
  } catch (err) {
    console.error(err);

    // ✅ Mensaje amigable si fue timeout
    if (err?.name === "AbortError") {
      showError("⏳ Se excedió el tiempo de espera al imprimir (timeout).");
    } else {
      showError(`❌ Error al imprimir: ${err?.message || err}`);
    }
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
