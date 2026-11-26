# 15. Contratos exactos: configuración de servicios

Los paths son relativos a `/api`. Contrato contrastado con `routes/api.php`, `ServiceController`, `Service`, `TourScope` y `VehicleFeature`. Ejemplos marcados como fixtures son ilustrativos, no resultados de una petición ejecutada.

## Rutas y actores

| Método | Ruta | Middleware efectivo | Lectura/escritura |
|---|---|---|---|
| GET | `/branches/{branchId}/services` | `auth:sanctum` | Store de la tienda; POS de su sucursal |
| POST | `/branches/{branchId}/services` | `auth:sanctum` | Solo Store |
| GET | `/branches/{branchId}/services/{serviceId}` | `auth:sanctum` | Store o POS de su sucursal |
| PUT, POST | `/branches/{branchId}/services/{serviceId}` | `auth:sanctum` | Solo Store; POST invoca la actualización |

El scope resuelve sucursal activa y pertenencia a la tienda del actor. Una sucursal/servicio fuera del alcance se responde como no encontrado (404); un POS que intenta configurar recibe 403. No se recibe `store_id` para elegir tenant. Este controlador no aplica un permiso RBAC nominal ni `ServiceOperationScope`; no inferir una autorización adicional por nombre de rol. Para `vehicle_requirement` distinto de `none`, sí comprueba `VehicleFeature::recordsEnabled`.

## Listado

`GET /branches/{branchId}/services?search=...&service_type=...&is_active=...&page=...`

Filtros opcionales: `search` busca en nombre, código, descripción corta y descripción; `service_type` se compara literalmente (sin enum); `is_active` se convierte a booleano. Orden `id` descendente. Solo servicios activos salvo que `is_active` filtre otro estado. Paginación Laravel, 16 por página. Respuesta:

```json
{
  "success": true,
  "branch": {"id": 12, "name": "Ometepec"},
  "services": {
    "current_page": 1, "data": [{"id": 45, "name": "Afinación", "service_type": "workshop", "config": null}],
    "first_page_url": "…", "from": 1, "last_page": 1, "per_page": 16, "to": 1, "total": 1
  }
}
```

El elemento de ejemplo está reducido: cada servicio es el modelo Eloquent con imágenes y relaciones cargadas por el controlador. No fijar un DTO reducido como respuesta real.

## Detalle

`GET /branches/{branchId}/services/{serviceId}` devuelve:

```json
{
  "success": true,
  "branch": {"id": 12, "name": "Ometepec"},
  "service": {"id": 45, "name": "Afinación", "service_type": "workshop", "base_price": "850.00", "config": {"vehicle_requirement": "optional", "forms": [{"template_id": 7, "required": true, "sort_order": 1}]}},
  "branch_config": {"id": 9, "service_id": 45, "branch_id": 12, "price_override": null, "capacity_override": null, "is_active": true, "created_at": "2026-11-26T12:00:00.000000Z", "updated_at": "2026-11-26T12:00:00.000000Z"}
}
```

`branch_config` es el registro de `service_branches` para esta sucursal o `null`; los campos de precio/capacidad pueden ser nulos. `service` es el modelo serializado, no una transformación Resource estable. En particular `vehicle_requirement` está dentro de `service.config`, no como propiedad JSON de primer nivel.

## Crear y actualizar

Se aceptan JSON y multipart. Para multipart con archivos, usar `POST` con `_method=PUT` para actualizar. El POST directo a la ruta con `{serviceId}` también actualiza. Content type multipart lo gestiona el navegador.

| Campo | Crear | Actualizar | Regla / predeterminado |
|---|---|---|---|
| `name` | requerido | sometimes|required | string, máx. 191 |
| `code` | opcional | opcional | nullable string, máx. 191 |
| `short_description`, `description` | opcionales | opcionales | nullable string, sin max declarado |
| `service_type` | requerido | sometimes|required | string, máx. 40; no hay enum |
| `vehicle_requirement` | opcional | opcional | `none`, `optional`, `required`; `sometimes|required|in:...` |
| `base_price` | requerido | sometimes|required | numérico, mínimo 0 |
| `duration_minutes` | opcional | opcional | nullable integer, mínimo 1 |
| `requires_booking`, `requires_resource`, `requires_address`, `is_home_service`, `requires_confirmation`, `requires_deposit` | opcionales | opcionales | nullable boolean; al crear falso |
| `deposit_type` | opcional | opcional | nullable string, máx. 20 |
| `deposit_value` | opcional | opcional | nullable numérico, mínimo 0 |
| `billing_mode` | opcional | opcional | nullable string, máx. 30; al crear `full` |
| `default_capacity` | opcional | opcional | nullable integer, mínimo 1 |
| `sat_product_code` | opcional | opcional | nullable string, máx. 20 |
| `sat_unit_code` | opcional | opcional | nullable string, máx. 20 |
| `tax_object` | opcional | opcional | nullable string, máx. 10 |
| `iva_percentage` | opcional | opcional | nullable numeric, 0–100 |
| `price_override` | opcional | opcional | nullable numeric, mínimo 0; configuración de sucursal |
| `capacity_override` | opcional | opcional | nullable integer, mínimo 1; configuración de sucursal |
| `images[]` | opcional | opcional | array máximo 10; archivo máximo 20,480 KB por imagen |
| `primary_image_index` | opcional | — | integer ≥0; índice fuera de rango se normaliza a 0 |
| `delete_image_ids[]` | — | opcional | IDs enteros de imágenes del servicio |
| `primary_image_id` | — | opcional | ID de imagen para principal |
| `is_active` | — | opcional | nullable boolean |

Las imágenes aceptan JPEG, PNG, WebP, GIF, AVIF, HEIF/HEIC, SVG, BMP y TIFF (extensiones MIME declaradas en las reglas). Crear establece `is_active=true`, `duration_minutes=null`, `default_capacity=null`, `config=null` si no se especifica `vehicle_requirement`; branch config inicia con overrides nulos y activa. Código/descripciones ausentes quedan nulos. No hay enum de `service_type`; `tour` recibe un tratamiento especial: no admite `vehicle_requirement` diferente de `none`.

Respuesta de creación HTTP 201: `{"success":true,"message":"Servicio creado correctamente.","service":{...}}`. El ID está en `response.service.id`. Actualización devuelve HTTP 200 con `success`, `message` y `service` actualizado.

### Ejemplo JSON de creación

```json
{
  "name": "Inspección preventiva", "code": "INS-01", "service_type": "workshop",
  "base_price": 350, "duration_minutes": 45, "requires_booking": true,
  "vehicle_requirement": "optional", "billing_mode": "full",
  "default_capacity": 1, "iva_percentage": 16
}
```

### Ejemplo multipart de creación

```text
name=Inspección preventiva
service_type=workshop
base_price=350
vehicle_requirement=optional
images[0]=<archivo JPEG>
primary_image_index=0
```

### Ejemplo multipart de actualización

```text
POST /api/branches/12/services/45
_method=PUT
name=Inspección preventiva avanzada
vehicle_requirement=none
images[0]=<archivo PNG>
```

### Ejemplo de respuesta

```json
{"success":true,"message":"Servicio creado correctamente.","service":{"id":45,"name":"Inspección preventiva","service_type":"workshop","base_price":"350.00","config":{"vehicle_requirement":"optional"},"images":[],"branches":[]}}
```

Las relaciones exactas incluidas dependen de las relaciones cargadas; lo garantizado para el ID es `service.id`.

## `vehicle_requirement` y preservación de `config`

En petición va en el nivel superior (`vehicle_requirement`); almacenamiento/respuesta va en `service.config.vehicle_requirement`. Valores admitidos: `none`, `optional`, `required`. Crear sin campo conserva `config=null`; el accessor del modelo interpreta ausencia como `none`, pero el campo JSON bruto puede permanecer null. Actualizar omitiéndolo no cambia config. Enviar `none` lo persiste y no exige expedientes. `optional|required` exige `VehicleFeature::recordsEnabled(store_id)` y responde 403 si no; un tour con cualquiera de esos valores responde 422. Al cambiarlo el controlador fusiona la propiedad en config existente, preservando `forms` y otras claves. No enviar un reemplazo completo de `config` (no se acepta ese campo).

## `booking_type`

No es un campo de creación/edición de servicio. La operación de booking-config descrita en el documento 16 fija `booking_type=appointment`. Hay registros históricos de tipo tour, pero este endpoint no expone un enum ni permite elegirlo. `service_type` es texto libre y no equivale a `booking_type`.

## Errores relevantes

401 sin autenticación; 403 actor sin escritura o expedientes deshabilitados para requisitos vehiculares; 404 sucursal/servicio fuera de alcance; 422 reglas de validación o tour que exige vehículo. La API no redefine validación por un módulo deshabilitado cuando el requisito omitido/`none` no necesita expedientes.

## Evidencia del contrato

- Rutas: `routes/api.php`, grupo branch services.
- Reglas/transformación: `app/Http/Controllers/Api/ServiceController.php`, `index`, `show`, `store`, `update`; imágenes mediante relación `images`.
- Scope y feature: `app/Services/Tours/TourScope.php` y `app/Services/Vehicles/VehicleFeature.php`.
- Modelo/relaciones: `app/Models/Service.php`.
- Prueba relacionada con servicio/tours: `tests/Feature/Tours/TourApiTest.php`; el paquete no afirma que se ejecutara durante esta tarea documental.

