# Integración operativa POS y correcciones de seguridad

Fecha: 2026-11-27. Este anexo complementa los contratos 33–53 y actualiza los hallazgos de token y almacenes. Se revisó el código Laravel y se añadieron pruebas SQLite aisladas. No se ejecutaron migraciones, ventas reales, solicitudes HTTP contra una instancia externa, MySQL, despliegues ni cambios de precios.

## Decisión de alcance

Clientes y expedientes son datos maestros a nivel de tienda. Una terminal autorizada puede consultar y registrar vehículos de su propia tienda aunque se hayan creado durante una operación de otra sucursal. No se añade `branch_id` a `vehicles`. En cambio, citas, disponibilidad, órdenes, capturas asociadas, documentos e historial operativo continúan acotados a la sucursal autenticada. Los PDFs históricos parten de la orden de esa sucursal y conservan snapshots; el POS no obtiene acceso a una orden ajena mediante el snapshot. El QR identifica el expediente y su resolución permanece autenticada; la consulta POS de QR/etiqueta requiere expediente relacionado con servicio de la sucursal.

## Módulos efectivos

| Capacidad | Clave | Gate de operación confirmado |
|---|---|---|
| Agenda, citas, recepción, órdenes | `service_sales` | `ServiceOperationScope`: tienda activa/con acceso, plan `ventas-de-servicios` incluido/limitado, sucursal activa de la terminal y override de terminal no desactivado. Configuración de servicios/agenda exige Store. |
| Expedientes y QR | `vehicle_records` | `VehicleFeature::recordsEnabled`, plan `ventas-de-servicios` y override POS. Expedientes compartidos dentro de la tienda; historial/documentos con sucursal del POS. Cambiar estado y rotar QR son Store-only. |
| Formularios | `service_forms` | `FormFeature`: tienda/plan, branch activo de terminal y override. Captura requiere orden de esa sucursal. Plantillas y asociaciones son Store-only. |
| Búsqueda especializada | `vehicle_catalog` | Contexto POS comprueba disponibilidad del catálogo, sucursal autenticada, override `vehicle_catalog` y override `sales`; producto visible e inventario limitado a warehouses activos asignados. Contexto por orden aplica además `service_sales` y requiere módulo `vehicle_records` si consulta vehículo. |
| Clientes | `customers` | El override ahora bloquea escrituras de gestión POS (`POST /clientesnew`, `POST /clientes/quick-store`, `PUT/PATCH/DELETE /clientes/{id}`) cuando la capacidad efectiva no es visible. Las lecturas de clientes permanecen disponibles para selección comercial, créditos y ventas pendientes. Store conserva administración. |
| Ventas | `sales` | Sigue el flujo V2 existente. La configuración visual del módulo no debe considerarse sustituto de validaciones de precio/inventario; estas son responsabilidad del servidor. |

La pantalla administrativa configura módulos con `PUT /api/pos/modules` (solo Store) y `pos_location_id` para override de terminal. POS solo consulta `GET /api/pos/modules` y `/api/pos/modules/enabled`. El resultado incluye `available`, `enabled`, `visible`, `source` y ahora `store_enabled`. En `service_sales`, `vehicle_catalog`, `vehicle_records` y `service_forms`, un override de terminal no puede habilitar una función desactivada en la tienda; Store debe habilitar primero el módulo y después asignarlo a terminales. `vehicle_catalog.visible` también se apaga si la terminal tiene `sales` deshabilitado. El cambio es aditivo en la respuesta; cada endpoint vuelve a comprobar su scope. Los registros existentes son `service_sales`, `vehicle_catalog`, `vehicle_records`, `service_forms`, `customers` y `sales`; no se agregaron claves ni tablas.

### Mapeo de plan de `vehicle_catalog`

`PosModuleService::PLAN_FEATURES` no asigna un feature slug a `vehicle_catalog`, mientras que expedientes y formularios usan `ventas-de-servicios`. No hay un slug vehicular independiente acreditado por el catálogo de planes revisado. No se cambió el mapeo para evitar retirar acceso comercial a tiendas existentes. Propuesta: aprobar un slug independiente (por ejemplo `catalogo-vehicular`), configurarlo de forma retrocompatible (ausencia de valor sigue concediendo el acceso actual) y mapearlo después a la disponibilidad del módulo. Requiere decisión comercial del plan; no se implementó.

## Token administrativo para abrir terminal POS

### Contrato preservado

`POST /api/admin/pos-token`, `Authorization: Bearer AUTH_TOKEN` de Store. Body `{"pos_id":101}`. Respuesta exitosa permanece `{"token":"<plainTextToken>"}`. El token conserva la ability existente `sell-only`.

Ahora la ruta comprueba identidad `Store`, `is_active`, `hasAccess()`, pertenencia del POS a `store_id` autenticado y pertenencia de su sucursal a esa misma tienda con `is_active=true`. Emite una sola credencial por solicitud. POS no puede invocar esta ruta.

La ability `sell-only` se guarda en Sanctum, pero las rutas de servicio se protegen hoy por `auth:sanctum` y scopes/módulos; no tienen middleware `abilities:`/`ability:`. Por tanto la string de ability no es por sí sola una barrera de autorización para endpoints de servicio. No se amplió ni cambió el contrato de abilities.

Tokens emitidos antes de esta corrección no se revocan automáticamente: la corrección impide nuevas emisiones cross-tenant pero no invalida credenciales existentes. Procedimiento propuesto: identificar terminal y tokens afectados desde `personal_access_tokens`, comprobar consumidores, coordinar rotación individual, probar login/impresión/integraciones de esa terminal y revocar solo sus filas de token (`tokenable_type=PosLocation`, `tokenable_id` concreto). No revocar masivamente producción. La ruta anterior emitía dos tokens por solicitud y devolvía uno; revisar token rows históricos por POS antes de decidir su limpieza.

## Almacenes en venta V2

`POST /api/v2/sales` sigue siendo el endpoint comercial existente. La fuente autoritativa es `pos_location_warehouse`, la misma relación de la que catálogo POS deriva `allowed_warehouse_ids` y `warehouse_inventories`. `warehouse_ids` de reportes de caja no autoriza cobros.

El preflight se ejecuta antes de invocar el creador de ventas; además, `PointOfSaleServiceV2::createSale` revalida dentro de su transacción para cerrar una revocación concurrente de la asignación. Para cada partida cuyo producto pertenezca a la tienda y use inventario por almacén, `warehouse_id` debe existir, estar activo, pertenecer a la tienda y sucursal de la terminal y tener asignación en `pos_location_warehouse`. Si el producto usa almacén y no se envía ID, se devuelve 422 en `items.{n}.warehouse_id`. Sin tabla/pivote no se considera autorizado ningún almacén.

Compatibilidad: productos con inventario tradicional a nivel de producto (`use_warehouse_inventory=false`) continúan sin requerir almacén; un `warehouse_id` ignorado por el contrato anterior para dichos productos no se usa ni causa rechazo. Las validaciones posteriores de producto, variante, lote, existencia, precios, descuentos e impuestos siguen en el servicio transaccional actual. Variantes y lotes heredan la autorización del almacén de la partida; no se modificó el mecanismo de descuento. Si falla una validación antes del servicio no existe escritura; las validaciones posteriores se ejecutan dentro de `DB::transaction` y deben revertirse conjuntamente.

| Caso | Resultado esperado por el nuevo gate |
|---|---|
| Warehouse activo asignado, misma tienda y branch, producto `use_warehouse_inventory=true` | Pasa autorización de almacén; continúan validaciones de stock/variante/lote/precio existentes. |
| Activo de misma sucursal no asignado a terminal | 422; venta no se invoca. |
| Otra sucursal, otra tienda o inactivo | 422; venta no se invoca. |
| Sin warehouse en producto con control por almacén | 422; venta no se invoca. |
| Producto sin control por almacén, como POS tradicional | Sin warehouse requerido; se conserva stock tradicional. |
| Varios warehouses asignados | Cada partida se valida individualmente; se admiten múltiples almacenes autorizados en la venta. |

## Precios y descuentos: riesgo aún abierto

No se cambiaron reglas comerciales. V2 acepta `unit_price`, `original_price` y `discount_percent` enviados por el cliente; recalcula importes e IVA usando el precio recibido y compara `total_amount` contra esos mismos valores. La comparación de total no certifica que el precio/descuento esté autorizado. `unit_price` puede ser 0; `discount_percent` admite hasta 100. `original_price` puede venir del cliente o derivarse de precio del warehouse, variante o producto. IVA sí deriva de `products.iva`. El servicio V2 no valida un cupón ni ejecuta un motor de promociones observado en este flujo.

El endpoint `POST /api/pos/perfil/verificar-password` solo comprueba contraseña de identidad Store; `PUT /api/pos/productos/{product}/descuento` cambia el precio/discount persistido y filtra `products.store_id` usando `user.id`; no constituye autorización por partida en checkout V2 y no se conectó al flujo. No hay una regla de permiso individual confirmada para precio manual/descuento.

Propuesta para autorización: mantener precios explícitos permitidos por operación legítima, pero resolver en servidor precio original por producto/variante/warehouse y reglas de cantidad/promoción/cupón; descartar el `original_price` no confiable. Cuando el cliente mande un precio distinto del calculado, exigir autorización comercial identificable según la política real existente (p. ej., credencial de supervisor que deje trazabilidad) o rechazar; el código revisado no ofrece un permiso de partida reutilizable. Confirmar topes, rol autorizado y promociones antes de implementarlo. Forzar precio base de catálogo sin esa confirmación podría romper ventas con precios por sucursal, variante o volumen. Este riesgo **bloquea habilitar el checkout especializado en producción**.

## Estado de terminal e idempotencia: propuestas, sin esquema nuevo

No hay `is_active` en el modelo `PosLocation` ni campo de estado de terminal encontrado; el login compara código/access code y acceso de tienda, no un estado de POS. Deshabilitar `service_sales` o revocar token no representa desactivación comercial completa. Propuesta mínima, pendiente de autorización de esquema: columna aditiva `pos_locations.is_active` default true; administración para activar/desactivar; login la rechaza; validación central en autenticación POS rechaza también tokens ya emitidos. Desactivar no borra configuración ni ventas. Para que sea efectiva debe aplicarse a rutas POS, no solo al endpoint login.

V2 no presenta clave de idempotencia del cliente ni identificador de operación. La `invoice_token` generada al crear no es recuperable si se pierde la respuesta. Propuesta retrocompatible pendiente de esquema/cobro: columnas nullable `sales.pos_operation_id` UUID y `pos_operation_hash`, índice único `(pos_location_id, pos_operation_id)` (NULL permite ventas antiguas). La transacción reclama la clave antes de pagos/movimientos; repetición con mismo hash devuelve venta original, clave con hash distinto responde 409; una colisión simultánea se resuelve consultando la fila única ya confirmada. Requiere almacenar respuesta/recurso suficiente y asegurar que pago/inventario/WhatsApp no se repitan. No implementar hasta aprobar esquema y contrato.

## Rutas operativas relevantes

Las operaciones y métodos exactos se listan en los documentos 33–49. Resumen:

- `auth:sanctum`: agendas, órdenes, formularios, vehículos y módulos POS; POS usa bearer propio, no AUTH_TOKEN.
- `service_sales`: rutas `/branches/{branchId}/bookings*` y `/service-orders*`.
- `service_forms`: `/service-orders/{orderId}/forms*`; el `orderId` debe ser de la sucursal de terminal.
- `vehicle_records`: `/vehicles*` y documentos QR; modelo/cliente/vehículo se aíslan por tienda.
- `vehicle_catalog`: `GET /products/search-by-vehicle` bajo `api.auth:sanctum` y `store.access`.
- Administración exclusiva Store: configurar servicios/booking-config, recursos, plantillas/asociaciones, cambiar estado de expediente, rotar QR y `PUT /pos/modules`.
- Documentos operativos exigen Sanctum, scope de sucursal y `Cache-Control: private, no-store`.

La emisión cross-tenant se corrige en `/admin/pos-token`, pero el endpoint `/pos/login` todavía no consulta estado activo de terminal porque no existe tal atributo.

## Pruebas

Resultados de esta entrega, todos con SQLite en memoria y datos inventados:

| Comando | Resultado |
|---|---|
| `php artisan test --filter=PosTokenIssuanceTest` | 4 pruebas, 15 aserciones aprobadas. Propia, ajena, tienda inactiva/sucursal inactiva, un token y POS actor rechazado. |
| `php artisan test --filter=PosProductLookupTest` | 7 pruebas, 36 aserciones aprobadas. Incluye almacén asignado, no asignado, otra sucursal, tienda, inactivo, warehouse requerido, tradicional y fallo antes del writer. |
| `php artisan test --filter=PosModulesTest` | 7 pruebas, 52 aserciones aprobadas. Incluye override `customers` que bloquea escrituras de gestión. |

Esto no es MySQL ni HTTP externo. Pruebas de servicio cubren autorización del almacén y test HTTP Feature comprueba que el writer no se llama antes de rechazo; no simulan decrementos V2 exitosos para cada variante/lote. El flujo completo autorizado de venta, rollbacks por errores posteriores y concurrencia requiere schema aislado MySQL/Laravel.

## Pendientes de activación

1. Resolver la autorización de precios/descuentos sin romper precios legítimos.
2. Corregir/verificar almacenes bajo MySQL real y flujo V2 completo; estas pruebas SQLite verifican el preflight, no locking del motor.
3. Decidir esquema/contrato de terminal activa e idempotencia antes de implementarlos.
4. Probar el recorrido de login POS, `CheckStoreAccess`, búsqueda, orden y vínculo con bearer real en entorno Laravel aislado.
5. No activar nuevas operaciones POS en producción mientras los puntos 1, 2 y 4 sigan abiertos.
