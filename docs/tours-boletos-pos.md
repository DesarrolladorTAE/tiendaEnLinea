# Boletos PDF en el detalle de reserva

En el detalle de una reserva, “Boletos de la reserva” permite ver y descargar el documento generado por el backend. Contiene un boleto por pasajero y los importes de la reserva completa; no es un recibo independiente por cada abono.

La disponibilidad usa `status: confirmed`, `payment_status` y `tickets_pdf_url` del detalle. Una reserva confirmada con saldo puede descargarlo y muestra una advertencia de que el PDF no acredita liquidación ni autoriza el abordaje. Los botones quedan deshabilitados si no hay URL disponible, la reserva está cancelada o fue reembolsada.

La descarga usa `GET /branches/{branchId}/bookings/{bookingId}/tickets.pdf` mediante el cliente autenticado de tienda o POS. No se navega a la URL pública con el token de reserva. El PDF se muestra como blob y se libera al cerrar el visor o cambiar el estado financiero de la reserva. Un HTTP 409 informa que los boletos ya no están vigentes.

Esta integración solo consulta el documento. No crea pagos, confirma reservas ni envía avisos. Los adjuntos automáticos y sus canales se generan en el backend.

Validación: pruebas de `BookingTickets.test.jsx`, `tourTickets.test.js` y `TourBookingDetailPage.test.jsx`, con respuestas simuladas y sin reservas reales.
