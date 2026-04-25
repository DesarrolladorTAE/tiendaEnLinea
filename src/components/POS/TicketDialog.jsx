import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Box,
  Typography,
  IconButton,
  Divider,
  useMediaQuery,
  Alert,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LanIcon from "@mui/icons-material/Lan";
import ComputerIcon from "@mui/icons-material/Computer";
import AndroidIcon from "@mui/icons-material/Android";
import AppleIcon from "@mui/icons-material/Apple";
import BluetoothIcon from "@mui/icons-material/Bluetooth";
import SettingsIcon from "@mui/icons-material/Settings";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import { useTheme } from "@mui/material/styles";
import { showSuccess, showError } from "../../utils/alerts";
import axiosClientPOS from "../../config/axiosClientPOS";

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

export default function TicketDialog({
  open,
  onClose,
  sale,
  ticketUrl,
  onSend,
  posLocationId,
}) {
  const theme = useTheme();

  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [phone, setPhone] = useState("");

  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [sendingPayload, setSendingPayload] = useState(false);
  const [printSetting, setPrintSetting] = useState(null);
  const [autoSent, setAutoSent] = useState(false);

  const digitsOnly = (v) => (v || "").replace(/\D/g, "").slice(0, 10);
  const isValidPhone = /^\d{10}$/.test(phone);

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
    !loadingSend;

  useEffect(() => {
    if (open) {
      setPhone("");
      setLoadingSend(false);
      setLoadingConfig(false);
      setSendingPayload(false);
      setPrintSetting(null);
      setAutoSent(false);
      loadPayloadConfig();
    }
  }, [open, sale?.id, posLocationId]);

  useEffect(() => {
    if (
      open &&
      sale?.id &&
      printSetting?.enabled &&
      printSetting?.auto_send_payload &&
      printSetting?.app_type !== "whatsapp" &&
      !autoSent &&
      !sendingPayload
    ) {
      setAutoSent(true);
      handleConfiguredPayload();
    }
  }, [open, sale?.id, printSetting]);

  const handleClose = () => {
    setPhone("");
    setLoadingSend(false);
    setLoadingConfig(false);
    setSendingPayload(false);
    setPrintSetting(null);
    setAutoSent(false);
    onClose?.();
  };

  const loadPayloadConfig = async () => {
    if (!posLocationId) return;

    setLoadingConfig(true);

    try {
      const { data } = await axiosClientPOS.get(
        `/pos/print-settings/${posLocationId}/payload-config`
      );

      setPrintSetting(data || null);
    } catch (error) {
      console.error("Error cargando configuración de payload:", error);
      setPrintSetting(null);
    } finally {
      setLoadingConfig(false);
    }
  };

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
      throw new Error(data?.message || "No se pudo obtener payload de impresión");
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
      request
    );

    if (!resp?.ok) {
      throw new Error(resp?.message || "No se pudo imprimir desde la aplicación.");
    }

    return true;
  };

  const handleConfiguredPayload = async () => {
    if (!sale?.id) {
      showError("❌ No hay venta para imprimir.");
      return;
    }

    if (!printSetting?.enabled || !printSetting?.app_type) {
      showError("Configura primero la conexión del punto de venta.");
      return;
    }

    setSendingPayload(true);

    try {
      const appType = printSetting.app_type;
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

      if (appType === "whatsapp") {
        showError("WhatsApp se envía desde el botón verde de WhatsApp.");
        return;
      }

      showSuccess(`🖨️ ${meta.label} correctamente.`);
    } catch (err) {
      console.error("Error payload configurado:", err);
      showError(`❌ ${err?.message || "No se pudo enviar el payload."}`);
    } finally {
      setSendingPayload(false);
    }
  };

  if (!open) return null;

  const isBusy = loadingSend || sendingPayload || loadingConfig;

  const buttonBaseSx = {
    minHeight: { xs: 44, sm: 46 },
    fontSize: { xs: "0.88rem", sm: "0.9rem", md: "0.86rem" },
    fontWeight: 700,
    px: 1.2,
    py: 1,
    borderRadius: 1.8,
    whiteSpace: "normal",
    lineHeight: 1.15,
    textAlign: "center",
    textTransform: "none",
    "& .MuiButton-startIcon": {
      marginRight: 0.75,
      marginLeft: 0,
    },
  };

  const content = (
    <>
      <Box
        sx={{
          flex: 1,
          p: { xs: 1.5, sm: 2, md: 2.5 },
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            width: "100%",
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "#fff",
            mb: 2,
            flexShrink: 0,
          }}
        >
          <iframe
            src={ticketUrl}
            width="100%"
            height={isDesktop ? "430" : "520"}
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

      <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
        <Box sx={{ width: "100%" }}>
          <Box
            sx={{
              mb: 1.4,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {loadingConfig ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Cargando configuración de conectividad...
              </Alert>
            ) : printSetting?.enabled ? (
              <Chip
                label={`Conectividad configurada: ${meta.label}`}
                sx={{
                  alignSelf: "flex-start",
                  fontWeight: 800,
                  bgcolor: `${meta.color}18`,
                  color: meta.color,
                }}
              />
            ) : (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                No hay conectividad configurada para este punto de venta.
              </Alert>
            )}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.2,
            }}
          >
            <Button
              onClick={handleConfiguredPayload}
              disabled={!canSendPayload}
              variant="contained"
              fullWidth
              startIcon={
                sendingPayload || loadingConfig ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  meta.icon
                )
              }
              sx={{
                ...buttonBaseSx,
                bgcolor: meta.color,
                boxShadow: `0 10px 24px ${meta.color}44`,
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
              onClick={handleSend}
              disabled={!isValidPhone || isBusy}
              fullWidth
              variant="contained"
              color="success"
              startIcon={
                loadingSend ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <WhatsAppIcon fontSize="small" />
                )
              }
              sx={buttonBaseSx}
            >
              {loadingSend ? "Enviando..." : "Enviar WhatsApp"}
            </Button>

            <Button
              onClick={handleClose}
              disabled={isBusy}
              fullWidth
              color="inherit"
              variant="outlined"
              sx={{
                ...buttonBaseSx,
                gridColumn: { xs: "auto", sm: "1 / -1" },
              }}
            >
              Cerrar
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            width: "100%",
            maxWidth: 760,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: { sm: "1.1rem", lg: "1.2rem" },
          }}
        >
          Ticket #{sale?.id}
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {content}
        </DialogContent>

        <DialogActions sx={{ display: "none" }} />
      </Dialog>
    );
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100dvh",
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
          flexShrink: 0,
        }}
      >
        <IconButton onClick={handleClose}>
          <ArrowBackIcon />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            flex: 1,
            fontWeight: 700,
            fontSize: { xs: "1rem", sm: "1.1rem" },
          }}
        >
          Ticket #{sale?.id}
        </Typography>

        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
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