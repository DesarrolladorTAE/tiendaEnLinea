import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";

import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PaymentIcon from "@mui/icons-material/Payment";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import {
  getPaymentMethods,
  togglePaymentMethod,
} from "../../services/admin/paymentMethodService";

import PaypalModal from "./PaypalForm";
import OfflineAccountsModal from "./OfflineAccountsModal";

export default function PaymentMethodsModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [changing, setChanging] = useState(null);

  const [error, setError] = useState("");
  const [methods, setMethods] = useState([]);

  const [paypalOpen, setPaypalOpen] = useState(false);
  const [offlineOpen, setOfflineOpen] = useState(false);

  const loadMethods = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getPaymentMethods();

      const data = response?.data?.data;

      setMethods(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "No se pudo cargar la configuración de pagos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadMethods();
    }
  }, [open, loadMethods]);

  const handleToggle = async (method) => {
    setChanging(method.code);
    setError("");

    try {
      await togglePaymentMethod(method.code);

      await loadMethods();
    } catch (err) {
      setError(
        err?.response?.data?.message || "No se pudo actualizar el método.",
      );
    } finally {
      setChanging(null);
    }
  };

  const methodIcon = (code) => {
    switch (code) {
      case "paypal":
        return <PaymentIcon color="primary" />;

      case "transferencia":
        return <AccountBalanceIcon color="primary" />;

      case "whatsapp":
        return <WhatsAppIcon color="success" />;

      default:
        return <PaymentIcon />;
    }
  };

  const configurationText = (method) => {
    if (method.code === "transferencia") {
      const count = Number(method.accounts_count || 0);

      if (!count) {
        return "No hay cuentas configuradas";
      }

      return count === 1 ? "1 cuenta activa" : `${count} cuentas activas`;
    }

    if (method.code === "whatsapp") {
      return "Pedido mediante enlace directo de WhatsApp";
    }

    return method.configured ? "Configurado" : "Configuración pendiente";
  };

  const configureMethod = (method) => {
    switch (method.code) {
      case "paypal":
        setPaypalOpen(true);
        break;

      case "transferencia":
        setOfflineOpen(true);
        break;

      case "whatsapp":
        /*
         * Aquí pondremos el formulario nuevo de WhatsApp
         * para pedidos.
         */
        break;

      default:
        break;
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PaymentIcon />

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Configuración de pasarela
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Selecciona los métodos disponibles para los pedidos de tu
                tienda.
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box
              sx={{
                py: 6,
                textAlign: "center",
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              {methods.map((method) => (
                <Paper
                  key={method.code}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                  }}
                >
                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    spacing={2}
                    alignItems={{
                      xs: "stretch",
                      sm: "center",
                    }}
                  >
                    <Box>{methodIcon(method.code)}</Box>

                    <Box sx={{ flex: 1 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 700 }}
                        >
                          {method.name}
                        </Typography>

                        {method.code !== "whatsapp" &&
                          (method.configured ? (
                            <Chip
                              size="small"
                              color="success"
                              icon={<CheckCircleIcon />}
                              label="Configurado"
                            />
                          ) : (
                            <Chip
                              size="small"
                              color="warning"
                              icon={<WarningAmberIcon />}
                              label="Pendiente"
                            />
                          ))}
                      </Stack>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {configurationText(method)}
                      </Typography>
                    </Box>

                    {method.code !== "whatsapp" && (
                      <Button
                        variant="outlined"
                        onClick={() => configureMethod(method)}
                      >
                        {method.code === "transferencia"
                          ? "Configurar cuentas"
                          : "Configurar"}
                      </Button>
                    )}

                    <FormControlLabel
                      sx={{ m: 0 }}
                      control={
                        <Switch
                          checked={Boolean(method.is_active)}
                          disabled={changing === method.code}
                          onChange={() => handleToggle(method)}
                        />
                      }
                      label={method.is_active ? "Activo" : "Inactivo"}
                    />
                  </Stack>
                </Paper>
              ))}

              {!methods.length && (
                <Alert severity="info">No hay métodos disponibles.</Alert>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <PaypalModal
        open={paypalOpen}
        onClose={() => {
          setPaypalOpen(false);
          loadMethods();
        }}
      />

      <OfflineAccountsModal
        open={offlineOpen}
        onClose={() => {
          setOfflineOpen(false);
          loadMethods();
        }}
      />
    </>
  );
}
