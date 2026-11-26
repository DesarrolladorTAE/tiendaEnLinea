# 34. Contratos exactos: órdenes de servicio

> Evidencia de fase 5 pendiente de cotejo con la revisión operativa de Laravel. Este anexo conserva el contrato reportado en la entrega previa. Consulta [fuente y certeza](README.md#fuente-y-certeza).

Rutas bajo `auth:sanctum`, prefijo `/branches/{branchId}`. Controlador `ServiceOrderController`; scopes `ServiceOperationScope` y `TourScope`; pruebas Feature `ServiceOperationsTest`.

## Listado, resumen, detalle

| Método | Ruta | Función |
|---|---|---|
| GET | `/branches/{branchId}/service-orders` | listado paginado |
| GET | `/branches/{branchId}/service-orders/summary` | conteos por status/booking status |
| GET | `/branches/{branchId}/service-orders/{orderId}` | detalle y formulario progress |
| GET | `/branches/{branchId}/customers/{customerId}/service-history` | órdenes/citas paginadas del cliente |
| POST | `/branches/{branchId}/service-orders` | atención directa, sin cita |
| POST | `/branches/{branchId}/bookings/{bookingId}/service-order` | convertir cita |

Store con branch de tenant o PosLocation de esa branch; `service_sales`/plan de servicios, tienda activa. Branch ajena/no activa o recurso ajeno se oculta 404; módulo inhabilitado 403. No hay identidad Employee/User habilitada por `TourScope`.

### GET listado

Query permitidos: `customer_id`, `vehicle_id`, `service_id`, `resource_id` integers; `status` in `pending,in_progress,completed,cancelled`; `date_from`, `date_to` `Y-m-d`; `per_page` 1–100 default20 y `page` paginator. Filtra fechas por `service_orders.created_at`; orden id DESC. Sin texto, folio, booking, fecha de cita, page size mayor a100, orden custom ni filtros explícitos de store/branch (path/context). Respuesta paginator Laravel directa. Selecciona: `id,store_id,order_code,service_id,booking_id,customer_id,vehicle_id,branch_id,resource_id,sale_id,status_id,priority,description,started_at,completed_at,visit_mileage,vehicle_snapshot,customer_snapshot,created_at,updated_at`. Eager relations `service:{id,name}`, `status:{id,name,code}`, `resource:{id,name}`, `booking:{id,booking_code,booking_date,start_time}`, `formSubmissions:{id,service_order_id,service_form_template_id,status,folio,completed_at}`. No carga venta completa, answers de form ni relation customer/vehicle.

### GET detalle

`GET .../service-orders/{orderId}` devuelve `{"data": <ServiceOrder serializado>, "forms_progress": {"total":1,"completed":0,"draft":1,"cancelled":0,"required_pending":[7]}}`. Carga `service, booking, status, resource, history, formSubmissions` (solo IDs/metadatos), `sale` limitado a `id,store_id,client_id,pos_location_id,status,total_amount`. Incluye atributos escalares de order como snapshots, `form_requirements_snapshot`, `visit_mileage`, diagnosis/resolution/priority y relaciones cargadas. No carga respuestas ni documento; formularios se consultan por endpoint de forms. History viene completa sin paginación ni orden explícito garantizado.

### Resumen y customer history

Summary requiere `date_from` y `date_to` formato `Y-m-d`, `date_to>=date_from`, máximo diferencia 366 días. Agrupa órdenes por código status usando `created_at`; citas por status y `booking_date`. Respuesta `{"data":{"branch_id":12,"period":{"date_from":"...","date_to":"..."},"orders":{"pending":2},"bookings":{"confirmed":3}}}`.

Customer service-history query opcional `vehicle_id,service_id` integer≥1; status en códigos de order; fechas Y-m-d; `per_page`1–100 default20. Respuesta `{data:{customer_id,orders:<paginator orders_page>,bookings:<paginator bookings_page>}}`, cada paginator separado. Orders eager service,status,resource, submissions metadatos; bookings service/resource. Filtro date sobre `created_at` orders y `booking_date` bookings. Scope branch, cliente tenant.

## Crear sin cita

`POST /branches/{branchId}/service-orders` JSON:

```json
{"service_id":8,"customer_id":14,"vehicle_id":81,"resource_id":6,"description":"Inspección inicial","priority":"normal","idempotency_key":"orden-recepcion-0001"}
```

`service_id`, `customer_id` requeridos integer≥1; `vehicle_id`, `resource_id` nullable integer≥1; `description` nullable string max10000; `priority` opcional `low|normal|high|urgent`, default `normal`; idempotency key requerida string8–100. No recibe branch ID (se deriva del path), fecha, kilometraje, estado, folio, precio, snapshots ni formularios.

Servicio debe estar activo y asignado a branch; customer del mismo tenant; vehículo activo de ese customer, mismo tenant y compatible con service vehicle_requirement (`none/optional/required`); recurso activo, branch y asociado al servicio, requerido si `service.requires_resource`. Orden inicia status `pending`. Folio `SO-` + uppercase 24 hex del hash de store:branch:idempotency_key. Snapshot de formularios contiene template id/required/order/schema/version/name vigentes; snapshot de documento service/branch/technician; customer snapshot `{name,phone}`; vehicle snapshot `{brand_id,model_id,brand,model,year,plates,vin}`. `created` history incluye request hash/document snapshot. 201 `{data:order}`; repetir la misma clave y mismo payload devuelve 200 misma orden; payload distinto 409. Recurso lleno al iniciar o crear validación 422.

## Desde cita

`POST /branches/{branchId}/bookings/{bookingId}/service-order`, sin body. Solo booking `confirmed` o `arrived`; si `pending`, 409 `Confirme la cita antes de convertirla en orden.`. Copia service/customer/vehicle/resource, branch, booking, notes→description y snapshots/versiones vigentes de requisitos; status inicial pending. Folio `SO-` + ULID. Idempotencia por `booking_id`: repetición devuelve orden existente con 200 antes de validar status; primera creación 201. No duplica orden. Cita permanece en estado hasta orden complete/cancel (esas acciones reflejan `completed`/`cancelled` en booking). Error de estado 409; scope tenant/branch 404.

## Edición y contratos relacionados

`PATCH /branches/{branchId}/service-orders/{orderId}` permite `description`, `diagnosis`, `resolution` nullable string max10000 y `priority` opcional enum. Omitidos quedan iguales; status completed/cancelled 409. Respuesta `{data:order}`. No hay endpoint pause/resume.

Asignar recurso, vincular venta, kilometraje, forms y documentos se describen en documentos 36–37. Para terminar: ver matriz doc35; detail expone progress, orders index solo metadata. Código de órdenes no es secuencial. Fixtures completos en 39; controller Feature assertions en `ServiceOperationsTest::test_immediate_order_vehicle_requirement_and_form_snapshot`, `test_booking_conversion_and_order_transitions_are_idempotent`, `test_order_form_snapshot_survives_template_change_before_draft_starts`.
