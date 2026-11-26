# 28. Esquema dinámico y conservación de versiones

Fuentes: `app/Services/Forms/FormSchema.php`, `FormAnswers.php`, `VehicleInspectionTemplate.php`, modelos `ServiceFormTemplate`/`ServiceFormSubmission`, controladores de formularios y Feature `ServiceFormsTest`.

## Estructura del schema

El objeto raíz acepta únicamente `kind?`, `title`, `description?`, `sections`, `metadata?`. `title` string no vacío max191; `kind` nullable string max50; `description` nullable max2000. `sections` es lista requerida de 1–20 elementos. `metadata` objeto solo admite `disclaimers`, lista opcional de hasta 10 textos no vacíos max500. Schema JSON serializado máximo 65,536 bytes.

Sección: `{id,title,description?,sort_order,fields}`. `id` patrón `^[a-z][a-z0-9_]{0,63}$`, único global en plantilla; `title` requerido max191; `description` opcional max1000; `sort_order` requerido entero 1–1000; `fields` lista 1–100. Total máximo 200 campos por plantilla.

Campo: `{id,label,type,required,sort_order,help?,options?,default?,rules?,number?}`. `id` mismo patrón y único global; `label` max300 requerido; `type` debe ser uno de los diez tipos abajo; `required` boolean requerido; `sort_order` int1–1000; `help` nullable max1000; `number` opcional int1–1000. Propiedades desconocidas se rechazan.

## Tipos implementados y validación

| Tipo | Respuesta | Límite/validación |
|---|---|---|
| `short_text` | string | máx 500, `min_length`/`max_length` opcionales 0–10000, efectivo nunca supera 500 |
| `long_text` | string | máx 10000; reglas de longitud opcionales |
| `integer` | entero JSON | `min`/`max` numéricos opcionales |
| `decimal` | número JSON int/float | `min`/`max` opcionales |
| `date` | string `YYYY-MM-DD` | fecha real exacta |
| `time` | string `HH:MM` | hora válida 24h |
| `single_select` | string value | opciones requeridas |
| `multi_select` | lista de strings | opciones requeridas, sin duplicados, max_items 1–30/default30 |
| `checkbox` | boolean | true/false |
| `boolean` | boolean | true/false |
| `inspection` | objeto | `status` en opciones, campos de explicación/observación/recomendación opcionales |

Para tipos select/inspection `options` es lista requerida 1–30 de `{value,label}`; value sigue patrón de ID y es único; label max100. Otros tipos rechazan options si no es null. `rules` solo admite `min,max,min_length,max_length,max_items,require_explanation_when`; límites deben corresponder al tipo y `min≤max`. `default` se valida como respuesta para el campo; inspección prohíbe default para exigir selección explícita.

Campos condicionales/visibilidad condicional **no existen**. `number` solo es metadato validado; `kind=inspection25` impone exactamente 25 campos `inspection`, números únicos 1–25, y opciones exactas `bien, atender, urgente, nr`; `nr` debe exigir explicación.

## Respuestas

`answers` es objeto por ID de campo, no lista; vacío `{}` permitido. Máximo 200 propiedades y 131,072 bytes JSON. Desconocidos producen `answers.<id>` 422. Null se acepta por validador, incluso en campo required mientras se guarda draft; final requiere que cada campo required no sea null, `''` o `[]`. Claves faltantes son válidas para borrador, no para completar si requeridas. Campos opcionales también se validan si presentes.

Inspection value solo admite `status`, `explanation`, `observation`, `recommendation`; status obligatorio dentro del objeto y debe ser opción existente. Textos opcionales max2000. Si status está en `require_explanation_when`, explanation debe existir y no quedar en blanco tras trim. `observation` y `recommendation` no son requeridos por schema de inspección estándar.

## Versiones y snapshots

Editar `schema` distinto incrementa `service_form_templates.version` atómicamente. Cambiar metadatos no incrementa. No hay endpoint de publicación ni tabla de revisiones de template identificable en la API. La asociación de servicio guarda `template_id`, obligatoriedad y orden, no versión. La configuración de requisitos de formulario se copia a `service_orders.form_requirements_snapshot` al crear orden; para iniciar submission se prioriza ese snapshot sobre la config viva del servicio.

Al iniciar formulario se copia a `schema_snapshot` la versión/schema guardados en el snapshot de requisito, si existen; en otro caso schema/version vigentes del template. `template_version`, `schema_snapshot`, folio y contexto no cambian luego. Un draft continúa sobre su snapshot aunque template cambie. Nuevas órdenes/capturas usan vigente según asignación/snapshot. Completed y cancelled conservan inmutable schema, respuestas y contexto. El modelo impide cambios históricos aun si se intenta vía Eloquent; la cancelación de completed conserva answers.

## Versionado de captura ilustrativo

```json
{"id":901,"service_form_template_id":7,"template_version":2,"status":"draft","schema_snapshot":{"title":"Recepción v2"}}
```

El contrato completo de API y respuestas está en docs 27/29. Evidencia Feature: `test_template_schema_validation_and_versioning`, `test_draft_keeps_initial_version_and_deactivated_template_blocks_new_starts`, `test_draft_finalization_protection_and_snapshot_version`, `test_generic_types_reject_invalid_values_and_accept_valid_values`, `test_inspection_25_points_nr_and_summary`.
