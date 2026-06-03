import React, { useEffect, useMemo, useState } from "react";
import { Button, Alert, Chip, CircularProgress, Stack } from "@mui/material";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import SettingsIcon from "@mui/icons-material/Settings";
import ComputerIcon from "@mui/icons-material/Computer";
import LanIcon from "@mui/icons-material/Lan";
import AndroidIcon from "@mui/icons-material/Android";
import AppleIcon from "@mui/icons-material/Apple";
import BluetoothIcon from "@mui/icons-material/Bluetooth";

import CreditPdfViewerModal from "./CreditPdfViewerModal";
import axiosClient from "../../config/axiosClientPOS";
import { showError, showSuccess } from "../../utils/alerts";

const APP_META = {
  windows_usb: {
    label: "Enviar a Windows USB",
    color: "#1565c0",
    icon: <ComputerIcon />,
  },
  windows_ip: {
    label: "Enviar a Windows IP",
    color: "#1976d2",
    icon: <LanIcon />,
  },
  android_usb: {
    label: "Enviar a Android USB",
    color: "#2e7d32",
    icon: <AndroidIcon />,
  },
  android_ip: {
    label: "Enviar a Android IP",
    color: "#1b5e20",
    icon: <AndroidIcon />,
  },
  ios_ip: {
    label: "Enviar a iPhone IP",
    color: "#455a64",
    icon: <AppleIcon />,
  },
  ios_ble: {
    label: "Enviar a iPhone BLE",
    color: "#212121",
    icon: <BluetoothIcon />,
  },
};

const cleanPhone10 = (value) =>
  String(value || "")
    .replace(/\D+/g, "")
    .slice(-10);

export default function CreditTicketModal({
  open,
  onClose,
  sale,
  phone,
  setPhone,
  onSendWhatsapp,
  sending = false,
}) {
  const pdfUrl = sale?.id ? `/v2/sales/${sale.id}/ticket.pdf` : "";
  const posLocationId = sale?.pos_location_id || sale?.posLocation?.id || null;

  const resolvedPhone = useMemo(() => {
    return cleanPhone10(
      phone ||
        sale?.client?.telefono ||
        sale?.cliente?.telefono ||
        sale?.client_phone ||
        ""
    );
  }, [phone, sale]);

  const [loadingConfig, setLoadingConfig] = useState(false);
  const [sendingPayload, setSendingPayload] = useState(false);
  const [sendingWhatsappLocal, setSendingWhatsappLocal] = useState(false);
  const [printSetting, setPrintSetting] = useState(null);

  useEffect(() => {
    if (!open || !sale?.id || !posLocationId) return;

    const loadConfig = async () => {
      try {
        setLoadingConfig(true);

        const { data } = await axiosClient.get(
          `/pos/print-settings/${posLocationId}/payload-config`
        );

        setPrintSetting(data || null);
      } catch (e) {
        console.error(e);
        setPrintSetting(null);
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfig();
  }, [open, sale?.id, posLocationId]);

  const meta = useMemo(() => {
    if (!printSetting?.enabled || !printSetting?.app_type) {
      return {
        label: "Configurar conexión",
        color: "#9ca3af",
        icon: <SettingsIcon />,
      };
    }

    return (
      APP_META[printSetting.app_type] || {
        label: "Enviar payload",
        color: "#2563eb",
        icon: <PrintRoundedIcon />,
      }
    );
  }, [printSetting]);

  const handleSendWhatsapp = async ({
    es_cliente,
    phone: targetPhone,
  } = {}) => {
    if (!sale?.id) {
      showError("No se encontró la venta.");
      return;
    }

    const cleanPhone = cleanPhone10(targetPhone || resolvedPhone);

    if (!cleanPhone || cleanPhone.length !== 10) {
      showError("Ingresa un número válido de 10 dígitos.");
      return;
    }

    if (typeof onSendWhatsapp === "function") {
      await onSendWhatsapp({
        es_cliente,
        phone: cleanPhone,
      });
      return;
    }

    try {
      setSendingWhatsappLocal(true);

      const { data } = await axiosClient.post(
        `/sales/${sale.id}/send-whatsapp`,
        {
          phone: cleanPhone,
          es_cliente,
        }
      );

      showSuccess(
        data?.message || "Ticket enviado correctamente por WhatsApp."
      );
    } catch (e) {
      console.error(e);
      showError(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.response?.data?.details ||
          "No se pudo enviar el ticket por WhatsApp."
      );
    } finally {
      setSendingWhatsappLocal(false);
    }
  };

  const getPrintPayload = async () => {
    const { data } = await axiosClient.get(`/sales/${sale.id}/print-payload`);

    if (!data?.ok || !data?.payload) {
      throw new Error(
        data?.message || "No se pudo obtener payload de impresión."
      );
    }

    return data.payload;
  };

  const getPrinterConfig = async () => {
    if (!posLocationId) {
      throw new Error("No se encontró el punto de venta actual.");
    }

    const { data: ticket } = await axiosClient.get(
      `/pos/ticket-config/${posLocationId}`
    );

    const printerIp = String(ticket?.printer_ip || "").trim();
    const printerPort = Number(ticket?.printer_port || 0);

    if (!printerIp || !printerPort) {
      throw new Error("Configura primero la IP y puerto de la impresora.");
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
      throw new Error("No hay bridge Flutter disponible.");
    }

    const resp = await window.flutter_inappwebview.callHandler(
      "printTicket",
      request
    );

    if (!resp?.ok) {
      throw new Error(resp?.message || "No se pudo imprimir desde la app.");
    }

    return true;
  };

  const handleConfiguredPayload = async () => {
    if (!sale?.id) return;

    if (!printSetting?.enabled || !printSetting?.app_type) {
      showError("Configura primero la conexión del punto de venta.");
      return;
    }

    try {
      setSendingPayload(true);

      const appType = printSetting.app_type;
      const payload = await getPrintPayload();

      if (appType === "windows_usb") {
        const ok = sendToWindows({
          ...payload,
          app_type: appType,
          transport: "usb",
        });

        if (!ok) throw new Error("No hay bridge Windows disponible.");
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

        if (!ok) throw new Error("No hay bridge Windows disponible.");
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
    } catch (e) {
      console.error(e);
      showError(e?.message || "No se pudo enviar el payload.");
    } finally {
      setSendingPayload(false);
    }
  };

  const extraActions = (
    <Stack spacing={1}>
      {loadingConfig ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          Cargando configuración de impresión...
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
        fullWidth
        variant="contained"
        startIcon={
          sendingPayload || loadingConfig ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            meta.icon
          )
        }
        onClick={handleConfiguredPayload}
        disabled={
          sendingPayload ||
          loadingConfig ||
          sending ||
          !printSetting?.enabled ||
          !printSetting?.app_type
        }
        sx={{
          textTransform: "none",
          fontWeight: 900,
          minHeight: 44,
          bgcolor: meta.color,
          "&:hover": { bgcolor: meta.color, filter: "brightness(.92)" },
        }}
      >
        {sendingPayload || loadingConfig ? "Procesando..." : meta.label}
      </Button>
    </Stack>
  );

  return (
    <CreditPdfViewerModal
      open={open}
      onClose={onClose}
      title={`Ticket de venta #${sale?.id || ""}`}
      pdfUrl={pdfUrl}
      phone={resolvedPhone}
      setPhone={setPhone}
      onSendWhatsapp={handleSendWhatsapp}
      sending={sending || sendingWhatsappLocal}
      downloadName={`ticket_venta_${sale?.id || ""}.pdf`}
      extraActions={extraActions}
    />
  );
}