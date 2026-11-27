# 42. Fixtures de cierre de fase 5

Fixtures ilustrativos derivados de las reglas de los controladores; no todos son capturas literales de una prueba. La prueba Feature ejecutada en este cierre fue `tests/Feature/ServiceOperationsTest.php`: **14 passed, 107 assertions**, configuración SQLite `:memory:` con esquema/datos ficticios creada por la suite. No se usó MySQL ni producción.

## PATCH de cita: éxito (ilustrativo, contrato de controller)

```http
PATCH /api/branches/12/bookings/21
Content-Type: application/json
Accept: application/json
```

```json
{"notes":"Traerá el vehículo por la mañana","vehicle_id":82}
```

```json
{"data":{"id":21,"store_id":3,"booking_code":"BK-0123456789ABCDEF01234567","service_id":8,"branch_id":12,"customer_id":14,"vehicle_id":82,"resource_id":6,"sale_id":null,"booking_date":"2026-12-02","start_time":"09:00:00","end_time":"10:00:00","quantity":1,"unit_price":"650.00","total":"650.00","status":"confirmed","payment_status":"pending","notes":"Traerá el vehículo por la mañana","metadata":{"created_by_type":"store","created_by_id":3},"confirmed_at":"2026-11-26T10:00:00.000000Z","cancelled_at":null,"created_at":"2026-11-26T09:00:00.000000Z","updated_at":"2026-11-26T11:00:00.000000Z"}}
```

## Reprogramación

```http
POST /api/branches/12/bookings/21/reschedule
Content-Type: application/json
Accept: application/json
```

```json
{"booking_date":"2026-12-03","start_time":"10:30","resource_id":6}
```

Éxito: `200 {"data": <Booking actualizado>}`. El fixture de disponibilidad fallida está respaldado por `test_availability_consecutive_conflict_reschedule_cancel_and_idempotency`:

```json
{"message":"The given data was invalid.","errors":{"start_time":["No hay disponibilidad para este horario y recurso."]}}
```

HTTP 422. Esto no altera la cita original. Para conservar el recurso existente, omitir `resource_id`; `null` significa recalcular sin fijar ID.

## Cancelación

```http
POST /api/branches/12/bookings/21/cancel
Content-Type: application/json
Accept: application/json
```

```json
{"reason":"El cliente solicita mover la atención a otra semana"}
```

Éxito: `200 {"data": <Booking con status=cancelled, cancelled_at y metadata.cancellation_reason/cancelled_by_type/cancelled_by_id>}`. La prueba de disponibilidad/reprogramación/cancelación confirma que la cita cancelada deja de ocupar el cupo. Repetir o cancelar una cita completada/con orden produce HTTP 409 (`abort_if(…,409)`); el controlador no establece un cuerpo JSON propio para ese conflicto, así que el cuerpo depende del handler de excepciones Laravel. No asumir un `message` o `code` específico. Si la validación del motivo falla, HTTP 422 con `errors.reason`.

## Venta vinculada a la orden

```http
POST /api/branches/12/service-orders/77/sale
Content-Type: application/json
Accept: application/json
```

```json
{"sale_id":901}
```

Éxito `200` (derivado del modelo actualizado):

```json
{"data":{"id":77,"store_id":3,"branch_id":12,"order_code":"OS-2026-000077","customer_id":14,"vehicle_id":82,"sale_id":901,"status_id":2,"created_at":"2026-11-26T09:00:00.000000Z","updated_at":"2026-11-26T11:00:00.000000Z"}}
```

La prueba `test_sale_link_rejects_foreign_client_and_duplicate_order` verifica éxito y rechazos de tenant/venta ya vinculada. Respuestas ilustrativas de validación:

```json
{"message":"The given data was invalid.","errors":{"sale_id":["El cliente de la venta no coincide."]}}
```

```json
{"message":"The given data was invalid.","errors":{"sale_id":["La venta ya está vinculada a otra orden."]}}
```

Ambas HTTP 422. Un segundo `sale_id` diferente en una orden que ya tiene venta genera HTTP 409. La operación no cobra ni modifica inventario.

## Certeza y alcance

- Literalmente comprobado por Feature: suite de operaciones 14/107; escenarios cubiertos en `ServiceOperationsTest` incluyen disponibilidad, reschedule con slot no disponible, cancelación/liberación, conversión a orden, aislamiento branch/store, reasignación de recurso y vínculo de venta con duplicidad.
- Derivado directamente de código: formato completo del objeto booking/orden, PATCH de actualización de cita, validaciones detalladas de estados, listados de ventas y timezone.
- No comprobado: locks/concurrencia MySQL; aceptación/rechazo semántico de cada estado de pago en vínculo (el código no filtra estado); consumidor frontend externo; zona por tienda/sucursal.

