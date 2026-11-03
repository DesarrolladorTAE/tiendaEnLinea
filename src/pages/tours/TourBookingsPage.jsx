import TourModuleLayout from "../../components/tours/TourModuleLayout";
import React, { useEffect, useState } from "react";
import { Alert, Button, CircularProgress, Grid, Pagination, Snackbar, Stack, Typography } from "@mui/material";
import { useBookingRequest, useBookingScope } from "../../hooks/tours/useBookingPage";
import BookingCard from "../../components/tours/BookingCard";
import AssistedSaleDialog from "../../components/tours/AssistedSaleDialog";
import TourBookingDetailPage from "./TourBookingDetailPage";
import { departureDate } from "../../components/tours/departureUtils";

export default function TourBookingsPage(props) {
  const scope = useBookingScope(props);
  if (!scope.valid) return <Alert severity="warning">La sucursal o salida no está disponible.</Alert>;
  return <BookingsList key={JSON.stringify(scope.context)} {...props} scope={scope} />;
}
function BookingsList({ scope, onBack, autoCreate = false }) {
  const { context, base, navigate, sessionExpired } = scope;
  const [page, setPage] = useState(1); const [formOpen, setFormOpen] = useState(autoCreate && context.mode === "pos");
  const [selectedBooking, setSelectedBooking] = useState(null); const [notice, setNotice] = useState(false);
  const request = useBookingRequest(context, { page, sessionExpired });
  useEffect(() => { if (!request.loading && !request.error && page > request.lastPage) setPage(Math.max(1, request.lastPage)); }, [page, request.lastPage, request.loading, request.error]);
  const view = (booking) => context.mode === "pos" ? setSelectedBooking(booking.id) : navigate(base + "/" + context.departureId + "/bookings/" + booking.id);
  if (selectedBooking) return <TourBookingDetailPage mode="pos" posContext={context} posBookingId={selectedBooking} onBack={() => { setSelectedBooking(null); request.reload(); }} />;
  const canCreate = context.mode === "pos" && !request.loading && !request.error && request.departure?.status === 'scheduled' && Number(request.departure?.available_capacity) > 0;
  return <TourModuleLayout title="Reservaciones y ventas" description={`Sucursal #${context.branchId} - Salida #${context.departureId}`} onBack={onBack || (() => navigate(base))} backLabel="Volver a salidas">
    {context.mode === "pos" && <Button sx={{ mb: 2 }} variant="contained" disabled={!canCreate} onClick={() => setFormOpen(true)}>Nueva venta</Button>}
    {request.loading ? <CircularProgress aria-label="Cargando reservaciones" /> : request.error ? <Alert severity="error" sx={{ whiteSpace: "pre-line" }} action={<Button onClick={request.reload}>Reintentar</Button>}>{request.error}</Alert> : <Stack spacing={2}>
      <Typography>{departureDate(request.departure.departure_date)} · {request.departure.departure_time?.slice(0, 5)} · Disponibles: {request.departure.available_capacity ?? "—"}</Typography>
      {!request.rows.length ? <Alert severity="info">No hay reservaciones en esta salida.</Alert> : <Grid container spacing={2}>{request.rows.map((booking) => <Grid key={booking.id} size={{ xs: 12, md: 6 }}><BookingCard booking={booking} onView={view} /></Grid>)}</Grid>}
      {request.lastPage > 1 && <Pagination page={page} count={request.lastPage} onChange={(_, value) => setPage(value)} />}
    </Stack>}
    {formOpen && canCreate && context.mode === "pos" && <AssistedSaleDialog context={context} departure={request.departure} onClose={() => setFormOpen(false)} onSessionExpired={sessionExpired} onSaved={() => { setFormOpen(false); setPage(1); request.reload(); setNotice(true); }} />}
    <Snackbar open={notice} autoHideDuration={4000} onClose={() => setNotice(false)}><Alert severity="success" onClose={() => setNotice(false)}>Reservación guardada.</Alert></Snackbar>
  </TourModuleLayout>;
}
