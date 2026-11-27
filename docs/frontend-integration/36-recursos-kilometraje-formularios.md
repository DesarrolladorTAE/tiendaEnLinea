# 36. Recursos, kilometraje y formularios en órdenes

Fuentes: `ServiceOrderController`, `VehicleController::visitMileage`, `ServiceOperationScope`, `BookingAvailability`, `FormFeature`, `ServiceFormSubmissionController`; rutas Laravel y Feature `ServiceOperationsTest`, `ServiceFormsTest`.

## Asignación/reasignación de recurso a orden

`PATCH /branches/{branchId}/service-orders/{orderId}/resource`, Sanctum. Store/POS de branch, módulo/plan service_sales. Body `{"resource_id":6}` o `{"resource_id":null}`; nullable integer≥1. No hay motivo. Orden completed/cancelled: 409. ID debe ser recurso de tenant y branch, activo, asociado activamente al servicio. Null está prohibido si service `requires_resource=true` (422 vía scope).

Bloquea branch/order. Si orden viene de booking futuro o de hoy no iniciado, valida disponibilidad real excluyendo la misma cita; cambia también `booking.resource_id`. Si booking pasado/cancelled no recalcula disponibilidad, pero conserva sincronización del recurso. Para orden directa solo verifica que resource no esté ocupado respecto a capacity de órdenes in_progress. Actualiza order.resource_id y crea history `resource_assigned` con `previous_resource_id`, `resource_id`, `technician_snapshot` (nombre del recurso). Sin una relación elegible no asume que cualquier empleado sea técnico. Response `{"data":<order>}`. Sin disponibilidad 422 `resource_id`; recurso ajeno/inactivo no se encuentra (404); terminal 409.

La ruta de administración/consulta de recursos y asociaciones está en docs 17; availability puede devolver `resource_ids`. En listado de orden la relación resource es solo `{id,name}`; detail incluye el modelo cargado.

## Kilometraje de visita

`PATCH /vehicles/{vehicleId}/service-orders/{orderId}/mileage`, Sanctum + `VehicleFeature::recordsEnabled`; POS solo su branch. JSON `{"visit_mileage":0}`: requerido integer 0–999,999,999, cero permitido. Transacción bloquea vehículo y orden; orden debe pertenecer a ese vehículo y tenant; POS de otra branch 403. Orden completed/cancelled 409. Respuesta `{"data":{"order":<fresh order>,"vehicle":<fresh vehicle>}}`.

Se guarda lectura de visita aunque sea inferior al acumulado actual del expediente. El `vehicles.latest_mileage` solo cambia si `started_at ?? created_at` no es más antiguo que timestamp registrado y el nuevo valor no es inferior al acumulado. Cambios al acumulado no borran lectura histórica en orden. Diferencia del PATCH genérico de vehículo, que sí puede modificar directamente aggregate y no añade evento histórico. Cuando cambia el expediente después de orden, `vehicle_snapshot`/`customer_snapshot` persisten; PDF/form snapshot utiliza copia histórica. Prueba VehicleRecords cubre que una visita antigua no reemplace agregado reciente.

## Formularios requeridos y capturas

Al crear order, `form_requirements_snapshot` congela cada asignación activa: `template_id,required,sort_order,version,schema,name`. Ediciones futuras de asociación/plantilla no alteran requisito ni schema de esa orden. `GET /service-orders/{orderId}` expone el snapshot y `forms_progress:{total,completed,draft,cancelled,required_pending}`. `GET /service-orders/{orderId}/forms` devuelve asignaciones y capturas; capturas incluyen su `template_version`, `schema_snapshot`, `answers`, `context_snapshot`, `status` y summary. Nunca iniciar ficticias: POST start necesita una orden real, ID de plantilla que esté en el snapshot/asociación, misma tienda/branch accesible y no duplicada para esa orden.

Formulario obligatorio se cumple únicamente con una submission `completed` para el mismo template ID; draft/cancelled no. Modificar asociación tras crear orden no la altera. Orden completion con pendientes: 422, `errors.forms` y `errors.pending_template_ids`. Endpoint de captura completo y transiciones: documento 29; capacidades `service_forms`: documento 19. Cita no es suficiente para capture: debe convertirse primero en order.

## Fallos de elegibilidad

`service_id` activo y asignado a sucursal; el recurso debe estar activo y asociado. El backend no expone una entidad dedicada de “técnico” en esta operación: emplea recursos (`resources`) y `user_id` según el contrato de recursos; no inferir empleados desde otra lista ni dar selección libre. Si la service exige resource, no se puede crear/atender la orden sin asignación.
