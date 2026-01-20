// src/components/POS/TicketDialog.jsx
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
import axiosClientPOS from "../../config/axiosClientPOS";

export default function TicketDialog({
  open,
  onClose,
  sale,
  ticketUrl,
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

  const digitsOnly = (v) => (v || "").replace(/\D/g, "");
  const isValidPhone = /^\d{10}$/.test(phone);

  const handleSend = async () => {
    if (!sale?.id) return showError("❌ No hay venta para enviar.");
    if (!isValidPhone) return;

    setLoadingSend(true);
    try {
      await onSend?.(digitsOnly(phone));
      showSuccess("📨 Ticket enviado por WhatsApp");
    } catch (err) {
      console.error(err);
      showError("❌ Error al enviar por WhatsApp");
    } finally {
      setLoadingSend(false);
    }
  };

  const handlePrint = async () => {
    if (!sale?.id) return showError("❌ No hay venta para imprimir.");

    setLoadingPrint(true);

    // ✅ timeout en ms (para PrintBridge HTTP)
    const TIMEOUT_MS = 8000;

    try {
      // 1) Pedir payload REAL al backend (logo, qr, texto, openDrawer, etc.)
      const { data } = await axiosClientPOS.get(
        `/sales/${sale.id}/print-payload`
      );

      if (!data?.ok || !data?.payload) {
        throw new Error(data?.message || "No se pudo obtener payload de impresión");
      }

      const payload = data.payload;

      // 2) Caso APP (WebView con JS Interface)
      if (window.AndroidPrintBridge?.print) {
        window.AndroidPrintBridge.print(JSON.stringify(payload));
        showSuccess("🖨️ Enviado a imprimir (USB)");
        return;
      }

      // 3) Caso navegador normal => pegarle al server de la TABLET (PrintBridge)
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

      const respJson = await res.json().catch(() => ({}));

      if (!res.ok || respJson?.ok === false) {
        throw new Error(respJson?.error || `HTTP ${res.status}`);
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
          inputProps={{
            maxLength: 10,
            inputMode: "numeric",
            pattern: "\\d{10}",
          }}
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
