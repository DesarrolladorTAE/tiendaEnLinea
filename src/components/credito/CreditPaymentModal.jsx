import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  useMediaQuery,
  FormControlLabel,
  Switch,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import axiosClient from "../../config/axiosClientPOS";
import { showSuccess, showError } from "../../utils/alerts";

const money = (v) => `$${Number(v || 0).toFixed(2)}`;

const METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "td", label: "Tarjeta Débito" },
  { value: "tc", label: "Tarjeta Crédito" },
  { value: "transferencia", label: "Transferencia" },
];

export default function CreditPaymentModal({ open, onClose, account, onSaved }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [saving, setSaving] = useState(false);
  const [payFullDebt, setPayFullDebt] = useState(false);

  const [form, setForm] = useState({
    amount: "",
    payment_method: "efectivo",
    reference: "",
    ultimos_4: "",
    notes: "",
  });

  const balance = Number(account?.current_balance || 0);
  const isCard = form.payment_method === "td" || form.payment_method === "tc";
  const isTransfer = form.payment_method === "transferencia";

  useEffect(() => {
    if (open) {
      setPayFullDebt(false);
      setForm({
        amount: "",
        payment_method: "efectivo",
        reference: "",
        ultimos_4: "",
        notes: "",
      });
    }
  }, [open]);

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const handlePaymentMethodChange = (value) => {
    setForm((p) => ({
      ...p,
      payment_method: value,
      reference: "",
      ultimos_4: "",
    }));
  };

  const handleToggleFullDebt = (checked) => {
    setPayFullDebt(checked);

    if (checked) {
      setForm((p) => ({
        ...p,
        amount: balance > 0 ? String(balance.toFixed(2)) : "",
      }));
    } else {
      setForm((p) => ({
        ...p,
        amount: "",
      }));
    }
  };

  const reset = () => {
    setPayFullDebt(false);
    setForm({
      amount: "",
      payment_method: "efectivo",
      reference: "",
      ultimos_4: "",
      notes: "",
    });
  };

  const handleSubmit = async () => {
    const amount = payFullDebt ? balance : Number(form.amount || 0);

    if (!account?.id) return;

    if (amount <= 0) {
      showError("Ingresa un monto válido.");
      return;
    }

    if (amount > balance) {
      showError("El abono no puede ser mayor al saldo pendiente.");
      return;
    }

    if ((isCard || isTransfer) && form.ultimos_4.length !== 4) {
      showError(
        isCard
          ? "Ingresa los últimos 4 dígitos de la tarjeta."
          : "Ingresa 4 dígitos de referencia para la transferencia."
      );
      return;
    }

    setSaving(true);

    try {
      const reference =
        form.payment_method === "efectivo"
          ? null
          : form.reference || form.ultimos_4 || null;

      const { data } = await axiosClient.post(
        `/pos/credit-accounts/${account.id}/payments`,
        {
          amount,
          payment_method: form.payment_method,
          reference,
          ultimos_4:
            isCard || isTransfer
              ? form.ultimos_4
              : null,
          notes: form.notes || null,
          pay_full_debt: payFullDebt,
        }
      );

      showSuccess(data?.message || "Abono registrado correctamente.");
      reset();
      onSaved?.();
      onClose?.();
    } catch (e) {
      showError(e?.response?.data?.message || "No se pudo registrar el abono.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ fontWeight: 900 }}>
        Registrar abono
        <IconButton
          onClick={onClose}
          disabled={saving}
          sx={{ position: "absolute", right: 12, top: 10 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info">
            Cliente: <b>{account?.client_name || "Cliente"}</b>
            <br />
            Saldo pendiente: <b>{money(balance)}</b>
          </Alert>

          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 3,
              bgcolor: payFullDebt ? "#f0fdf4" : "#fff",
              borderColor: payFullDebt ? "#22c55e" : "divider",
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={payFullDebt}
                  onChange={(e) => handleToggleFullDebt(e.target.checked)}
                  color="success"
                />
              }
              label={
                <Typography sx={{ fontWeight: 900 }}>
                  Liquidar deuda completa
                </Typography>
              }
            />

            <Typography variant="body2" color="text.secondary">
              Al activarlo se pagará automáticamente todo el saldo pendiente.
            </Typography>
          </Paper>

          <TextField
            label="Monto del abono"
            type="number"
            value={form.amount}
            onChange={(e) => handleChange("amount", e.target.value)}
            fullWidth
            disabled={payFullDebt}
            inputProps={{ min: 0, step: "0.01" }}
            helperText={
              payFullDebt
                ? `Se liquidará el total pendiente: ${money(balance)}`
                : ""
            }
          />

          <TextField
            select
            label="Método de pago"
            value={form.payment_method}
            onChange={(e) => handlePaymentMethodChange(e.target.value)}
            fullWidth
          >
            {METHODS.map((m) => (
              <MenuItem key={m.value} value={m.value}>
                {m.label}
              </MenuItem>
            ))}
          </TextField>

          {isCard ? (
            <TextField
              label="Últimos 4 dígitos de la tarjeta"
              value={form.ultimos_4}
              onChange={(e) =>
                handleChange(
                  "ultimos_4",
                  e.target.value.replace(/\D/g, "").slice(0, 4)
                )
              }
              fullWidth
              inputProps={{
                maxLength: 4,
                inputMode: "numeric",
                pattern: "[0-9]*",
              }}
              helperText="Obligatorio para pagos con tarjeta."
            />
          ) : null}

          {isTransfer ? (
            <>
              <TextField
                label="Referencia de transferencia"
                value={form.reference}
                onChange={(e) => handleChange("reference", e.target.value)}
                fullWidth
                helperText="Folio, clave de rastreo o referencia bancaria."
              />

              <TextField
                label="4 dígitos de referencia"
                value={form.ultimos_4}
                onChange={(e) =>
                  handleChange(
                    "ultimos_4",
                    e.target.value.replace(/\D/g, "").slice(0, 4)
                  )
                }
                fullWidth
                inputProps={{
                  maxLength: 4,
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                }}
                helperText="Se envía para cumplir la validación actual del backend."
              />
            </>
          ) : null}

          <TextField
            label="Notas"
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            fullWidth
            multiline
            minRows={2}
            placeholder={
              payFullDebt
                ? "Ej. Liquidación completa de deuda"
                : "Notas del abono"
            }
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={handleSubmit}
          disabled={saving || balance <= 0}
        >
          {saving ? (
            <CircularProgress size={20} color="inherit" />
          ) : payFullDebt ? (
            "Liquidar deuda"
          ) : (
            "Guardar abono"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}