// src/components/ventas/FacturaWhatsAppDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Box,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import axiosClientPOS from "../../config/axiosClientPOS";

export default function FacturaWhatsAppDialog({
  open,
  onClose,
  saleId,
  cliente,
  tipoDocumento, // "pdf" | "xml"
}) {
  const telefonoCliente =
    cliente?.telefono ||
    cliente?.phone ||
    cliente?.celular ||
    cliente?.mobile ||
    "";

  const [usarTelefonoCliente, setUsarTelefonoCliente] = React.useState(true);
  const [phone, setPhone] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    if (!open) return;

    setErrorMsg("");

    // Ya no dependemos del teléfono del cliente para activar el switch,
    // porque el backend lo resuelve con es_cliente=true.
    setUsarTelefonoCliente(true);
    setPhone("");
  }, [open, saleId, tipoDocumento]);

  const handleToggle = (e) => {
    const checked = e.target.checked;
    setUsarTelefonoCliente(checked);
    setErrorMsg("");

    if (checked) {
      setPhone("");
    }
  };

  const handleSend = async () => {
    if (!saleId || !tipoDocumento) return;

    if (!usarTelefonoCliente && !phone.trim()) {
      setErrorMsg("Debes capturar un número para envío externo.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const payload = usarTelefonoCliente
        ? {
            tipo: tipoDocumento,
            es_cliente: true,
          }
        : {
            phone: phone.trim(),
            tipo: tipoDocumento,
            es_cliente: false,
          };

      await axiosClientPOS.post(
        `/pos/facturacion/ventas/${saleId}/send-whatsapp`,
        payload
      );

      onClose?.();
    } catch (error) {
      const backendError =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.response?.data?.details ||
        "No se pudo enviar el documento por WhatsApp.";

      setErrorMsg(backendError);
      console.error("Error enviando WhatsApp:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ pr: 7 }}>
        Enviar por WhatsApp
        <IconButton
          onClick={onClose}
          disabled={loading}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info">
            Se enviará el archivo <b>{tipoDocumento?.toUpperCase()}</b> por WhatsApp.
          </Alert>

          {!!errorMsg && (
            <Alert severity="error">
              {errorMsg}
            </Alert>
          )}

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.default",
            }}
          >
            <FormControlLabel
              sx={{ m: 0, width: "100%", alignItems: "flex-start" }}
              control={
                <Switch
                  checked={usarTelefonoCliente}
                  onChange={handleToggle}
                  disabled={loading}
                />
              }
              label={
                <Box>
                  <Typography fontWeight={700}>
                    Enviar al teléfono del cliente
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {usarTelefonoCliente
                      ? telefonoCliente
                        ? `Se intentará usar el teléfono registrado: ${telefonoCliente}`
                        : "El backend buscará el teléfono registrado del cliente."
                      : "Se enviará a un número externo capturado manualmente."}
                  </Typography>
                </Box>
              }
            />
          </Box>

          <TextField
            label="Número externo"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            disabled={loading || usarTelefonoCliente}
            placeholder="Ej. 7441234567"
            helperText={
              usarTelefonoCliente
                ? "Activado: se usará el teléfono del cliente desde backend."
                : "Captura aquí el número al que deseas enviar el documento."
            }
          />

          <Typography variant="body2" color="text.secondary">
            {usarTelefonoCliente
              ? "Se enviará con mensaje para cliente registrado."
              : "Se enviará con mensaje para un número externo."}
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Cancelar
        </Button>

        <Button
          onClick={handleSend}
          variant="contained"
          color="success"
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <WhatsAppIcon />
            )
          }
          disabled={loading || !saleId || !tipoDocumento || (!usarTelefonoCliente && !phone.trim())}
        >
          {loading ? "Enviando..." : "Enviar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}