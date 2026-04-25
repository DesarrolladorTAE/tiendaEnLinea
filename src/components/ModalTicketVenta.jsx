import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Stack,
  useMediaQuery,
  Box,
  Typography,
  Paper,
  Alert,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LanIcon from "@mui/icons-material/Lan";
import ComputerIcon from "@mui/icons-material/Computer";
import AndroidIcon from "@mui/icons-material/Android";
import BluetoothIcon from "@mui/icons-material/Bluetooth";
import SettingsIcon from "@mui/icons-material/Settings";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";

import axiosClientPOS from "../config/axiosClientPOS";
import { showSuccess, showError } from "../utils/alerts";

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
    icon: <LanIcon />,
  },
  ios_ble: {
    label: "Enviar a iPhone BLE",
    color: "#212121",
    icon: <BluetoothIcon />,
  },
  whatsapp: {
    label: "Enviar por WhatsApp",
    color: "#25D366",
    icon: <WhatsAppIcon />,
  },
};

export default function ModalTicketVenta({
  open,
  onClose,
  ventaId,
  ticketUrl,
  posLocationId,
}) {
  const [numero, setNumero] = useState("");
  const [loadingPayload, setLoadingPayload] = useState(false);
  const [payloadPreview, setPayloadPreview] = useState(null);

  const [loadingConfig, setLoadingConfig] = useState(false);
  const [printSetting, setPrintSetting] = useState(null);

  const [sendingPayload, setSendingPayload] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const origin = window.location.origin;
  const baseUrl = origin.includes("localhost")
    ? "https://mitiendaenlineamx.com.mx"
    : origin;

  const pdfUrl = useMemo(() => {
    if (ticketUrl) return ticketUrl;
    if (!ventaId) return "";
    return `${baseUrl}/api/sales/${ventaId}/ticket.pdf`;
  }, [ticketUrl, ventaId, baseUrl]);

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

  const isWhatsapp = printSetting?.app_type === "whatsapp";
  const canSend =
    Boolean(printSetting?.enabled && printSetting?.app_type) &&
    !loadingConfig &&
    !sendingPayload;

  useEffect(() => {
    if (open) {
      setNumero("");
      setPrintSetting(null);
      setPayloadPreview(null);
      loadPayloadPreview();
      loadPayloadConfig();
    } else {
      setNumero("");
      setPrintSetting(null);
      setPayloadPreview(null);
      setLoadingPayload(false);
      setLoadingConfig(false);
      setSendingPayload(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ventaId, posLocationId]);


  if (!ventaId) return null;

  const handleNumeroChange = (e) => {
    const input = (e.target.value || "").replace(/\D/g, "").slice(0, 10);
    setNumero(input);
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
      console.error("Error cargando configuración:", error);
      setPrintSetting(null);
    } finally {
      setLoadingConfig(false);
    }
  };

  const getPrintPayload = async () => {
    const { data } = await axiosClientPOS.get(`/sales/${ventaId}/print-payload`);

    if (!data?.ok || !data?.payload) {
      throw new Error(data?.message || "No se pudo obtener payload de impresión");
    }

    return data.payload;
  };

  const getPrinterConfig = async () => {
    if (!posLocationId) {
      throw new Error("No se encontró el punto de venta actual.");
    }

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

    return { printerIp, printerPort };
  };

  const loadPayloadPreview = async () => {
    if (!ventaId) return;

    setLoadingPayload(true);

    try {
      const payload = await getPrintPayload();
      setPayloadPreview(payload);
    } catch (error) {
      console.error("Error cargando preview payload:", error);
      setPayloadPreview(null);
    } finally {
      setLoadingPayload(false);
    }
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
    if (window.AndroidPrintBridge?.print) {
      window.AndroidPrintBridge.print(JSON.stringify(payload));
      return true;
    }

    return false;
  };

  const sendToFlutter = async (request) => {
    if (!window.flutter_inappwebview?.callHandler) {
      throw new Error("No hay bridge disponible en esta aplicación.");
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

  const handleEnviarWhatsapp = async () => {
    if (numero.length !== 10) {
      throw new Error("Ingresa un número válido de 10 dígitos.");
    }

    await axiosClientPOS.post(`/sales/${ventaId}/send-whatsapp`, {
      phone: numero,
    });

    setNumero("");
  };

  const handleEnviarPayload = async () => {
    if (!ventaId) {
      showError("No hay venta para enviar.");
      return;
    }

    if (!printSetting?.enabled || !printSetting?.app_type) {
      showError("Configura primero la conexión del punto de venta.");
      return;
    }

    setSendingPayload(true);

    try {
      const appType = printSetting.app_type;

      if (appType === "whatsapp") {
        await handleEnviarWhatsapp();
        showSuccess("Ticket enviado por WhatsApp correctamente.");
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
      console.error("Error enviando payload:", error);
      showError(error?.message || "No se pudo enviar el payload.");
    } finally {
      setSendingPayload(false);
    }
  };

  const previewText = (value, fallback = "—") => {
    if (!value || !String(value).trim()) return fallback;
    return String(value).trim();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          overflow: "hidden",
          minHeight: fullScreen ? "100%" : 680,
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
        <span>Ticket de Venta #{ventaId}</span>

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, bgcolor: "#f7f7f7" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 360px",
            minHeight: fullScreen ? "calc(100vh - 64px)" : 620,
          }}
        >
          <Box
            sx={{
              p: isMobile ? 2 : 0,
              bgcolor: "#f7f7f7",
              borderRight: isMobile ? "none" : "1px solid #e5e7eb",
              minHeight: 0,
            }}
          >
            {!isMobile ? (
              pdfUrl ? (
                <iframe
                  title="Ticket PDF"
                  src={pdfUrl}
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: 620,
                    border: "none",
                    display: "block",
                    background: "#fff",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    minHeight: 620,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 3,
                  }}
                >
                  No se encontró la vista previa del ticket.
                </Box>
              )
            ) : (
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                  Datos del ticket
                </Typography>

                {loadingPayload ? (
                  <Box
                    sx={{
                      minHeight: 120,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CircularProgress size={28} />
                  </Box>
                ) : payloadPreview ? (
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      lineHeight: 1.6,
                    }}
                  >
                    {previewText(payloadPreview.textBeforeQr)}
                    {"\n\n"}
                    QR:{" "}
                    {previewText(
                      payloadPreview.qrText ||
                      payloadPreview.qrs?.[0]?.text ||
                      "—"
                    )}
                    {"\n\n"}
                    {previewText(payloadPreview.textAfterQr)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No se pudo cargar el payload del ticket.
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              bgcolor: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
                borderColor: "#e5e7eb",
              }}
            >
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Envío configurado
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    El botón se muestra según la configuración guardada del punto
                    de venta.
                  </Typography>
                </Box>

                {loadingConfig ? (
                  <Box
                    sx={{
                      minHeight: 72,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CircularProgress size={26} />
                  </Box>
                ) : (
                  <>
                    <Chip
                      label={
                        printSetting?.enabled
                          ? `Conexión: ${meta.label}`
                          : "Sin conexión configurada"
                      }
                      sx={{
                        alignSelf: "flex-start",
                        fontWeight: 800,
                        bgcolor: printSetting?.enabled ? `${meta.color}18` : "#f3f4f6",
                        color: printSetting?.enabled ? meta.color : "#6b7280",
                      }}
                    />

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
                      startIcon={<WhatsAppIcon />}
                      onClick={async () => {
                        try {
                          setSendingPayload(true);
                          await handleEnviarWhatsapp();
                          showSuccess("Ticket enviado por WhatsApp correctamente.");
                        } catch (error) {
                          showError(error?.message || "No se pudo enviar por WhatsApp.");
                        } finally {
                          setSendingPayload(false);
                        }
                      }}
                      disabled={sendingPayload || numero.length !== 10}
                      fullWidth
                      sx={{
                        minHeight: 48,
                        borderRadius: 3,
                        fontWeight: 900,
                        textTransform: "none",
                        bgcolor: "#25D366",
                        boxShadow: "0 12px 26px rgba(37,211,102,.28)",
                        "&:hover": {
                          bgcolor: "#1ebe5d",
                        },
                        "&.Mui-disabled": {
                          bgcolor: "#d1d5db",
                          color: "#6b7280",
                          boxShadow: "none",
                        },
                      }}
                    >
                      Enviar por WhatsApp
                    </Button>

                    {!printSetting?.enabled && (
                      <Alert severity="warning" sx={{ borderRadius: 2 }}>
                        Debes configurar la conexión en el apartado de
                        configuración del punto de venta.
                      </Alert>
                    )}

                    <Button
                      variant="contained"
                      startIcon={
                        sendingPayload ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          meta.icon
                        )
                      }
                      onClick={handleEnviarPayload}
                      disabled={!canSend || sendingPayload}
                      fullWidth
                      sx={{
                        minHeight: 48,
                        justifyContent: "flex-start",
                        borderRadius: 3,
                        fontWeight: 900,
                        textTransform: "none",
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
                      {sendingPayload ? "Enviando..." : meta.label}
                    </Button>
                  </>
                )}
              </Stack>
            </Paper>

            <Button
              onClick={onClose}
              variant="outlined"
              color="inherit"
              fullWidth
              sx={{ minHeight: 44, borderRadius: 3 }}
            >
              Cerrar
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}