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
  Box,
  Typography,
  IconButton,
  Divider,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import UsbIcon from "@mui/icons-material/Usb";
import LanIcon from "@mui/icons-material/Lan";
import ComputerIcon from "@mui/icons-material/Computer";
import AndroidIcon from "@mui/icons-material/Android";
import { useTheme } from "@mui/material/styles";
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
  const theme = useTheme();

  // Solo escritorio será modal
  // Tablet y móvil = vista tipo page
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  const [phone, setPhone] = useState("");
  const [loadingSend, setLoadingSend] = useState(false);

  const [loadingWindowsUsb, setLoadingWindowsUsb] = useState(false);
  const [loadingWindowsIp, setLoadingWindowsIp] = useState(false);
  const [loadingAndroidUsb, setLoadingAndroidUsb] = useState(false);
  const [loadingFlutterIp, setLoadingFlutterIp] = useState(false);

  useEffect(() => {
    if (open) {
      setPhone("");
      setLoadingSend(false);
      setLoadingWindowsUsb(false);
      setLoadingWindowsIp(false);
      setLoadingAndroidUsb(false);
      setLoadingFlutterIp(false);
    }
  }, [open, sale?.id]);

  const handleClose = () => {
    setPhone("");
    setLoadingSend(false);
    setLoadingWindowsUsb(false);
    setLoadingWindowsIp(false);
    setLoadingAndroidUsb(false);
    setLoadingFlutterIp(false);
    onClose?.();
  };

  const digitsOnly = (v) => (v || "").replace(/\D/g, "").slice(0, 10);
  const isValidPhone = /^\d{10}$/.test(phone);

  const handleSend = async () => {
    if (!sale?.id) {
      showError("❌ No hay venta para enviar.");
      return;
    }

    if (!isValidPhone) {
      showError("Ingresa un número válido de 10 dígitos.");
      return;
    }

    setLoadingSend(true);
    try {
      await onSend?.(digitsOnly(phone));
      showSuccess("📨 Ticket enviado por WhatsApp");
      setPhone("");
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
      throw new Error(
        data?.message || "No se pudo obtener payload de impresión"
      );
    }

    return data.payload;
  };

  const getPrinterConfig = async () => {
    if (!posLocationId) {
      throw new Error("❌ No se encontró el POS actual.");
    }

    const { data: ticket } = await axiosClientPOS.get(
      `/pos/ticket-config/${posLocationId}`
    );

    const printerIp = String(ticket?.printer_ip || "").trim();
    const printerPort = Number(ticket?.printer_port || 0);

    if (!printerIp || !printerPort) {
      throw new Error(
        "Configura primero la IP y el puerto de la impresora en la sucursal correspondiente."
      );
    }

    return { printerIp, printerPort };
  };

  const sendToWindows = (payload) => {
    if (typeof window.sendPrintPayloadToWindows === "function") {
      return window.sendPrintPayloadToWindows(payload);
    }

    if (
      window.chrome?.webview?.postMessage &&
      typeof window.chrome.webview.postMessage === "function"
    ) {
      window.chrome.webview.postMessage(JSON.stringify(payload));
      return true;
    }

    return false;
  };

  const isAnyPrinting =
    loadingWindowsUsb ||
    loadingWindowsIp ||
    loadingAndroidUsb ||
    loadingFlutterIp;

  const handleWindowsUsb = async () => {
    if (!sale?.id) {
      showError("❌ No hay venta para imprimir.");
      return;
    }

    setLoadingWindowsUsb(true);

    try {
      const payload = await getPrintPayload();

      const windowsPayload = {
        ...payload,
        transport: "usb",
      };

      const ok = sendToWindows(windowsPayload);

      if (ok) {
        showSuccess("🖨️ Enviado a imprimir por Windows USB");
        return;
      }

      throw new Error("No hay bridge de Windows disponible.");
    } catch (err) {
      console.error(err);
      showError(`❌ Error en Windows USB: ${err?.message || err}`);
    } finally {
      setLoadingWindowsUsb(false);
    }
  };

  const handleWindowsIp = async () => {
    if (!sale?.id) {
      showError("❌ No hay venta para imprimir.");
      return;
    }

    setLoadingWindowsIp(true);

    try {
      const payload = await getPrintPayload();
      const { printerIp, printerPort } = await getPrinterConfig();

      const windowsPayload = {
        ...payload,
        transport: "tcp",
        host: printerIp,
        port: printerPort,
      };

      const ok = sendToWindows(windowsPayload);

      if (ok) {
        showSuccess(`🖨️ Enviado a Windows IP (${printerIp}:${printerPort})`);
        return;
      }

      throw new Error("No hay bridge de Windows disponible.");
    } catch (err) {
      console.error(err);
      showError(`❌ Error en Windows IP: ${err?.message || err}`);
    } finally {
      setLoadingWindowsIp(false);
    }
  };

  const handleAndroidUsb = async () => {
    if (!sale?.id) {
      showError("❌ No hay venta para imprimir.");
      return;
    }

    setLoadingAndroidUsb(true);

    try {
      const payload = await getPrintPayload();

      if (window.AndroidPrintBridge?.print) {
        window.AndroidPrintBridge.print(JSON.stringify(payload));
        showSuccess("🖨️ Enviado a Android USB");
        return;
      }

      throw new Error("No hay bridge Android USB disponible en este dispositivo.");
    } catch (err) {
      console.error(err);
      showError(`❌ Error en Android USB: ${err?.message || err}`);
    } finally {
      setLoadingAndroidUsb(false);
    }
  };

  const handleFlutterIp = async () => {
    if (!sale?.id) {
      showError("❌ No hay venta para imprimir.");
      return;
    }

    setLoadingFlutterIp(true);

    try {
      const payload = await getPrintPayload();
      const { printerIp, printerPort } = await getPrinterConfig();

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
            `🖨️ Enviado a imprimir por Flutter IP (${printerIp}:${printerPort})`
          );
          return;
        }

        throw new Error(resp?.message || "No se pudo imprimir desde la app.");
      }

      throw new Error("No hay bridge Flutter disponible en este dispositivo.");
    } catch (err) {
      console.error(err);
      showError(`❌ Error en Flutter IP: ${err?.message || err}`);
    } finally {
      setLoadingFlutterIp(false);
    }
  };

  if (!open) return null;

  const content = (
    <>
      <Box sx={{ flex: 1, p: { xs: 1.5, sm: 2 } }}>
        <Box
          sx={{
            width: "100%",
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "#fff",
            mb: 2,
          }}
        >
          <iframe
            src={ticketUrl}
            width="100%"
            height={isDesktop ? "400" : "520"}
            title="Ticket preview"
            style={{ border: "none", display: "block" }}
          />
        </Box>

        <TextField
          label="Número WhatsApp"
          fullWidth
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
      </Box>

      <Divider />

      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Stack
          direction={{ xs: "column", sm: "column", md: "row" }}
          spacing={1.2}
          sx={{ width: "100%" }}
        >
          <Button
            onClick={handleWindowsUsb}
            disabled={isAnyPrinting}
            variant="outlined"
            fullWidth
            startIcon={
              loadingWindowsUsb ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ComputerIcon />
              )
            }
          >
            {loadingWindowsUsb ? "Imprimiendo..." : "Windows USB"}
          </Button>

          <Button
            onClick={handleWindowsIp}
            disabled={isAnyPrinting}
            variant="contained"
            fullWidth
            startIcon={
              loadingWindowsIp ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <LanIcon />
              )
            }
          >
            {loadingWindowsIp ? "Imprimiendo..." : "Windows IP"}
          </Button>

          <Button
            onClick={handleAndroidUsb}
            disabled={isAnyPrinting}
            variant="outlined"
            color="success"
            fullWidth
            startIcon={
              loadingAndroidUsb ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <AndroidIcon />
              )
            }
          >
            {loadingAndroidUsb ? "Imprimiendo..." : "Android USB"}
          </Button>

          <Button
            onClick={handleFlutterIp}
            disabled={isAnyPrinting}
            variant="contained"
            color="secondary"
            fullWidth
            startIcon={
              loadingFlutterIp ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <UsbIcon />
              )
            }
          >
            {loadingFlutterIp ? "Imprimiendo..." : "Flutter IP"}
          </Button>

          <Button
            onClick={handleSend}
            disabled={!isValidPhone || loadingSend || isAnyPrinting}
            fullWidth
            variant="contained"
            color="success"
            startIcon={
              loadingSend ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <WhatsAppIcon />
              )
            }
          >
            {loadingSend ? "Enviando..." : "Enviar"}
          </Button>

          <Button onClick={handleClose} fullWidth color="inherit" variant="outlined">
            Cerrar
          </Button>
        </Stack>
      </Box>
    </>
  );

  // ESCRITORIO = MODAL
  if (isDesktop) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Ticket #{sale?.id}</DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {content}
        </DialogContent>

        <DialogActions sx={{ display: "none" }} />
      </Dialog>
    );
  }

  // MÓVIL / TABLET = PAGE
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: 1,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          minHeight: 64,
        }}
      >
        <IconButton onClick={handleClose}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>
          Ticket #{sale?.id}
        </Typography>

        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
        }}
      >
        {content}
      </Box>
    </Box>
  );
}