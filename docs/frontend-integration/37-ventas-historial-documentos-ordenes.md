# 37. Ventas vinculadas, historial y documentos de órdenes

> Evidencia de fase 5 pendiente de cotejo con la revisión operativa de Laravel. Este anexo conserva el contrato reportado en la entrega previa. Consulta [fuente y certeza](README.md#fuente-y-certeza).

Fuentes: `ServiceOrderController`, `ServiceOperationScope`, `ServiceOrderHistory`, `ServiceDocumentController`, `ServiceDocumentData`, rutas y pruebas Feature `ServiceOperationsTest`/`ServiceDocumentsTest`.

## Vincular venta existente

`POST /branches/{branchId}/service-orders/{orderId}/sale`, Sanctum, Store/POS mismo scope service_sales. JSON `{ "sale_id": 410 }`, required integer≥1. Sale debe estar en la tienda, tener `client_id` igual al `order.customer_id`, tener `pos_location_id` que pertenezca a la tienda y branch de ruta, y no estar ya ligada a otra orden. Venta inexistente/otra tienda: 404; cliente/branch inválidos/venta usada: 422 en `errors.sale_id`. Transacción bloquea order y sale. Si order ya trae otra sale, 409. Misma venta repetida sobre misma orden retorna `{data:order}` sin evento duplicado. Success 200 order con `sale_id`; history evento `sale_attached`, metadata `{sale_id}`. No modifica cobro, estatus de venta o venta; no existe unlink/replace ni vínculo multiple por order.

### Búsqueda elegible

Existe `GET /admin/ventas` bajo `api.auth:sanctum` → `SaleController::index2`, Store scope (`auth()->id()`), acepta `fecha_inicio`, `fecha_fin`, `pos_location_id`; solo aplica rango si ambos están presentes; salida JSON lista no paginada con `id,store_id,pos_location_id,total_amount,paid_amount,status,created_at,invoice_id,items_count` y POS. No filtra `client_id`, branch autorizada ni eligibilidad para servicio; puede resultar fuente demasiado amplia. `GET /sales/{sale}` usa api.auth y devuelve venta con items/productos, no contrato de búsqueda elegible. No hay endpoint de búsqueda que garantice venta elegible por order/cliente/branch; UI puede usar el listado autorizado y dejar que POST vinculación valide, pero no mostrarla como elegible hasta tener confirmación. No se debe usar el buscador de venta POS para alterar cobro.

Cancelación/devolución de venta vinculada: `ServiceOrderController` no escucha esos eventos ni desvincula/actualiza order. No asumir cambio de estado de orden o reembolso por el vínculo.

## Historial

No existe endpoint independiente `/service-orders/{id}/history`. Detail `GET /branches/{branchId}/service-orders/{orderId}` eager-load completo `history`; es relación Eloquent sin paginación ni `orderBy` declarado, así que no depender de orden estable contractual. Cada fila del modelo `ServiceOrderHistory` expone `id,service_order_id,status_id,user_id,event_type,description,metadata,created_at,updated_at`; `metadata` cast array. `status_id` es estado de la orden al registrar el evento, no un campo explícito `previous_status/new_status` universal. Cancellation agrega `previous_status`; no todos los events guardan transición antes/después.

Eventos observados por código: `created` (`request_hash`, `document_snapshot`, y al convertir `booking_id`); `updated` (`fields`); `started`; `completed`; `cancelled` (reason en description, `previous_status`); `resource_assigned` (`previous_resource_id,resource_id,technician_snapshot`); `sale_attached` (`sale_id`); `mileage_recorded` (`previous_mileage,visit_mileage`); `form_completed/form_cancelled` cuando hay soporte de metadata. `ServiceOperationScope::history` añade `actor_type` (`store` o `pos`) y `actor_id`; `user_id` solo cuando actor sea User, aunque scope operativo actualmente rechaza ese tipo. No existen snapshots completos de venta, respuestas de formulario en evento ni referencia a PDF.

Fixture ilustrativo:

```json
{"data":{"id":77,"order_code":"SO-AB12","status":{"code":"in_progress"},"history":[{"id":1,"service_order_id":77,"status_id":1,"user_id":null,"event_type":"created","description":"Atención inmediata creada.","metadata":{"actor_type":"store","actor_id":3,"document_snapshot":{"service":"Inspección","branch":"Centro","technician":"Técnico 1"}},"created_at":"2026-11-26T09:00:00Z"},{"id":2,"service_order_id":77,"status_id":2,"user_id":null,"event_type":"started","description":"Atención iniciada.","metadata":{"actor_type":"pos","actor_id":9},"created_at":"2026-11-26T09:10:00Z"},{"id":3,"service_order_id":77,"status_id":2,"user_id":null,"event_type":"resource_assigned","description":"Recurso actualizado.","metadata":{"previous_resource_id":6,"resource_id":8,"technician_snapshot":"Técnico 2","actor_type":"store","actor_id":3},"created_at":"2026-11-26T09:20:00Z"},{"id":4,"service_order_id":77,"status_id":2,"user_id":null,"event_type":"mileage_recorded","description":"Kilometraje de la visita registrado.","metadata":{"previous_mileage":null,"visit_mileage":48210,"actor_type":"pos","actor_id":9},"created_at":"2026-11-26T09:30:00Z"}]}}
```

## PDFs operativos

`GET /branches/{branchId}/service-orders/{orderId}/document.pdf` genera `orden-{order_code}.pdf`; `GET /branches/{branchId}/service-orders/{orderId}/forms/{submissionId}/document.pdf` genera `formulario-{folio}.pdf`. Sanctum + `RequireServiceDocumentAuth` + branch/order scope; formulario agrega FormFeature. PDF 200 `application/pdf`, `private, no-store`, `nosniff`; sin body/query. No status gate explícito: formulario debe estar relacionado con la orden; documento refleja estado actual/histórico y solo lista completed submissions al mostrar formularios dentro del PDF de orden. Respuestas/schemas de formulario leídos de snapshots, no template vigente. Errores 401 sin Sanctum, 403 gate/module, 404 order/submission/branch ajena; render failure puede 5xx. No hay endpoints separados para comprobantes de recepción/finalización ni list documents.

## Payload térmico

`GET /branches/{branchId}/service-orders/{orderId}/thermal?paper_size=58` (tamaño opcional integer 58 u 80; default desde settings, fallback80; `pos_location_id` opcional integer≥1, debe estar en misma tienda+branch y POS no puede elegir otra terminal). Respuesta JSON `{ "ok":true,"payload":{...}}`, `Cache-Control: private,no-store`; no PDF ni `Content-Type` de impresora.

```json
{"ok":true,"payload":{"transport":"usb","action":"print","paper":{"size":58,"charsPerLine":32},"printer":{"ip":"","port":9100},"textBeforeQr":"COMPROBANTE DE SERVICIO\nOrden: SO-AB12\nSucursal: Centro\nFecha: 26/11/2026 09:00\nServicio: Inspección\nEstado: En proceso\nCliente: Cliente ficticio\nVehículo: Nissan Versa\nTécnico: Técnico 2\nDocumento operativo; no acredita pago.\n","textAfterQr":"","qrs":[],"qrText":"","cut":true,"openDrawer":false,"logo":null,"meta":{"document_type":"service_receipt","service_order_id":77,"store_id":3,"branch_id":12},"app_type":"windows_usb"}}
```

80mm usa defaults chars/line 48, 58mm usa 32 salvo setting; ambos ajustan configuración válida 16–64. 72 produce 422. Este endpoint arma un payload operativo separado de ticket comercial y no comunica con impresora. Impresión física y compatibilidad Android/Windows no quedan comprobadas ni se modifica PrintBridge. `ServiceDocumentsTest::test_documents_use_saved_snapshots_after_master_data_changes` verifica PDFs privados basados en snapshots y aislamiento; `test_thermal_receipt_is_operational_and_paper_sizes_are_validated` verifica 58/80, rechazo de 72 y autenticación.
