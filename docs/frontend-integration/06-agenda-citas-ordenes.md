# Agenda, citas y órdenes de servicio

Todas las rutas de agenda/órdenes están protegidas por Sanctum bajo `/branches/{branchId}`. El ámbito de sucursal debe verificarse para la cuenta y el actor POS. La agenda y operaciones siguen disponibles en el caso tradicional sin vehículo cuando el servicio no lo exige.

## Rutas y acciones

| HTTP | Ruta | Acción |
|---|---|---|
| GET, POST | `/branches/{branchId}/bookings` | listar/crear cita |
| GET, PATCH | `/branches/{branchId}/bookings/{bookingId}` | consultar/editar |
| POST | `.../bookings/{bookingId}/confirm` | confirmar |
| POST | `.../bookings/{bookingId}/cancel` | cancelar |
| POST | `.../bookings/{bookingId}/reschedule` | reprogramar |
| POST | `.../bookings/{bookingId}/arrival` | registrar llegada |
| POST | `.../bookings/{bookingId}/service-order` | crear/recuperar orden desde cita |
| GET, POST | `/branches/{branchId}/service-orders` | listar/crear orden inmediata |
| GET | `.../service-orders/summary` | resumen |
| GET, PATCH | `.../service-orders/{orderId}` | detalle/actualización |
| POST | `.../{orderId}/start`, `/complete`, `/cancel` | transición de estado |
| PATCH | `.../{orderId}/resource` | asignar recurso |
| POST | `.../{orderId}/sale` | vincular venta ya creada |
| POST | `.../{orderId}/next-booking` | siguiente cita |
| GET | `.../customers/{customerId}/service-history` | historial cliente |

## Contratos exactos

Los cuerpos, filtros, paginación, cálculo de slots, states y respuestas exactas están en [33](33-contratos-exactos-agenda-citas.md), órdenes y snapshots en [34](34-contratos-exactos-ordenes-servicio.md), transiciones en [35](35-estados-transiciones-operativas.md), recurso/kilometraje/forms en [36](36-recursos-kilometraje-formularios.md), vínculo de ventas/historial/documentos en [37](37-ventas-historial-documentos-ordenes.md), capabilities en [38](38-capacidades-operativas-seguimiento.md), fixtures en [39](39-fixtures-agenda-ordenes.md).

La cita se crea con `service_id`, `customer_id`, `booking_date`, `start_time` e `idempotency_key`, más `vehicle_id`, `resource_id`, `notes` opcionales. React no envía end_time, duration, price, quantity ni estado: Laravel revalida disponibilidad y calcula fin/precio/capacidad. No existe endpoint de calendario ni de no-show.

## Estados

Las transiciones reales de citas y órdenes están en documento 35. Citas usan `pending`, `confirmed`, `arrived`, `completed`, `cancelled`; no existe no-show. Órdenes soportan `pending → in_progress → completed` o `cancelled`; no hay pause/resume. Iniciar orden no crea capturas; se inician por el endpoint de formularios. Completar valida los formularios requeridos. Conversión de cita es idempotente. No inferir acciones fuera de las rutas documentadas.

## Asociación comercial

`POST /branches/{branchId}/service-orders/{orderId}/sale` asocia una venta existente autorizada de la misma tienda/sucursal/cliente. No crea venta, cobra ni mueve inventario. Crear y cobrar refacciones únicamente en flujo POS actual y después vincular la venta.

