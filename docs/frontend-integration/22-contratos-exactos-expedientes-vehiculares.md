# 22. Contratos exactos: expedientes vehiculares

Paths relativos a `/api`. Evidencia principal: `routes/api.php`, `app/Http/Controllers/Api/VehicleController.php`, `app/Models/Vehicle.php`, migración `2026_11_25_000001_create_vehicles_and_service_relations.php`, `VehicleFeature` y `tests/Feature/VehicleRecordsTest.php`.

## Rutas efectivas y acceso

| Método | Ruta | Controlador/método | Middleware y autorización | Scope |
|---|---|---|---|---|
| GET | `/vehicles` | `VehicleController@index` | `auth:sanctum`; Store o PosLocation; `vehicle_records` activo | tenant/store; no filtra branch aunque POS tenga una |
| POST | `/vehicles` | `VehicleController@store` | igual | `store_id` del actor |
| GET | `/vehicles/{vehicleId}` | `VehicleController@show` | igual | tenant/store; POS no filtra branch aquí |
| PUT, PATCH | `/vehicles/{vehicleId}` | `VehicleController@update` | igual | tenant/store; campos limitados por validador |
| PATCH | `/vehicles/{vehicleId}/status` | `VehicleController@status` | igual, pero solo actor Store | tenant/store |
| GET | `/vehicles/{vehicleId}/history` | `VehicleController@history` | igual | Store: todas las sucursales o `branch_id`; POS: su branch, otra da 403 |
| GET | `/clients/{customerId}/vehicles` | `VehicleController@byCustomer` | igual | cliente y vehículos de la tienda, no filtra branch |
| PATCH | `/vehicles/{vehicleId}/service-orders/{orderId}/mileage` | `VehicleController@visitMileage` | igual | tenant; POS además debe coincidir con branch de la orden |

El módulo `vehicle_records` se comprueba mediante `VehicleFeature::recordsEnabled` (módulo/plan). PosLocation además requiere branch activo de su tienda y no tener override local `vehicle_records=false`. Contexto no Store/PosLocation responde 403; recurso fuera de tenant responde 404. No hay permiso RBAC con nombre en estas rutas. Los endpoints de QR/etiqueta se describen en documento 25.

## GET listado

`GET /vehicles` acepta estos filtros query:

| Parámetro | Tipo | Regla / efecto |
|---|---|---|
| `customer_id` | integer | ≥1; igualdad exacta |
| `brand_id` | integer | ≥1; igualdad sobre `vehicle_brand_id` |
| `model_id` | integer | ≥1; igualdad sobre `vehicle_model_id` |
| `plates` | string | máx. 32; normaliza y busca prefijo |
| `vin` | string | máx. 50; normaliza y busca prefijo |
| `is_active` | boolean | filtra activo/inactivo |
| `per_page` | integer | 1–100, default 20 |
| `page` | integer | ≥1 |

No existen filtros `year`, `branch_id`, texto libre ni ordenamiento configurable en este endpoint. Orden determinista `id DESC`. Placas/VIN se normalizan con trim, uppercase y eliminación de caracteres que no sean A–Z/0–9; búsqueda es prefijo (`normalizado%`). Si la entrada normaliza a cadena vacía, ese filtro no se aplica.

Respuesta directa de paginator Laravel (no envuelta en `data`):

```json
{
  "current_page": 1,
  "data": [{
    "id": 81, "store_id": 3, "customer_id": 12, "vehicle_brand_id": 4, "vehicle_model_id": 9,
    "year": 2022, "plates": "ABC-123", "plates_normalized": "ABC123",
    "vin": "1HGCM82633A004352", "vin_normalized": "1HGCM82633A004352",
    "latest_mileage": 48210, "latest_mileage_recorded_at": "2026-11-20T10:00:00.000000Z",
    "is_active": true, "created_at": "2026-11-20T10:00:00.000000Z", "updated_at": "2026-11-20T10:00:00.000000Z",
    "customer": {"id": 12, "nombre_alias": "Cliente de prueba", "telefono": "5550000100"},
    "brand": {"id": 4, "name": "Nissan"},
    "model": {"id": 9, "vehicle_brand_id": 4, "name": "Versa"}
  }],
  "first_page_url": "…", "from": 1, "last_page": 1, "last_page_url": "…",
  "links": [{"url": null, "label": "&laquo; Previous", "active": false}],
  "next_page_url": null, "path": "…", "per_page": 20, "prev_page_url": null,
  "to": 1, "total": 1
}
```

Los valores son fixture ilustrativo. Campos normalizados sí aparecen en el modelo de salida; `public_token` está oculto. Relación `customer` queda limitada a id/nombre/teléfono; brand y model a los campos seleccionados.

Colección vacía mantiene la forma paginator: `{"current_page":1,"data":[],"per_page":20,"total":0,...}`.

## Crear vehículo

`POST /vehicles`, `Content-Type: application/json`. Campo obligatorio significa requerido y no null.

| Campo aceptado | Regla | Default / normalización |
|---|---|---|
| `customer_id` | requerido integer; cliente `clientes.id` de misma tienda | `store_id` nunca se recibe del cliente |
| `vehicle_brand_id` | requerido integer; marca `vehicle_brands.id` de misma tienda | identificador, no texto libre |
| `vehicle_model_id` | requerido integer | ID debe pertenecer a `vehicle_brand_id` recibido |
| `year` | opcional nullable integer, 1886–2200 | null si se omite |
| `plates` | opcional nullable string max32 | trim; null permitido |
| `vin` | opcional nullable string max50 | trim; null permitido |
| `latest_mileage` | opcional nullable integer 0–999,999,999 | null si se omite; no valida contra el valor anterior |

No se aceptan `color`, `notes`, `observations`, `status`, `is_active`, `store_id`, `branch_id`, `pos_location_id` ni `public_token`. `is_active` se crea true por default de BD y solo se cambia mediante endpoint status. Los campos desconocidos que no son explícitamente prohibited no se agregan al modelo porque no forman parte del validador/payload validado.

Marca/modelo son IDs. Además de que la marca pertenezca al tenant, el modelo debe corresponder a esa marca; error custom: `El modelo no pertenece a la marca seleccionada.` El evento `saving` del modelo también verifica que cliente, marca y modelo estén asociados al mismo tenant.

Respuesta HTTP 201: `{"data": <Vehicle con customer, brand y model cargados>}`. Modelo oculta `public_token`:

```json
{"data":{"id":81,"store_id":3,"customer_id":12,"vehicle_brand_id":4,"vehicle_model_id":9,"year":2022,"plates":"ABC-123","plates_normalized":"ABC123","vin":"1HGCM82633A004352","vin_normalized":"1HGCM82633A004352","latest_mileage":48210,"latest_mileage_recorded_at":"2026-11-20T10:00:00.000000Z","is_active":true,"created_at":"2026-11-20T10:00:00.000000Z","updated_at":"2026-11-20T10:00:00.000000Z","customer":{"id":12,"nombre_alias":"Cliente de prueba","telefono":"5550000100"},"brand":{"id":4,"name":"Nissan"},"model":{"id":9,"vehicle_brand_id":4,"name":"Versa"}}}
```

Petición válida ilustrativa:

```json
{"customer_id":12,"vehicle_brand_id":4,"vehicle_model_id":9,"year":2022,"plates":"ABC-123","vin":"1HGCM82633A004352","latest_mileage":48210}
```

Si `latest_mileage` se envía no nulo en creación, `latest_mileage_recorded_at` se establece a `now()`.

## Editar vehículo

`PUT` o `PATCH /vehicles/{vehicleId}`. Es actualización parcial. Los campos editables son `customer_id`, `vehicle_brand_id`, `vehicle_model_id`, `year`, `plates`, `vin`, `latest_mileage`, con las mismas reglas; los tres IDs de relación son `sometimes` pero no nullable. Campos omitidos se conservan. `year`, `plates`, `vin` y `latest_mileage` pueden enviarse `null` según sus reglas. Enviar `latest_mileage:null` limpia lectura y timestamp.

Ejemplo parcial:

```http
PATCH /api/vehicles/81
```
```json
{"plates":"NUE-456","vehicle_brand_id":4,"vehicle_model_id":9}
```

El cliente, marca, modelo y placas/VIN pueden cambiarse, siempre validando tenant, pareja marca/modelo y unicidad. Un cambio en el vehículo no reescribe snapshots ya guardados en órdenes. Respuesta 200 `{"data": <Vehicle actualizado con customer, brand y model>}`.

### Kilometraje

`latest_mileage` sí se puede editar directamente mediante `POST`, `PUT` o `PATCH /vehicles`. El backend **no impide que ese campo baje** y registra el timestamp como reciente; la ruta directa no agrega un evento histórico. No afirmar al usuario que el kilometraje general es monotónico.

La captura operacional por visita es `PATCH /vehicles/{vehicleId}/service-orders/{orderId}/mileage` con `{"visit_mileage": integer 0..999999999}`. Guarda lectura en la orden; actualiza `vehicles.latest_mileage` solo si la visita no es anterior al último registro y el valor no es menor al acumulado. Lectura de orden finalizada/cancelada responde 409 si existe tabla/estado aplicable. La lectura de visita puede quedar menor como dato histórico, sin bajar el acumulado. Prueba `test_historical_visit_cannot_replace_more_recent_mileage`.

## Estado, errores y conservación

Único estado del expediente: boolean `is_active`. `PATCH /vehicles/{vehicleId}/status` recibe `{"is_active":true|false}`; solo Store, no POS. La ruta no expone archivado, delete ni eliminación física. Desactivar conserva filas y relaciones; pruebas confirman que cita y orden históricas se mantienen y que nuevas asociaciones/citas con un vehículo inactivo son rechazadas por guardas del dominio. Lectura/historial del expediente no filtra automáticamente inactivos.

Placas y VIN son únicos por `store_id` mediante columnas normalizadas e índices compuestos; no por branch ni globalmente. Dos tiendas pueden usar el mismo valor. Errores:

| Caso | HTTP/campo | Mensaje de código |
|---|---|---|
| Placas/VIN ya existente | 422, `errors.plates` o `errors.vin` | `Ya existe un vehículo con este identificador en la tienda.` |
| Colisión detectada por constraint durante carrera | 422, `errors.vehicle` | `VIN o placas duplicados dentro de la tienda.` |
| Cliente inexistente/ajeno | 422, `errors.customer_id` | regla `exists` tenant-scoped |
| Marca inexistente/ajena | 422, `errors.vehicle_brand_id` | regla `exists` tenant-scoped |
| Modelo ajeno a marca | 422, `errors.vehicle_model_id` | `El modelo no pertenece a la marca seleccionada.` |
| Año fuera 1886–2200 | 422, `errors.year` | validación Laravel |
| Kilometraje fuera de rango/no entero | 422, `errors.latest_mileage` o `errors.visit_mileage` | validación Laravel |
| Vehículo de otra tienda/no existe | 404 |
| Módulo de expedientes no habilitado | 403, mensaje `Los expedientes vehiculares no están habilitados.` |
| POS intenta cambiar estado | 403, `Solo la tienda puede cambiar el estado del expediente.` |

Validaciones usan JSON Laravel `{"message":"The given data was invalid.","errors":{"field":["..."]}}` (el mensaje estándar puede localizarse). Módulo, autenticación, tenant, unicidad y restricciones de creación están cubiertos en `tests/Feature/VehicleRecordsTest.php`; ver secciones de evidencia en documento 26.

## Evidencia y límites

- Pruebas reales: `VehicleRecordsTest::test_multiple_vehicles_search_and_duplicate_normalization`, `test_brand_model_and_cross_store_access`, `test_pos_scope_and_client_controller_reject_foreign_pos`, `test_history_snapshots_optional_relations_and_visit_mileage`, `test_historical_visit_cannot_replace_more_recent_mileage`.
- El campo VIN completo se devuelve a usuarios autenticados con acceso al expediente. No ponerlo en URLs públicas/QR ni mostrarlo sin autorización.
- El contrato de ruta de listado/show permite POS autenticado acceder a vehículos de cualquier branch de su tienda; las rutas de documento/QR aplican scope adicional. El backend actual no impone branch en esos dos métodos.

