import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

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

import axiosClientPOS from "../../config/axiosClientPOS";
import { showSuccess, showError } from "../../utils/alerts";

const APP_META = {
  windows_usb: {
    label: "Windows USB",
    color: "#1565c0",
    icon: <ComputerIcon fontSize="small" />,
  },
  windows_ip: {
    label: "Windows IP",
    color: "#1976d2",
    icon: <LanIcon fontSize="small" />,
  },
  android_usb: {
    label: "Android USB",
    color: "#2e7d32",
    icon: <AndroidIcon fontSize="small" />,
  },
  android_ip: {
    label: "Android IP",
    color: "#1b5e20",
    icon: <AndroidIcon fontSize="small" />,
  },
  ios_ip: {
    label: "iPhone IP",
    color: "#455a64",
    icon: <AppleIcon fontSize="small" />,
  },
  ios_ble: {
    label: "iPhone BLE",
    color: "#212121",
    icon: <BluetoothIcon fontSize="small" />,
  },
  whatsapp: {
    label: "WhatsApp",
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
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [phone, setPhone] = useState("");
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [sendingPayload, setSendingPayload] = useState(false);
  const [printSetting, setPrintSetting] = useState(null);
  const [autoSent, setAutoSent] = useState(false);

  const digitsOnly = (v) =>
    String(v || "")
      .replace(/\D/g, "")
      .slice(0, 10);
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

  const isBusy = loadingSend || sendingPayload || loadingConfig;

  const canSendPayload =
    Boolean(printSetting?.enabled && printSetting?.app_type) &&
    !isBusy &&
    Boolean(sale?.id);

  useEffect(() => {
    if (!open) return;

    setPhone("");
    setLoadingSend(false);
    setLoadingConfig(false);
    setSendingPayload(false);
    setPrintSetting(null);
    setAutoSent(false);

    loadPayloadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sale?.id, posLocationId]);

  useEffect(() => {
    if (
      open &&
      sale?.id &&
      printSetting?.enabled &&
      printSetting?.auto_send_payload &&
      printSetting?.app_type &&
      printSetting?.app_type !== "whatsapp" &&
      !autoSent &&
      !sendingPayload
    ) {
      setAutoSent(true);
      handleConfiguredPayload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sale?.id, printSetting?.enabled, printSetting?.app_type]);

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
    const { data } = await axiosClientPOS.get(
      `/sales/${sale.id}/print-payload`,
    );

    if (!data?.ok || !data?.payload) {
      throw new Error(
        data?.message || "No se pudo obtener payload de impresión",
      );
    }

    return data.payload;
  };

  const getPrinterConfig = async () => {
    if (!posLocationId) {
      throw new Error("No se encontró el POS actual.");
    }

    const { data: ticket } = await axiosClientPOS.get(
      `/pos/ticket-config/${posLocationId}`,
    );

    const printerIp = String(ticket?.printer_ip || "").trim();
    const printerPort = Number(ticket?.printer_port || 0);

    if (!printerIp || !printerPort) {
      throw new Error("Configura primero la IP y el puerto de la impresora.");
    }

    return { printerIp, printerPort };
  };

  const sendToWindows = (payload) => {
    if (typeof window.sendPrintPayloadToWindows === "function") {
      window.sendPrintPayloadToWindows(payload);
      return true;
    }

    if (window.chrome?.webview?.postMessage) {
      window.chrome.webview.postMessage(JSON.stringify(payload));
      return true;
    }

    return false;
  };

  const sendToAndroidUsb = (payload) => {
    if (!window.AndroidPrintBridge?.print) {
      return false;
    }

    const response = window.AndroidPrintBridge.print(JSON.stringify(payload));

    if (response === true || response === "true") {
      return true;
    }

    throw new Error(
      response || "La app Android recibió el ticket, pero no pudo imprimir.",
    );
  };

  const sendToFlutter = async (request) => {
    if (!window.flutter_inappwebview?.callHandler) {
      throw new Error("No hay bridge Flutter disponible.");
    }

    const resp = await window.flutter_inappwebview.callHandler(
      "printTicket",
      request,
    );

    if (!resp?.ok) {
      throw new Error(resp?.message || "No se pudo imprimir desde la app.");
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

        if (!ok) {
          showError("Windows USB solo funciona desde la app de escritorio.");
          return;
        }
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

        if (!ok) {
          showError("Windows IP solo funciona desde la app de escritorio.");
          return;
        }
      }

      if (appType === "android_usb") {
        const ok = sendToAndroidUsb({
          ...payload,
          app_type: appType,
          transport: "usb",
        });

        if (!ok) {
          showError(
            "Android USB solo funciona desde la app Android instalada, no desde el navegador.",
          );
          return;
        }
      }

      if (appType === "android_ip") {
        const ok = sendToAndroidUsb({
          ...payload,
          app_type: appType,
          transport: "tcp",
        });

        if (!ok) {
          showError(
            "Android IP solo funciona desde la app Android instalada, no desde el navegador.",
          );
          return;
        }
      }

      if (appType === "ios_ip") {
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
        showError("WhatsApp se envía desde el botón verde.");
        return;
      }

      showSuccess(`🖨️ Enviado a ${meta.label}.`);
    } catch (err) {
      console.error("Error payload configurado:", err);
      showError(`❌ ${err?.message || "No se pudo enviar el payload."}`);
    } finally {
      setSendingPayload(false);
    }
  };

  if (!open) return null;

  const buttonBaseSx = {
    minHeight: { xs: 42, sm: 44 },
    fontSize: { xs: "0.78rem", sm: "0.9rem" },
    fontWeight: 900,
    px: { xs: 1, sm: 1.5 },
    py: 0.9,
    borderRadius: 2,
    textTransform: "none",
    lineHeight: 1.1,
    "& .MuiButton-startIcon": {
      mr: { xs: 0.5, sm: 0.8 },
    },
  };

  const ticketPreview = isDesktop ? (
    <Box
      sx={{
        width: "100%",
        flex: "1 1 auto",
        minHeight: 0,
        height: "100%",
        borderRadius: 2.5,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "#fff",
      }}
    >
      {!ticketUrl ? (
        <Box
          sx={{
            height: "100%",
            minHeight: 260,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 1.5,
            bgcolor: "#fff",
          }}
        >
          <CircularProgress />
          <Typography sx={{ fontWeight: 900, color: "#6b7280" }}>
            Cargando ticket...
          </Typography>
        </Box>
      ) : (
        <iframe
          src={ticketUrl}
          width="100%"
          height="100%"
          title="Ticket preview"
          style={{
            border: "none",
            display: "block",
            background: "#fff",
          }}
        />
      )}
    </Box>
  ) : null;

  const content = (
    <Box
      sx={{
        height: { xs: "100%", lg: "auto" },
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          flex: "1 1 auto",
          minHeight: 0,
          p: { xs: 1, sm: 1.5, md: 2 },
          display: "grid",
          gridTemplateRows: isDesktop ? "minmax(360px, 1fr) auto" : "auto",
          gap: { xs: 0.75, sm: 1.5 },
          overflow: "hidden",
        }}
      >
        {isDesktop && ticketPreview}

        <TextField
          label="Número WhatsApp"
          fullWidth
          size={isMobile ? "small" : "medium"}
          value={phone}
          onChange={(e) => setPhone(digitsOnly(e.target.value))}
          placeholder="5512345678"
          inputProps={{
            maxLength: 10,
            inputMode: "numeric",
            pattern: "\\d{10}",
          }}
          helperText="Ingresa 10 dígitos."
        />
      </Box>

      <Divider />

      <Box
        sx={{
          p: { xs: 1, sm: 1.5, md: 2 },
          flexShrink: 0,
          bgcolor: "background.paper",
          pb: { xs: "max(12px, env(safe-area-inset-bottom))", sm: 1.5 },
        }}
      >
        {loadingConfig ? (
          <Alert severity="info" sx={{ borderRadius: 2, mb: 1 }}>
            Cargando conectividad...
          </Alert>
        ) : printSetting?.enabled ? (
          <Chip
            size={isMobile ? "small" : "medium"}
            label={`Conectado: ${meta.label}`}
            sx={{
              mb: 1,
              maxWidth: "100%",
              fontWeight: 900,
              bgcolor: `${meta.color}18`,
              color: meta.color,
            }}
          />
        ) : (
          <Alert severity="warning" sx={{ borderRadius: 2, mb: 1 }}>
            No hay conectividad configurada.
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr" },
            gap: { xs: 0.8, sm: 1 },
          }}
        >
          <Button
            onClick={handleConfiguredPayload}
            disabled={!canSendPayload}
            variant="contained"
            fullWidth
            startIcon={
              sendingPayload || loadingConfig ? (
                <CircularProgress size={17} color="inherit" />
              ) : (
                meta.icon
              )
            }
            sx={{
              ...buttonBaseSx,
              bgcolor: meta.color,
              boxShadow: `0 10px 22px ${meta.color}36`,
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
            {sendingPayload || loadingConfig ? "..." : meta.label}
          </Button>

          <Button
            onClick={handleSend}
            disabled={!isValidPhone || isBusy}
            fullWidth
            variant="contained"
            color="success"
            startIcon={
              loadingSend ? (
                <CircularProgress size={17} color="inherit" />
              ) : (
                <WhatsAppIcon fontSize="small" />
              )
            }
            sx={buttonBaseSx}
          >
            {loadingSend ? "..." : "WhatsApp"}
          </Button>

          <Button
            onClick={handleClose}
            disabled={isBusy}
            fullWidth
            color="inherit"
            variant="outlined"
            sx={{
              ...buttonBaseSx,
              gridColumn: "1 / -1",
            }}
          >
            Cerrar
          </Button>
        </Box>
      </Box>
    </Box>
  );

  if (isDesktop) {
    return (
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1400,
          bgcolor: "rgba(15,23,42,.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 760,
            maxHeight: "92vh",
            bgcolor: "background.paper",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 24px 80px rgba(0,0,0,.25)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid",
              borderColor: "divider",
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                flex: 1,
                fontWeight: 900,
                fontSize: "1.1rem",
              }}
            >
              Ticket #{sale?.id || ""}
            </Typography>

            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ minHeight: 0, overflow: "hidden" }}>{content}</Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1600,
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1,
          py: 0.75,
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          minHeight: { xs: 54, sm: 60 },
          flexShrink: 0,
        }}
      >
        <IconButton onClick={handleClose} size="small">
          <ArrowBackIcon />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            flex: 1,
            fontWeight: 900,
            fontSize: { xs: "0.98rem", sm: "1.08rem" },
          }}
        >
          Ticket #{sale?.id || ""}
        </Typography>

        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {content}
      </Box>
    </Box>
  );
}
