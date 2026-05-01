// src/components/clientes/ClienteFiadoModal.jsx
import React, { useEffect, useState } from "react";
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
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  Chip,
  CircularProgress,
  useMediaQuery,
  Alert,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import SavingsIcon from "@mui/icons-material/Savings";
import axiosClient from "../../config/axiosClientPOS";
import { showSuccess, showError } from "../../utils/alerts";

export default function ClienteFiadoModal({ open, onClose, client, onSaved }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState(null);

  const [form, setForm] = useState({
    credit_limit: "",
    payment_due_date: "",
    is_active: false,
  });

  const clientName =
    client?.nombre_alias || client?.razon_social || "Cliente sin nombre";

  const formatDateInput = (value) => {
    if (!value) return "";
    return String(value).slice(0, 10);
  };

  const loadAccount = async () => {
    if (!client?.id || !open) return;

    setLoading(true);

    try {
      const { data } = await axiosClient.get(`/pos/credit-client/${client.id}`);
      const acc = data?.account || null;

      setAccount(acc);
      setForm({
        credit_limit: acc?.id ? String(acc.credit_limit ?? 0) : "",
        payment_due_date: acc?.id
          ? formatDateInput(acc.payment_due_date)
          : "",
        is_active: acc?.id ? Boolean(acc.is_active) : false,
      });
    } catch (error) {
      showError("No se pudo cargar la información de fiado del cliente.");
      setAccount(null);
      setForm({
        credit_limit: "",
        payment_due_date: "",
        is_active: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setAccount(null);
      setForm({
        credit_limit: "",
        payment_due_date: "",
        is_active: false,
      });
      return;
    }

    loadAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client?.id]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!client?.id) return;

    const payload = {
      client_id: client.id,
      credit_limit: Number(form.credit_limit || 0),
      payment_due_date: form.payment_due_date || null,
      is_active: Boolean(form.is_active),
    };

    if (payload.credit_limit < 0) {
      showError("El límite de fiado no puede ser negativo.");
      return;
    }

    setSaving(true);

    try {
      const { data } = account?.id
        ? await axiosClient.put(`/pos/credit-accounts/${account.id}`, payload)
        : await axiosClient.post("/pos/credit-accounts", payload);

      setAccount(data?.account || null);
      showSuccess(data?.message || "Configuración de fiado guardada.");
      onSaved?.(data?.account);
      onClose?.();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        "No se pudo guardar la configuración de fiado.";
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  const currentBalance = Number(account?.current_balance || 0);
  const creditLimit = Number(form.credit_limit || 0);

  const isUnlimited = creditLimit === 0;
  const hasNoDueDate = !form.payment_due_date;

  const availableCredit = isUnlimited
    ? "Ilimitado"
    : `$${Math.max(0, creditLimit - currentBalance).toFixed(2)}`;

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 4,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 2.2,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.14
          )}, ${alpha(theme.palette.success.main, 0.1)})`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.2} alignItems="center">
            <CreditScoreIcon color="primary" />
            <Stack>
              <Typography fontWeight={900}>Fiado del cliente</Typography>
              <Typography variant="body2" color="text.secondary">
                {clientName}
              </Typography>
            </Stack>
          </Stack>

          <IconButton onClick={onClose} disabled={saving}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 5 }}>
            <CircularProgress />
            <Typography mt={2} color="text.secondary">
              Cargando información de fiado...
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Alert severity="info">
              Activa el fiado, define el límite permitido y una fecha final de
              pago. Usa <b>0</b> en el límite para permitir fiado sin límite y
              deja la fecha vacía para no manejar vencimiento.
            </Alert>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                <SavingsIcon color="success" />
                <Typography fontWeight={900}>Resumen</Typography>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={`Saldo actual: $${currentBalance.toFixed(2)}`}
                  color={currentBalance > 0 ? "warning" : "success"}
                  variant="outlined"
                />

                <Chip
                  label={`Disponible: ${availableCredit}`}
                  color="primary"
                  variant="outlined"
                />

                <Chip
                  label={form.is_active ? "Fiado activo" : "Fiado desactivado"}
                  color={form.is_active ? "success" : "default"}
                />

                {isUnlimited && (
                  <Chip label="Sin límite" color="info" variant="outlined" />
                )}

                {hasNoDueDate ? (
                  <Chip
                    label="Sin vencimiento"
                    color="info"
                    variant="outlined"
                  />
                ) : (
                  <Chip
                    label={`Vence: ${form.payment_due_date}`}
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Paper>

            <Divider />

            <TextField
              label="Límite de fiado"
              type="number"
              value={form.credit_limit}
              onChange={(e) => handleChange("credit_limit", e.target.value)}
              fullWidth
              inputProps={{ min: 0, step: "0.01" }}
              helperText="Usa 0 para permitir fiado sin límite."
            />

            <TextField
              label="Fecha final de pago"
              type="date"
              value={form.payment_due_date}
              onChange={(e) =>
                handleChange("payment_due_date", e.target.value)
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Déjalo vacío si no quieres manejar fecha límite de pago."
            />

            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(form.is_active)}
                  onChange={(e) => handleChange("is_active", e.target.checked)}
                />
              }
              label="Permitir fiado a este cliente"
            />

            {currentBalance > 0 && !isUnlimited && creditLimit < currentBalance ? (
              <Alert severity="warning">
                El límite configurado es menor al saldo actual del cliente.
              </Alert>
            ) : null}
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}
      >
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loading}
        >
          {saving ? "Guardando..." : "Guardar fiado"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}