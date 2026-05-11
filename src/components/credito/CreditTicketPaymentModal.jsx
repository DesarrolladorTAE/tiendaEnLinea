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
  Paper,
  Chip,
  Box,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import axiosClient from "../../config/axiosClientPOS";
import { showSuccess, showError } from "../../utils/alerts";

const money = (v) => `$${Number(v || 0).toFixed(2)}`;

const METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "td", label: "Tarjeta Débito" },
  { value: "tc", label: "Tarjeta Crédito" },
  { value: "transferencia", label: "Transferencia" },
];

export default function CreditTicketPaymentModal({
  open,
  onClose,
  account,
  sale,
  onSaved,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    payment_method: "efectivo",
    reference: "",
    notes: "",
  });

  const creditAmount = Number(sale?.credit_amount || sale?.total_amount || 0);
  const paidAmount = Number(sale?.credit_paid_amount || 0);
  const pendingAmount = Math.max(0, creditAmount - paidAmount);
  const alreadyPaid = pendingAmount <= 0;

  useEffect(() => {
    if (open) {
      setForm({
        payment_method: "efectivo",
        reference: "",
        notes: "",
      });
    }
  }, [open, sale?.id]);

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!account?.id || !sale?.id) return;

    if (pendingAmount <= 0) {
      showError("Este ticket ya está liquidado.");
      return;
    }

    setSaving(true);

    try {
      const { data } = await axiosClient.post(
        `/pos/credit-accounts/${account.id}/sales/${sale.id}/payment`,
        {
          amount: pendingAmount,
          payment_method: form.payment_method,
          reference: form.reference || null,
          notes: form.notes || `Liquidación del ticket #${sale.id}`,
        }
      );

      showSuccess(data?.message || "Ticket liquidado correctamente.");
      onSaved?.(data);
      onClose?.();
    } catch (e) {
      showError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "No se pudo liquidar el ticket."
      );
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
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 4,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 950,
          pr: 6,
          color: "#fff",
          bgcolor: alreadyPaid ? "#16a34a" : "#0f766e",
        }}
      >
        Liquidar ticket #{sale?.id || ""}
        <IconButton
          onClick={onClose}
          disabled={saving}
          sx={{
            position: "absolute",
            right: 12,
            top: 10,
            color: "#fff",
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "#f8fafc" }}>
        <Stack spacing={2}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 4,
              border: "1px solid",
              borderColor: alreadyPaid ? "#bbf7d0" : "#99f6e4",
              bgcolor: alreadyPaid ? "#f0fdf4" : "#ecfdf5",
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                {alreadyPaid ? (
                  <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 34 }} />
                ) : (
                  <ReceiptLongIcon sx={{ color: "#0f766e", fontSize: 34 }} />
                )}

                <Box>
                  <Typography sx={{ fontWeight: 950, fontSize: "1.1rem" }}>
                    {alreadyPaid ? "Ticket liquidado" : "Confirmar liquidación"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cliente:{" "}
                    <b>
                      {account?.client_name ||
                        account?.client?.nombre_alias ||
                        "Cliente"}
                    </b>
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={`Ticket #${sale?.id || ""}`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 900 }}
                />

                <Chip
                  label={alreadyPaid ? "Liquidado" : "Pendiente"}
                  color={alreadyPaid ? "success" : "warning"}
                  sx={{ fontWeight: 900 }}
                />
              </Stack>

              <Stack spacing={0.8}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Total crédito</Typography>
                  <Typography sx={{ fontWeight: 900 }}>
                    {money(creditAmount)}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Pagado</Typography>
                  <Typography sx={{ fontWeight: 900, color: "#15803d" }}>
                    {money(paidAmount)}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">
                    Pendiente a liquidar
                  </Typography>
                  <Typography sx={{ fontWeight: 950, color: "#b45309" }}>
                    {money(pendingAmount)}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Paper>

          {alreadyPaid ? (
            <Alert severity="success" sx={{ borderRadius: 3 }}>
              Este ticket ya no tiene saldo pendiente.
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ borderRadius: 3 }}>
              Se registrará el pago por el total pendiente del ticket:{" "}
              <b>{money(pendingAmount)}</b>.
            </Alert>
          )}

          <TextField
            select
            label="Método de pago"
            value={form.payment_method}
            onChange={(e) => handleChange("payment_method", e.target.value)}
            fullWidth
            disabled={alreadyPaid}
          >
            {METHODS.map((m) => (
              <MenuItem key={m.value} value={m.value}>
                {m.label}
              </MenuItem>
            ))}
          </TextField>

          {form.payment_method !== "efectivo" ? (
            <TextField
              label="Referencia"
              value={form.reference}
              onChange={(e) => handleChange("reference", e.target.value)}
              fullWidth
              disabled={alreadyPaid}
              placeholder="Folio, autorización o referencia"
            />
          ) : null}

          <TextField
            label="Notas"
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            fullWidth
            multiline
            minRows={2}
            disabled={alreadyPaid}
            placeholder={`Ej. Liquidación del ticket #${sale?.id || ""}`}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: "#fff" }}>
        <Button onClick={onClose} disabled={saving}>
          Cerrar
        </Button>

        <Button
          variant="contained"
          color="success"
          startIcon={
            saving ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <PaymentsIcon />
            )
          }
          onClick={handleSubmit}
          disabled={saving || alreadyPaid}
          sx={{
            textTransform: "none",
            fontWeight: 950,
            borderRadius: 2,
            px: 3,
          }}
        >
          {saving ? "Liquidando..." : `Liquidar ${money(pendingAmount)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}