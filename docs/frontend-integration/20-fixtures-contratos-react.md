# 20. Fixtures JSON de contratos para React

Estos ejemplos son datos ficticios e ilustrativos basados en las formas observadas en controladores y validadores. Úselos para tipado/fixtures de UI; no son capturas de ejecución ni prometen IDs estables. En producción, manejar claves desconocidas y los códigos HTTP documentados.

## Leer capacidades de terminal

```http
GET /api/pos/modules
Authorization: Bearer <token Sanctum>
Accept: application/json
```
```json
{"data":[{"key":"vehicle_catalog","name":"Catálogo vehicular","sort_order":30,"available":true,"enabled":true,"visible":true,"source":"general"},{"key":"vehicle_records","name":"Expedientes vehiculares","sort_order":31,"available":true,"enabled":false,"visible":false,"source":"general"},{"key":"service_forms","name":"Formularios de servicio","sort_order":32,"available":true,"enabled":true,"visible":true,"source":"pos"}]}
```

## Consultar configuración privada de sucursal

```http
GET /api/admin/branches/12/catalog-settings
Authorization: Bearer <token Sanctum>
Accept: application/json
```
```json
{"data":{"branch_id":12,"vehicle_feature_available":true,"catalog_search_mode":"both","vehicle_compatibilities_enabled":true}}
```
La respuesta actual también conserva esas propiedades y agrega `data.capabilities`; ver el fixture completo del documento 19.

## Crear servicio por JSON

```http
POST /api/branches/12/services
Content-Type: application/json
Accept: application/json
```
```json
{"name":"Inspección preventiva","code":"INS-01","service_type":"workshop","base_price":350,"duration_minutes":45,"requires_booking":true,"vehicle_requirement":"optional","billing_mode":"full","default_capacity":1,"iva_percentage":16}
```
Respuesta ilustrativa:
```json
{"success":true,"message":"Servicio creado correctamente.","service":{"id":45,"name":"Inspección preventiva","service_type":"workshop","base_price":"350.00","config":{"vehicle_requirement":"optional"},"images":[],"branches":[]}}
```

## Actualizar servicio con multipart

```text
POST /api/branches/12/services/45
_method=PUT
Accept: application/json
name=Inspección preventiva avanzada
vehicle_requirement=none
images[0]=<archivo>
```
Respuesta: 200 `{"success":true,"message":"Servicio actualizado correctamente.","service":{...}}`. El ID está en `service.id`; campo de requisito vehicular persiste bajo `service.config.vehicle_requirement`.

## Booking config de dos franjas

```http
PUT /api/branches/12/services/45/booking-config
Content-Type: application/json
```
```json
{"is_active":true,"duration_minutes":60,"slot_interval_minutes":30,"capacity_per_slot":2,"capacity_per_day":12,"min_advance_minutes":60,"max_advance_days":45,"buffer_minutes":10,"requires_confirmation":true,"weekly_schedules":[{"weekday":1,"is_enabled":true,"start_time":"09:00","end_time":"13:00","capacity_override":null},{"weekday":1,"is_enabled":true,"start_time":"14:00","end_time":"18:00","capacity_override":2}],"exceptions":[{"date":"2026-12-25","type":"closed","reason":"Festivo"}]}
```
Respuesta exitosa: `{"data":{"id":8,"branch_id":12,"service_id":45,"booking_type":"appointment","is_active":true,"duration_minutes":60,"slot_interval_minutes":30,"capacity_per_slot":2,"weekly_schedules":[...],"schedule_exceptions":[...]}}`.

## Consultar disponibilidad

```http
GET /api/branches/12/services/45/availability?date=2026-11-30&resource_id=7
```
```json
{"data":{"branch_id":12,"service_id":45,"date":"2026-11-30","timezone":"America/Mexico_City","slots":[{"date":"2026-11-30","start_time":"09:00","end_time":"10:00","resource_ids":[7]}]}}
```
La lista vacía tiene la misma estructura `"slots":[]`; no contiene razón ni contadores.

## Crear recurso y asociarlo

```http
POST /api/branches/12/resources
Content-Type: application/json
```
```json
{"resource_code":"TEC-07","type":"employee","name":"Técnico 7","description":"Técnico de taller","capacity":1,"user_id":77,"config":{"bay":"A"},"is_active":true}
```
```json
{"success":true,"message":"<mensaje devuelto por el controlador>","resource":{"id":7,"branch_id":12,"resource_code":"TEC-07","type":"employee","name":"Técnico 7","capacity":1,"user_id":77,"is_active":true}}
```
Asociar:
```http
POST /api/branches/12/services/45/resources
```
```json
{"resources":[{"resource_id":7,"duration_override":45,"price_override":null,"is_active":true}]}
```
`user_id` no prueba por sí mismo que ese usuario sea técnico elegible.

## Horario de recurso

```http
PUT /api/branches/12/resources/7/schedule
```
```json
{"weekly_schedules":[{"weekday":1,"is_enabled":true,"start_time":"09:00","end_time":"13:00"},{"weekday":1,"is_enabled":true,"start_time":"14:00","end_time":"18:00"}]}
```
La colección completa reemplaza la anterior.
Para borrar franjas se envía `{"weekly_schedules":[]}`. La respuesta contiene la colección vacía; el recurso queda sin restricción horaria propia y continúa sujeto a la agenda general, reservas, capacidad y estado activo.

## Asociación de plantilla

```http
PUT /api/branches/12/services/45/forms
```
```json
{"forms":[{"template_id":7,"required":true,"sort_order":1},{"template_id":11,"required":false,"sort_order":2}]}
```
Respuesta:
```json
{"data":{"service_id":45,"forms":[{"template_id":7,"required":true,"sort_order":1},{"template_id":11,"required":false,"sort_order":2}]}}
```
Para borrar asociaciones, `PUT` con `{"forms":[]}` responde `{"data":{"service_id":45,"forms":[]}}`. Omitir `forms` sigue dando 422; plantillas y submissions existentes se conservan.

## Error de validación

```json
{"message":"The weekly schedules.0.start time field must match the format H:i.","errors":{"weekly_schedules.0.start_time":["The weekly schedules.0.start time field must match the format H:i."]}}
```

## Errores de autorización comunes

```json
{"message":"Unauthenticated."}
```
401 autenticación faltante. 403 actor, módulo, plan o permiso insuficiente. 404 entidad fuera de tenant/sucursal o inexistente. 422 cuerpo/query inválidos. 409 agenda inactiva. Manejar otras respuestas según endpoint; no asumir una envoltura universal.

