# Anticipos, liquidación, cobros y pedidos web

Integración del contrato de pagos del 6 de noviembre de 2026.

## Tours

- El historial de servicios permite buscar reservas de toda la sucursal por folio/comprador y abrir su detalle para registrar anticipos, abonos o liquidación sobre el mismo ID. El filtro de origen es opcional y se identifica como tal; para cobrar reservas públicas se debe dejar toda la sucursal.
- La liquidación usa exactamente el saldo actual, no el total original. Una reserva cancelada no admite confirmar un cobro nuevo. No se impone al cobro del POS el cierre público de 24 horas.
- Los movimientos se consultan antes de habilitar un cobro nuevo. Se revisan todas las páginas para detectar comprobantes de transferencia u órdenes en línea pendientes. Los presupuestos pendientes en efectivo no se consideran evidencia por aprobar.
- Los comprobantes se descargan con autenticación desde `payments/{id}/proof`; confirmar o rechazar usa la edición del movimiento existente. No se crea otro pago para aprobarlo.
- Una orden en línea pendiente ofrece conciliación `POST payments/{id}/reconcile` en lugar de confirmación manual. No inicia cargos ni captura órdenes. Si el servidor mantiene el pago pendiente, el bloqueo sigue activo.
- Una respuesta de cobro incierta bloquea el reenvío desde el formulario. Al cerrarlo se actualizan movimientos y saldo; no se reintenta automáticamente el POST.
- Las tarjetas muestran la atribución `metadata.collection` cuando existe. Los pagos administrativos sin caja se conservan como administración; no se inventa una caja histórica.

## Reportes

Admin y POS incluyen «Cobros de tours por caja», consultando `GET /branches/{id}/tours/payments`. Las fechas corresponden al pago, y el filtro de caja a quien cobró. El POS utiliza su token; el backend limita su alcance. Admin puede seleccionar una caja de la sucursal o ver toda la sucursal.

Recibido, reembolsado y neto se toman de `data.summary`, con todos los resultados filtrados; no se calculan sumando la página visible. Este rubro se muestra separado del manifiesto y de ventas de productos para evitar duplicarlo. Este proyecto no contiene un cierre de caja general en el que se puedan integrar otros totales.

## Pedidos offline de productos

La bandeja administrativa permite seleccionar sucursal y caja para listado y estadísticas. Sin filtro conserva los pedidos antiguos sin venta. El POS tiene acceso a «Pedidos web» con su cliente autenticado y filtros de su propia sucursal/caja; detalle y acciones utilizan el mismo cliente y el backend valida su pertenencia.

La bandeja es una página en `/admin/pedidos-web`, accesible desde Sucursales, y una vista completa dentro del POS. Comparte la presentación de Tickets y comprobantes: encabezado oscuro, acento amarillo y paneles adaptables. El detalle se abre dentro de la página y conserva los filtros al volver; solo las vistas previas de archivos usan un visor emergente.

La compra pública ya enviaba la sucursal conocida. `CheckoutPayModal` también admite `posLocationId` opcional para enviar una caja web configurada por quien lo integra; no se elige una caja arbitraria desde el navegador.

La aprobación de productos sigue siendo de la venta completa. Los abonos de tours permanecen en los movimientos de la reserva.

## Validación y despliegue

Los cambios son del frontend; no ejecutan migraciones ni cargos. Los endpoints deben estar desplegados en el backend. Las notificaciones requieren además la infraestructura documentada en `tours-notificaciones-admin-pos.md`.
