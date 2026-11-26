# 33. Contratos exactos: agenda y citas

> Evidencia de fase 5 pendiente de cotejo con la revisión operativa de Laravel. Este anexo conserva el contrato reportado en la entrega previa. Consulta [fuente y certeza](README.md#fuente-y-certeza).

Paths relativos a `/api`. Fuentes: `routes/api.php`, `BookingController`, `BookingAvailabilityController`, `BookingAvailability`, `BookingConfigController`, `ServiceOperationScope`, modelos `Booking`/`BookingConfig`; Feature `tests/Feature/ServiceOperationsTest.php`.

## Agenda/listado

| Método | Ruta | Controlador | Auth/scope |
|---|---|---|---|
| GET | `/branches/{branchId}/bookings` | `BookingController@index` | `auth:sanctum`, Store o POS de la misma branch; módulo `service_sales`, plan `ventas-de-servicios` |
| GET | `/branches/{branchId}/bookings/{bookingId}` | `show` | mismo; booking limitado a tenant+branch |
| POST | `/branches/{branchId}/bookings` | `store` | mismo |
| PATCH | `/branches/{branchId}/bookings/{bookingId}` | `update` | mismo |
| POST | `/branches/{branchId}/bookings/{bookingId}/confirm` | `confirm` | mismo |
| POST | `/branches/{branchId}/bookings/{bookingId}/arrival` | `arrival` | mismo |
| POST | `/branches/{branchId}/bookings/{bookingId}/reschedule` | `reschedule` | mismo |
| POST | `/branches/{branchId}/bookings/{bookingId}/cancel` | `cancel` | mismo |
| POST | `/branches/{branchId}/bookings/{bookingId}/service-order` | `ServiceOrderController::fromBooking` | mismo |

Identidades efectivas Store y PosLocation (terminal). Usuarios/employees de tipo `User` no pasan el scope existente. `TourScope::branch` oculta branch ajena/inactiva con 404; POS debe coincidir exactamente con su tienda y branch. Sin autenticación 401; módulos/plan/actor bloqueado 403.

`GET .../bookings` acepta filtros query: `date_from`, `date_to` formato `Y-m-d`; `customer_id`, `vehicle_id`, `service_id`, `resource_id` integer; `status` string max30 (no enum validado); `upcoming` boolean; `per_page` integer1–100 default20. No tiene búsqueda textual/folio, filtro por hora, paginación configurable por page propia (Laravel usa `page`), orden configurable ni filtro por store. Orden `booking_date ASC`, `start_time ASC`. Incluye relations acotadas `service:{id,name}`, `resource:{id,name}`, `vehicle:{id,plates}`, `customer:{id,nombre_alias}`. Directo paginator Laravel (`current_page,data,per_page,total,last_page,...`).

`upcoming=true` añade `booking_date >= hoy` en `config('app.timezone')` y excluye `cancelled`,`completed`; no reemplaza otros filtros. `date_from` y `date_to` son inclusivos; controlador no verifica que from≤to.

Ejemplo de fila (IDs ilustrativos; modelo Booking crudo más relaciones seleccionadas):

```json
{"id":21,"store_id":3,"booking_code":"BK-0123456789ABCDEF01234567","service_id":8,"branch_id":12,"customer_id":14,"vehicle_id":81,"resource_id":6,"sale_id":null,"booking_date":"2026-12-02","start_time":"09:00:00","end_time":"10:00:00","quantity":1,"unit_price":"650.00","total":"650.00","status":"confirmed","payment_status":"pending","notes":"Revisión solicitada","metadata":{"created_by_type":"store","created_by_id":3},"confirmed_at":"2026-11-26T10:00:00.000000Z","cancelled_at":null,"created_at":"2026-11-26T10:00:00.000000Z","updated_at":"2026-11-26T10:00:00.000000Z","service":{"id":8,"name":"Inspección"},"resource":{"id":6,"name":"Técnico 1"},"vehicle":{"id":81,"plates":"ABC-123"},"customer":{"id":14,"nombre_alias":"Cliente ficticio"}}
```

No existe endpoint específico de calendar/day/week/month; consultar el mismo endpoint con rango de fechas y paginar. El rango `date_from/date_to` permite vistas diaria/semanal/mensual. No hay filtro de folio salvo comparar `booking_code` en cliente, por lo que la búsqueda server-side por folio no existe.

## Disponibilidad

`GET /branches/{branchId}/services/{serviceId}/availability?date=YYYY-MM-DD&resource_id=6`. `date` requerido exacto; `resource_id` opcional integer≥1 y se valida en branch, recurso activo y asignado al servicio. Respuesta real: `{"data":{"branch_id":12,"service_id":8,"date":"2026-12-02","timezone":"America/Mexico_City","slots":[{"date":"2026-12-02","start_time":"09:00","end_time":"10:00","resource_ids":[6]}]}}`. No devuelve capacity total/ocupada/restante explícitamente; disponibilidad inferible únicamente por presencia del slot y lista de recursos. Sin recurso requerido y ninguno asignado, puede devolver slot con `resource_ids:[]`.

Config usada: preferir `booking_configs` `branch_id` para tienda+servicio+`booking_type=appointment`; si falta, usa config general con `branch_id=null`. La ruta GET booking-config solo consulta configuración específica de branch y puede responder `data:null` aunque availability use fallback general. Config inactiva bloquea slots y reserva con 409. Duración: config `duration_minutes` (si valor falso/0 cae a service `duration_minutes`, luego 60); override no nulo/verdadero de `resource_services.duration_override` sustituye duración. React solo envía `booking_date` y `start_time`; Laravel calcula `end_time` y lo responde.

El backend aplica `app.timezone`, no parámetro de zona horaria. `min_advance_minutes` filtra inicios previos a ahora+min; `max_advance_days` limita día final; franjas especiales reemplazan las semanales para ese día; `closed/blocked/holiday` bloquean todo si no tienen límites, o restan intervalo si tienen. Recursos activos/asignados deben cubrir duración y su horario semanal, si tienen horarios. Capacidad de recurso cuenta reservas solapadas (salvo cancelled/completed) y órdenes in_progress sin cita. Capacidad de servicio por slot y diaria cuenta cantidad reservada (creation fija quantity=1), buffer aplica alrededor de solapamientos.

## Crear cita

JSON requerido: `service_id` integer≥1, `customer_id` integer≥1, `booking_date` `Y-m-d`, `start_time` `H:i`, `idempotency_key` string8–100. Opcionales `vehicle_id` nullable integer≥1, `resource_id` nullable integer≥1, `notes` nullable string max5000. No recibe branch_id, end_time, duration, quantity, status, precio, total ni confirmación.

El servicio debe pertenecer a tienda/branch y estar activo. Customer y vehicle deben pertenecer al tenant; vehicle debe estar activo, corresponder a customer y satisfacer `vehicle_requirement`: `required` exige vehículo, `none` prohíbe vehículo, `optional` permite cualquiera (relación guard). `resource_id` debe estar activo, branch y asociado al servicio; se requiere si `service.requires_resource=true`. Si el servicio requiere recurso y no se manda, Laravel selecciona primero disponible del slot; si no hay, error de validación. La fecha/hora se verifica de nuevo en transacción. `requires_confirmation` de booking config **o** service define estado inicial: `pending` si cualquiera es true, si no `confirmed` y `confirmed_at=now()`.

Precio/total no se reciben: se copian `service.base_price`, quantity=1, payment_status pending. Folio estable `BK-` + 24 chars hex uppercase de hash SHA256(store:branch:idempotency_key). Metadata conserva hash request y creador. Misma clave + mismo payload retorna 200 mismo recurso; misma clave con payload distinto 409. Slot ocupado/no disponible 422 `errors.start_time` (`No hay disponibilidad para este horario y recurso.`). Fin calculado se guarda.

Escenarios de request (todos agregan `idempotency_key` único, y `booking_date/start_time` dentro de disponibilidad): tradicional con `vehicle_requirement=none`: `{"service_id":4,"customer_id":14,"booking_date":"2026-12-02","start_time":"09:00","idempotency_key":"booking-trad-0001"}`; vehicular con `vehicle_requirement=required`: agregar `"vehicle_id":81`; resource obligatorio: agregar `"resource_id":6` o dejarlo omitido para autoasignación disponible; confirmación manual: en response `data.status="pending"`; automática: `data.status="confirmed"` y `confirmed_at` no null. Horario ocupado/inexistente conserva error 422 `errors.start_time`. La política vehículo none/required/optional se valida en `VehicleAssociationGuard`, no en availability.

## Disponibilidad cambió antes de guardar

`store` bloquea fila branch en transacción y recalcula availability antes de crear, por lo que consulta previa no garantiza reservar. Si ya no cabe, 422 en `start_time`; si resource inválido/no elegible, 404 o 422 según fallo del `scope`. Conflicto idempotency 409. El diseño usa locks DB pero test actual es SQLite: no demuestra concurrencia MySQL.

## Evidencia

`ServiceOperationsTest::test_availability_consecutive_conflict_reschedule_cancel_and_idempotency`, `test_exceptions_override_weekly_schedule`, `test_pending_booking_requires_explicit_confirmation`, `test_resource_duration_override_changes_slot_end_without_conflicting_with_following_slot`, `test_reassignment_updates_booking_and_operational_queries_are_scoped`. Los JSON de agenda de este documento son fixtures derivados del serializer; tests Feature verifican campos/estados referidos, no se afirma captura literal de las filas ilustrativas.
