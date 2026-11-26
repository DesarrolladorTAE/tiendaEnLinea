# 39. Fixtures de agenda y órdenes para React

> Evidencia de fase 5 pendiente de cotejo con la revisión operativa de Laravel. Este anexo conserva el contrato reportado en la entrega previa. Consulta [fuente y certeza](README.md#fuente-y-certeza).

Datos ficticios generados a partir de los ejemplos y formas descritas en la documentación previa. Los casos son independientes. IDs de estado, mensajes, timestamps y el conjunto de relaciones son ilustrativos. Usa los códigos de estado y las claves de errores para las pruebas simuladas. Ningún JSON se obtuvo ejecutando Laravel en esta entrega.

## Agenda vacía / día con slots

Listado sin citas devuelve paginator Laravel directo:

```json
{"current_page":1,"data":[],"first_page_url":"/api/branches/12/bookings?page=1","from":null,"last_page":1,"last_page_url":"/api/branches/12/bookings?page=1","links":[{"url":null,"label":"&laquo; Previous","active":false},{"url":"/api/branches/12/bookings?page=1","label":"1","active":true},{"url":null,"label":"Next &raquo;","active":false}],"next_page_url":null,"path":"/api/branches/12/bookings","per_page":20,"prev_page_url":null,"to":null,"total":0}
```

```json
{"data":{"branch_id":12,"service_id":8,"date":"2026-12-02","timezone":"America/Mexico_City","slots":[]}}
```

```json
{"data":{"branch_id":12,"service_id":8,"date":"2026-12-02","timezone":"America/Mexico_City","slots":[{"date":"2026-12-02","start_time":"09:00","end_time":"10:00","resource_ids":[6]},{"date":"2026-12-02","start_time":"09:30","end_time":"10:30","resource_ids":[6]}]}}
```

## Citas

Body creation:

```json
{"service_id":8,"customer_id":14,"vehicle_id":81,"resource_id":6,"booking_date":"2026-12-02","start_time":"09:00","notes":"Revisión solicitada","idempotency_key":"booking-frontend-0001"}
```

Pending (requiere confirmación) y confirmed (autoconfirmada) son misma fila salvo status/timestamp; estos ejemplos sintetizan modelo crudo:

```json
{"data":{"id":21,"store_id":3,"booking_code":"BK-0123456789ABCDEF01234567","service_id":8,"branch_id":12,"customer_id":14,"vehicle_id":81,"resource_id":6,"sale_id":null,"booking_date":"2026-12-02","start_time":"09:00:00","end_time":"10:00:00","quantity":1,"unit_price":"650.00","total":"650.00","status":"pending","payment_status":"pending","notes":"Revisión solicitada","metadata":{"created_by_type":"store","created_by_id":3},"confirmed_at":null,"cancelled_at":null,"created_at":"2026-11-26T10:00:00Z","updated_at":"2026-11-26T10:00:00Z"}}
```

```json
{"data":{"id":22,"store_id":3,"booking_code":"BK-76543210ABCDEF0123456789","service_id":8,"branch_id":12,"customer_id":14,"vehicle_id":null,"resource_id":6,"sale_id":null,"booking_date":"2026-12-03","start_time":"11:00:00","end_time":"12:00:00","quantity":1,"unit_price":"650.00","total":"650.00","status":"confirmed","payment_status":"pending","notes":null,"metadata":{"created_by_type":"pos","created_by_id":9},"confirmed_at":"2026-11-26T10:00:00Z","cancelled_at":null}}
```

Reprogramada: mismo modelo, cambia date/time/resource y `metadata.rescheduled_at`; no persiste horarios previos explícitos. Cancelada: status `cancelled`, `cancelled_at`, metadata con reason/by. Cita cancelada libera cupo. Estos fragmentos no duplican objetos completos; response del API retorna todos los atributos del modelo.

Confirm/arrival/reschedule/cancel responden `{"data":<booking actualizado>}`. Reprogramar conserva el status y agrega `metadata.rescheduled_at`; cancelar agrega `metadata.cancellation_reason`, actor y timestamp. No se conserva un log con los horarios previos.

## Order desde cita / directa

Create directa:

```json
{"service_id":8,"customer_id":14,"vehicle_id":81,"resource_id":6,"description":"Revisión visual","priority":"normal","idempotency_key":"order-frontend-0001"}
```

Body de conversión de cita es vacío: `POST /branches/12/bookings/21/service-order`.

Respuesta de order model (incluye campos null/relations según carga):

```json
{"data":{"id":77,"store_id":3,"order_code":"SO-0123456789ABCDEF01234567","service_id":8,"booking_id":21,"customer_id":14,"vehicle_id":81,"branch_id":12,"resource_id":6,"sale_id":null,"status_id":1,"priority":"normal","description":"Revisión solicitada","diagnosis":null,"resolution":null,"visit_mileage":null,"started_at":null,"completed_at":null,"vehicle_snapshot":{"brand_id":4,"model_id":9,"brand":"Nissan","model":"Versa","year":2022,"plates":"ABC-123","vin":"FICTICIO"},"customer_snapshot":{"name":"Cliente ficticio","phone":"5550000100"},"form_requirements_snapshot":[{"template_id":7,"required":true,"sort_order":1,"version":2,"schema":{"kind":"generic","title":"Diagnóstico"},"name":"Diagnóstico"}],"created_at":"2026-11-26T10:00:00Z","updated_at":"2026-11-26T10:00:00Z"}}
```

## Ordenes operativas

Detail order in progress includes `forms_progress`:

```json
{"data":{"id":77,"order_code":"SO-0123456789ABCDEF01234567","service_id":8,"booking_id":21,"customer_id":14,"vehicle_id":81,"branch_id":12,"resource_id":6,"sale_id":410,"status":{"id":2,"name":"En proceso","code":"in_progress"},"form_requirements_snapshot":[{"template_id":7,"required":true,"sort_order":1,"version":2,"schema":{"title":"Diagnóstico","sections":[{"id":"general","title":"General","sort_order":1,"fields":[{"id":"result","label":"Resultado","type":"short_text","required":true,"sort_order":1}]}]},"name":"Diagnóstico"}],"visit_mileage":48210,"history":[],"form_submissions":[{"id":901,"service_form_template_id":7,"status":"completed","folio":"SF-FICTICIO","completed_at":"2026-11-26T12:00:00Z"}],"sale":{"id":410,"store_id":3,"client_id":14,"pos_location_id":9,"status":"completed","total_amount":"650.00"}},"forms_progress":{"total":1,"completed":1,"draft":0,"cancelled":0,"required_pending":[]}}
```

Formularios pending: `forms_progress.required_pending:[7]`; intentar complete retorna 422 `errors.forms` + `errors.pending_template_ids`. Completed: status code `completed`, `completed_at`; cancelled: `cancelled`, `completed_at` según código y linked booking cancelled. Orden tradicional tiene `vehicle_id:null`, snapshots vehicle null/ausentes y mismo contrato de formularios.

Subfixture de una orden tradicional sin cita: `{"booking_id":null,"vehicle_id":null,"customer_id":14,"service_id":4,"status":{"code":"pending"},"form_requirements_snapshot":[]}`. Al cancelar una orden, status es `cancelled`, `completed_at` se establece al instante de cancelación y una booking vinculada cambia a cancelled. Son fragmentos, no DTOs separados.

## Venta vinculada

```json
{"sale_id":410}
```

Validación client mismatch/sale already attached:

```json
{"message":"The given data was invalid.","errors":{"sale_id":["El cliente de la venta no coincide."]}}
```

## Conflicto y autorización

```json
{"message":"The given data was invalid.","errors":{"start_time":["No hay disponibilidad para este horario y recurso."]}}
```

```json
{"message":"El módulo de servicios está deshabilitado."}
```

Estas respuestas derivan de reglas/código y status tests; message puede variar por Laravel locale/handler. 409 conflicto de estado/idempotency; 404 branch/entidad ajena; 403 módulo/actor; 422 validation.

## Respuestas completas para escenarios de prueba simulada

Cada bloque representa un escenario de interfaz. El orden de campos y las relaciones de estos modelos deben cotejarse con el serializer antes de convertirlos en aserciones de integración.
### Agenda con citas

```json
{"current_page":1,"data":[{"id":21,"store_id":3,"booking_code":"BK-0123456789ABCDEF01234567","service_id":8,"branch_id":12,"customer_id":14,"vehicle_id":81,"resource_id":6,"sale_id":null,"booking_date":"2026-12-02","start_time":"09:00:00","end_time":"10:00:00","quantity":1,"unit_price":"650.00","total":"650.00","status":"pending","payment_status":"pending","notes":"Revisión solicitada","metadata":{"created_by_type":"store","created_by_id":3},"confirmed_at":null,"cancelled_at":null,"created_at":"2026-11-26T10:00:00Z","updated_at":"2026-11-26T10:00:00Z","service":{"id":8,"name":"Inspección"},"resource":{"id":6,"name":"T?cnico 1"},"vehicle":{"id":81,"plates":"ABC-123"},"customer":{"id":14,"nombre_alias":"Cliente ficticio"}}],"first_page_url":"/api/branches/12/bookings?page=1","from":1,"last_page":1,"last_page_url":"/api/branches/12/bookings?page=1","links":[{"url":null,"label":"&laquo; Previous","active":false},{"url":"/api/branches/12/bookings?page=1","label":"1","active":true},{"url":null,"label":"Next &raquo;","active":false}],"next_page_url":null,"path":"/api/branches/12/bookings","per_page":20,"prev_page_url":null,"to":1,"total":1}
```

### Cita reprogramada

```json
{"data":{"id":22,"store_id":3,"booking_code":"BK-76543210ABCDEF0123456789","service_id":8,"branch_id":12,"customer_id":14,"vehicle_id":null,"resource_id":6,"sale_id":null,"booking_date":"2026-12-04","start_time":"12:00:00","end_time":"13:00:00","quantity":1,"unit_price":"650.00","total":"650.00","status":"confirmed","payment_status":"pending","notes":null,"metadata":{"created_by_type":"pos","created_by_id":9,"rescheduled_at":"2026-11-27T10:00:00Z"},"confirmed_at":"2026-11-26T10:00:00Z","cancelled_at":null,"created_at":"2026-11-26T10:00:00Z","updated_at":"2026-11-27T10:00:00Z"}}
```

### Cita cancelada

```json
{"data":{"id":22,"store_id":3,"booking_code":"BK-76543210ABCDEF0123456789","service_id":8,"branch_id":12,"customer_id":14,"vehicle_id":null,"resource_id":6,"sale_id":null,"booking_date":"2026-12-04","start_time":"12:00:00","end_time":"13:00:00","quantity":1,"unit_price":"650.00","total":"650.00","status":"cancelled","payment_status":"pending","notes":null,"metadata":{"created_by_type":"pos","created_by_id":9,"rescheduled_at":"2026-11-27T10:00:00Z","cancellation_reason":"Solicitud del cliente"},"confirmed_at":"2026-11-26T10:00:00Z","cancelled_at":"2026-11-27T10:00:00Z","created_at":"2026-11-26T10:00:00Z","updated_at":"2026-11-27T10:00:00Z"}}
```

### Orden directa tradicional

```json
{"data":{"id":78,"store_id":3,"order_code":"SO-0123456789ABCDEF01234568","service_id":4,"booking_id":null,"customer_id":14,"vehicle_id":null,"branch_id":12,"resource_id":null,"sale_id":null,"status_id":1,"priority":"normal","description":"Servicio tradicional ficticio","diagnosis":null,"resolution":null,"visit_mileage":null,"started_at":null,"completed_at":null,"vehicle_snapshot":null,"customer_snapshot":{"name":"Cliente ficticio","phone":"5550000100"},"form_requirements_snapshot":[],"created_at":"2026-11-26T10:00:00Z","updated_at":"2026-11-26T10:00:00Z"}}
```

### Orden vehicular

```json
{"data":{"id":77,"store_id":3,"order_code":"SO-0123456789ABCDEF01234567","service_id":8,"booking_id":21,"customer_id":14,"vehicle_id":81,"branch_id":12,"resource_id":6,"sale_id":null,"status_id":1,"priority":"normal","description":"Revisión solicitada","diagnosis":null,"resolution":null,"visit_mileage":null,"started_at":null,"completed_at":null,"vehicle_snapshot":{"brand_id":4,"model_id":9,"brand":"Nissan","model":"Versa","year":2022,"plates":"ABC-123","vin":"FICTICIO"},"customer_snapshot":{"name":"Cliente ficticio","phone":"5550000100"},"form_requirements_snapshot":[{"template_id":7,"required":true,"sort_order":1,"version":2,"schema":{"title":"Diagnóstico","sections":[{"id":"general","title":"General","sort_order":1,"fields":[{"id":"result","label":"Resultado","type":"short_text","required":true,"sort_order":1}]}]},"name":"Diagnóstico"}],"created_at":"2026-11-26T10:00:00Z","updated_at":"2026-11-26T10:00:00Z"}}
```

### Orden con formularios pendientes

```json
{"data":{"id":77,"store_id":3,"order_code":"SO-0123456789ABCDEF01234567","service_id":8,"booking_id":21,"customer_id":14,"vehicle_id":81,"branch_id":12,"resource_id":6,"sale_id":null,"status_id":2,"priority":"normal","description":"Revisión solicitada","diagnosis":null,"resolution":null,"visit_mileage":48210,"started_at":"2026-11-27T10:00:00Z","completed_at":null,"vehicle_snapshot":{"brand_id":4,"model_id":9,"brand":"Nissan","model":"Versa","year":2022,"plates":"ABC-123","vin":"FICTICIO"},"customer_snapshot":{"name":"Cliente ficticio","phone":"5550000100"},"form_requirements_snapshot":[{"template_id":7,"required":true,"sort_order":1,"version":2,"schema":{"title":"Diagnóstico","sections":[{"id":"general","title":"General","sort_order":1,"fields":[{"id":"result","label":"Resultado","type":"short_text","required":true,"sort_order":1}]}]},"name":"Diagnóstico"}],"created_at":"2026-11-26T10:00:00Z","updated_at":"2026-11-26T10:00:00Z","status":{"id":2,"name":"En proceso","code":"in_progress"},"history":[],"form_submissions":[],"sale":null},"forms_progress":{"total":1,"completed":0,"draft":0,"cancelled":0,"required_pending":[7]}}
```

### Orden con formularios completados

```json
{"data":{"id":77,"store_id":3,"order_code":"SO-0123456789ABCDEF01234567","service_id":8,"booking_id":21,"customer_id":14,"vehicle_id":81,"branch_id":12,"resource_id":6,"sale_id":null,"status_id":2,"priority":"normal","description":"Revisión solicitada","diagnosis":null,"resolution":null,"visit_mileage":48210,"started_at":"2026-11-27T10:00:00Z","completed_at":null,"vehicle_snapshot":{"brand_id":4,"model_id":9,"brand":"Nissan","model":"Versa","year":2022,"plates":"ABC-123","vin":"FICTICIO"},"customer_snapshot":{"name":"Cliente ficticio","phone":"5550000100"},"form_requirements_snapshot":[{"template_id":7,"required":true,"sort_order":1,"version":2,"schema":{"title":"Diagnóstico","sections":[{"id":"general","title":"General","sort_order":1,"fields":[{"id":"result","label":"Resultado","type":"short_text","required":true,"sort_order":1}]}]},"name":"Diagnóstico"}],"created_at":"2026-11-26T10:00:00Z","updated_at":"2026-11-26T10:00:00Z","status":{"id":2,"name":"En proceso","code":"in_progress"},"history":[],"form_submissions":[{"id":901,"service_form_template_id":7,"status":"completed","folio":"SF-FICTICIO","completed_at":"2026-11-26T12:00:00Z"}],"sale":null},"forms_progress":{"total":1,"completed":1,"draft":0,"cancelled":0,"required_pending":[]}}
```

### Orden con venta vinculada

```json
{"data":{"id":77,"store_id":3,"order_code":"SO-0123456789ABCDEF01234567","service_id":8,"booking_id":21,"customer_id":14,"vehicle_id":81,"branch_id":12,"resource_id":6,"sale_id":410,"status_id":2,"priority":"normal","description":"Revisión solicitada","diagnosis":null,"resolution":null,"visit_mileage":48210,"started_at":"2026-11-27T10:00:00Z","completed_at":null,"vehicle_snapshot":{"brand_id":4,"model_id":9,"brand":"Nissan","model":"Versa","year":2022,"plates":"ABC-123","vin":"FICTICIO"},"customer_snapshot":{"name":"Cliente ficticio","phone":"5550000100"},"form_requirements_snapshot":[{"template_id":7,"required":true,"sort_order":1,"version":2,"schema":{"title":"Diagnóstico","sections":[{"id":"general","title":"General","sort_order":1,"fields":[{"id":"result","label":"Resultado","type":"short_text","required":true,"sort_order":1}]}]},"name":"Diagnóstico"}],"created_at":"2026-11-26T10:00:00Z","updated_at":"2026-11-26T10:00:00Z","status":{"id":2,"name":"En proceso","code":"in_progress"},"history":[],"form_submissions":[{"id":901,"service_form_template_id":7,"status":"completed","folio":"SF-FICTICIO","completed_at":"2026-11-26T12:00:00Z"}],"sale":{"id":410,"store_id":3,"client_id":14,"pos_location_id":9,"status":"completed","total_amount":"650.00"}},"forms_progress":{"total":1,"completed":1,"draft":0,"cancelled":0,"required_pending":[]}}
```

### Orden finalizada

```json
{"data":{"id":77,"store_id":3,"order_code":"SO-0123456789ABCDEF01234567","service_id":8,"booking_id":21,"customer_id":14,"vehicle_id":81,"branch_id":12,"resource_id":6,"sale_id":410,"status_id":3,"priority":"normal","description":"Revisión solicitada","diagnosis":null,"resolution":null,"visit_mileage":48210,"started_at":"2026-11-27T10:00:00Z","completed_at":"2026-11-27T10:00:00Z","vehicle_snapshot":{"brand_id":4,"model_id":9,"brand":"Nissan","model":"Versa","year":2022,"plates":"ABC-123","vin":"FICTICIO"},"customer_snapshot":{"name":"Cliente ficticio","phone":"5550000100"},"form_requirements_snapshot":[{"template_id":7,"required":true,"sort_order":1,"version":2,"schema":{"title":"Diagnóstico","sections":[{"id":"general","title":"General","sort_order":1,"fields":[{"id":"result","label":"Resultado","type":"short_text","required":true,"sort_order":1}]}]},"name":"Diagnóstico"}],"created_at":"2026-11-26T10:00:00Z","updated_at":"2026-11-27T10:00:00Z","status":{"id":3,"code":"completed","name":"Finalizada"},"history":[],"form_submissions":[{"id":901,"service_form_template_id":7,"status":"completed","folio":"SF-FICTICIO","completed_at":"2026-11-26T12:00:00Z"}],"sale":{"id":410,"store_id":3,"client_id":14,"pos_location_id":9,"status":"completed","total_amount":"650.00"}},"forms_progress":{"total":1,"completed":1,"draft":0,"cancelled":0,"required_pending":[]}}
```

### Orden cancelada

```json
{"data":{"id":77,"store_id":3,"order_code":"SO-0123456789ABCDEF01234567","service_id":8,"booking_id":21,"customer_id":14,"vehicle_id":81,"branch_id":12,"resource_id":6,"sale_id":410,"status_id":4,"priority":"normal","description":"Revisión solicitada","diagnosis":null,"resolution":null,"visit_mileage":48210,"started_at":"2026-11-27T10:00:00Z","completed_at":"2026-11-27T10:00:00Z","vehicle_snapshot":{"brand_id":4,"model_id":9,"brand":"Nissan","model":"Versa","year":2022,"plates":"ABC-123","vin":"FICTICIO"},"customer_snapshot":{"name":"Cliente ficticio","phone":"5550000100"},"form_requirements_snapshot":[{"template_id":7,"required":true,"sort_order":1,"version":2,"schema":{"title":"Diagnóstico","sections":[{"id":"general","title":"General","sort_order":1,"fields":[{"id":"result","label":"Resultado","type":"short_text","required":true,"sort_order":1}]}]},"name":"Diagnóstico"}],"created_at":"2026-11-26T10:00:00Z","updated_at":"2026-11-27T10:00:00Z","status":{"id":4,"code":"cancelled","name":"Cancelada"},"history":[],"form_submissions":[{"id":901,"service_form_template_id":7,"status":"completed","folio":"SF-FICTICIO","completed_at":"2026-11-26T12:00:00Z"}],"sale":{"id":410,"store_id":3,"client_id":14,"pos_location_id":9,"status":"completed","total_amount":"650.00"}},"forms_progress":{"total":1,"completed":1,"draft":0,"cancelled":0,"required_pending":[]}}
```

## Pruebas Feature citadas por la entrega previa

`tests/Feature/ServiceOperationsTest.php`: slot/conflict/idempotency/reschedule/cancel; excepciones; conversión y transiciones; requerimiento vehicular y snapshot de forms; aislamiento branch/store; re-asignación de resource; siguiente booking; pendiente manual y llegada. `ServiceFormsTest.php`: snapshots/versiones/required submissions. `ServiceDocumentsTest.php`: PDF/thermal access and response shape. No se corrieron pruebas en esta tarea documental.
