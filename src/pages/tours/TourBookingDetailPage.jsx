import TourModuleLayout from "../../components/tours/TourModuleLayout";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Snackbar, Stack, Typography, Tabs, Tab } from "@mui/material";
import { useBookingScope, useBookingRequest } from "../../hooks/tours/useBookingPage";
import { cancelBooking } from "../../services/tours/tourService";
import { bookingError } from "../../components/tours/bookingUtils";
import { departureDate } from "../../components/tours/departureUtils";
import BookingPayments from "../../components/tours/BookingPayments";
import BookingPassengers from "../../components/tours/BookingPassengers";
import BookingSummary from "../../components/tours/BookingSummary";
import BookingTickets from "../../components/tours/BookingTickets";
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
  const [section, setSection] = useState("payments");
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const back = onBack || (() => navigate(base + "/" + context.departureId + "/bookings"));
  const cancel = async () => {
    if (pending.current || context.mode !== "pos") return;
    pending.current = true; setBusy(true);
    try {
      if (!await showConfirm("¿Cancelar esta reservación? Se liberarán sus lugares. Esta acción no registra ni ejecuta un reembolso.", "Sí, cancelar reservación") || !mounted.current) return;
      await cancelBooking(context, bookingId);
      if (mounted.current) back();
    } catch (error) {
      if (!mounted.current) return;
      setNotice({ severity: "error", message: bookingError(error) });
      if (error?.response?.status === 401) sessionExpired();
    } finally { pending.current = false; if (mounted.current) setBusy(false); }
  };
  const canEdit = context.mode === "pos" && request.booking?.status !== "cancelled";
  return <TourModuleLayout title={request.booking?.booking_code || `Reserva #${bookingId}`} description="Consulta el saldo, registra abonos y administra los pasajeros." onBack={busy ? undefined : back} backLabel="Volver a reservas">
    {request.loading ? <CircularProgress /> : request.error ? <Alert severity="error" sx={{ whiteSpace: "pre-line" }} action={<Button onClick={request.reload}>Reintentar</Button>}>{request.error}</Alert> : <Stack spacing={3}>
      <Typography>Salida: {departureDate(request.departure.departure_date)} · {request.departure.departure_time?.slice(0, 5)}</Typography>
      <Card variant="outlined"><CardContent><BookingSummary booking={request.booking} /></CardContent></Card>
      <Card variant="outlined" sx={{ borderRadius: 3 }}><CardContent><BookingTickets context={context} booking={request.booking} onSessionExpired={sessionExpired} /></CardContent></Card>
      {canEdit && <Stack direction="row" gap={1} flexWrap="wrap"><Button size="large" variant="contained" disabled={busy} onClick={() => setEditing(true)}>Editar reservación</Button><Button size="large" color="error" disabled={busy} onClick={cancel}>Cancelar reservación</Button></Stack>}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <Tabs value={section} onChange={(_, value) => setSection(value)} sx={{ px: 2, borderBottom: "1px solid #e3e4e7" }}><Tab value="payments" label="Pagos y abonos" /><Tab value="passengers" label="Pasajeros y abordaje" /></Tabs>
        <CardContent>
          {section === "passengers" ? <BookingPassengers context={context} booking={request.booking} departure={request.departure} onChanged={request.reload} onSessionExpired={sessionExpired} /> : <BookingPayments context={context} booking={request.booking} showSummary={false} onBookingUpdated={record => { request.applyBooking(record); if (!Object.prototype.hasOwnProperty.call(record, "tickets_pdf_url")) request.reload(); }} onSessionExpired={sessionExpired} />}
        </CardContent>
      </Card>
    </Stack>}
    {editing && canEdit && request.booking && <BookingFormDialog context={context} booking={request.booking} onClose={() => setEditing(false)} onSessionExpired={sessionExpired} onSaved={() => { setEditing(false); request.reload(); setNotice({ severity: "success", message: "Reservación actualizada." }); }} />}
    <Snackbar open={!!notice} autoHideDuration={notice?.severity === "error" ? null : 4000} onClose={() => setNotice(null)}><Alert severity={notice?.severity || "info"} sx={{ whiteSpace: "pre-line" }} onClose={() => setNotice(null)}>{notice?.message}</Alert></Snackbar>
  </TourModuleLayout>;
}
