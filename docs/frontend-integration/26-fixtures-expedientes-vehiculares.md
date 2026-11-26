# 26. Fixtures React: expedientes vehiculares

Todos los identificadores y datos son ficticios. Las respuestas completas son ilustrativas salvo donde se indica “probado”: los Feature tests suelen verificar propiedades seleccionadas, no serialización íntegra con timestamps de cada motor.

## Crear expediente — request válido (derivado del validador)

```http
POST /api/vehicles
Authorization: Bearer <Sanctum>
Accept: application/json
Content-Type: application/json
```
```json
{"customer_id":12,"vehicle_brand_id":4,"vehicle_model_id":9,"year":2022,"plates":"ABC-123","vin":"1HGCM82633A004352","latest_mileage":48210}
```

Respuesta 201 ilustrativa, forma real de controller/modelo:

```json
{"data":{"id":81,"store_id":3,"customer_id":12,"vehicle_brand_id":4,"vehicle_model_id":9,"year":2022,"plates":"ABC-123","plates_normalized":"ABC123","vin":"1HGCM82633A004352","vin_normalized":"1HGCM82633A004352","latest_mileage":48210,"latest_mileage_recorded_at":"2026-11-20T10:00:00.000000Z","is_active":true,"customer":{"id":12,"nombre_alias":"Cliente de prueba","telefono":"5550000100"},"brand":{"id":4,"name":"Nissan"},"model":{"id":9,"vehicle_brand_id":4,"name":"Versa"}}}
```
`public_token` no se incluye. HTTP 201, `data.id` es el nuevo ID.

## Listar / sin resultados

```http
GET /api/vehicles?plates=abc123&is_active=1&per_page=20&page=1
```
Respuesta directa paginator:
```json
{"current_page":1,"data":[{"id":81,"customer_id":12,"vehicle_brand_id":4,"vehicle_model_id":9,"year":2022,"plates":"ABC-123","plates_normalized":"ABC123","vin":"1HGCM82633A004352","vin_normalized":"1HGCM82633A004352","latest_mileage":48210,"is_active":true,"customer":{"id":12,"nombre_alias":"Cliente de prueba","telefono":"5550000100"},"brand":{"id":4,"name":"Nissan"},"model":{"id":9,"vehicle_brand_id":4,"name":"Versa"}}],"first_page_url":"…","from":1,"last_page":1,"last_page_url":"…","links":[...],"next_page_url":null,"path":"…","per_page":20,"prev_page_url":null,"to":1,"total":1}
```
```json
{"current_page":1,"data":[],"from":null,"last_page":1,"per_page":20,"to":null,"total":0,"links":[...]}
```

## Edición parcial y estado

```http
PATCH /api/vehicles/81
```
```json
{"plates":"NUE-456","latest_mileage":49000}
```
200: `{"data":{...vehicle actualizado...}}`. `latest_mileage` directo puede bajar; el backend no lo impide.

```http
PATCH /api/vehicles/81/status
```
```json
{"is_active":false}
```
200: `{"data":{"id":81,"is_active":false,...}}`. Solo Store. No hay DELETE ni archive endpoint.

## Errores de registro

Duplicado normalizado (mensaje custom confirmado por código):
```json
{"message":"The given data was invalid.","errors":{"plates":["Ya existe un vehículo con este identificador en la tienda."]}}
```
VIN duplicado usa `errors.vin` con la misma frase. Colisión de índice en carrera usa `errors.vehicle` y `VIN o placas duplicados dentro de la tienda.`

Modelo no pertenece a marca:
```json
{"message":"The given data was invalid.","errors":{"vehicle_model_id":["El modelo no pertenece a la marca seleccionada."]}}
```

Cliente inexistente o de otra tienda produce 422 `errors.customer_id` por regla `exists` tenant-scoped; no revela si el ID existe en otro tenant. Año fuera de 1886–2200 produce 422 `errors.year`; kilometraje no entero/negativo/sobre 999999999 produce 422 `errors.latest_mileage`. Mensajes estándar pueden estar localizados.

Módulo apagado (mensaje de código):
```json
{"message":"Los expedientes vehiculares no están habilitados."}
```
HTTP 403. Recurso de otra tienda: HTTP 404. Usuario sin Sanctum: 401.

## Historial

Muestra mínima sin historial:
```json
{"data":{"vehicle_id":81,"orders":{"current_page":1,"data":[],"per_page":20,"total":0,"last_page":1},"bookings":{"current_page":1,"data":[],"per_page":20,"total":0,"last_page":1}}}
```

Ejemplo ilustrativo con booking, orden, snapshots e inspección:
```json
{"data":{"vehicle_id":81,"orders":{"current_page":1,"data":[{"id":52,"order_code":"SO-52","service_id":5,"booking_id":31,"customer_id":12,"branch_id":12,"resource_id":7,"sale_id":90,"visit_mileage":48210,"vehicle_snapshot":{"brand_id":4,"model_id":9,"brand":"Nissan","model":"Versa","year":2022,"plates":"ABC-123","vin":"1HGCM82633A004352"},"customer_snapshot":{"name":"Cliente anterior","phone":"5550000100"},"started_at":"2026-11-30T09:05:00.000000Z","completed_at":"2026-11-30T10:00:00.000000Z","service":{"id":5,"name":"Inspección"},"branch":{"id":12,"name":"Centro"},"resource":{"id":7,"name":"Técnico 7"},"status":{"id":4,"name":"Finalizado","code":"completed"},"booking":{"id":31,"booking_code":"BK-31"},"form_submissions":[{"id":61,"service_order_id":52,"service_form_template_id":8,"status":"completed","folio":"SF-61","completed_at":"2026-11-30T09:45:00.000000Z"}]}],"per_page":20,"total":1,"last_page":1},"bookings":{"current_page":1,"data":[{"id":31,"booking_code":"BK-31","booking_date":"2026-11-30","status":"confirmed","service":{"id":5,"name":"Inspección"},"branch":{"id":12,"name":"Centro"},"resource":{"id":7,"name":"Técnico 7"}}],"per_page":20,"total":1,"last_page":1}}}
```
En el controller el historial probado devuelve colecciones paginadas separadas. No inventar una colección `events`, metadata de documento ni sale object. Los snapshots pueden incluir VIN; tratar como privado.

## QR: SVG, resolver y rotar

QR SVG es GET sin body y devuelve `image/svg+xml`; el contenido QR es un código, no URL:

```text
MTELMX:VEHICLE:V1:AbCdEf0123456789AbCdEf0123456789AbCdEf0123456789
```

Resolver (Sanctum, branch scope):
```http
POST /api/branches/12/vehicles/resolve-qr
Content-Type: application/json
```
```json
{"code":"MTELMX:VEHICLE:V1:AbCdEf0123456789AbCdEf0123456789AbCdEf0123456789"}
```
200:
```json
{"data":{"vehicle_id":81,"is_active":true}}
```
Token inválido, revocado o fuera de scope: 404. `code` faltante/inválido por tipo/longitud: 422. QR poseído no sustituye autenticación.

Rotar (Store-only, POST body vacío):
```http
POST /api/branches/12/vehicles/81/rotate-qr
```
```json
{"data":{"vehicle_id":81,"regenerated":true}}
```
Respuesta no incluye token nuevo; volver a pedir SVG. Un segundo POST vuelve a rotar (no idempotente).

## Etiqueta PDF

```http
GET /api/branches/12/vehicles/81/label.pdf?width_mm=60&height_mm=40
```
Respuesta binaria `application/pdf`, descarga `etiqueta-vehiculo-81.pdf`, dimensiones 60 × 40 mm. Parámetros omitidos default 50 × 35 mm; permitido width 35–100 y height 25–80 enteros. Fuera de rango: 422.

## Origen de evidencia

- Pruebas: `tests/Feature/VehicleRecordsTest.php` verifica altas, duplicados normalizados, tenant, POS, cliente, snapshots y visitas.
- Pruebas: `tests/Feature/ServiceDocumentsTest.php` verifica QR SVG, token anterior invalida, token ausente en JSON, aislamiento POS/tienda y descarga PDF.
- Los ejemplos de error derivan de reglas/custom messages en código. Las pruebas existentes suelen afirmar status y claves de validación, no el texto completo del error.

