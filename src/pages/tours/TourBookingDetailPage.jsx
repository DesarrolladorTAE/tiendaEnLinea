import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Snackbar, Stack, Typography } from "@mui/material";
import { useBookingScope, useBookingRequest } from "../../hooks/tours/useBookingPage";
import { cancelBooking } from "../../services/tours/tourService";
import { bookingError } from "../../components/tours/bookingUtils";
import { departureDate } from "../../components/tours/departureUtils";
import BookingPayments from "../../components/tours/BookingPayments";
import BookingPassengers from "../../components/tours/BookingPassengers";
import BookingSummary from "../../components/tours/BookingSummary";
import BookingFormDialog from "../../components/tours/BookingFormDialog";
import { showConfirm } from "../../utils/alerts";

export default function TourBookingDetailPage(props) {
  const scope = useBookingScope(props);
  const bookingId = Number(scope.context.mode === "pos" ? props.posBookingId : scope.params.bookingId);
  if (!scope.valid || !Number.isSafeInteger(bookingId) || bookingId <= 0) return <Alert severity="warning">La reservación no está disponible para esta sucursal.</Alert>;
  return <BookingDetail key={JSON.stringify([scope.context, bookingId])} scope={scope} bookingId={bookingId} onBack={props.onBack} />;
}
function BookingDetail({ scope, bookingId, onBack }) {
  const { context, base, navigate, sessionExpired } = scope;
  const request = useBookingRequest(context, { bookingId, sessionExpired });
  const [editing, setEditing] = useState(false); const [busy, setBusy] = useState(false); const pending = useRef(false);
  const [notice, setNotice] = useState(null); const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const back = onBack || (() => navigate(base + "/" + context.departureId + "/bookings"));
  const cancel = async () => {
    if (pending.current || context.mode !== "pos") return;
    pending.current = true; setBusy(true);
    try {
      if (!await showConfirm("¿Cancelar esta reservación? Los lugares reservados serán liberados según las reglas del backend.", "Sí, cancelar reservación") || !mounted.current) return;
      await cancelBooking(context, bookingId);
      if (mounted.current) back();
    } catch (error) {
      if (!mounted.current) return;
      setNotice({ severity: "error", message: bookingError(error) });
      if (error?.response?.status === 401) sessionExpired();
    } finally { pending.current = false; if (mounted.current) setBusy(false); }
  };
  const canEdit = context.mode === "pos" && request.booking?.status !== "cancelled";
  return <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, sm: 3 }, bgcolor: "#fff", borderRadius: 3 }}>
    <Stack direction="row" flexWrap="wrap" justifyContent="space-between" gap={2} mb={3}><Typography variant="h4" fontWeight={900}>Detalle de reservación</Typography><Button disabled={busy} onClick={back}>Volver a reservaciones</Button></Stack>
    {request.loading ? <CircularProgress /> : request.error ? <Alert severity="error" sx={{ whiteSpace: "pre-line" }} action={<Button onClick={request.reload}>Reintentar</Button>}>{request.error}</Alert> : <Stack spacing={3}>
      <Typography>Salida: {departureDate(request.departure.departure_date)} · {request.departure.departure_time?.slice(0, 5)}</Typography>
      <Card variant="outlined"><CardContent><BookingSummary booking={request.booking} /></CardContent></Card>
      {canEdit && <Stack direction="row" gap={1} flexWrap="wrap"><Button size="large" variant="contained" disabled={busy} onClick={() => setEditing(true)}>Editar reservación</Button><Button size="large" color="error" disabled={busy} onClick={cancel}>Cancelar reservación</Button></Stack>}
      <BookingPassengers context={context} booking={request.booking} departure={request.departure} onChanged={request.reload} onSessionExpired={sessionExpired} />
      <BookingPayments context={context} booking={request.booking} onBookingUpdated={request.applyBooking} onSessionExpired={sessionExpired} />
    </Stack>}
    {editing && canEdit && request.booking && <BookingFormDialog context={context} booking={request.booking} onClose={() => setEditing(false)} onSessionExpired={sessionExpired} onSaved={() => { setEditing(false); request.reload(); setNotice({ severity: "success", message: "Reservación actualizada." }); }} />}
    <Snackbar open={!!notice} autoHideDuration={notice?.severity === "error" ? null : 4000} onClose={() => setNotice(null)}><Alert severity={notice?.severity || "info"} sx={{ whiteSpace: "pre-line" }} onClose={() => setNotice(null)}>{notice?.message}</Alert></Snackbar>
  </Box>;
}
