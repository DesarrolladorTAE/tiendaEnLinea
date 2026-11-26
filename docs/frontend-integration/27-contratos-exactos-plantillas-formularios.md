# 27. Contratos exactos: plantillas y asociación con servicios

Paths relativos a `/api`. Evidencia: `routes/api.php`, `ServiceFormTemplateController`, `ServiceFormConfigController`, `FormFeature`, `FormSchema`, `ServiceFormTemplate` y `tests/Feature/ServiceFormsTest.php`.

## Autorización común

Todas las rutas administrativas/operativas de formularios usan `auth:sanctum` y `FormFeature::context`. Acepta identidad `Store` o `PosLocation`; ambos requieren tienda activa, acceso vigente, módulo `service_forms` habilitado y plan compatible con `ventas-de-servicios`. POS requiere branch propia activa y no tener override de `service_forms=false`. Los métodos de escritura de plantillas y asociaciones llaman `context(..., true)`, por lo que solo Store puede ejecutarlos. No hay permiso RBAC de formularios independiente. Otra identidad o módulo apagado: 403; plantilla/orden de otra tienda se oculta con 404.

La respuesta privada de capacidades por sucursal representa `service_forms` con `available`, `enabled`, `visible`, `source`, `scope` y `authorization.read/capture/configure`; los valores no sustituyen el gate de `FormFeature`. Detalle de fuente y alcance en [documento 19](19-capacidades-privadas-permisos-rutas.md).

## Rutas de plantillas

| Método | Ruta | Acción | Actor |
|---|---|---|---|
| GET | `/service-form-templates` | listado | Store/POS; POS ve solo activas |
| POST | `/service-form-templates` | crear | Store |
| POST | `/service-form-templates/install/vehicle-inspection-25` | instalar plantilla estándar idempotente | Store |
| GET | `/service-form-templates/{templateId}` | detalle | Store/POS; POS solo activa |
| PUT, PATCH | `/service-form-templates/{templateId}` | editar metadatos/schema y versionar schema | Store |
| PATCH | `/service-form-templates/{templateId}/status` | activar/desactivar | Store |
| POST | `/service-form-templates/{templateId}/duplicate` | copiar a nueva plantilla | Store |

No existe publicación separada ni eliminación. `is_active` regula nuevas capturas, no borra ni oculta historial Store. Para POS, una plantilla inactiva responde 404 en detalle.

### Lista y detalle

`GET /service-form-templates?search=inspeccion&is_active=true&per_page=20&page=1`. `search` opcional string max191 (coincidencia parcial en `name` o `key`), `is_active` boolean, `per_page` entero 1–100 default20 y `page` paginación Laravel. Orden `name` ascendente. Respuesta paginator Laravel directamente, no `{data:...}` envolvente. Cada elemento es modelo de plantilla (`id, store_id, name, description, key, version, schema, is_active, created_at, updated_at` y auditoría de actor si columnas presentes). No hay otra búsqueda, filtro de versión ni orden configurable.

`GET /service-form-templates/{id}` devuelve `{"data": <plantilla>}`. ID fuera de tienda o inactiva para POS: 404.

### Crear

`POST /service-form-templates` JSON: `name` requerido string max191; `description` opcional nullable string max5000; `key` requerido string max100, regex `^[a-z][a-z0-9-]*$`, único dentro de la tienda; `schema` requerido objeto/array validado por `FormSchema`. `store_id` y `version` prohibidos. Almacena versión 1, activa por valor predeterminado del esquema de BD, y asigna auditoría de creador/editor. 201 `{"data": <plantilla>}`. Errores de validación: 422 Laravel `{message,errors}`.

### Edición/versionado

`PUT` o `PATCH /service-form-templates/{id}` admite `name` opcional pero si presente requerido string max191; `description` `sometimes|nullable|string|max:5000`; `schema` `sometimes|required|array`. `key`, `store_id`, `version` prohibidos; cambios de key no existen. Campos omitidos permanecen. Actualización transaccional bloquea fila. La versión sube **solo** cuando `schema` está presente y su valor difiere del schema actual. Cambiar nombre/descripción no incrementa. No hay historial de versiones como filas independientes: el template conserva schema vigente; snapshots de orden/submission preservan versiones anteriores. Éxito 200 `{"data": <plantilla>}`.

### Estado y duplicación

`PATCH /service-form-templates/{id}/status` JSON `{"is_active": boolean}` requerido. 200 `{data: plantilla actualizada}`. No altera capturas históricas. No se puede iniciar captura nueva con plantilla inactiva.

`POST /service-form-templates/{id}/duplicate` JSON `{name: requerido string max191, key: requerido string max100 y patrón/único por tienda}`. Copia `description` y `schema`, crea nueva key/ID, versión 1, activa. Respuesta 201 `{data: copia}`. No copia submissions ni asociaciones.

### Instalación de inspección predeterminada

`POST /service-form-templates/install/vehicle-inspection-25`, sin body. Store. Crea key `vehicle-inspection-25`, nombre `Revisión vehicular de 25 puntos`, schema provisional y versión 1. Si ya existe la key en la tienda, devuelve esa plantilla sin sobreescribirla (200); primer alta 201. Transacción bloquea Store para evitar dobles instalaciones.

## Asociación de plantillas a servicio

`GET /branches/{branchId}/services/{serviceId}/forms` Store/POS lectura; valida servicio en branch autorizada. Respuesta `{"data":{"service_id":45,"forms":[{"template_id":7,"required":true,"sort_order":1}],"templates":[...]}}`. `forms` viene de `service.config.forms`; `templates` son solo las plantillas enlazadas y pueden incluir inactivas ya asociadas. La asociación usa `template_id`, no `version_id`.

`PUT` misma ruta: Store únicamente. Reemplaza solo propiedad `forms` dentro de `service.config`; preserva `vehicle_requirement` y otras claves. Body requiere `forms` presente, array max20; `[]` elimina las asociaciones sin eliminar plantillas, submissions ni snapshots. Cada objeto solo admite `template_id` requerido integer≥1 distinto, `required` boolean requerido, `sort_order` integer 1–1000 requerido. Cada template debe ser activa y de la misma tienda. Orden normalizado por sort_order y luego template_id. No se fija versión en asociación: al iniciar una captura se toma la versión/schema vigentes.

401 sin Sanctum; 403 módulo/plan, identidad no admitida o POS intentando escritura; 404 branch/servicio fuera de scope; 422 campos o plantilla inválidos. No existe endpoint delete separado.

## Evidencia

Feature: `ServiceFormsTest::test_template_schema_validation_and_versioning`, `test_multiple_assignments_preserve_config_and_reject_foreign_or_inactive_templates`, `test_explicit_empty_form_associations_preserve_templates_history_and_other_config`, `test_draft_keeps_initial_version_and_deactivated_template_blocks_new_starts`. Los ejemplos JSON de este documento reflejan directamente la transformación del controlador; valores de IDs son ilustrativos.
