# 35. Estados y transiciones operativas

Fuente: `BookingController`, `ServiceOrderController`, `ServiceOperationScope`, `BookingAvailability`, Feature `ServiceOperationsTest`. Las rutas están bajo Sanctum y scope tenant/branch Store o POS.

## Citas

| Estado interno | Significado | Operaciones válidas confirmadas | Cupo |
|---|---|---|---|
| `pending` | espera confirmación manual | confirm, reschedule, cancel, editar notas/vehículo; conversión no permitida | ocupa capacidad |
| `confirmed` | confirmada | confirm idempotente, arrival, reschedule, cancel, convertir en orden | ocupa capacidad |
| `arrived` | cliente llegó | arrival idempotente, cancel, convertir en orden; reschedule 409 | ocupa capacidad |
| `completed` | orden de la cita finalizada | lectura; no reschedule/cancel/update normal | libera capacidad |
| `cancelled` | cancelada | lectura | libera capacidad |

No existe `no_show`, pausa ni transición de inasistencia. La confirmación repite 200 sin nueva escritura cuando ya está confirmed; arrival repite 200 cuando arrived. Confirm solo acepta pending/confirmed; llegada solo confirmed/arrived; fuera de condición 409. Cancel permite pending/confirmed/arrived siempre que no exista service order y no esté completed/cancelled; requiere razón. Una cita vinculada a orden no puede cancelarse/reprogramarse/editarse por la guarda `serviceOrders()->exists()` donde aplica.

Crear cita produce pending si service/config `requires_confirmation` true (lógica OR); de lo contrario confirmed con `confirmed_at`. Conversion desde confirmed/arrived deja booking como está. Finalizar orden marca cita completed; cancelar orden marca cita cancelled y timestamp. No existe ledger separado de cita; `metadata` guarda creador/confirmador/llegada/cancelación y tiempo de reprogramación; no se registra historial completo de horarios anteriores. Cualquier solicitud duplicada sin llave idempotente de transición puede responder 409 para estados no válidos; confirm/arrival sí son repetibles.

## Órdenes

Los cuatro códigos soportados por los métodos operativos se crean por tienda usando `ServiceOperationScope::status`: `pending` (Pendiente, initial=true, final=false), `in_progress` (En proceso), `completed` (Finalizado, final=true), `cancelled` (Cancelado, final=true). Filas se persisten per-store en `service_order_statuses`, pero códigos/propiedades son definidos por código para estos endpoints; no se ofrece CRUD del catálogo de estado por estas rutas.

| Estado actual | Endpoint/acción | Siguiente | Validaciones/efectos |
|---|---|---|---|
| pending | `POST .../{id}/start` | in_progress | recurso sigue válido/activo/asignado y bajo capacity; set `started_at`; history `started` |
| pending | `POST .../{id}/cancel` | cancelled | reason 5–2000; set `completed_at`; booking asociado cancelled; history con previous_status |
| pending | `POST .../{id}/complete` | no permitido | 409, solo in_progress |
| in_progress | `POST .../{id}/complete` | completed | vehículo requerido y formularios required completed; set `completed_at`; booking associated completed; history `completed` |
| in_progress | `POST .../{id}/cancel` | cancelled | reason; set `completed_at`; booking cancelled; history `cancelled` |
| completed/cancelled | PATCH order, start, complete, cancel, resource assignment | no permitido | update/assign terminal 409; start/complete/cancel invalid state 409 |

No existen pause/resume. `PATCH order` permite descripción/diagnóstico/resolución/prioridad antes de estado terminal y registra evento `updated` con lista `fields`. No hay permisos action-specific: toda operación usa mismo `ServiceOperationScope`; diferencias Store/POS solo scope branch, módulos/plan. Formularios tienen su gate adicional.

Formularios required: `forms_progress.required_pending` lista IDs que no tienen submission completed. Draft/cancelled no completan requisito. `POST complete` devuelve 422 con `errors.forms` y `errors.pending_template_ids`; no cambia estado. Completar/cancelar booking/order y registrar history ocurren dentro de transacción. Repetir start/complete/cancel fuera del estado permitido es 409; historial de transiciones se añade una vez por transición aceptada.

## Conflictos y concurrencia

Los métodos usan DB transaction; algunos bloquean branch y orden/booking con `lockForUpdate`. El nivel de concurrencia efectiva depende del motor. Las Feature usan SQLite in-memory y no prueban locks ni doble submit MySQL. La clave idempotente es explícita para crear citas/órdenes directas, y conversión protege por unique/lookup de booking_id; las transiciones de status no reciben idempotency key. No afirmar concurrencia MySQL comprobada.
