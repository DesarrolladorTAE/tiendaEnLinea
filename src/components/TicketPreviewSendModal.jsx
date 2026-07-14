import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Box,
  Alert,
  Chip,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PrintIcon from "@mui/icons-material/Print";
import LanIcon from "@mui/icons-material/Lan";
import ComputerIcon from "@mui/icons-material/Computer";
import AndroidIcon from "@mui/icons-material/Android";
import AppleIcon from "@mui/icons-material/Apple";
import BluetoothIcon from "@mui/icons-material/Bluetooth";
import SettingsIcon from "@mui/icons-material/Settings";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";

import axiosClient from "../config/axiosClientPOS";
import { showError, showSuccess } from "../utils/alerts";

const APP_META = {
  windows_usb: {
    label: "Enviar a Windows USB",
    color: "#1565c0",
    icon: <ComputerIcon fontSize="small" />,
  },
  windows_ip: {
    label: "Enviar a Windows IP",
    color: "#1976d2",
    icon: <LanIcon fontSize="small" />,
  },
  android_usb: {
    label: "Enviar a Android USB",
    color: "#2e7d32",
    icon: <AndroidIcon fontSize="small" />,
  },
  android_ip: {
    label: "Enviar a Android IP",
    color: "#1b5e20",
    icon: <AndroidIcon fontSize="small" />,
  },
  ios_ip: {
    label: "Enviar a iPhone IP",
    color: "#455a64",
    icon: <AppleIcon fontSize="small" />,
  },
  ios_ble: {
    label: "Enviar a iPhone BLE",
    color: "#212121",
    icon: <BluetoothIcon fontSize="small" />,
  },
  whatsapp: {
    label: "Payload WhatsApp",
    color: "#25D366",
    icon: <WhatsAppIcon fontSize="small" />,
  },
};

export default function TicketPreviewSendModal({
  open,
  onClose,
  sale,
  posLocationId,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [ticketUrl, setTicketUrl] = useState("");
  const [loadingPdf, setLoadingPdf] = useState(false);

  const [sending, setSending] = useState(false);
  const [sendMode, setSendMode] = useState("client");
  const [customPhone, setCustomPhone] = useState("");

  const [loadingConfig, setLoadingConfig] = useState(false);
  const [sendingPayload, setSendingPayload] = useState(false);
  const [printSetting, setPrintSetting] = useState(null);

  const [downloadingTicket, setDownloadingTicket] = useState(false);

  const clientPhone =
    sale?.client?.telefono || sale?.client?.phone || sale?.telefono || "";

  const finalPhone = sendMode === "client" ? clientPhone : customPhone;

  const meta = useMemo(() => {
    if (!printSetting?.enabled || !printSetting?.app_type) {
      return {
        label: "Configurar conexión",
        color: "#9ca3af",
        icon: <SettingsIcon fontSize="small" />,
      };
    }

    return (
      APP_META[printSetting.app_type] || {
        label: "Enviar payload",
        color: "#2563eb",
        icon: <PrintRoundedIcon fontSize="small" />,
      }
    );
  }, [printSetting]);

  const canSendPayload =
    Boolean(printSetting?.enabled && printSetting?.app_type) &&
    !loadingConfig &&
    !sendingPayload &&
    !sending;

  useEffect(() => {
    if (!open || !sale?.id) return;

    setCustomPhone("");
    setSendMode(clientPhone ? "client" : "custom");
    setSending(false);
    setSendingPayload(false);
    setLoadingConfig(false);
    setPrintSetting(null);

    loadTicket();
    loadPayloadConfig();

    return () => {
      setTicketUrl((oldUrl) => {
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        return "";
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sale?.id, posLocationId]);

  const loadTicket = async () => {
    try {
      setLoadingPdf(true);

      const resp = await axiosClient.get(`/v2/sales/${sale.id}/ticket.pdf`, {
        responseType: "arraybuffer",
      });

      const blob = new Blob([resp.data], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(blob);

      setTicketUrl((oldUrl) => {
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        return objectUrl;
      });
    } catch (error) {
      console.error(error);
      showError("No se pudo cargar el ticket.");
    } finally {
      setLoadingPdf(false);
    }
  };

  const loadPayloadConfig = async () => {
    if (!posLocationId) return;

    try {
      setLoadingConfig(true);

      const { data } = await axiosClient.get(
        `/pos/print-settings/${posLocationId}/payload-config`,
      );

      setPrintSetting(data || null);
    } catch (error) {
      console.error("Error cargando configuración de payload:", error);
      setPrintSetting(null);
    } finally {
      setLoadingConfig(false);
    }
  };

  const cleanPhone = (value) =>
    String(value || "")
      .replace(/\D/g, "")
      .slice(0, 10);

  const handleSendWhatsApp = async () => {
    const phone = cleanPhone(finalPhone);

    if (!phone || phone.length !== 10) {
      showError("Ingresa un número válido para enviar el ticket.");
      return;
    }

    try {
      setSending(true);

      await axiosClient.post(`/v2/sales/${sale.id}/send-whatsapp`, {
        phone,
        telefono: phone,
        es_cliente: sendMode === "client",
      });

      showSuccess("Ticket enviado por WhatsApp correctamente.");
      setCustomPhone("");
    } catch (error) {
      console.error(error);

      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "No se pudo enviar el ticket por WhatsApp.";

      showError(msg);
    } finally {
      setSending(false);
    }
  };

  const getPrintPayload = async () => {
    const { data } = await axiosClient.get(`/sales/${sale.id}/print-payload`);

    if (!data?.ok || !data?.payload) {
      throw new Error(
        data?.message || "No se pudo obtener payload de impresión.",
      );
    }

    return data.payload;
  };

  const getPrinterConfig = async () => {
    if (!posLocationId) {
      throw new Error("No se encontró el punto de venta actual.");
    }

    const { data: ticket } = await axiosClient.get(
      `/pos/ticket-config/${posLocationId}`,
    );

    const printerIp = String(ticket?.printer_ip || "").trim();
    const printerPort = Number(ticket?.printer_port || 0);

    if (!printerIp || !printerPort) {
      throw new Error(
        "Configura primero la IP y el puerto de la impresora en la sucursal correspondiente.",
      );
    }

    return { printerIp, printerPort };
  };

  const sendToWindows = (payload) => {
    if (typeof window.sendPrintPayloadToWindows === "function") {
      return window.sendPrintPayloadToWindows(payload);
    }

    if (window.chrome?.webview?.postMessage) {
      window.chrome.webview.postMessage(JSON.stringify(payload));
      return true;
    }

    return false;
  };

  const sendToAndroidUsb = (payload) => {
    if (window.AndroidPrintBridge?.print) {
      window.AndroidPrintBridge.print(JSON.stringify(payload));
      return true;
    }

    return false;
  };

  const sendToFlutter = async (request) => {
    if (!window.flutter_inappwebview?.callHandler) {
      throw new Error("No hay bridge Flutter disponible en este dispositivo.");
    }

    const resp = await window.flutter_inappwebview.callHandler(
      "printTicket",
      request,
    );

    if (!resp?.ok) {
      throw new Error(
        resp?.message || "No se pudo imprimir desde la aplicación.",
      );
    }

    return true;
  };

  const handleConfiguredPayload = async () => {
    if (!sale?.id) {
      showError("No hay venta para imprimir.");
      return;
    }

    if (!printSetting?.enabled || !printSetting?.app_type) {
      showError("Configura primero la conexión del punto de venta.");
      return;
    }

    try {
      setSendingPayload(true);

      const appType = printSetting.app_type;

      if (appType === "whatsapp") {
        showError("WhatsApp se envía desde el botón verde de WhatsApp.");
        return;
      }

      const payload = await getPrintPayload();

      if (appType === "windows_usb") {
        const ok = sendToWindows({
          ...payload,
          app_type: appType,
          transport: "usb",
        });

        if (!ok) throw new Error("No hay bridge de Windows disponible.");
      }

      if (appType === "windows_ip") {
        const { printerIp, printerPort } = await getPrinterConfig();

        const ok = sendToWindows({
          ...payload,
          app_type: appType,
          transport: "tcp",
          host: printerIp,
          port: printerPort,
        });

        if (!ok) throw new Error("No hay bridge de Windows disponible.");
      }

      if (appType === "android_usb") {
        const ok = sendToAndroidUsb({
          ...payload,
          app_type: appType,
          transport: "usb",
        });

        if (!ok) throw new Error("No hay bridge Android USB disponible.");
      }

      if (appType === "android_ip" || appType === "ios_ip") {
        const { printerIp, printerPort } = await getPrinterConfig();

        await sendToFlutter({
          payload: {
            ...payload,
            app_type: appType,
            transport: "tcp",
          },
          host: printerIp,
          port: printerPort,
        });
      }

      if (appType === "ios_ble") {
        await sendToFlutter({
          payload: {
            ...payload,
            app_type: appType,
            transport: "ble",
          },
        });
      }

      showSuccess(`${meta.label} correctamente.`);
    } catch (error) {
      console.error("Error enviando payload configurado:", error);
      showError(error?.message || "No se pudo enviar el payload.");
    } finally {
      setSendingPayload(false);
    }
  };

  const handlePrintPdf = () => {
    if (!ticketUrl) return;
    window.open(ticketUrl, "_blank");
  };

  const handleClose = () => {
    setCustomPhone("");
    setSendMode(clientPhone ? "client" : "custom");
    setSending(false);
    setSendingPayload(false);
    onClose?.();
  };

  const buttonBaseSx = {
    borderRadius: 3,
    textTransform: "none",
    fontWeight: 900,
    minHeight: 46,
  };

  const handleDownloadPdf = async () => {
    if (!sale?.id) {
      showError("No se encontró la venta.");
      return;
    }

    try {
      setDownloadingTicket(true);

      let downloadUrl = ticketUrl;
      let shouldRevokeUrl = false;

      // Si todavía no está disponible el PDF cargado,
      // lo solicitamos nuevamente al backend.
      if (!downloadUrl) {
        const response = await axiosClient.get(
          `/v2/sales/${sale.id}/ticket.pdf`,
          {
            responseType: "blob",
          },
        );

        const blob = new Blob([response.data], {
          type: response.headers?.["content-type"] || "application/pdf",
        });

        downloadUrl = URL.createObjectURL(blob);
        shouldRevokeUrl = true;
      }

      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `ticket-venta-${sale.id}.pdf`;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      link.remove();

      if (shouldRevokeUrl) {
        setTimeout(() => {
          URL.revokeObjectURL(downloadUrl);
        }, 1000);
      }

      showSuccess("Ticket descargado correctamente.");
    } catch (error) {
      console.error("Error descargando ticket:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "No se pudo descargar el ticket.";

      showError(message);
    } finally {
      setDownloadingTicket(false);
    }
  };

  const sidePanel = (
    <Stack
      sx={{
        width: { xs: "100%", md: 330 },
        flexShrink: 0,
      }}
      spacing={2}
    >
      <Box>
        <Typography sx={{ fontWeight: 950, fontSize: "1rem" }}>
          Enviar ticket por WhatsApp
        </Typography>
        <Typography variant="body2" color="text.secondary">
          WhatsApp siempre estará disponible para compartir el ticket.
        </Typography>
      </Box>

      <FormControl>
        <FormLabel>Destino</FormLabel>

        <RadioGroup
          value={sendMode}
          onChange={(e) => setSendMode(e.target.value)}
        >
          <FormControlLabel
            value="client"
            control={<Radio />}
            label={`Cliente ${clientPhone ? `(${clientPhone})` : "(sin teléfono)"}`}
            disabled={!clientPhone}
          />

          <FormControlLabel
            value="custom"
            control={<Radio />}
            label="Otro número"
          />
        </RadioGroup>
      </FormControl>

      {sendMode === "custom" && (
        <TextField
          label="Número WhatsApp"
          value={customPhone}
          onChange={(e) => setCustomPhone(cleanPhone(e.target.value))}
          fullWidth
          placeholder="Ej. 7441234567"
          inputProps={{
            maxLength: 10,
            inputMode: "numeric",
          }}
        />
      )}

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
        onClick={handleSendWhatsApp}
        disabled={sending || sendingPayload}
        sx={buttonBaseSx}
      >
        {sending ? "Enviando..." : "Enviar WhatsApp"}
      </Button>

      <Box sx={{ pt: 1 }}>
        <Typography sx={{ fontWeight: 950, fontSize: "1rem" }}>
          Envío configurado
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Este botón depende de la configuración del punto de venta.
        </Typography>
      </Box>

      {loadingConfig ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          Cargando configuración...
        </Alert>
      ) : printSetting?.enabled ? (
        <Chip
          label={`Conectividad: ${meta.label}`}
          sx={{
            alignSelf: "flex-start",
            fontWeight: 900,
            bgcolor: `${meta.color}18`,
            color: meta.color,
          }}
        />
      ) : (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          No hay conectividad configurada para este punto de venta.
        </Alert>
      )}

      <Button
        variant="contained"
        startIcon={
          sendingPayload || loadingConfig ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            meta.icon
          )
        }
        onClick={handleConfiguredPayload}
        disabled={!canSendPayload}
        sx={{
          ...buttonBaseSx,
          bgcolor: meta.color,
          boxShadow: `0 12px 26px ${meta.color}44`,
          "&:hover": {
            bgcolor: meta.color,
            filter: "brightness(.92)",
          },
          "&.Mui-disabled": {
            bgcolor: "#d1d5db",
            color: "#6b7280",
            boxShadow: "none",
          },
        }}
      >
        {sendingPayload || loadingConfig ? "Procesando..." : meta.label}
      </Button>

      <Button
        variant="outlined"
        startIcon={<PrintIcon />}
        onClick={handlePrintPdf}
        disabled={!ticketUrl}
        sx={buttonBaseSx}
      >
        Abrir / imprimir PDF
      </Button>

      <Button
        variant="outlined"
        startIcon={
          downloadingTicket ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <DownloadRoundedIcon />
          )
        }
        onClick={handleDownloadPdf}
        disabled={downloadingTicket || loadingPdf || !sale?.id}
        sx={buttonBaseSx}
      >
        {downloadingTicket ? "Descargando..." : "Descargar ticket"}
      </Button>
    </Stack>
  );

  const pdfPanel = (
    <Box
      sx={{
        flex: 1,
        minHeight: { xs: 460, md: 720 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: { xs: 2.5, md: 3 },
        overflow: "hidden",
        bgcolor: "#f9fafb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {loadingPdf ? (
        <CircularProgress />
      ) : ticketUrl ? (
        <iframe
          src={ticketUrl}
          title="Ticket PDF"
          style={{
            width: "100%",
            height: isMobile ? "620px" : "720px",
            border: 0,
          }}
        />
      ) : (
        <Typography color="text.secondary">
          No se pudo cargar el ticket.
        </Typography>
      )}
    </Box>
  );

  if (!open) return null;

  if (isMobile) {
    return (
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1400,
          bgcolor: "background.default",
          width: "100vw",
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            px: 1,
            py: 1,
            minHeight: 64,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexShrink: 0,
          }}
        >
          <IconButton onClick={handleClose}>
            <ArrowBackIcon />
          </IconButton>

          <Typography
            sx={{
              flex: 1,
              fontWeight: 950,
              fontSize: "1rem",
            }}
          >
            Ticket venta #{sale?.id}
          </Typography>

          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 1.5,
          }}
        >
          <Stack spacing={2}>
            {sidePanel}
            {pdfPanel}
          </Stack>
        </Box>
      </Box>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ fontWeight: 950 }}>
        Ticket venta #{sale?.id}
        <IconButton
          onClick={handleClose}
          sx={{ position: "absolute", right: 12, top: 10 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack direction="row" spacing={2}>
          {sidePanel}
          {pdfPanel}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          sx={{ textTransform: "none", fontWeight: 800 }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
