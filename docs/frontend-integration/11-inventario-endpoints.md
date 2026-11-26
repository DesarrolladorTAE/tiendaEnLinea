# Inventario de endpoints de integración

Los paths son relativos a `/api`. El inventario no reemplaza validadores; cita clase/controlador para rastrear cuerpos y respuestas. La autenticación se toma del grupo de rutas declarado. “Permiso” describe el scope comprobado por feature; no se inventa nombre RBAC cuando la ruta no declara uno.

| Métodos | Ruta | Credencial / middleware | Módulo / permiso y scope | Parámetros y cuerpo |
|---|---|---|---|---|
| GET/POST | `/branches/{branchId}/services` | Sanctum | servicio habilitado; tienda+branch | `branchId`; POST validado por service controller |
| GET/PUT/POST/DELETE | `/branches/{branchId}/services/{serviceId}` | Sanctum | servicio; tienda+branch | IDs de ruta; body según controller |
| GET/PUT | `.../services/{serviceId}/booking-config` | Sanctum | agenda; tienda+branch | PUT config validada |
| GET | `.../services/{serviceId}/availability` | Sanctum | agenda | `date`, opcional `resource_id` |
| GET/POST/PUT/DELETE | `.../services/{serviceId}/resources[/{resourceId}]` | Sanctum | administración servicio, scope branch | relación recurso según validator |
| GET/POST/PATCH | `/branches/{branchId}/bookings[/{bookingId}]` | Sanctum | agenda, scope branch | query/listado; body BookingController |
| POST | `.../bookings/{bookingId}/{confirm,cancel,reschedule,arrival,service-order}` | Sanctum | transiciones; scope branch | ID; body de reprogramación según método |
| GET/POST | `/branches/{branchId}/service-orders` | Sanctum | servicios; scope branch | filtros/listado; body orden |
| GET/PATCH | `.../service-orders/{orderId}` | Sanctum | servicio | ID; campos update validados |
| POST | `.../{orderId}/{start,complete,cancel}` | Sanctum | transición condicionada | ID y motivo si requerido |
| PATCH | `.../{orderId}/resource` | Sanctum | asignación en branch | body de referencia recurso |
| POST | `.../{orderId}/sale` | Sanctum | vincular venta autorizada | `{sale_id}` |
| POST | `.../{orderId}/next-booking` | Sanctum | crear cita desde el contexto de la orden | Ver [contrato de seguimiento](38-capacidades-operativas-seguimiento.md) |
| GET/POST | `/service-form-templates` | Sanctum | `service_forms`, admin de tienda | schema/atributos validados dinámicamente |
| GET/PUT/PATCH | `/service-form-templates/{templateId}` | Sanctum | plantilla en tienda | ID; nueva versión al editar |
| POST | `/service-form-templates/{templateId}/duplicate` | Sanctum | plantilla en tienda | ID |
| PATCH | `/service-form-templates/{templateId}/status` | Sanctum | plantilla | estado validado |
| GET/PUT | `/branches/{branchId}/services/{serviceId}/forms` | Sanctum | Forms + servicio, branch | asociaciones/requerido/opcional |
| GET | `/service-orders/{orderId}/forms` | Sanctum | Forms, scope de orden | requisitos y capturas |
| POST | `/service-orders/{orderId}/forms` | Sanctum | Forms, scope de orden | `{template_id}` para iniciar |
| GET/PUT/PATCH | `/service-orders/{orderId}/forms/{submissionId}` | Sanctum | Forms, scope orden | snapshot-respuestas |
| GET | `/service-orders/{orderId}/forms/{submissionId}/summary` | Sanctum | Forms, scope orden | resumen de captura |
| POST | `.../complete`, `.../cancel` | Sanctum | transición formulario | motivo para cancelar según validator |
| GET | `/branches/{branchId}/service-orders/{orderId}/forms/{submissionId}/document.pdf` | `RequireServiceDocumentAuth` + `FormFeature` | PDF privado; Store/POS scope branch/orden | descarga `formulario-{folio}.pdf` |
| GET/POST | `/vehicles` | Sanctum | `vehicle_records`, tienda | filtro/listado; creación cliente/marca/modelo |
| GET/PUT/PATCH | `/vehicles/{vehicleId}` | Sanctum | expediente, tienda | ID; update validado |
| GET | `/clients/{customerId}/vehicles` | Sanctum | expediente | customer ID mismo tenant |
| GET | `/vehicles/{vehicleId}/history` | Sanctum | expediente | vehicle ID mismo tenant |
| PATCH | `/vehicles/{vehicleId}/status` | Sanctum | expediente admin | estado validado |
| PATCH | `/vehicles/{vehicleId}/service-orders/{orderId}/mileage` | Sanctum | expediente+orden branch | kilometraje validado |
| GET | `/branches/{branchId}/service-orders/{orderId}/document.pdf` | `RequireServiceDocumentAuth` | documentos de servicios, tienda+branch | order ID; PDF |
| GET | `/branches/{branchId}/service-orders/{orderId}/thermal` | `RequireServiceDocumentAuth` | documento t?rmico, tienda y sucursal | JSON, `paper_size` opcional 58 u 80 |
| GET | `/branches/{branchId}/vehicles/{vehicleId}/qr.svg` | `RequireServiceDocumentAuth` + scope servicio | expediente/branch; Sanctum | SVG `image/svg+xml`, privado |
| GET | `/branches/{branchId}/vehicles/{vehicleId}/label.pdf` | `RequireServiceDocumentAuth` + scope servicio | expediente/branch; Sanctum | query width_mm/height_mm, PDF privado |
| POST | `/branches/{branchId}/vehicles/{vehicleId}/rotate-qr` | middleware mismo + throttle 10/min | Store solamente | body vacío; invalida token anterior |
| POST | `/branches/{branchId}/vehicles/resolve-qr` | middleware mismo + throttle 30/min | expediente/branch; Sanctum | `{"code":"MTELMX:VEHICLE:V1:<token>"}` |
| GET | `/vehicle-brands`, `/vehicle-models`, `/vehicle-years`, `/vehicle-part-types` | `api.auth:sanctum`, `store.access` | `vehicle_catalog` y contexto comercial | filtros; modelos requiere marca |
| GET | `/products/search` | `api.auth:sanctum`, `store.access` | venta POS, tienda/sucursal | filtros tradicionales |
| GET | `/products/search-by-vehicle` | mismo grupo | catálogo vehicular/POS y almacén autorizado | filtros combinados, page/per_page |
| GET | `/admin/products/{product}/vehicle-compatibilities` | mismo grupo | compatibilidad producto | product ID, filtros branch conforme controller |
| PATCH | `/admin/products/{product}/automotive-details` | mismo grupo, admin autorizado | clasificar/editar marca | `{is_vehicle_universal?, commercial_brand?}` |
| POST/GET | `/products/import-with-vehicles[/{template}]` | mismo grupo | importación/exportación admin tienda | multipart file para import; template binario |
| POST/GET | `/vehicle-compatibilities/import[/{template}]` | mismo grupo | relaciones admin | multipart; export query `include_classification=1` |
| GET/PUT | `/reports/admin/settings` | Sanctum, `Store` | reporte/costos admin | PUT porcentajes; no POS |
| GET | `/reports/admin/weekly`, `/weekly/coverage`, `/monthly` | Sanctum, `Store` | reporte admin, tienda/branch autorizado | fechas / year+month; filtros; paginación semanal |
| GET | `/reports/admin/{weekly,monthly}/{pdf,excel}` | Sanctum, `Store` | descarga privada | mismos filtros de periodo |
| GET/PUT | `/pos/modules` | Sanctum POS | módulos visibles de terminal | body exacto en `PosModuleController` |
| GET | `/pos/modules/enabled` | Sanctum POS | capacidades configuradas POS | sin body |
| GET | `/public/storefront/{storeSlug}/capabilities` | público storefront | capacidades publicadas, no autorización privada | slug |

## Respuestas/códigos

La forma JSON es la que devuelve el controller/resource del endpoint; la tabla evita falsos DTO universales. Buscar el controller nombrado por ruta y sus Feature tests antes de fijar interfaces TypeScript. Listas paginadas conservan metadatos Laravel cuando el controller usa paginator. PDF/XLSX/SVG son binarios/texto, no JSON. Códigos comunes 401/403/404/422; conflictos de transición pueden variar según controlador. No asumir 409 uniforme.

## Contratos que requieren confirmación directa del validator

Nombres completos de horarios/excepciones, esquema `services.config`, payload de formulario dinámico, estructura de resolución QR, campos completos de creación/edición de vehículo, filtros/respuesta de todas las listas, y configuración POS. Ver código bajo `app/Http/Controllers/Api`, `app/Http/Requests`, `app/Services` y tests vinculados. El inventario deja intencionalmente esos DTOs sin inventar.

