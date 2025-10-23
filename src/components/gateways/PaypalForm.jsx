import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  Typography,
  Box,
  IconButton,
  InputAdornment,
  Divider,
  Chip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LockIcon from "@mui/icons-material/Lock";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import axiosClient from "../../config/axiosClient";
import { showSuccess, showError } from "../../utils/alerts";

export default function PaypalModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const [hasSecret, setHasSecret] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const [form, setForm] = useState({
    client_id: "",
    client_secret: "",
  });

  // 🔹 Cargar credenciales existentes
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setShowSecret(false);
    axiosClient
      .get("/paypal/credentials")
      .then(({ data }) => {
        const exists = !!(data && data.client_id);
        setHasSecret(exists);
        setForm({
          client_id: exists ? data.client_id : "",
          client_secret: "",
        });
      })
      .catch(() => {
        setHasSecret(false);
        setForm({ client_id: "", client_secret: "" });
      })
      .finally(() => {
        setInitialLoaded(true);
        setLoading(false);
      });
  }, [open]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "client_secret" && value.length > 0) setHasSecret(false);
  };

  const copyClientId = async () => {
    try {
      await navigator.clipboard.writeText(form.client_id || "");
      showSuccess?.("Client ID copiado al portapapeles");
    } catch {
      showError?.("No se pudo copiar el Client ID");
    }
  };

  // 🔹 Guardar credenciales
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.client_id.trim()) {
        showError("Debes ingresar tu Client ID.");
        return;
      }

      setLoading(true);

      const payload =
        hasSecret && !form.client_secret.trim()
          ? { client_id: form.client_id.trim() } // no cambiar secret
          : {
              client_id: form.client_id.trim(),
              client_secret: form.client_secret.trim(),
            };

      await axiosClient.post("/paypal/credentials", payload);
      showSuccess("Credenciales PayPal guardadas correctamente.");
      onClose();
    } catch {
      showError("No se pudo guardar la configuración de PayPal.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Eliminar credenciales
  const onDelete = async () => {
    if (!confirm("¿Seguro que deseas eliminar tus credenciales PayPal?")) return;
    try {
      setLoading(true);
      await axiosClient.delete("/paypal/credentials");
      showSuccess("Credenciales eliminadas correctamente.");
      setHasSecret(false);
      setForm({ client_id: "", client_secret: "" });
      onClose();
    } catch {
      showError("Error al eliminar las credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {/* 🔹 Encabezado con logo */}
      <DialogTitle
        sx={{
          p: 0,
          mb: 1,
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
          background:
            "linear-gradient(135deg, rgba(247,249,252,1) 0%, rgba(255,255,255,1) 100%)",
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              component="img"
              src="/assets/img/logo/paypal.png"
              alt="PayPal"
              sx={{ height: 28 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Configurar PayPal
            </Typography>
          </Stack>
          <LockIcon sx={{ opacity: 0.6 }} />
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        {!initialLoaded ? (
          <Stack alignItems="center" py={3}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Cargando credenciales...
            </Typography>
          </Stack>
        ) : (
          <form onSubmit={onSubmit}>
            <Stack spacing={2}>
              {/* 🔹 Estado visual de credenciales */}
              <Chip
                icon={
                  hasSecret ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <ErrorOutlineIcon color="error" />
                  )
                }
                label={
                  hasSecret
                    ? "Credenciales guardadas correctamente"
                    : "Sin credenciales configuradas"
                }
                color={hasSecret ? "success" : "default"}
                sx={{
                  alignSelf: "flex-start",
                  fontWeight: 600,
                  mb: 1,
                }}
              />

              <Alert severity="info" sx={{ mb: 1 }}>
                Cada tienda usa su propia cuenta PayPal. Tus credenciales se
                guardan de forma segura y cifrada.
              </Alert>

              {/* 🔹 Client ID */}
              <TextField
                label="Client ID"
                name="client_id"
                value={form.client_id}
                onChange={onChange}
                fullWidth
                required
                disabled={loading}
                helperText="Cópialo desde tu app en el dashboard de PayPal."
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={copyClientId}
                        edge="end"
                        disabled={!form.client_id}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* 🔹 Client Secret */}
              <TextField
                label="Client Secret"
                name="client_secret"
                type={showSecret ? "text" : "password"}
                value={
                  hasSecret && form.client_secret.length === 0
                    ? "********"
                    : form.client_secret
                }
                onChange={onChange}
                fullWidth
                required={!hasSecret}
                disabled={loading}
                helperText={
                  hasSecret
                    ? "El Client Secret actual está guardado. Ingresa uno nuevo si deseas actualizarlo."
                    : "Pega tu Client Secret para activarlo."
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        disabled={hasSecret && form.client_secret.length === 0}
                        onClick={() => setShowSecret((v) => !v)}
                        aria-label="toggle password visibility"
                      >
                        {showSecret ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Divider />

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  onClick={onSubmit}
                  variant="contained"
                  disabled={loading}
                  color="primary"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </Button>
              </Stack>
            </Stack>
          </form>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          justifyContent: "space-between",
          backgroundColor: (t) => t.palette.action.hover,
        }}
      >
        <Button color="error" onClick={onDelete} disabled={loading}>
          Eliminar credenciales
        </Button>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          Tus claves se guardan cifradas en el servidor
        </Typography>
      </DialogActions>
    </Dialog>
  );
}
