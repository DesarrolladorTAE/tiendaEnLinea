import React from "react";
import { Alert, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { PAYMENT_TYPES, PAYMENT_METHODS, PAYMENT_RECORD_STATUSES, paymentDateLabel, paymentLabel, paymentMoney, pendingOnlinePayment } from "./paymentUtils";
export default function BookingPaymentCard({ payment, canManage, busy, onEdit, onCancel, onProof, onReconcile }) {
  return <Card variant="outlined" sx={{ borderRadius: 3 }}><CardContent><Stack spacing={1.5}>
    <Typography fontWeight={800}>{paymentDateLabel(payment.payment_date)}</Typography>
    <Stack direction="row" gap={1} flexWrap="wrap"><Typography>{paymentLabel(PAYMENT_TYPES, payment.payment_type)}</Typography><Typography color="text.secondary">· {paymentLabel(PAYMENT_METHODS, payment.payment_method)}</Typography></Stack>
    <Typography variant="h5" fontWeight={900}>{paymentMoney(payment.amount)}</Typography>
    <Chip size="small" sx={{ alignSelf: "flex-start" }} color={payment.status === "confirmed" ? "success" : payment.status === "pending" ? "warning" : payment.status === "cancelled" || payment.status === "rejected" ? "error" : "default"} label={paymentLabel(PAYMENT_RECORD_STATUSES, payment.status)} />
    {payment.status === "pending" && <Alert severity="info">Pendiente: este registro no representa dinero cobrado ni modifica el saldo confirmado.</Alert>}
    {payment.reference && <Typography sx={{ overflowWrap: "anywhere" }}>Referencia: {payment.reference}</Typography>}
    {payment.notes && <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>Notas: {payment.notes}</Typography>}
    {payment.metadata?.collection && <Typography variant="caption">Cobro: sucursal #{payment.metadata.collection.branch_id} · {payment.metadata.collection.pos_location_id ? `Caja #${payment.metadata.collection.pos_location_id}` : payment.metadata.collection.channel === "online" ? "En línea" : "Administración"}</Typography>}
    {canManage && <Stack direction="row" gap={1} flexWrap="wrap">
      {payment.payment_method === "transfer" && <Button disabled={busy} onClick={() => onProof(payment)}>Descargar comprobante</Button>}
      {pendingOnlinePayment(payment) ? <Button disabled={busy} onClick={() => onReconcile(payment)}>Conciliar PayPal</Button> : <><Button disabled={busy || payment.status === "cancelled"} onClick={() => onEdit(payment)}>{payment.status === "pending" ? "Revisar / confirmar / rechazar" : "Editar"}</Button><Button color="error" disabled={busy || payment.status === "cancelled"} onClick={() => onCancel(payment)}>Cancelar registro</Button></>}
    </Stack>}
  </Stack></CardContent></Card>;
}
