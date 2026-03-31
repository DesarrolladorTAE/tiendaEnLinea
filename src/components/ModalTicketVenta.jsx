// src/components/ModalTicketVenta.jsx
import React, { useEffect, useMemo, useState } from "react";
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
  useMediaQuery,
  Box,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import UsbIcon from "@mui/icons-material/Usb";
import LanIcon from "@mui/icons-material/Lan";

import axiosClientPOS from "../config/axiosClientPOS";
import { showSuccess, showError } from "../utils/alerts";

export default function ModalTicketVenta({
  open,
  onClose,
  ventaId,
  ticketUrl,
  posLocationId,
}) {
  const [numero, setNumero] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingPrintUsb, setLoadingPrintUsb] = useState(false);
  const [loadingPrintIp, setLoadingPrintIp] = useState(false);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const origin = window.location.origin;
  const baseUrl = origin.includes("localhost")
    ? "https://mitiendaenlineamx.com.mx"
    : origin;

  useEffect(() => {
    if (open) {
      setNumero("");
      setSending(false);
      setLoadingPrintUsb(false);
      setLoadingPrintIp(false);
    }
  }, [open, ventaId]);

  const pdfUrl = useMemo(() => {
    if (ticketUrl) return ticketUrl;
    if (!ventaId) return "";
    return `${baseUrl}/api/sales/${ventaId}/ticket.pdf`;
  }, [ticketUrl, ventaId, baseUrl]);

  if (!ventaId) return null;

  const handleNumeroChange = (e) => {
    const input = (e.target.value || "").replace(/\D/g, "").slice(0, 10);
    setNumero(input);
  };

  const getPrintPayload = async () => {
    const { data } = await axiosClientPOS.get(`/sales/${ventaId}/print-payload`);

    if (!data?.ok || !data?.payload) {
      throw new Error(
        data?.message || "No se pudo obtener payload de impresión"
      );
    }

    return data.payload;
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

  const handlePrintUsb = async () => {
    if (!ventaId) return showError("❌ No hay venta para imprimir.");

    setLoadingPrintUsb(true);

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
      showError(`❌ Error al imprimir por USB: ${err?.message || err}`);
    } finally {
      setLoadingPrintUsb(false);
    }
  };

  const handlePrintIp = async () => {
    if (!ventaId) return showError("❌ No hay venta para imprimir.");
    if (!posLocationId) {
      return showError("❌ No se encontró el punto de venta actual.");
    }

    setLoadingPrintIp(true);

    try {
      const payload = await getPrintPayload();

      const { data: ticket } = await axiosClientPOS.get(
        `/pos/ticket-config/${posLocationId}`
      );

      const printerIp = String(ticket?.printer_ip || "").trim();
      const printerPort = Number(ticket?.printer_port || 0);

      if (!printerIp || !printerPort) {
        throw new Error(
          "Configura primero la IP y el puerto de la impresora en el ticket de la sucursal."
        );
      }

      const request = {
        payload,
        host: printerIp,
        port: printerPort,
      };

      console.log("printTicket -> request", request);

      if (window.flutter_inappwebview?.callHandler) {
        const resp = await window.flutter_inappwebview.callHandler(
          "printTicket",
          request
        );

        console.log("printTicket -> response", resp);

        if (resp?.ok) {
          showSuccess(
            `🖨️ Enviado a imprimir por IP (${printerIp}:${printerPort})`
          );
          return;
        }

        throw new Error(resp?.message || "No se pudo imprimir desde la app.");
      }

      throw new Error("No hay bridge Flutter disponible en este dispositivo.");
    } catch (err) {
      console.error(err);
      showError(`❌ Error al imprimir por IP: ${err?.message || err}`);
    } finally {
      setLoadingPrintIp(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pr: 1,
        }}
      >
        Ticket de Venta #{ventaId}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: 0,
          bgcolor: "#f7f7f7",
        }}
      >
        {pdfUrl ? (
          <iframe
            title="Ticket PDF"
            src={pdfUrl}
            style={{
              width: "100%",
              height: fullScreen ? "calc(100vh - 270px)" : "70vh",
              minHeight: fullScreen ? "420px" : "600px",
              border: "none",
              display: "block",
              background: "#fff",
            }}
          />
        ) : (
          <Box
            sx={{
              minHeight: 320,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 3,
            }}
          >
            No se encontró la vista previa del ticket.
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ width: "100%" }}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ flexGrow: 1, width: "100%" }}
          >
            <TextField
              label="Número para WhatsApp"
              value={numero}
              onChange={handleNumeroChange}
              placeholder="5522334455"
              size="small"
              fullWidth
              inputProps={{ inputMode: "numeric", maxLength: 10 }}
            />

            <Button
              variant="contained"
              color="success"
              startIcon={
                sending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <WhatsAppIcon />
                )
              }
              onClick={handleEnviarWhatsapp}
              disabled={sending || numero.length !== 10}
              sx={{ minWidth: { xs: "100%", sm: 150 } }}
            >
              {sending ? "Enviando..." : "Enviar"}
            </Button>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ width: { xs: "100%", md: "auto" } }}
          >
            <Button
              onClick={handlePrintUsb}
              variant="outlined"
              startIcon={
                loadingPrintUsb ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <UsbIcon />
                )
              }
              disabled={loadingPrintUsb || loadingPrintIp}
              fullWidth={fullScreen}
            >
              {loadingPrintUsb ? "Imprimiendo..." : "Imprimir USB"}
            </Button>

            <Button
              onClick={handlePrintIp}
              variant="contained"
              startIcon={
                loadingPrintIp ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <LanIcon />
                )
              }
              disabled={loadingPrintIp || loadingPrintUsb}
              fullWidth={fullScreen}
            >
              {loadingPrintIp ? "Imprimiendo..." : "Imprimir IP"}
            </Button>

            <Button
              onClick={onClose}
              variant="outlined"
              color="secondary"
              fullWidth={fullScreen}
            >
              Cerrar
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}