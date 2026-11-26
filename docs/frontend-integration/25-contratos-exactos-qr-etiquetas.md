# 25. Contratos exactos: QR vehicular y etiquetas

Fuentes: `routes/api.php`, `RequireServiceDocumentAuth`, `ServiceDocumentController`, `ServiceOperationScope`, `VehicleFeature`, `Vehicle::$hidden`, `tests/Feature/ServiceDocumentsTest.php`. Paths relativos a `/api`.

## Autorización común

```text
GET  /branches/{branchId}/vehicles/{vehicleId}/qr.svg
GET  /branches/{branchId}/vehicles/{vehicleId}/label.pdf
POST /branches/{branchId}/vehicles/{vehicleId}/rotate-qr
POST /branches/{branchId}/vehicles/resolve-qr
```

Middleware de grupo `RequireServiceDocumentAuth`: requiere credencial Sanctum y responde 401 JSON `{"message":"Unauthenticated."}` con `Cache-Control: private, no-store`. Después `ServiceOperationScope::branch` valida branch activa y pertenencia al Store o a la única branch del POS, así como `service_sales`/plan según configuración. Controller valida `vehicle_records` mediante `VehicleFeature::recordsEnabled`. Esto es **un gate adicional** a `vehicle_records.authorization` de `GET /admin/branches/{branchId}/catalog-settings`; QR/etiqueta pueden ser denegados si no se permite operar servicios.

Para actor POS, la feature rechaza override local `vehicle_records=false` y exige que el vehículo tenga al menos una orden en esa branch; si no, 404. Para Store, vehículo debe pertenecer a la misma tienda; controller no exige orden asociada a esa branch. `is_active=false` no impide generar/resolver QR ni etiqueta: resolve devuelve el estado booleano.

No hay permiso RBAC individual llamado “QR” o “label”. Autorización real la forman Sanctum, Store/PosLocation, módulos/features y scope del controller. Rotar es Store-only. Las respuestas/documentos usan `private, no-store`; no son URLs públicas.

## Generar / leer código QR (SVG)

`GET /branches/{branchId}/vehicles/{vehicleId}/qr.svg`. Sin query/body. Respuesta 200, cuerpo `image/svg+xml`, `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`. QR genera payload:

```text
MTELMX:VEHICLE:V1:<48 caracteres alfanuméricos del public_token>
```

El QR **no contiene una URL**. No incluye nombre, placas, VIN, teléfono ni historial. El `public_token` aleatorio permanece oculto en serialización del modelo. Fixtures no deben guardar el token real; ejemplo ficticio:

```text
MTELMX:VEHICLE:V1:AbCdEf0123456789AbCdEf0123456789AbCdEf0123456789
```

La ruta produce un SVG con QR tamaño 320/margen 2. No es una autorización: poseer/decodificar el código no da acceso privado.

## Regenerar/rotar token

`POST /branches/{branchId}/vehicles/{vehicleId}/rotate-qr`. Solo sesión Store (POS recibe 403); no tiene cuerpo requerido. Throttle `10/min`. Transacción bloquea la fila, asigna nuevo `Str::random(48)` y guarda. Respuesta 200:

```json
{"data":{"vehicle_id":81,"regenerated":true}}
```

La respuesta **no entrega el token nuevo**; obtener el SVG mediante GET. El token anterior deja de resolver una vez guardado el nuevo. No hay idempotency key: cada POST exitoso vuelve a rotarlo, por lo que reintentar una petición después de un timeout puede invalidar el token recién generado. Test comprueba que token anterior queda 404. La tabla tiene unicidad global para `public_token`; no exponerlo en JSON.

## Resolver código escaneado

`POST /branches/{branchId}/vehicles/resolve-qr`, JSON:

```json
{"code":"MTELMX:VEHICLE:V1:AbCdEf0123456789AbCdEf0123456789AbCdEf0123456789"}
```

Regla: `code` requerido string max80; debe iniciar exacto `MTELMX:VEHICLE:V1:` y el resto debe coincidir con 48 alfanuméricos. Token incorrecto, revocado, no encontrado, tenant ajeno o vehículo fuera del scope resuelve 404. Falta/exceso/formato del campo falla 422. Throttle `30/min` (key prefix `vehicle-qr-resolve:`). Autenticación Sanctum requerida; no hay resolución pública.

Éxito 200, `Cache-Control: private, no-store`:

```json
{"data":{"vehicle_id":81,"is_active":true}}
```

No devuelve datos personales, VIN ni datos del expediente. Para navegación, React debe enviar el contenido QR como `code` a la resolución autenticada dentro de una branch autorizada y, con `vehicle_id`, abrir `GET /vehicles/{vehicleId}` bajo sesión y gate de expediente. El identificador escaneado por sí solo no habilita la ficha. Si el vehículo está inactivo, resolución sigue siendo 200 con `is_active:false`; la UI debe mostrar estado y no asumir que puede crear cita/orden.

## Etiqueta vehicular PDF

`GET /branches/{branchId}/vehicles/{vehicleId}/label.pdf?width_mm=50&height_mm=35`. Query opcional:

| Campo | Regla | Default |
|---|---|---|
| `width_mm` | integer entre 35 y 100 | 50 mm |
| `height_mm` | integer entre 25 y 80 | 35 mm |

No hay tamaños nombrados, unidades distintas ni orientación seleccionable. PDF usa tamaño personalizado por esos mm, orientación portrait. Descarga `etiqueta-vehiculo-{vehicleId}.pdf`, content type PDF, `private, no-store`, `nosniff`. Parámetro fuera de rango/no entero produce 422. La etiqueta contiene identificación visual limitada (id/modelo/marca según plantilla) y QR SVG embebido; no imprime placas, VIN, cliente ni teléfono. Prueba existente descarga 60 x 40 mm y comprueba magic `%PDF-`.

Generar el PDF no comprueba impresora ni ejecuta impresión física. La salida real a etiquetadora requiere validar modelo, protocolo, resolución y medio del dispositivo.

## Errores y señales de capacidades

| Caso | HTTP |
|---|---|
| Sin Sanctum | 401 |
| Módulo/permisos/operación bloqueada | 403 |
| Branch o vehículo ajeno/no existente; POS sin orden en branch | 404 |
| Parámetros `width_mm`/`height_mm` o cuerpo `code` inválidos | 422 |
| Límite de rotación/resolución | 429 |

`GET /admin/branches/{branchId}/catalog-settings` publica `data.capabilities.vehicle_records` con `available`, `enabled`, `visible`, `source`, `scope` y `authorization.read`, `.write`, `.manage_status`. No tiene flags separados para history, QR SVG, resolver, rotate o label. Para cada acción respeta el endpoint real: read/write genéricos no conceden por sí mismos acceso a QR, el cual añade `service_sales`/branch; rotate solo Store; documentos exigen Sanctum. No inventar capacidades individuales.

## Evidencia automatizada

`tests/Feature/ServiceDocumentsTest.php::test_inspection_pdf_label_and_qr_rotation_are_private_and_scoped` verifica SVG, PDF etiqueta, resolución, rotación, invalidación de token, token ausente en respuesta, POS sin permiso de rotación y aislamiento de otra branch/tienda. `RequireServiceDocumentAuth` prueba ausencia de credencial en el mismo archivo de suite.

