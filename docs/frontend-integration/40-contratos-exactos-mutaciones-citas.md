# 40. Contratos exactos: edición, reprogramación, cancelación y recurso de citas

Paths relativos a `/api`. Fuentes: `routes/api.php`, `BookingController::update/reschedule/cancel`, `BookingAvailability::assertSlot/slots`, `ServiceOperationScope`, modelo `Booking` y pruebas `tests/Feature/ServiceOperationsTest.php`.

## Autorización compartida

Rutas con `auth:sanctum`, Store propietario de branch o PosLocation de esa tienda y branch. `ServiceOperationScope::branch` valida tienda activa/acceso, módulo general `service_sales`, feature de plan `ventas-de-servicios` y override del POS. Empleado/User no admitido por `TourScope`. Sucursal ajena/inactiva y booking ajena responden 404 para ocultar scope; módulos/actor restringido 403. El método no usa permiso específico de RBAC por acción.

## `PATCH /branches/{branchId}/bookings/{bookingId}` — actualización limitada

Controlador `BookingController::update`. Body JSON acepta únicamente:

| Campo | Regla | Efecto |
|---|---|---|
| `notes` | nullable string max5000 | sustituye notas; null las limpia |
| `vehicle_id` | nullable integer min1 | cambia vehículo, si pasa el guard del modelo |

No hay campos obligatorios. Omitido significa conservar valor actual. Enviar `{}` está permitido y guarda la instancia. Propiedades desconocidas no forman parte de `$data` y se ignoran; no se permiten cambios por esta ruta a cliente, servicio, recurso, sucursal, fecha/hora, duración, precio, estado o cantidad.

El booking debe estar en la branch; se bloquea dentro de DB transaction. Códigos `cancelled` y `completed`, o booking que ya tenga cualquier service order, responden 409. Los otros estados no están rechazados expresamente. Cambiar vehicle_id no cambia customer_id: el guard comprueba mismo tenant, vehículo activo y asignado al customer actual, y satisface `vehicle_requirement` del servicio. Null puede fallar 422 si vehículo es requerido; ID ajeno/inactivo/otro customer se traduce a validación `vehicle_id` 422.

Éxito 200:

```json
{"data":{"id":21,"store_id":3,"booking_code":"BK-0123456789ABCDEF01234567","service_id":8,"branch_id":12,"customer_id":14,"vehicle_id":82,"resource_id":6,"sale_id":null,"booking_date":"2026-12-02","start_time":"09:00:00","end_time":"10:00:00","quantity":1,"unit_price":"650.00","total":"650.00","status":"confirmed","payment_status":"pending","notes":"Cliente actualizó el vehículo","metadata":{"created_by_type":"store","created_by_id":3},"confirmed_at":"2026-11-26T10:00:00Z","cancelled_at":null,"created_at":"2026-11-26T09:00:00Z","updated_at":"2026-11-26T10:01:00Z"}}
```

Errores: 401 sin Sanctum; 403 feature/actor; 404 branch/booking ajeno o inexistente; 409 terminal o con orden asociada; 422 regla de campo/relación vehículo. No hay prueba Feature dedicada a editar booking; contrato viene de reglas del controller y `VehicleAssociationGuard`.

## `POST /branches/{branchId}/bookings/{bookingId}/reschedule`

Body JSON:

| Campo | Regla | Omisión/null |
|---|---|---|
| `booking_date` | required `date_format:Y-m-d` | obligatorio, no nullable |
| `start_time` | required `date_format:H:i` 24h | obligatorio, no nullable |
| `resource_id` | nullable integer min1 | omitido conserva recurso; null solicita recurso sin fijar ID |

No recibe motivo, duración, end_time, timezone, ni status. La zona es `config('app.timezone')` (hoy `America/Mexico_City`). El servicio/config definen duración y `duration_override` puede aplicarse; Laravel recalcula `end_time`. Resultado conserva status y modifica fecha, inicio, fin, recurso y `metadata.rescheduled_at`; no guarda el horario anterior ni motivo.

Estados: permite `pending` y `confirmed`; rechaza `arrived`,`cancelled`,`completed` (409) y cualquier booking con orden de servicio (409). No hay transición de estado. Transacción bloquea la fila de branch y booking; disponibilidad se comprueba antes de guardar y el cambio de horario/recurso ocurre dentro de esa misma transacción. Si la reserva nueva falla, la antigua permanece sin cambios. La implementación usa `lockForUpdate`, pero la suite Feature usa SQLite in-memory: no prueba exclusión mutua concurrente en MySQL.

### Exclusión de la cita consultada en disponibilidad

La API GET `/branches/{branchId}/services/{serviceId}/availability` **no** admite `booking_id` ni parámetro de exclusión. Internamente `BookingAvailability::slots(..., ?int $excludeBooking)` y `assertSlot(..., ?int $excludeBooking)` sí permiten excluir; `BookingController::reschedule` les pasa el ID de booking. Por tanto la cita no se bloquea a sí misma al proponer/revalidar su nuevo slot. Es un argumento interno de servicio, no contrato query.

El slot se valida con fecha+hora exacta; si no hay cupo/recurso devuelve 422 con `errors.start_time: ["No hay disponibilidad para este horario y recurso."]`. Recurso inválido/ajeno/inactivo puede 404 por scope, o no producir slot y 422. Conflicto de estado 409. Éxito 200 `{ "data": <Booking actualizado> }`.

`resource_id` omitido conserva el actual y se verifica que pueda reservarse en el nuevo horario. Con null, availability busca slots sin recurso específico: si `service.requires_resource=true`, Laravel selecciona el primer `resource_ids` disponible; si no requiere resource, queda null. ID enviado debe estar activo, branch propia y asociado al servicio. Cualquier fallo de cupo deja intacto el booking anterior.

## Cancelar: `POST /branches/{branchId}/bookings/{bookingId}/cancel`

Body requerido `{ "reason":"Cliente solicita cancelar" }`; `reason` string requerido min5 max2000, no nullable. Estados cancelables: `pending`, `confirmed`, `arrived`, siempre que todavía no exista service order. `completed`, `cancelled` o una cita con order asociado responden 409. Store/POS en la branch pueden solicitarla.

Transacción con locks branch/booking cambia status a `cancelled`, establece `cancelled_at` y suma a metadata `cancellation_reason`, `cancelled_by_type` (`store|pos`) y `cancelled_by_id`. No elimina cita ni orden; de hecho la presencia de order impide esta ruta. Booking cancelada deja de contar para disponibilidad porque `BookingAvailability` excluye `cancelled` y `completed`.

Éxito 200 `{"data":<Booking actualizado>}`. Repetir cancelación: 409, no es idempotente. Sin reason/min5/max2000: 422 `errors.reason`. Sucursal/booking ajena: 404; actor/módulo: 403. Pruebas `test_availability_consecutive_conflict_reschedule_cancel_and_idempotency`, `test_pending_booking_requires_explicit_confirmation` verifican reprogramación no disponible, liberación de cupo, estado/confirmación, pero no todas las variantes del motivo/cancel.

## Cambio de recurso de cita vs. orden

No existe `PATCH /bookings/{id}/resource`. Para cambiar recurso de cita sin order debe llamarse `reschedule`, enviando fecha y hora junto con nuevo `resource_id`; esto vuelve a validar capacidad y conserva el horario si se reenvía. Una cita arrived o con order no puede reprogramarse.

Para order vinculada a booking, ruta distinta `PATCH /branches/{branchId}/service-orders/{orderId}/resource` actualiza resource de orden y sincroniza `booking.resource_id`; documentada en [36](36-recursos-kilometraje-formularios.md). No confundir la operación de orden con edición de booking aislada.

## Evidencia y límites

`ServiceOperationsTest::test_availability_consecutive_conflict_reschedule_cancel_and_idempotency` cubre create/idempotency/conflict, reprogramación fallida y cancelación que libera cupo. `test_pending_booking_requires_explicit_confirmation` cubre pending→confirmed→arrived. `test_reassignment_updates_booking_and_operational_queries_are_scoped` cubre el cambio sincronizado por ruta de orden. Ninguna de estas pruebas se ejecutó sobre MySQL.
