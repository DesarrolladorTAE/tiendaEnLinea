import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, CircularProgress, Grid, Pagination, Snackbar, Stack, Typography } from "@mui/material";
import { cancelBookingPayment, getBooking, getBookingPayments } from "../../services/tours/tourService";
import { showConfirm } from "../../utils/alerts";
import { paymentBooking, paymentCents, paymentCollection, paymentError } from "./paymentUtils";
import PaymentSummary from "./PaymentSummary";
import BookingPaymentCard from "./BookingPaymentCard";
import PaymentDialog from "./PaymentDialog";

export default function BookingPayments({ context, booking, onBookingUpdated, onSessionExpired }) {
  const [page, setPage] = useState(1); const [revision, setRevision] = useState(0);
  const [history, setHistory] = useState({ rows: [], lastPage: 1, loading: true, error: "" });
  const [dialog, setDialog] = useState(null); const [busy, setBusy] = useState(false); const pending = useRef(false);
  const [syncing, setSyncing] = useState(false); const [syncError, setSyncError] = useState(""); const [notice, setNotice] = useState(null);
  const mounted = useRef(true); const balanceController = useRef(null);
  const sessionRef = useRef(onSessionExpired); sessionRef.current = onSessionExpired;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; balanceController.current?.abort(); }; }, []);
  useEffect(() => {
    let active = true; const controller = new AbortController();
    setHistory((prev) => ({ ...prev, loading: true, error: "" }));
    getBookingPayments({ ...context, signal: controller.signal }, booking.id, page).then(({ data }) => {
      if (!active) return;
      const collection = paymentCollection(data);
      if (page > collection.lastPage) { setPage(Math.max(1, collection.lastPage)); return; }
      setHistory({ ...collection, loading: false, error: "" });
    }).catch((error) => {
      if (!active) return;
      setHistory((prev) => ({ ...prev, loading: false, error: paymentError(error) }));
      if (error?.response?.status === 401) sessionRef.current();
    });
    return () => { active = false; controller.abort(); };
  }, [context, booking.id, page, revision]);

  const refreshBalance = async () => {
    setSyncing(true); setSyncError("");
    balanceController.current?.abort();
    const controller = new AbortController(); balanceController.current = controller;
    try {
      const { data } = await getBooking({ ...context, signal: controller.signal }, booking.id);
      if (!mounted.current || controller.signal.aborted) return;
      if (data?.success === false) throw new Error(data.message || "No se pudo consultar la reservación.");
      const record = paymentBooking(data?.data?.booking ?? data?.booking ?? data?.data ?? data, booking.id);
      if (!record) throw new Error("El servidor no devolvió el resumen financiero de la reservación.");
      onBookingUpdated(record);
    } catch (error) {
      if (!mounted.current || controller.signal.aborted) return;
      setSyncError("El registro de pago ya fue procesado. Falta actualizar el saldo: " + paymentError(error));
      if (error?.response?.status === 401) onSessionExpired();
    } finally { if (mounted.current && !controller.signal.aborted) setSyncing(false); }
  };
  const applyPaymentResponse = async (response) => {
    if (!mounted.current) return;
    setDialog(null);
    const result = response.data?.data;
    const updatedBooking = paymentBooking(result?.booking, booking.id);
    if (updatedBooking) { onBookingUpdated(updatedBooking); setSyncError(""); }
    // Use the returned payment record, never infer its status or amount.
    if (result?.payment?.id) setHistory((prev) => ({ ...prev, rows: [result.payment, ...prev.rows.filter((row) => String(row.id) !== String(result.payment.id))] }));
    setNotice({ severity: "success", message: response.data?.message || "Registro de pago actualizado." });
    setPage(1); setRevision((value) => value + 1);
    // A successful mutation must not become a retryable POST if this GET fails.
    if (!updatedBooking) await refreshBalance();
  };
  const cancel = async (payment) => {
    if (pending.current) return;
    pending.current = true; setBusy(true);
    try {
      if (!await showConfirm("¿Cancelar este registro de pago? El servidor recalculará el saldo.", "Sí, cancelar registro") || !mounted.current) return;
      const response = await cancelBookingPayment(context, booking.id, payment.id);
      await applyPaymentResponse(response);
    } catch (error) {
      if (!mounted.current) return;
      setNotice({ severity: "error", message: paymentError(error) });
      if (error?.response?.status === 401) onSessionExpired();
    } finally { pending.current = false; if (mounted.current) setBusy(false); }
  };
  const canManage = ["store", "pos"].includes(context.mode);
  const blocked = busy || syncing || !!syncError || history.loading || !!history.error;
  const rows = [...history.rows].sort((a, b) => String(b.payment_date || "").localeCompare(String(a.payment_date || "")));
  return <Stack spacing={2}>
    <Typography variant="h6" fontWeight={900}>Pagos</Typography>
    <PaymentSummary booking={booking} />
    {syncing && <Alert severity="info" icon={<CircularProgress size={20} />}>Actualizando el saldo confirmado por el servidor…</Alert>}
    {syncError && <Alert severity="warning" sx={{ whiteSpace: "pre-line" }} action={<Button onClick={refreshBalance}>Actualizar saldo</Button>}>{syncError}</Alert>}
    {canManage && paymentCents(booking.remaining_amount) > 0 && <Button size="large" variant="contained" disabled={blocked} sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }} onClick={() => setDialog({})}>Registrar pago</Button>}
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap"><Typography variant="h6">Historial de pagos</Typography>{canManage && paymentCents(booking.paid_amount) > 0 && <Button color="inherit" variant="text" disabled={blocked} onClick={() => setDialog({ refund: true })}>Registrar devolución</Button>}</Stack>
    {history.error && <Alert severity="error" sx={{ whiteSpace: "pre-line" }} action={<Button onClick={() => setRevision((value) => value + 1)}>Reintentar</Button>}>{history.error}</Alert>}
    {history.loading && <CircularProgress size={28} aria-label="Cargando historial de pagos" />}
    {!history.loading && !history.error && !rows.length && <Typography color="text.secondary">Todavía no hay registros de pago.</Typography>}
    <Grid container spacing={2}>{rows.map((payment) => <Grid key={payment.id} size={{ xs: 12, md: 6 }}><BookingPaymentCard payment={payment} canManage={canManage} busy={blocked} onEdit={(record) => setDialog({ payment: record })} onCancel={cancel} /></Grid>)}</Grid>
    {history.lastPage > 1 && <Pagination page={page} count={history.lastPage} disabled={busy || syncing || history.loading} onChange={(_, value) => setPage(value)} />}
    {dialog && canManage && <PaymentDialog context={context} booking={booking} {...dialog} onClose={() => setDialog(null)} onSaved={(response) => { void applyPaymentResponse(response); }} onSessionExpired={onSessionExpired} />}
    <Snackbar open={!!notice} autoHideDuration={notice?.severity === "error" ? null : 4500} onClose={() => setNotice(null)}><Alert severity={notice?.severity || "info"} onClose={() => setNotice(null)} sx={{ whiteSpace: "pre-line" }}>{notice?.message}</Alert></Snackbar>
  </Stack>;
}
