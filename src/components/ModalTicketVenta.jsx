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
  const [loadingPrint, setLoadingPrint] = useState(false);

  if (!ventaId) return null;

  // ✅ URL para previsualizar PDF (Laravel en internet)
  const baseUrl = window.location.origin.includes("localhost")
    ? "https://mitiendaenlineamx.com.mx"
    : window.location.origin;

  const url = `${baseUrl}/api/sales/${ventaId}/ticket.pdf`;

  const handlePrint = async () => {
    setLoadingPrint(true);
    try {
      // ✅ Ticket simulado en TEXTO PLANO (ESC/POS)
      const text = [
        "ZAPATERIA CHUCHO",
        "RFC: XAXX010101000",
        "TEL: 55 1234 5678",
        "------------------------------",
        `TICKET #${ventaId}`,
        `FECHA: ${new Date().toLocaleString()}`,
        "CAJA: POS-1",
        "------------------------------",
        "Producto A        1 x 50.00  50.00",
        "Producto B        2 x 25.00  50.00",
        "------------------------------",
        "SUBTOTAL:                86.21",
        "IVA 16%:                 13.79",
        "TOTAL:                  100.00",
        "------------------------------",
        "PAGO: EFECTIVO           200.00",
        "CAMBIO:                 100.00",
        "",
        "GRACIAS POR SU COMPRA",
        "www.mitiendaenlineamx.com.mx",
        "",
        "",
      ].join("\n");

      // ✅ Si estás dentro de la app (WebView) debe existir este objeto
      if (window.AndroidPrintBridge?.print) {
        window.AndroidPrintBridge.print(
          JSON.stringify({
            text,
            cut: true,
            openDrawer: true, // ✅ abre cajón si lo implementaste en PrintBridge
          })
        );
        showSuccess("🖨️ Enviado a imprimir (USB)");
        return;
      }

      // Si no estás en WebView, falla (para que no creas que imprimió)
      throw new Error("No estás dentro de la app TaePrintBridge (WebView).");
    } catch (err) {
      console.error(err);
      showError(`❌ Error al imprimir: ${err.message || err}`);
    } finally {
      setLoadingPrint(false);
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
      await axiosClient.post(`/sales/${ventaId}/send-whatsapp`, { phone: numero });
      showSuccess("Ticket enviado por WhatsApp correctamente.");
      setNumero("");
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
          style={{ width: "100%", height: "600px", border: "none" }}
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
          startIcon={loadingPrint ? <CircularProgress size={18} color="inherit" /> : <PrintIcon />}
          color="primary"
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
