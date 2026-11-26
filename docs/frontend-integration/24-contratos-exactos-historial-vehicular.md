# 24. Contrato exacto: historial vehicular

Fuente: `routes/api.php`, `VehicleController::history`, `VehicleController::branch`, `ServiceOrder`, `Booking`, `VehicleAssociationGuard` y `tests/Feature/VehicleRecordsTest.php`.

## Endpoint y scope

```http
GET /api/vehicles/{vehicleId}/history
Authorization: Bearer <Sanctum de Store o POS>
Accept: application/json
```

Middleware `auth:sanctum`; `vehicle_records` activo y tienda con acceso. El vehículo debe pertenecer a la tienda o devuelve 404. Store ve todas las sucursales salvo `?branch_id=ID`; ID branch Store debe pertenecer a su tienda o devuelve 404. POS se acota automáticamente a su `branch_id`; mandar otro `branch_id` devuelve 403. No hay permiso RBAC nominal.

## Filtros y paginación

| Query | Validación | Efecto |
|---|---|---|
| `branch_id` | leído por scope; Store debe pertenecer a su tenant; POS solo propio | restringe ambas colecciones |
| `per_page` | integer 1–100, default 20 | aplicado a ambas colecciones |
| `service_id` | integer ≥1 | filtra citas y órdenes |
| `status` | string max30 | solo órdenes, por `service_order_statuses.code` |
| `date_from`, `date_to` | `YYYY-MM-DD` | órdenes por `created_at`; citas por `booking_date` |

JSON devuelve paginadores separados: `orders` usa query page name `orders_page`, `bookings` usa `bookings_page`; no comparten `page`. Órdenes ordenadas `created_at DESC`; citas `booking_date DESC`. Cada paginador tiene metadatos Laravel. No hay cursor ni arreglo cronológico combinado.

## Forma de respuesta

```json
{
  "data": {
    "vehicle_id": 81,
    "orders": {"current_page":1,"data":[],"per_page":20,"total":0,"last_page":1,"from":null,"to":null,"links":[...]},
    "bookings": {"current_page":1,"data":[],"per_page":20,"total":0,"last_page":1,"from":null,"to":null,"links":[...]}
  }
}
```

Un vehículo sin historial es 200 con ambas `data: []`, no 404 (si el expediente sí existe).

Cada fila de orden es el modelo `ServiceOrder` serializado con columnas reales de `service_orders` salvo `form_requirements_snapshot`, más relaciones:

- `service:{id,name}`, `branch:{id,name}`, `resource:{id,name}`, `status:{id,name,code}`, `booking:{id,booking_code}`;
- `form_submissions`: si la tabla existe, únicamente `id`, `service_order_id`, `service_form_template_id`, `status`, `folio`, `completed_at`.
- Las columnas de orden, cuando existan, incluyen `created_at`, `started_at`, `completed_at`, `visit_mileage`, `vehicle_snapshot`, `customer_snapshot` y `sale_id` escalar.

No carga `sale` relation, no carga `service_order_history`, no devuelve pagos, ni URLs de documentos. Las submissions no incluyen respuestas, schema ni snapshot de formulario; abrir su endpoint de detalle con permisos/módulo `service_forms` para ese contenido. Recurso no es un listado de técnicos; el history relation expone id/nombre.

Cada fila de cita es el modelo `Booking`, con relaciones `service:{id,name}`, `branch:{id,name}`, `resource:{id,name}` y columnas propias (por ejemplo `booking_code`, `booking_date`, `start_time`, `end_time`, `status`, `vehicle_id`). No incluye snapshots de cliente/vehículo. `service_order_history` no se representa como timeline.

## Snapshots e información histórica

Al crear una orden con vehículo, `VehicleAssociationGuard` captura:

```json
{"vehicle_snapshot":{"brand_id":4,"model_id":9,"brand":"Nissan","model":"Versa","year":2022,"plates":"ABC-123","vin":"1HGCM82633A004352"},"customer_snapshot":{"name":"Cliente de prueba","phone":"5550000100"}}
```

Cambios posteriores del nombre/phone de cliente o marca/modelo/identificadores no reescriben esos snapshots. El evento `test_history_snapshots_optional_relations_and_visit_mileage` prueba que `vehicle_snapshot.plates` sigue `ABC-123` después de modificar placas del vehículo y que `customer_id` de la orden permanece original tras cambiar cliente asociado al expediente. El snapshot contiene VIN/placas en la respuesta autenticada; manejarlo como dato privado.

Kilometraje histórico de visita se representa como `visit_mileage` de cada orden; este endpoint no lista eventos de kilometraje separados. El agregado actual `vehicles.latest_mileage` no se incluye en raíz, cuyo único campo de expediente es `vehicle_id`.

## Fixtures ilustrativos

### Cita sin orden

```json
{"data":{"vehicle_id":81,"orders":{"current_page":1,"data":[],"per_page":20,"total":0,"last_page":1},"bookings":{"current_page":1,"data":[{"id":31,"booking_code":"BK-31","service_id":5,"branch_id":12,"customer_id":12,"vehicle_id":81,"resource_id":7,"booking_date":"2026-11-30","start_time":"09:00:00","end_time":"10:00:00","status":"confirmed","service":{"id":5,"name":"Inspección"},"branch":{"id":12,"name":"Centro"},"resource":{"id":7,"name":"Técnico 7"}}],"per_page":20,"total":1,"last_page":1}}}
```

### Orden finalizada, snapshots, visita e inspección

```json
{"data":{"vehicle_id":81,"orders":{"current_page":1,"data":[{"id":52,"order_code":"SO-52","store_id":3,"service_id":5,"booking_id":31,"customer_id":12,"branch_id":12,"resource_id":7,"sale_id":90,"status_id":4,"visit_mileage":48210,"vehicle_snapshot":{"brand_id":4,"model_id":9,"brand":"Nissan","model":"Versa","year":2022,"plates":"ABC-123","vin":"1HGCM82633A004352"},"customer_snapshot":{"name":"Cliente anterior","phone":"5550000100"},"started_at":"2026-11-30T09:05:00.000000Z","completed_at":"2026-11-30T10:00:00.000000Z","created_at":"2026-11-30T08:50:00.000000Z","service":{"id":5,"name":"Inspección"},"branch":{"id":12,"name":"Centro"},"resource":{"id":7,"name":"Técnico 7"},"status":{"id":4,"name":"Finalizado","code":"completed"},"booking":{"id":31,"booking_code":"BK-31"},"form_submissions":[{"id":61,"service_order_id":52,"service_form_template_id":8,"status":"completed","folio":"SF-61","completed_at":"2026-11-30T09:45:00.000000Z"}]}],"per_page":20,"total":1,"last_page":1},"bookings":{"current_page":1,"data":[...],"per_page":20,"total":1,"last_page":1}}}
```

Las propiedades concretas de filas dependen de columnas disponibles en esquema y relaciones cargadas. El fixture muestra campos presentes en el código, no un fixture capturado íntegramente. `status_id:4` y nombres son ficticios.

## Evidencia / qué queda fuera

- Prueba: `tests/Feature/VehicleRecordsTest.php::test_history_snapshots_optional_relations_and_visit_mileage`; afirma una orden y una cita en dos paginadores, snapshot estable y kilometraje.
- No hay endpoint `events` unificado ni orden combinado por timestamp.
- Para contenido de inspección: `/service-orders/{orderId}/forms` y detalle de submission; para PDF usar ruta privada de documentos. El history no crea una lista de archivos.
- `sale_id` es el único dato de venta en fila si columna existe; no hay datos de ticket ni cobro relacionados en este response.

