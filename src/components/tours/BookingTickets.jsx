import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { getBookingTickets } from "../../services/tours/tourService";
import { bookingError } from "./bookingUtils";

export default function BookingTickets({ context, booking, onSessionExpired }) {
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(null);
  const available = booking.status === "confirmed" && booking.payment_status !== "refunded" && Boolean(booking.tickets_pdf_url);
  useEffect(() => {
    setPreview(null); setError(""); setBusy(false);
    return () => { pending.current?.abort(); pending.current = null; };
  }, [booking.id, booking.status, booking.payment_status, booking.paid_amount, booking.remaining_amount, booking.tickets_pdf_url]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const load = async download => {
    if (!available || pending.current) return;
    const controller = new AbortController(); pending.current = controller;
    setBusy(true); setError("");
    try {
      const blob = await getBookingTickets({ ...context, signal: controller.signal }, booking.id);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      if (download) {
        const link = document.createElement("a");
        link.href = url; link.download = `reserva-${booking.id}-boletos.pdf`;
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else setPreview(url);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err.response?.status === 409 ? "Los boletos ya no están vigentes. Actualiza la reserva para consultar su estado actual." : bookingError(err));
      if (err.response?.status === 401) onSessionExpired?.();
    } finally {
      if (pending.current === controller) { pending.current = null; setBusy(false); }
    }
  };
  return <Stack spacing={1.5}>
    <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems={{ sm: "center" }} justifyContent="space-between">
      <Box><Typography fontWeight={800}>Boletos de la reserva</Typography><Typography variant="body2" color="text.secondary">Un PDF con un boleto por pasajero, importes y saldo de la reserva.</Typography></Box>
      <Stack direction="row" gap={1} flexWrap="wrap">
        <Button variant="outlined" disabled={!available || busy} onClick={() => load(false)}>Ver boletos</Button>
        <Button variant="outlined" disabled={!available || busy} onClick={() => load(true)}>Descargar boletos PDF</Button>
        {busy && <CircularProgress size={24} aria-label="Cargando boletos" />}
      </Stack>
    </Stack>
    {!available && <Typography variant="body2" color="text.secondary">Los boletos estarán disponibles cuando la reserva esté confirmada y vigente.</Typography>}
    {available && Number(booking.remaining_amount) > 0 && <Alert severity="warning">Esta reserva tiene saldo pendiente. Los boletos no acreditan la liquidación ni autorizan el abordaje.</Alert>}
    {error && <Alert severity="error">{error}</Alert>}
    <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} fullWidth maxWidth="lg">
      <DialogTitle>Boletos · {booking.booking_code || `Reserva #${booking.id}`}</DialogTitle>
      <DialogContent sx={{ p: 0 }}>{preview && <Box component="iframe" src={preview} title="Boletos PDF de la reserva" sx={{ width: "100%", height: "75vh", border: 0 }} />}</DialogContent>
      <DialogActions><Button disabled={busy || !available} onClick={() => load(true)}>Descargar PDF</Button><Button onClick={() => setPreview(null)}>Cerrar</Button></DialogActions>
    </Dialog>
  </Stack>;
}
