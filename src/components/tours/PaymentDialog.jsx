import React, { useRef, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormLabel, MenuItem, Radio, RadioGroup, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { createBookingPayment, updateBookingPayment } from "../../services/tours/tourService";
import { showConfirm } from "../../utils/alerts";
import { PAYMENT_TYPES, PAYMENT_METHODS, PAYMENT_RECORD_STATUSES, localPaymentDate, paymentDateInput, paymentError, paymentLimit, paymentMoney, serializePaymentDate, validatePayment } from "./paymentUtils";

export default function PaymentDialog({ context, booking, payment, refund = false, onClose, onSaved, onSessionExpired }) {
  const mobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [form, setForm] = useState(() => ({ payment_type: payment?.payment_type || (refund ? "refund" : "deposit"), payment_method: payment?.payment_method || "cash", amount: payment?.amount ?? "", payment_date: payment ? paymentDateInput(payment.payment_date) : localPaymentDate(), status: payment?.status || "confirmed", reference: payment?.reference || "", notes: payment?.notes || "" }));
  const [error, setError] = useState(""); const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false); const pending = useRef(false); const completed = useRef(false);
  const isRefund = form.payment_type === "refund";
  const limit = paymentLimit(booking, form.payment_type, payment);
  const validation = validatePayment(form, booking, payment);
  const showReference = ["transfer", "debit_card", "credit_card", "online"].includes(form.payment_method);
  const change = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const changeType = (value) => {
    setForm((prev) => ({ ...prev, payment_type: value, amount: ["final", "full"].includes(value) ? String(booking.remaining_amount ?? "") : "" }));
    setErrors({});
  };
  const field = (name, label, props = {}) => {
    const fieldError = errors[name] || (name === "amount" && form.amount !== "" ? validation.amount : undefined);
    return <TextField fullWidth name={name} label={label} value={form[name]} onChange={(event) => change(name, event.target.value)} error={!!fieldError} helperText={[].concat(fieldError || []).join(" ")} {...props} />;
  };
  const submit = async (event) => {
    event.preventDefault(); if (pending.current || completed.current) return;
    setError(""); setErrors(validation); if (Object.keys(validation).length) return;
    pending.current = true; setSaving(true);
    try {
      if (isRefund && !await showConfirm("Esta operación reducirá el monto pagado de la reservación. Solo los registros confirmados afectan el saldo.", "Confirmar devolución")) return;
      const payload = { payment_type: form.payment_type, payment_method: form.payment_method, amount: form.amount, payment_date: serializePaymentDate(form.payment_date), status: form.status, reference: form.reference.trim() || null, notes: form.notes.trim() || null };
      // No Worker can be inferred from the current POS session: omit registered_by.
      const response = payment ? await updateBookingPayment(context, booking.id, payment.id, payload) : await createBookingPayment(context, booking.id, payload);
      completed.current = true;
      onSaved(response);
    } catch (err) {
      setError(paymentError(err)); setErrors(err?.response?.data?.errors || {});
      if (err?.response?.status === 401) onSessionExpired();
    } finally { pending.current = false; setSaving(false); }
  };
  return <Dialog open fullScreen={mobile} fullWidth maxWidth="sm" onClose={saving ? undefined : onClose} PaperProps={{ component: "form", onSubmit: submit }}>
    <DialogTitle>{payment ? "Editar registro de pago" : isRefund ? "Registrar devolución" : "Registrar pago"}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      {error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{error}</Alert>}
      <Typography fontWeight={800}>{isRefund ? "Neto confirmado: " + paymentMoney(booking.paid_amount) : "Saldo actual: " + paymentMoney(booking.remaining_amount)}</Typography>
      <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}><Stack spacing={2}>
        <FormControl error={!!errors.payment_type} disabled={saving || !!payment || isRefund}><FormLabel>Tipo de pago</FormLabel><RadioGroup value={form.payment_type} onChange={(event) => changeType(event.target.value)}>{PAYMENT_TYPES.filter(([value]) => isRefund ? value === "refund" : value !== "refund").map(([value, label]) => <FormControlLabel key={value} value={value} control={<Radio />} label={label} />)}</RadioGroup></FormControl>
        {errors.payment_type && <Alert severity="error">{[].concat(errors.payment_type).join(" ")}</Alert>}
        {field("payment_method", "Método de pago", { select: true, required: true, children: PAYMENT_METHODS.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>) })}
        {field("amount", "Monto", { type: "number", required: true, inputProps: { min: ".01", max: limit == null ? undefined : (limit / 100).toFixed(2), step: ".01" } })}
        {payment && <Typography variant="caption">Máximo para reemplazar este registro: {limit == null ? "Sin información" : paymentMoney((limit / 100).toFixed(2))}. El servidor valida el importe final.</Typography>}
        {field("payment_date", "Fecha y hora del pago", { type: "datetime-local", required: true, inputProps: { step: 1 }, InputLabelProps: { shrink: true } })}
        {field("reference", "Referencia (opcional)", { sx: showReference ? { bgcolor: "#fff8e8", borderRadius: 1 } : undefined })}
        {showReference && <Typography variant="caption">Captura la referencia de transferencia u operación si está disponible.</Typography>}
        {field("notes", "Notas", { multiline: true, minRows: 2 })}
        {field("status", "Estado del registro", { select: true, required: true, children: PAYMENT_RECORD_STATUSES.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>) })}
        {form.status === "pending" && <Alert severity="info">Un registro pendiente no significa dinero cobrado.</Alert>}
        {form.status === "confirmed" && <Alert severity={isRefund ? "warning" : "info"}>{isRefund ? "Confirma únicamente si entregaste el importe de la devolución." : "Al confirmar, declaras que recibiste este importe."}</Alert>}
      </Stack></fieldset>
    </Stack></DialogContent><DialogActions><Button disabled={saving} onClick={onClose}>Cerrar</Button><Button size="large" variant="contained" type="submit" disabled={saving || completed.current || Object.keys(validation).length > 0}>{saving ? "Guardando…" : form.status === "confirmed" ? isRefund ? "Confirmar devolución" : "Confirmar cobro" : "Guardar registro"}</Button></DialogActions>
  </Dialog>;
}
