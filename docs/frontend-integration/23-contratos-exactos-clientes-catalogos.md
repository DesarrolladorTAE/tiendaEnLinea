# 23. Contratos exactos: clientes y catálogos para expedientes

Paths relativos a `/api`. Fuentes: `routes/api.php`, `ClienteController`, `VehicleCatalogController`, `VehicleCompatibilityService`, `VehicleFeature`, modelos `Cliente`, `VehicleBrand`, `VehicleModel` y pruebas `VehicleRecordsTest`/`VehicleCatalogTest`.

## Selección de clientes con sesión administrativa

| Método | Ruta | Middleware / identidad | Alcance |
|---|---|---|---|
| GET | `/clientes` | `auth:sanctum`; controller admite Store y PosLocation | todos los clientes de la tienda autenticada |
| GET | `/clientes/simple` | `auth:sanctum`; Store/PosLocation | todos los clientes de la tienda autenticada, DTO reducido |
| POST | `/clientesnew` | `auth:sanctum`; Store/PosLocation | crea en tienda derivada del actor |
| POST | `/clientes/quick-store` | `auth:sanctum`; Store/PosLocation | crea datos mínimos en la tienda derivada del actor |
| GET | `/clients/{customerId}/vehicles` | `auth:sanctum`; controller requiere módulo `vehicle_records` | cliente y vehículos del mismo tenant |

Los endpoints `/clientes` no requieren una credencial POS especial: `auth:sanctum` y `resolveStoreId` aceptan explícitamente Store/PosLocation. Un POS no puede escoger otra tienda ni otro `pos_location_id`. Al consultar `pos_location_id` de otra tienda, Store recibe 404 y POS recibe 403. Sin query POS usa su store autenticado.

**No hay búsqueda ni paginación** en `GET /clientes` o `/clientes/simple`: ambos devuelven toda la tienda. `/clientes` ordena por id descendente y serializa el modelo `Cliente` (password oculto); puede incluir datos fiscales. `/clientes/simple` ordena por nombre y devuelve:

```json
{"data":[{"id":12,"nombre_alias":"Cliente de prueba","telefono":"5550000100","credit_account":null}]}
```

Esta respuesta es reducida, pero puede incluir `credit_account` con id/estado/saldo/límite. Para selector vehicular, la API no tiene endpoint de búsqueda server-side dedicado. Propuesta pendiente, no implementada: extender `GET /clientes` con `search`, `per_page` y `page`, validación tenant y salida reducida para evitar descargar todo el directorio en tiendas con muchos clientes.

### Crear cliente completo

`POST /clientesnew` cuerpo aceptado:

| Campo | Regla |
|---|---|
| `nombre_alias` | requerido string max150 |
| `rfc` | nullable string max13; si hay texto se trim y uppercase |
| `razon_social` | nullable string max255 |
| `codigo_postal_fiscal` | nullable string max10 |
| `regimen_codigo` | nullable string max10 |
| `email` | nullable email |
| `telefono` | nullable string max20 |

Respuesta HTTP 201 `{"ok":true,"message":"Cliente creado correctamente.","cliente":<Cliente>}`. Un límite del plan puede producir 422 JSON con `ok:false`, `message`, `plan`, `limit` y `current_clients`. Plan sin resolver produce 422. No enviar `store_id` para asignación; se calcula de la identidad.

### Crear cliente rápido

`POST /clientes/quick-store`: `nombre_alias` requerido string max150 y `telefono` requerido string max20. Se trim nombre/teléfono. Respuesta 201 agrega `plan:{name,limit,current_clients_before_create,remaining_before_create}` al objeto `ok/message/cliente`.

## Vehículos de un cliente

`GET /clients/{customerId}/vehicles?per_page=20&page=1`: `per_page` opcional integer 1–100 default 20; `page` paginador Laravel. Cliente ajeno/inexistente produce 404. Orden id descendente. Cada vehículo carga brand y model. La consulta tenant es store-wide; no restringe a branch POS. Respuesta directa paginator:

```json
{"current_page":1,"data":[{"id":81,"customer_id":12,"vehicle_brand_id":4,"vehicle_model_id":9,"year":2022,"plates":"ABC-123","vin":"1HGCM82633A004352","latest_mileage":48210,"is_active":true,"brand":{"id":4,"name":"Nissan"},"model":{"id":9,"vehicle_brand_id":4,"name":"Versa"}}],"per_page":20,"total":1,"last_page":1,"from":1,"to":1}
```

Campos serializados adicionales dependen de columnas del modelo; `public_token` está oculto.

## Catálogos de marca/modelo existentes

El único par GET existente para nombres es el **catálogo de compatibilidad de productos**:

| Método/ruta | Middleware y permiso | Parámetros / salida |
|---|---|---|
| GET `/vehicle-brands` | `api.auth:sanctum`, `store.access`; Store/POS, `vehicle_catalog` disponible; POS también debe tener módulos vehicle_catalog y sales sin override false | opcional `branch_id` Store; POS usa su branch. Devuelve `{data:[{id,name}]}` |
| GET `/vehicle-models?brand_id=ID` | mismo | `brand_id` y filtros auxiliares validados; devuelve `{data:[{id,vehicle_brand_id,name}]}` |

No hay paginación, búsqueda textual ni filtro `is_active`; `VehicleBrand` y `VehicleModel` no declaran estado activo. Orden alfabético. Marcas/modelos devueltos son los relacionados con compatibilidades de productos existentes en tenant/branch. Modelo se valida bajo una marca que pertenece a la tienda; IDs ajenos/no encontrados producen 404; marca/modelo inconsistentes no dan una lista útil. Los cuerpos no crean marcas/modelos.

La distinción entre módulos es importante: el registro vehicular valida usando `vehicle_records`, pero estos endpoints están controlados por `VehicleFeature::available` (`vehicle_catalog`). Así, con `vehicle_records` habilitado y `vehicle_catalog` deshabilitado, **no se pueden usar estas rutas** (403) para poblar selector de expedientes. Las tablas son compartidas, pero no hay endpoints de lectura independientes para enumerar todas las marcas/modelos del expediente ni otro CRUD de catálogos.

Carencia para fase 3 React: una tienda puede tener permiso de crear expedientes, pero carecer de endpoint de catálogo de relaciones independiente de compatibilidades. Propuesta mínima para autorización (no implementada): `GET /vehicles/catalog/brands` y `GET /vehicles/catalog/brands/{brandId}/models`, protegidas por `vehicle_records`, Store/POS tenant-aware; respuestas `data:[{id,name}]` y `{data:[{id,vehicle_brand_id,name}]}`. No reutilizar APIs públicas ni habilitar `vehicle_catalog` indirectamente.

### Evidencia

- Clientes: `routes/api.php` grupo auth:sanctum de clientes; `ClienteController::index`, `simple`, `store`, `quickStore`, `resolveStoreId`.
- Catálogos compatibilidad: `routes/api.php` grupo `api.auth:sanctum` + `store.access`; `VehicleCatalogController::brands/models`; `VehicleCompatibilityService::context` exige `VehicleFeature::available`.
- Pruebas: `VehicleRecordsTest::test_pos_scope_and_client_controller_reject_foreign_pos`; `VehicleCatalogTest` prueba responses `/vehicle-brands` y `/vehicle-models`, pero son listas ligadas a compatibilidades.

