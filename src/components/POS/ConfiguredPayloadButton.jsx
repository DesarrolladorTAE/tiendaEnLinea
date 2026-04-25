import React, { useEffect, useMemo, useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ComputerIcon from "@mui/icons-material/Computer";
import AndroidIcon from "@mui/icons-material/Android";
import AppleIcon from "@mui/icons-material/Apple";
import BluetoothIcon from "@mui/icons-material/Bluetooth";
import LanIcon from "@mui/icons-material/Lan";

import axiosClientPOS from "../../config/axiosClientPOS";
import { showSuccess, showError } from "../../utils/alerts";

const APP_META = {
  windows_usb: {
    text: "Enviar a Windows USB",
    color: "#1565c0",
    icon: <ComputerIcon />,
  },
  windows_ip: {
    text: "Enviar a Windows IP",
    color: "#1976d2",
    icon: <LanIcon />,
  },
  android_usb: {
    text: "Enviar a Android USB",
    color: "#2e7d32",
    icon: <AndroidIcon />,
  },
  android_ip: {
    text: "Enviar a Android IP",
    color: "#1b5e20",
    icon: <AndroidIcon />,
  },
  ios_ip: {
    text: "Enviar a iPhone IP",
    color: "#455a64",
    icon: <AppleIcon />,
  },
  ios_ble: {
    text: "Enviar a iPhone BLE",
    color: "#212121",
    icon: <BluetoothIcon />,
  },
  whatsapp: {
    text: "Enviar por WhatsApp",
    color: "#25D366",
    icon: <WhatsAppIcon />,
  },
};

export default function ConfiguredPayloadButton({
  ventaId,
  posLocationId,
  whatsappPhone = "",
  disabled = false,
  autoSend = false,
  fullWidth = true,
  onSuccess,
}) {
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [sending, setSending] = useState(false);
  const [setting, setSetting] = useState(null);

  const isLoading = loadingConfig || sending;

  const meta = useMemo(() => {
    if (!setting?.enabled || !setting?.app_type) {
      return {
        text: "Configurar conexión",
        color: "#9ca3af",
        icon: <SettingsRoundedIcon />,
      };
    }

    return APP_META[setting.app_type] || {
      text: "Enviar payload",
      color: "#2563eb",
      icon: <PrintRoundedIcon />,
    };
  }, [setting]);

  useEffect(() => {
    if (posLocationId) {
      fetchPayloadConfig();
    }
  }, [posLocationId]);

  useEffect(() => {
    if (
      autoSend &&
      ventaId &&
      setting?.enabled &&
      setting?.auto_send_payload &&
      !sending
    ) {
      handleSend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSend, ventaId, setting]);

  const fetchPayloadConfig = async () => {
    try {
      setLoadingConfig(true);

      const { data } = await axiosClientPOS.get(
        `/pos/print-settings/${posLocationId}/payload-config`
      );

      setSetting(data || null);
    } catch (error) {
      console.error("Error cargando configuración de payload:", error);
      setSetting(null);
    } finally {
      setLoadingConfig(false);
    }
  };

  const getPrintPayload = async () => {
    const { data } = await axiosClientPOS.get(`/sales/${ventaId}/print-payload`);

    if (!data?.ok || !data?.payload) {
      throw new Error(data?.message || "No se pudo obtener el payload.");
    }

    return data.payload;
  };

  const sendToBridge = (payload) => {
    if (typeof window.sendPrintPayloadToWindows === "function") {
      window.sendPrintPayloadToWindows(payload);
      return true;
    }

    if (window.chrome?.webview?.postMessage) {
      window.chrome.webview.postMessage(JSON.stringify(payload));
      return true;
    }

    if (window.ReactNativeWebView?.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      return true;
    }

    if (window.webkit?.messageHandlers?.printPayload?.postMessage) {
      window.webkit.messageHandlers.printPayload.postMessage(payload);
      return true;
    }

    return false;
  };

  const handleSendWhatsapp = async () => {
    const phone = String(whatsappPhone || "").replace(/\D/g, "");

    if (phone.length !== 10) {
      throw new Error("Ingresa un número válido de 10 dígitos.");
    }

    await axiosClientPOS.post(`/sales/${ventaId}/send-whatsapp`, {
      phone,
    });

    showSuccess("Ticket enviado por WhatsApp correctamente.");
  };

  const handleSend = async () => {
    if (!ventaId) {
      showError("No hay venta para enviar.");
      return;
    }

    if (!setting?.enabled || !setting?.app_type) {
      showError("Configura primero la conexión del punto de venta.");
      return;
    }

    try {
      setSending(true);

      if (setting.app_type === "whatsapp") {
        await handleSendWhatsapp();
        onSuccess?.(setting.app_type);
        return;
      }

      const payload = await getPrintPayload();

      const finalPayload = {
        ...payload,
        app_type: setting.app_type,
        transport: setting.app_type,
        pos_location_id: posLocationId,
      };

      const ok = sendToBridge(finalPayload);

      if (!ok) {
        throw new Error(
          "No se encontró una aplicación conectada para recibir el payload."
        );
      }

      showSuccess(`Payload enviado correctamente: ${meta.text}`);
      onSuccess?.(setting.app_type);
    } catch (error) {
      console.error("Error enviando payload:", error);
      showError(error?.message || "No se pudo enviar el payload.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      fullWidth={fullWidth}
      variant="contained"
      startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : meta.icon}
      onClick={handleSend}
      disabled={disabled || isLoading || !setting?.enabled}
      sx={{
        py: 1.35,
        borderRadius: 3,
        fontWeight: 900,
        textTransform: "none",
        bgcolor: meta.color,
        boxShadow: `0 12px 28px ${meta.color}44`,
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
      {isLoading ? "Procesando..." : meta.text}
    </Button>
  );
}