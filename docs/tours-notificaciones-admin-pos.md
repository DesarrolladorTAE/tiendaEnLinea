# Avisos de tours en administración y POS

Contrato del 6 de noviembre de 2026.

La nueva venta de tours del POS permite elegir correo, WhatsApp, ambos o ninguno. Envía `notification_channels` (incluida la lista vacía) y mantiene `notification_channel` con el primer canal o `none` para compatibilidad. Nunca envía `both`.

El teléfono de contacto conserva exactamente 10 dígitos. WhatsApp admite un destino alternativo internacional con `+` y de 8 a 15 dígitos. Si no se captura, el backend utiliza +52 y el teléfono de contacto. El correo es obligatorio cuando se elige ese canal. Los avisos son para el comprador y se eligen independientemente del método de pago.

El detalle administrativo y del POS muestra las preferencias cuando la API las devuelve. Una preferencia no acredita entrega del mensaje. `confirmed` se presenta como «Aceptada / confirmada»; el estado de pago y el saldo siguen separados. Una reserva aceptada puede tener adeudo y cancelar no ejecuta un reembolso. Se conservan los estados y saldos devueltos por el backend.

No se agregaron llamadas para enviar mensajes desde el navegador ni reintentos automáticos de ventas. El bloqueo existente ante una respuesta incierta sigue vigente: consultar la reserva antes de repetir la operación.

## Alcance del backend y del catálogo público

Este repositorio no contiene la migración, los workers ni el scheduler del backend. Para recibir avisos reales, el backend debe desplegar la migración `2026_11_06_150000_add_tour_booking_events_and_notification_outbox.php`, la cola `tour-notifications`, el scheduler y los transportes de correo y WhatsApp por sucursal según el contrato.

`TOURS_TRACKING_URL` debe apuntar a la pantalla pública de Mi reserva. La lectura de `booking_token`, el historial `history` ordenado por `sequence` y la consulta `GET /public/bookings/{public_token}` corresponden al frontend público. El contrato no ofrece una ruta administrativa de eventos o entregas; no se inventa una ni se consulta el token público desde el administrador. No se muestran enlaces privados ni se envían tokens a analítica.

Los estados internos de entrega y su revisión operativa permanecen en el backend. Este cambio no afirma que los mensajes se hayan enviado ni modifica infraestructura de producción.
