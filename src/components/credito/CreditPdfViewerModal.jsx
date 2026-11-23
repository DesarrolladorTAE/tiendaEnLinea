import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Paper,
  Alert,
  useMediaQuery,
  CircularProgress,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";

import axiosClient from "../../config/axiosClientPOS";
import { showError } from "../../utils/alerts";

export default function CreditPdfViewerModal({
  open,
  onClose,
  title = "Vista PDF",
  pdfUrl,
  phone,
  setPhone,
  onSendWhatsapp,
  sending = false,
  downloadName = "documento.pdf",
  extraActions = null,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [loadingPdf, setLoadingPdf] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");

  const [sendToClient, setSendToClient] = useState(true);
  const [otherPhone, setOtherPhone] = useState("");

  useEffect(() => {
    if (open) {
      setSendToClient(true);
      setOtherPhone("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || !pdfUrl) return;

    let alive = true;
    let localUrl = "";

    const loadPdf = async () => {
      try {
        setLoadingPdf(true);

        const resp = await axiosClient.get(pdfUrl, {
          responseType: "arraybuffer",
        });

        const blob = new Blob([resp.data], { type: "application/pdf" });
        localUrl = URL.createObjectURL(blob);

        if (alive) setBlobUrl(localUrl);
      } catch (e) {
        console.error("Error cargando PDF:", e);
        showError("No se pudo cargar el PDF.");
        if (alive) setBlobUrl("");
      } finally {
        if (alive) setLoadingPdf(false);
      }
    };

    loadPdf();

    return () => {
      alive = false;
      if (localUrl) URL.revokeObjectURL(localUrl);
      setBlobUrl("");
    };
  }, [open, pdfUrl]);

  const normalizePhone = (value) =>
    String(value || "")
      .replace(/\D+/g, "")
      .slice(-10);

  const handleOtherPhone = (e) => {
    const clean = String(e.target.value || "")
      .replace(/\D/g, "")
      .slice(0, 10);

    setOtherPhone(clean);
  };

  const handleSwitch = (e) => {
    const checked = e.target.checked;
    setSendToClient(checked);

    if (!checked) {
      setOtherPhone("");
    }
  };

  const handleSend = () => {
    if (typeof onSendWhatsapp !== "function") {
      showError("No está configurada la función para enviar por WhatsApp.");
      return;
    }

    const targetPhone = sendToClient ? phone : otherPhone;
    const cleanPhone = normalizePhone(targetPhone);

    if (cleanPhone.length !== 10) {
      showError(
        sendToClient
          ? "El cliente no tiene un número válido registrado."
          : "Ingresa un número válido de 10 dígitos."
      );
      return;
    }

    onSendWhatsapp({
      es_cliente: sendToClient,
      phone: cleanPhone,
    });
  };

  const downloadPdf = () => {
    if (!blobUrl) return;

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const clientPhone = normalizePhone(phone);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ fontWeight: 900, pr: 6 }}>
        {title}

        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 10 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 360px",
            minHeight: fullScreen ? "calc(100vh - 64px)" : 650,
          }}
        >
          {!isMobile ? (
            <Box
              sx={{
                borderRight: "1px solid #e5e7eb",
                position: "relative",
              }}
            >
              {loadingPdf ? (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  sx={{ minHeight: 650 }}
                >
                  <CircularProgress />
                  <Typography mt={2}>Cargando PDF...</Typography>
                </Stack>
              ) : blobUrl ? (
                <iframe
                  title={title}
                  src={blobUrl}
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: 650,
                    border: "none",
                    background: "#fff",
                  }}
                />
              ) : (
                <Box p={3}>No se encontró el PDF.</Box>
              )}
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                En móvil no se muestra el visor. Puedes descargar el PDF o
                enviarlo por WhatsApp.
              </Alert>
            </Box>
          )}

          <Box sx={{ p: 2, bgcolor: "#fff" }}>
            <Stack spacing={2}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: sendToClient ? "#f0fdf4" : "#fff",
                  borderColor: sendToClient ? "#22c55e" : "divider",
                }}
              >
                <Typography sx={{ fontWeight: 900 }}>
                  Enviar por WhatsApp
                </Typography>

                <FormControlLabel
                  sx={{
                    mt: 1,
                    mb: sendToClient ? 0 : 1,
                    width: "100%",
                    ml: 0,
                    justifyContent: "space-between",
                    bgcolor: sendToClient ? "#22c55e" : "#fff",
                    border: "1px solid",
                    borderColor: sendToClient ? "#16a34a" : "#d1d5db",
                    color: sendToClient ? "#fff" : "#111827",
                    borderRadius: 999,
                    px: 1.5,
                    py: 0.5,
                  }}
                  labelPlacement="start"
                  control={
                    <Switch checked={sendToClient} onChange={handleSwitch} />
                  }
                  label={
                    <Typography sx={{ fontWeight: 900 }}>
                      Enviar al cliente
                    </Typography>
                  }
                />

                {sendToClient ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ color: "#166534" }}>
                      Se enviará al número registrado del cliente.
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mt: 0.5,
                        color: clientPhone.length === 10 ? "#166534" : "#b45309",
                        fontWeight: 800,
                      }}
                    >
                      {clientPhone.length === 10
                        ? `Número detectado: ${clientPhone}`
                        : "No se detectó un número válido del cliente."}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Escribe otro número para enviar este documento.
                    </Typography>

                    <TextField
                      size="small"
                      label="Otro número WhatsApp"
                      value={otherPhone}
                      onChange={handleOtherPhone}
                      inputProps={{ inputMode: "numeric", maxLength: 10 }}
                      fullWidth
                    />
                  </>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={
                    sending ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <WhatsAppIcon />
                    )
                  }
                  disabled={sending}
                  onClick={handleSend}
                  sx={{
                    mt: 1.5,
                    textTransform: "none",
                    fontWeight: 900,
                    bgcolor: "#25D366",
                    "&:hover": { bgcolor: "#1ebe5d" },
                  }}
                >
                  {sending ? "Enviando..." : "Enviar WhatsApp"}
                </Button>
              </Paper>

              {extraActions}

              <Button
                fullWidth
                variant="outlined"
                startIcon={<DownloadRoundedIcon />}
                onClick={downloadPdf}
                disabled={!blobUrl || loadingPdf}
                sx={{ textTransform: "none", fontWeight: 900 }}
              >
                Descargar PDF
              </Button>

              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                onClick={onClose}
              >
                Cerrar
              </Button>
            </Stack>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}