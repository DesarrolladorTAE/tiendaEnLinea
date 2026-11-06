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
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";

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
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2}>
        <Stack direction="row" gap={1.25} alignItems="center"><EventOutlinedIcon sx={{ color: "#8b7334" }} /><Box><Typography variant="overline" sx={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.4, color: "#7b8390" }}>Salida programada</Typography><Typography fontWeight={700}>{departureDate(request.departure.departure_date)}{request.departure.departure_time && ` · ${request.departure.departure_time.slice(0, 5)}`}</Typography></Box></Stack>
        {canEdit && <Button variant="outlined" startIcon={<EditOutlinedIcon />} disabled={busy} onClick={() => setEditing(true)} sx={{ alignSelf: { xs: "flex-start", sm: "center" }, borderColor: "#d9dde4", color: "#303846" }}>Editar reservación</Button>}
      </Stack>
      <Card variant="outlined"><CardContent sx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: { xs: 2, md: 3 } } }}><BookingSummary booking={request.booking} /></CardContent></Card>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "minmax(0,1fr) 330px" }, gap: 3, alignItems: "start" }}>
      <Card variant="outlined" sx={{ borderRadius: 3, order: { xs: 1, lg: 0 } }}>
        <Tabs value={section} onChange={(_, value) => setSection(value)} variant="scrollable" scrollButtons="auto" sx={{ px: { xs: 1, md: 2 }, borderBottom: "1px solid #edf0f3", "& .MuiTab-root": { textTransform: "none", fontWeight: 700, minHeight: 62 }, "& .MuiTabs-indicator": { bgcolor: "#c89b29", height: 3 } }}><Tab value="payments" label="Pagos y abonos" /><Tab value="passengers" label="Pasajeros y abordaje" /></Tabs>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {section === "passengers" ? <BookingPassengers context={context} booking={request.booking} departure={request.departure} onChanged={request.reload} onSessionExpired={sessionExpired} /> : <BookingPayments context={context} booking={request.booking} showSummary={false} onBookingUpdated={record => { request.applyBooking(record); if (!Object.prototype.hasOwnProperty.call(record, "tickets_pdf_url")) request.reload(); }} onSessionExpired={sessionExpired} />}
        </CardContent>
      </Card>
      <Stack spacing={2.5} sx={{ order: { xs: 0, lg: 1 } }}>
        <Card variant="outlined"><CardContent sx={{ p: 2.5 }}>
          <Box sx={{ width: 42, height: 42, bgcolor: "#fff8e3", color: "#94711c", borderRadius: 2, display: "grid", placeItems: "center", mb: 2 }}><ConfirmationNumberOutlinedIcon /></Box>
          <BookingTickets context={context} booking={request.booking} onSessionExpired={sessionExpired} compact />
        </CardContent></Card>
        {canEdit && <Box sx={{ px: 1 }}><Typography variant="caption" color="text.secondary">La cancelación libera los lugares y conserva el historial.</Typography><Button color="error" size="small" disabled={busy} onClick={cancel} sx={{ mt: .5, display: "block" }}>Cancelar reservación</Button></Box>}
      </Stack>
      </Box>
    </Stack>}
    {editing && canEdit && request.booking && <BookingFormDialog context={context} booking={request.booking} onClose={() => setEditing(false)} onSessionExpired={sessionExpired} onSaved={() => { setEditing(false); request.reload(); setNotice({ severity: "success", message: "Reservación actualizada." }); }} />}
    <Snackbar open={!!notice} autoHideDuration={notice?.severity === "error" ? null : 4000} onClose={() => setNotice(null)}><Alert severity={notice?.severity || "info"} sx={{ whiteSpace: "pre-line" }} onClose={() => setNotice(null)}>{notice?.message}</Alert></Snackbar>
  </TourModuleLayout>;
}
