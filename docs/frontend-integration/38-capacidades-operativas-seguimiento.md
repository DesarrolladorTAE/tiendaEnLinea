# 38. Capacidades, permisos y próximas visitas

## Autorización operativa

Las rutas de agenda, cita y orden están en `auth:sanctum` y resuelven branch por path. `ServiceOperationScope::branch` delega pertenencia a `TourScope`: Store debe ser dueño de branch; POS debe pertenecer a esa misma tienda y branch; otras identidades User/employee no son admitidas por scope actual. Luego valida tienda activa/acceso, módulo `service_sales` general, feature de plan `ventas-de-servicios` cuando está configurado, y override `service_sales=false` del POS. Configuración (BookingConfig PUT) es Store-only. Los endpoints de operaciones no tienen permisos RBAC individuales como booking.confirm/order.complete. No inventar botón habilitado desde permisos genéricos.

| Acción | Evidencia de autorización efectiva |
|---|---|
| Consultar agenda, availability, detalle | Sanctum + branch/tenant + service_sales/plan; Store y POS propio |
| Crear/confirmar/reprogramar/cancelar/arrival | el mismo scope operativo; validaciones/estado del método |
| Crear/listar/consultar órdenes, asignar recurso, state, vincular venta, siguiente booking | el mismo scope operativo; misma branch |
| Configurar horarios/cupo | scope con `configuration=true`; Store solamente |
| Capturar formularios | además FormFeature `service_forms`; Store y POS branch según docs 19/27/29 |
| Kilometraje vehículo | además `vehicle_records`; POS branch y registro de orden-vehículo; documento 36 |
| Descargar PDF/thermal | `RequireServiceDocumentAuth` + ServiceOperationScope; formulario PDF añade FormFeature; docs 31/37 |

No se encontró capacidad privada separada de agenda que anticipe cada transición (confirm/cancel/order complete) para deshabilitar botones. La configuración privada `GET /admin/branches/{branchId}/catalog-settings` representa vehicle/forms, no service_sales. `/pos/modules` representa available/enabled/visible para módulos, pero la respuesta no sustituye scope/plan efectivo del endpoint. `403` debe presentarse como falta de autorización/feature; branch ajena se oculta 404.

La agenda y reschedule usan la zona global `config('app.timezone')` (actualmente `America/Mexico_City`), sin override de tienda/sucursal ni señal privada previa a availability. Availability devuelve `data.timezone` después de la consulta. Ver propuesta compatible en [41](41-contratos-vinculacion-ventas-zona-horaria.md); no implementada.

## Próxima visita

Sí existe `POST /branches/{branchId}/service-orders/{orderId}/next-booking`. Body: `booking_date` Y-m-d requerido, `start_time` H:i requerido, `resource_id` nullable integer≥1 opcional, `notes` nullable string max5000, `idempotency_key` requerido string8–100. Controller deriva service/customer/vehicle del order, toma recurso enviado o el actual de la orden y delega a creación de booking regular; availability y confirmación/idempotencia aplican igual. Respuesta directa la de create booking (201 primera, 200 misma clave/payload). No requiere un estado específico de orden en el método. Es cita nueva normal.

No existe tabla/relación `previous_service_order_id` o entidad de plan de mantenimiento/recordatorio en ese endpoint; la booking no queda enlazada históricamente con la orden que la sugirió (el payload creado no añade relación de origen). No hay fecha sugerida por kilometraje, recordatorios, notificaciones ni follow-up scheduler en este contrato. Alternativa frontend disponible: usar endpoint next-booking, precargando datos de la orden; no presentar como historial de siguiente servicio relacionado salvo que exista otra relación en frontend, porque no la guarda este endpoint.

## Datos para capacidades UI

La UI puede leer `/pos/modules` para mostrar módulo configurado y consultar disponibilidad desde endpoint real para slots. No tiene señal de permiso individual; debe tratar respuesta 403/404 de la operación como fuente definitiva. La capacidad de servicio puede estar desactivada aunque el módulo visible esté true (plan/branch/service inactive); no asumir autorización a partir de `visible` solamente.

No se modificó ni se añadió endpoint de capacidades. Módulos/roles para el resto de aplicación: ver docs 02 y 19.
