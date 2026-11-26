# 29. Captura de formularios e inspecciones

Paths relativos a `/api`. Controlador `ServiceFormSubmissionController`, modelo `ServiceFormSubmission`, autorización `FormFeature`, `VehicleAssociationGuard`; rutas en `routes/api.php`; pruebas `tests/Feature/ServiceFormsTest.php` y `ServiceOperationsTest.php`.

## Rutas y autorización

| Método | Ruta | Función |
|---|---|---|
| GET | `/service-orders/{orderId}/forms` | asignaciones y capturas de la orden |
| POST | misma | iniciar captura `{template_id}` |
| GET | `/service-orders/{orderId}/forms/{submissionId}` | detalle |
| PUT, PATCH | misma | guardar respuestas draft `{answers}` |
| POST | misma + `/complete` | validar y completar |
| POST | misma + `/cancel` | cancelar `{reason}` |
| GET | misma + `/summary` | resumen calculado |

Todas usan `auth:sanctum`, `FormFeature`, identidad Store o PosLocation; Store consulta tenant y POS solo su propia branch (orden de otra branch responde 404). Módulo `service_forms`, plan de servicios, branch activa y override POS deben permitir la operación. Plantillas/órdenes/submissions ajenas o inexistentes se ocultan con 404; módulo o actor no autorizado responde 403. No existe captura independiente: siempre requiere una orden existente.

POS puede consultar, iniciar, editar draft, completar y cancelar draft. Cancelar una captura `completed` es exclusivo de Store. No hay permiso RBAC distinto por acción. Cada orden pasa `VehicleAssociationGuard`.

## GET formularios de orden

`GET /service-orders/{orderId}/forms` devuelve `{"data":{"order_id":501,"forms":[...],"submissions":[...]}}`. `forms` procede de `form_requirements_snapshot` de la orden, con fallback a `service.config.forms`; cada requisito contiene `template_id,required,sort_order` (puede incluir schema/version snapshot conforme al momento de creación de la orden). `submissions` es una colección sin paginar ordenada por ID; cada submission es el modelo serializado más `summary` calculado.

Shape ilustrativo:

```json
{"data":{"order_id":501,"forms":[{"template_id":7,"required":true,"sort_order":1}],"submissions":[{"id":901,"store_id":3,"service_order_id":501,"service_form_template_id":7,"template_version":1,"folio":"SF-01J...","schema_snapshot":{"title":"Diagnóstico"},"answers":{},"context_snapshot":{"order_code":"OS-501"},"status":"draft","started_by_type":"store","started_by_id":3,"completed_by_type":null,"completed_by_id":null,"completed_at":null,"cancelled_by_type":null,"cancelled_by_id":null,"cancellation_reason":null,"cancelled_at":null,"created_at":"2026-11-26T10:00:00Z","updated_at":"2026-11-26T10:00:00Z","summary":{"total_points":0,"answered_points":0,"pending_points":0,"bien":0,"atender":0,"urgente":0,"nr":0,"progress_percent":0,"required_complete":false}}]}}
```

## Iniciar y consultar captura

`POST /service-orders/{orderId}/forms` body `{ "template_id": 7 }`, requerido integer≥1. La plantilla debe estar asignada al servicio de la orden. Si orden no tiene requisito snapshot, exige además plantilla activa. Template no asignada da 422; duplicado de misma plantilla/orden da 409; template no encontrada/tenant ajeno da 404. Orden debe estar abierta. `inspection25` requiere vehículo en la orden.

Respuesta 201 `{"data": submission+summary}`. Inicia como `draft`, answers `{}`, folio `SF-` + ULID. Congela `template_id`, versión, schema y contexto. El contexto incluye `order_code,order_created_at,inspection_date,service,branch,technician,customer,vehicle,visit_mileage`; customer/vehicle usan snapshots de orden si existen, si no fallback de relaciones actuales. Los valores históricos se preservan.

`GET /service-orders/{orderId}/forms/{submissionId}` devuelve `{data:submission+summary}`. La ruta incluye ambos IDs y verifica que submission pertenece a orden.

## Borrador, finalización y cancelación

`PUT` o `PATCH /service-orders/{orderId}/forms/{submissionId}` body requerido `{ "answers": {"field_id": value} }`, answers array/objeto. Solo status draft y orden abierta; actualiza respuestas parcialmente, valida tipos y campos conocidos pero permite incompleto. Respuesta 200 `{data:submission+summary}`. Submission cerrada u orden finalizada/cancelada: 409.

`POST .../{submissionId}/complete` no requiere body. Revalida respuestas con required completos. Inspección25 exige además kilometraje de visita no nulo en la orden; copia ese valor al `context_snapshot`. Cambia status `completed`, registra actor y fecha, y escribe evento en historial de orden si la estructura existe. 200 `{data:submission+summary}`. Segunda finalización 409.

`POST .../{submissionId}/cancel` requiere `reason` string 5–2000. Draft puede cancelarse por Store/POS; completed solo por Store (POS 403). Orden debe estar abierta. Marca `cancelled`, guarda razón, actor y fecha, mantiene respuestas y snapshots; 200 `{data:submission+summary}`. No hay borrado ni reapertura.

`GET .../{submissionId}/summary` respuesta `{ "data":{"id":901,"status":"draft","summary":{"total_points":25,"answered_points":1,"pending_points":24,"bien":1,"atender":0,"urgente":0,"nr":0,"progress_percent":4,"required_complete":false}} }`. El conteo se basa únicamente en campos `inspection`; campos genéricos required pueden hacer `required_complete=false`.

## Estados y errores

| Actual | Acción | Resultado |
|---|---|---|
| draft | PUT/PATCH answers | draft |
| draft | complete, validación completa | completed |
| draft | cancel con motivo válido | cancelled |
| completed | lectura/PDF | permitido |
| completed | editar/completar otra vez | 409 |
| completed | cancel | Store sí; POS 403 |
| cancelled | lectura/PDF | permitido, histórico inmutable |
| cancelled | mutar/repetir transición | conflicto |

Laravel 422 `{message,errors}`: campo desconocido `answers.rogue`, opción errónea `answers.result`, campo obligatorio `answers.result`, estado de inspección `answers.point_01.status`, falta explicación NR `answers.point_05.explanation`, kilometraje de visita `visit_mileage`. Conflictos 409 incluyen `message` y no son errores de validación. Si la orden ya está completed/cancelled, mutaciones de formulario responden 409.

Pruebas: `test_draft_finalization_protection_and_snapshot_version`, `test_inspection_25_points_nr_and_summary`, `test_store_and_branch_isolation_and_permissions`, `test_draft_keeps_initial_version_and_deactivated_template_blocks_new_starts`, `test_pos_cannot_cancel_completed_form_and_unassigned_template_is_rejected`. Los valores de fixture son ilustrativos; los estados/códigos se verifican en Feature.
