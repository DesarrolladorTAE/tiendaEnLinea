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
  Stack,
} from "@mui/material";
import { showSuccess, showError } from "../../utils/alerts";
import axiosClientPOS from "../../config/axiosClientPOS";

export default function TicketDialog({
  open,
  onClose,
  sale,
  ticketUrl,
  onSend,
  posLocationId,
}) {
  const [phone, setPhone] = useState("");
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingPrintUsb, setLoadingPrintUsb] = useState(false);
  const [loadingPrintIp, setLoadingPrintIp] = useState(false);

  useEffect(() => {
    if (open) {
      setPhone("");
      setLoadingSend(false);
      setLoadingPrintUsb(false);
      setLoadingPrintIp(false);
    }
  }, [open, sale?.id]);

  const handleClose = () => {
    setPhone("");
    setLoadingSend(false);
    setLoadingPrintUsb(false);
    setLoadingPrintIp(false);
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

  const getPrintPayload = async () => {
    const { data } = await axiosClientPOS.get(`/sales/${sale.id}/print-payload`);

    if (!data?.ok || !data?.payload) {
      throw new Error(data?.message || "No se pudo obtener payload de impresión");
    }

    return data.payload;
  };

  const handlePrintUsb = async () => {
    if (!sale?.id) return showError("❌ No hay venta para imprimir.");

    setLoadingPrintUsb(true);

    const TIMEOUT_MS = 8000;

    try {
      const payload = await getPrintPayload();

      if (window.AndroidPrintBridge?.print) {
        window.AndroidPrintBridge.print(JSON.stringify(payload));
        showSuccess("🖨️ Enviado a imprimir por USB");
        return;
      }

      throw new Error("No hay bridge USB disponible en este dispositivo.");
    } catch (err) {
      console.error(err);

      if (err?.name === "AbortError") {
        showError("⏳ Se excedió el tiempo de espera al imprimir por USB.");
      } else {
        showError(`❌ Error al imprimir por USB: ${err?.message || err}`);
      }
    } finally {
      setLoadingPrintUsb(false);
    }
  };

  const handlePrintIp = async () => {
    if (!sale?.id) return showError("❌ No hay venta para imprimir.");
    if (!posLocationId) {
      return showError("❌ No se encontró el POS actual.");
    }

    setLoadingPrintIp(true);

    const TIMEOUT_MS = 8000;

    try {
      const payload = await getPrintPayload();

      const { data: ticket } = await axiosClientPOS.get(
        `/pos/ticket-config/${posLocationId}`
      );

      const printerIp = String(ticket?.printer_ip || "").trim();
      const printerPort = String(ticket?.printer_port || "").trim();

      if (!printerIp || !printerPort) {
        throw new Error(
          "Configura primero la IP y el puerto de la impresora en la sucursal correspondiente."
        );
      }

      const url = `http://${printerIp}:${printerPort}`;

      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).finally(() => clearTimeout(t));

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      showSuccess(`🖨️ Enviado directo a ${printerIp}:${printerPort}`);
    } catch (err) {
      console.error(err);

      if (err?.name === "AbortError") {
        showError("⏳ Tiempo de espera agotado al imprimir.");
      } else {
        showError(`❌ Error al imprimir: ${err?.message || err}`);
      }
    } finally {
      setLoadingPrintIp(false);
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

      <DialogActions sx={{ px: 2, pb: 2, pt: 1 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ width: "100%" }}
        >
          <Button
            onClick={handlePrintUsb}
            disabled={loadingPrintUsb || loadingPrintIp}
            variant="outlined"
            fullWidth
          >
            {loadingPrintUsb ? (
              <CircularProgress size={20} />
            ) : (
              "🖨️ Imprimir USB"
            )}
          </Button>

          <Button
            onClick={handlePrintIp}
            disabled={loadingPrintIp || loadingPrintUsb}
            variant="contained"
            fullWidth
          >
            {loadingPrintIp ? (
              <CircularProgress size={20} />
            ) : (
              "🌐 Imprimir IP"
            )}
          </Button>

          <Button
            onClick={handleSend}
            disabled={!isValidPhone || loadingSend}
            fullWidth
          >
            {loadingSend ? <CircularProgress size={20} /> : "✉️ Enviar"}
          </Button>

          <Button onClick={handleClose} fullWidth>
            Cerrar
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}