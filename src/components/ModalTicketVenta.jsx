// src/components/ModalTicketVenta.jsx
import React, { useEffect, useState } from "react";
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

import axiosClientPOS from "../config/axiosClientPOS";
import { showSuccess, showError } from "../utils/alerts";

export default function ModalTicketVenta({ open, onClose, ventaId }) {
  const [numero, setNumero] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingPrint, setLoadingPrint] = useState(false);

  // ✅ baseUrl SIEMPRE definido (sin hooks condicionales)
  const origin = window.location.origin;
  const baseUrl = origin.includes("localhost")
    ? "https://mitiendaenlineamx.com.mx"
    : origin;

  useEffect(() => {
    if (open) {
      setNumero("");
      setSending(false);
      setLoadingPrint(false);
    }
  }, [open, ventaId]);

  // ❗ ahora el return va DESPUÉS de los hooks
  if (!ventaId) return null;

  const pdfUrl = `${baseUrl}/api/sales/${ventaId}/ticket.pdf`;

  const handleNumeroChange = (e) => {
    const input = (e.target.value || "").replace(/\D/g, "").slice(0, 10);
    setNumero(input);
  };

  const handleEnviarWhatsapp = async () => {
    if (!ventaId) return showError("❌ No hay venta para enviar.");

    if (numero.length !== 10) {
      showError("Ingresa un número válido de 10 dígitos.");
      return;
    }

    setSending(true);
    try {
      await axiosClientPOS.post(`/sales/${ventaId}/send-whatsapp`, {
        phone: numero,
      });
      showSuccess("✅ Ticket enviado por WhatsApp correctamente.");
      setNumero("");
    } catch (error) {
      console.error("Error al enviar WhatsApp:", error);
      showError("❌ No se pudo enviar el ticket.");
    } finally {
      setSending(false);
    }
  };

  const handlePrint = async () => {
    if (!ventaId) return showError("❌ No hay venta para imprimir.");

    setLoadingPrint(true);
    const TIMEOUT_MS = 8000;

    try {
      // ✅ 1) Obtener payload real del backend
      const { data } = await axiosClientPOS.get(
        `/sales/${ventaId}/print-payload`
      );

      if (!data?.ok || !data?.payload) {
        throw new Error(
          data?.message || "No se pudo obtener payload de impresión"
        );
      }

      const payload = data.payload;

      // ✅ 2) Android WebView (USB directo)
      if (window.AndroidPrintBridge?.print) {
        window.AndroidPrintBridge.print(JSON.stringify(payload));
        showSuccess("🖨️ Enviado a imprimir (USB)");
        return;
      }

      // ✅ 3) Navegador normal → PrintBridge
      const PRINTBRIDGE_HOST = "192.168.1.200";
      const url = `http://${PRINTBRIDGE_HOST}:9100/print`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      const respJson = await res.json().catch(() => ({}));

      if (!res.ok || respJson?.ok === false) {
        throw new Error(respJson?.error || `HTTP ${res.status}`);
      }

      showSuccess("🖨️ Enviado a imprimir (PrintBridge)");
    } catch (err) {
      console.error(err);

      if (err?.name === "AbortError") {
        showError("⏳ Se excedió el tiempo de espera al imprimir.");
      } else {
        showError(`❌ Error al imprimir: ${err?.message || err}`);
      }
    } finally {
      setLoadingPrint(false);
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
          title="Ticket PDF"
          src={pdfUrl}
          style={{ width: "100%", height: "600px", border: "none" }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Stack
          spacing={1}
          direction="row"
          alignItems="center"
          sx={{ flexGrow: 1 }}
        >
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
            {sending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Enviar"
            )}
          </Button>
        </Stack>

        <Button
          onClick={handlePrint}
          variant="contained"
          color="primary"
          startIcon={
            loadingPrint ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <PrintIcon />
            )
          }
          disabled={loadingPrint}
        >
          {loadingPrint ? "Imprimiendo..." : "Imprimir"}
        </Button>

        <Button onClick={onClose} variant="outlined" color="secondary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
