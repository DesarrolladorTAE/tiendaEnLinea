import { normalizeDocumentSetting, documentActionMeta, deliverDocumentPdf } from "../../utils/saleDocument";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
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

import SaleDocumentPreview from "./SaleDocumentPreview";
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
  branchId,
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
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [previewAttempt, setPreviewAttempt] = useState(0);

  const digitsOnly = (v) =>
    String(v || "")
      .replace(/\D/g, "")
      .slice(0, 10);
  const isValidPhone = /^\d{10}$/.test(phone);

  const meta = useMemo(() => {
    const documentMeta = documentActionMeta(printSetting);
    if (documentMeta) return documentMeta;
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
  }, [open, sale?.id, printSetting?.enabled, printSetting?.app_type, printSetting?.auto_send_payload]);

  useEffect(() => {
    if (!open || !sale?.id) return;
    let active = true;
    setPreview(null); setPreviewError(false); setPreviewLoading(true);
    axiosClientPOS.get(`/sales/${sale.id}/documents/default/preview`)
      .then(({ data }) => {
        if (!data?.document || !data?.config || !["ticket", "nota_venta", "comprobante"].includes(data.document_type)) throw new Error("Invalid document preview");
        if (active) setPreview(data);
      })
      .catch(() => { if (active) setPreviewError(true); })
      .finally(() => { if (active) setPreviewLoading(false); });
    return () => { active = false; };
  }, [open, sale?.id, previewAttempt]);

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

      setPrintSetting(normalizeDocumentSetting(data));
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
      showSuccess("📨 Documento enviado por WhatsApp");
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
      `/sales/${sale.id}/documents/default/payload`,
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
      if (["document_pdf", "document_print"].includes(printSetting.app_type)) {
        await deliverDocumentPdf(axiosClientPOS, sale.id, printSetting.app_type === "document_print");
        return;
      }
      if (printSetting.app_type === "whatsapp") {
        await handleSend();
        return;
      }
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

  const totalLabel = sale?.receiptPayload?.is_credit_sale ? "Venta a crédito" : sale?.receiptPayload?.is_pending_sale ? "Venta pendiente" : "Venta completada";
  const actionColor = meta.color || "#ffba08";

  return <Box sx={{ bgcolor: "#fffdf7", border: "1px solid #e6e2d8", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
    <Box sx={{ p: { xs: 1.5, sm: 2 }, textAlign: "center", bgcolor: "#f4f1e8", overflow: "hidden" }}>
      <Typography sx={{ fontWeight: 900, color: "#1c1f24", mb: 1 }}>{totalLabel}</Typography>
      {sale?.receiptContext?.client && <Box sx={{ mb: 1.5, p: 1, textAlign: "left", border: "1px solid #e7d9ad", bgcolor: "#fffaf0", borderRadius: 1 }}><Typography variant="body2" fontWeight={900}>{sale.receiptContext.client.nombre_alias || sale.receiptContext.client.name || sale.receiptContext.client.nombre}</Typography>{sale.receiptContext.creditSale && <Typography variant="caption" display="block">Venta a fiado{sale.receiptContext.creditAccount?.payment_due_date ? ` - pago: ${String(sale.receiptContext.creditAccount.payment_due_date).slice(0, 10)}` : ""}</Typography>}</Box>}
      {previewLoading && <Box role="status" sx={{ py: 4 }}><CircularProgress size={24} /><Typography sx={{ mt: 1 }}>Cargando vista previa...</Typography></Box>}
      {previewError && <Alert severity="warning" sx={{ textAlign: "left" }} action={<Button color="inherit" size="small" onClick={() => setPreviewAttempt(value => value + 1)}>Reintentar</Button>}>No se pudo cargar la vista previa. La venta se guardó; puedes descargar el documento o reintentar.</Alert>}
      {preview && <SaleDocumentPreview preview={preview} />}
    </Box>
    {sale?.whatsapp?.attempted && <Alert severity={sale.whatsapp.sent ? "success" : "warning"}>{sale.whatsapp.sent ? "Documento enviado por WhatsApp." : "La venta se guardó, pero no se pudo enviar por WhatsApp."}</Alert>}
    <Stack spacing={1} sx={{ p: 2 }}>
      {loadingConfig && <Typography variant="caption">Consultando configuración de impresión...</Typography>}
      {!loadingConfig && !printSetting?.enabled && <Alert severity="warning">La impresión no está configurada para este punto de venta.</Alert>}
      <Button variant="contained" fullWidth startIcon={<PrintRoundedIcon />} disabled={!canSendPayload || printSetting?.app_type === "whatsapp" || printSetting?.app_type === "document_pdf"} onClick={handleConfiguredPayload} sx={{ bgcolor: actionColor, color: "#fff", fontWeight: 900, textTransform: "none", borderRadius: 2, minHeight: 44, "&:hover": { bgcolor: actionColor, filter: "brightness(.9)" } }}>{sendingPayload ? "Imprimiendo..." : "Imprimir"}</Button>
      <Button variant="outlined" fullWidth onClick={() => deliverDocumentPdf(axiosClientPOS, sale.id).catch(error => showError(error.message))} disabled={!sale?.id || isBusy} sx={{ borderColor: "#c7b27a", color: "#1c1f24", fontWeight: 800, textTransform: "none", borderRadius: 2, minHeight: 44 }}>Descargar ticket</Button>
      <TextField label="Número WhatsApp" fullWidth size="small" value={phone} onChange={e => setPhone(digitsOnly(e.target.value))} inputProps={{ maxLength: 10, inputMode: "numeric" }} />
      <Button onClick={handleSend} disabled={!isValidPhone || isBusy} startIcon={<WhatsAppIcon />} sx={{ color: "#187a3f", textTransform: "none", fontWeight: 800 }}>Enviar por WhatsApp</Button>
      <Button onClick={handleClose} disabled={isBusy} fullWidth variant="outlined" color="inherit" sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2 }}>Nueva venta</Button>
    </Stack>
  </Box>;
}
