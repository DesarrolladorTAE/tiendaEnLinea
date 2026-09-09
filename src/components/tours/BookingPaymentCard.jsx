import React from "react";
import { Alert, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { PAYMENT_TYPES, PAYMENT_METHODS, PAYMENT_RECORD_STATUSES, paymentDateLabel, paymentLabel, paymentMoney } from "./paymentUtils";
export default function BookingPaymentCard({ payment, canManage, busy, onEdit, onCancel }) {
  return <Card variant="outlined" sx={{ borderRadius: 3 }}><CardContent><Stack spacing={1.5}>
    <Typography fontWeight={800}>{paymentDateLabel(payment.payment_date)}</Typography>
    <Stack direction="row" gap={1} flexWrap="wrap"><Typography>{paymentLabel(PAYMENT_TYPES, payment.payment_type)}</Typography><Typography color="text.secondary">· {paymentLabel(PAYMENT_METHODS, payment.payment_method)}</Typography></Stack>
    <Typography variant="h5" fontWeight={900}>{paymentMoney(payment.amount)}</Typography>
    <Chip size="small" sx={{ alignSelf: "flex-start" }} color={payment.status === "confirmed" ? "success" : payment.status === "pending" ? "warning" : payment.status === "cancelled" || payment.status === "rejected" ? "error" : "default"} label={paymentLabel(PAYMENT_RECORD_STATUSES, payment.status)} />
    {payment.status === "pending" && <Alert severity="info">Pendiente: este registro no representa dinero cobrado ni modifica el saldo confirmado.</Alert>}
    {payment.reference && <Typography sx={{ overflowWrap: "anywhere" }}>Referencia: {payment.reference}</Typography>}
    {payment.notes && <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>Notas: {payment.notes}</Typography>}
    {canManage && <Stack direction="row" gap={1} flexWrap="wrap"><Button disabled={busy || payment.status === "cancelled"} onClick={() => onEdit(payment)}>Editar</Button><Button color="error" disabled={busy || payment.status === "cancelled"} onClick={() => onCancel(payment)}>Cancelar registro</Button></Stack>}
  </Stack></CardContent></Card>;
}
