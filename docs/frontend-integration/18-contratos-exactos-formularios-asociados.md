# 18. Contratos exactos: formularios asociados a servicios

Fuentes: `routes/api.php`, `ServiceFormTemplateController`, controlador de asociaciones de formularios, `FormFeature`, `TourScope`, modelos de plantilla/versionado y `tests/Feature/ServiceFormsTest.php`. Paths relativos a `/api`.

## Lista de plantillas

`GET /service-form-templates` — `auth:sanctum`; Store y POS de tienda/sucursal permitidos si `service_forms` está activo y plan incluye `ventas-de-servicios`. Query:

| Parámetro | Tipo | Regla / default |
|---|---|---|
| `search` | string | opcional, max191; busca name/key |
| `is_active` | boolean | opcional |
| `per_page` | integer | 1–100; default 20 |
| `page` | integer | paginación Laravel |

POS se restringe a plantillas activas aunque solicite `is_active=false`. Store sin `is_active` recibe activas e inactivas. Orden alfabético por nombre. La respuesta es un paginator Laravel directamente (sin envoltura `data`), con `data: [...]`, `current_page`, `per_page`, `total`, URLs y enlaces. Las plantillas contienen `id`, `store_id`, `name`, `key`, `is_active`, `version` y atributos del modelo; no hay un filtro `published` separado. La versión vigente se refleja en `version`.

## Leer asociaciones

`GET /branches/{branchId}/services/{serviceId}/forms`, Sanctum. FormFeature requiere módulo y plan; Store o POS de su sucursal para lectura. Respuesta:

```json
{"data":{"service_id":45,"forms":[{"template_id":7,"required":true,"sort_order":1}],"templates":[{"id":7,"name":"Inspección 25 puntos","key":"inspection-25","is_active":true,"version":3}]}}
```

`forms` proviene de `service.config.forms` o `[]`. `templates` contiene las plantillas de esos IDs, incluidas inactivas si ya estaban asociadas; no es el catálogo completo. Identificador de asociación es `template_id`; no `version_id`. No se devuelve una versión fijada en asociación. Para una nueva captura se utiliza el esquema/versión vigente; las submissions y órdenes conservan snapshots históricos conforme su mecanismo.

## Guardar/reemplazar asociaciones

`PUT` misma ruta, solo Store autenticado, módulo activo. Body:

```json
{"forms":[{"template_id":7,"required":true,"sort_order":1},{"template_id":11,"required":false,"sort_order":2}]}
```

Reglas: `forms` debe estar presente y ser array máximo 20 (`present|array|max:20`); así `forms: []` es válido, pero omitir el campo da 422. Cada elemento conserva: `template_id` requerido integer ≥1 y distinto; `required` requerido boolean; `sort_order` requerido integer 1–1000. Las claves adicionales de cada elemento son rechazadas. Cada plantilla debe existir en la misma tienda y estar activa; de lo contrario 422. El backend normaliza tipos y ordena por `sort_order`, luego `template_id`.

El endpoint reemplaza la propiedad `forms`, pero fusiona con `service.config` existente para conservar `vehicle_requirement` y otras claves. No reemplaza todo config. Omitir `forms` da 422. `forms: []` está permitido y elimina todas las asociaciones del servicio sin borrar plantillas, inspecciones/submissions históricas ni versiones. Una colección con elementos conserva las reglas y ordenamiento existentes. La escritura se limita al servicio de la tienda/sucursal validada.

Respuesta:

```json
{"data":{"service_id":45,"forms":[{"template_id":7,"required":true,"sort_order":1},{"template_id":11,"required":false,"sort_order":2}]}}
```

## Errores, historial y pruebas

401 sin Sanctum; 403 módulo/plan deshabilitado o POS intenta escribir; 404 sucursal/servicio fuera de scope; 422 campo omitido, elementos inválidos, template inactiva/ajena o extras no permitidos. `forms: []` es válido; la lectura de una plantilla inactiva ya asociada no la desasocia ni modifica snapshots. Cambios de schema crean versiones según operaciones de plantillas; los formularios enviados y requisitos copiados a orden conservan su snapshot según tests.

Pruebas: `tests/Feature/ServiceFormsTest.php`, escenarios de asociaciones múltiples y `test_explicit_empty_form_associations_preserve_templates_history_and_other_config`; comprueban arreglo omitido rechazado, arreglo vacío aceptado, configuración preservada, plantilla/submission histórica conservada y aislamiento.

## Evidencia del contrato

- Rutas: `routes/api.php`, service form templates y service forms.
- Lista: `app/Http/Controllers/Api/ServiceFormTemplateController.php`; consulta/escritura de configuración asociada: `app/Http/Controllers/Api/ServiceFormConfigController.php`.
- Feature y autorización: `app/Services/Forms/FormFeature.php`.
- Versionado/snapshots: modelos de plantillas y submissions, y `tests/Feature/ServiceFormsTest.php`.

