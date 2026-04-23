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
  Divider,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LanIcon from "@mui/icons-material/Lan";
import ComputerIcon from "@mui/icons-material/Computer";
import AndroidIcon from "@mui/icons-material/Android";
import BluetoothIcon from "@mui/icons-material/Bluetooth";

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

  const [loadingWindowsUsb, setLoadingWindowsUsb] = useState(false);
  const [loadingWindowsIp, setLoadingWindowsIp] = useState(false);
  const [loadingAndroidUsb, setLoadingAndroidUsb] = useState(false);
  const [loadingFlutterIp, setLoadingFlutterIp] = useState(false);
  const [loadingIosBle, setLoadingIosBle] = useState(false);

  const [loadingPayload, setLoadingPayload] = useState(false);
  const [payloadPreview, setPayloadPreview] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const origin = window.location.origin;
  const baseUrl = origin.includes("localhost")
    ? "https://mitiendaenlineamx.com.mx"
    : origin;

  useEffect(() => {
    if (open) {
      setNumero("");
      setSending(false);
      setLoadingWindowsUsb(false);
      setLoadingWindowsIp(false);
      setLoadingAndroidUsb(false);
      setLoadingFlutterIp(false);
      setLoadingIosBle(false);
      loadPayloadPreview();
    } else {
      setPayloadPreview(null);
      setLoadingPayload(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const isPrinting =
    loadingWindowsUsb ||
    loadingWindowsIp ||
    loadingAndroidUsb ||
    loadingFlutterIp ||
    loadingIosBle;

  const handleEnviarWhatsapp = async () => {
    if (!ventaId) {
      showError("❌ No hay venta para enviar.");
      return;
    }

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

  const handleWindowsUsb = async () => {
    if (!ventaId) {
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
      console.error("Error Windows USB:", err);
      showError(`❌ Error en Windows USB: ${err?.message || err}`);
    } finally {
      setLoadingWindowsUsb(false);
    }
  };

  const handleWindowsIp = async () => {
    if (!ventaId) {
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
      console.error("Error Windows IP:", err);
      showError(`❌ Error en Windows IP: ${err?.message || err}`);
    } finally {
      setLoadingWindowsIp(false);
    }
  };

  const handleAndroidUsb = async () => {
    if (!ventaId) {
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

      throw new Error("No hay bridge Android USB disponible.");
    } catch (err) {
      console.error("Error Android USB:", err);
      showError(`❌ Error en Android USB: ${err?.message || err}`);
    } finally {
      setLoadingAndroidUsb(false);
    }
  };

  const handleFlutterIp = async () => {
    if (!ventaId) {
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
      console.log(
        "flutter_inappwebview disponible:",
        !!window.flutter_inappwebview
      );

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
      console.error("Error Flutter IP:", err);
      showError(`❌ Error al imprimir por IP: ${err?.message || err}`);
    } finally {
      setLoadingFlutterIp(false);
    }
  };

  const handleIosBle = async () => {
    if (!ventaId) {
      showError("❌ No hay venta para imprimir.");
      return;
    }

    setLoadingIosBle(true);
    try {
      const payload = await getPrintPayload();

      const request = {
        payload,
      };

      console.log("printTicket BLE -> request", request);
      console.log(
        "flutter_inappwebview disponible:",
        !!window.flutter_inappwebview
      );

      if (window.flutter_inappwebview?.callHandler) {
        const resp = await window.flutter_inappwebview.callHandler(
          "printTicket",
          request
        );

        console.log("printTicket BLE -> response", resp);

        if (resp?.ok) {
          showSuccess("🖨️ Enviado a imprimir por iOS BLE");
          return;
        }

        throw new Error(resp?.message || "No se pudo imprimir desde la app.");
      }

      throw new Error("No hay bridge Flutter disponible en este dispositivo.");
    } catch (err) {
      console.error("Error iOS BLE:", err);
      showError(`❌ Error al imprimir por iOS BLE: ${err?.message || err}`);
    } finally {
      setLoadingIosBle(false);
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

      <DialogContent
        dividers
        sx={{
          p: 0,
          bgcolor: "#f7f7f7",
        }}
      >
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
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  sx={{ mb: 1.5 }}
                >
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
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                Enviar por WhatsApp
              </Typography>

              <Stack spacing={1.25}>
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
                  disabled={sending || numero.length !== 10 || isPrinting}
                  fullWidth
                >
                  {sending ? "Enviando..." : "Enviar WhatsApp"}
                </Button>
              </Stack>
            </Paper>

            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, flexGrow: 1 }}
            >
              <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                Impresión por plataforma
              </Typography>

              <Stack spacing={1.25}>
                <Button
                  onClick={handleWindowsUsb}
                  variant="outlined"
                  startIcon={
                    loadingWindowsUsb ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <ComputerIcon />
                    )
                  }
                  disabled={isPrinting}
                  fullWidth
                  sx={{ minHeight: 46, justifyContent: "flex-start" }}
                >
                  {loadingWindowsUsb ? "Imprimiendo..." : "Windows USB"}
                </Button>

                <Button
                  onClick={handleWindowsIp}
                  variant="contained"
                  startIcon={
                    loadingWindowsIp ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <LanIcon />
                    )
                  }
                  disabled={isPrinting}
                  fullWidth
                  sx={{ minHeight: 46, justifyContent: "flex-start" }}
                >
                  {loadingWindowsIp ? "Imprimiendo..." : "Windows IP"}
                </Button>

                <Button
                  onClick={handleAndroidUsb}
                  variant="outlined"
                  color="success"
                  startIcon={
                    loadingAndroidUsb ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <AndroidIcon />
                    )
                  }
                  disabled={isPrinting}
                  fullWidth
                  sx={{ minHeight: 46, justifyContent: "flex-start" }}
                >
                  {loadingAndroidUsb ? "Imprimiendo..." : "Android USB"}
                </Button>

                <Button
                  onClick={handleFlutterIp}
                  variant="contained"
                  color="secondary"
                  startIcon={
                    loadingFlutterIp ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <LanIcon />
                    )
                  }
                  disabled={isPrinting}
                  fullWidth
                  sx={{ minHeight: 46, justifyContent: "flex-start" }}
                >
                  {loadingFlutterIp ? "Imprimiendo..." : "IOS IP"}
                </Button>

                <Button
                  onClick={handleIosBle}
                  variant="contained"
                  color="info"
                  startIcon={
                    loadingIosBle ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <BluetoothIcon />
                    )
                  }
                  disabled={isPrinting}
                  fullWidth
                  sx={{ minHeight: 46, justifyContent: "flex-start" }}
                >
                  {loadingIosBle ? "Imprimiendo..." : "IOS BLE"}
                </Button>

                <Divider sx={{ my: 1 }} />

                <Button
                  onClick={onClose}
                  variant="outlined"
                  color="inherit"
                  fullWidth
                  sx={{ minHeight: 44 }}
                >
                  Cerrar
                </Button>
              </Stack>
            </Paper>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}