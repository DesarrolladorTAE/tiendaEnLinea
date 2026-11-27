# Reconciliación de ventas y vínculo con órdenes de servicio

Actualización 2026-11-27: el vínculo mantiene el contrato descrito; los riesgos del token cross-tenant y warehouses V2 están corregidos en código y cubiertos por pruebas SQLite focalizadas (ver [anexo 75](75-integracion-operativa-pos-seguridad.md)). El precio V2 y ausencia de idempotencia continúan pendientes.

## Vínculo venta–orden

Ruta `POST /branches/{branchId}/service-orders/{orderId}/sale`, `auth:sanctum`. Controlador: `App\Http\Controllers\Api\ServiceOrderController::attachSale`; scope: `App\Services\Bookings\ServiceOperationScope`.

Body real: `{"sale_id": 481}` (`sale_id` requerido, integer, mínimo 1). El scope exige branch accesible, tienda activa/con acceso, módulo/feature `service_sales`/`ventas-de-servicios`, sucursal de la orden y, para POS, que su override de módulo no esté desactivado. La identidad POS se admite sin sesión administrativa.

El controlador valida venta dentro de la misma tienda, que tenga cliente igual al customer_id de la orden, que el POS de origen pertenezca a la misma tienda y sucursal, y que la venta no esté vinculada a otra orden. **No comprueba estado de venta, estado de pago, cancelación, devolución ni estado de orden** en este método. Por tanto, los estados abiertos/pagados/pendientes/crédito/cancelados/devueltos no tienen filtro explícito: si cumplen las relaciones, el método permite el vínculo. No se añade política comercial.

- Otro tenant: la búsqueda `Sale::where('store_id', branch.store_id)->findOrFail()` devuelve 404.
- POS de otra sucursal o cliente incompatible: 422 con `errors.sale_id`.
- Venta ya vinculada a otra orden: 422.
- Orden ya enlazada a otra venta: 409.
- Mismo `sale_id` repetido en la misma orden: respuesta idempotente; no vuelve a guardar ni crea `sale_attached` adicional.
- No hay operación de reemplazo ni desvinculación.
- El vínculo modifica `service_orders.sale_id` y agrega historial `sale_attached`; no ejecuta pagos, cobro, inventario ni cambios de estado comercial.

Respuesta: `{"data": <modelo ServiceOrder actualizado>}`. La ruta GET de detalle incorpora `sale` compacto con ids, cliente, POS, status y total, útil para reconciliar el resultado del vínculo.

Ejemplo ilustrativo de error de conflicto:

```json
{"message":"The given data was invalid.","errors":{"sale_id":["The sale id has already been taken."]}}
```

El mensaje exacto para cada error de dominio depende de la rama: cliente no coincide (“El cliente de la venta no coincide.”), sucursal (“La venta pertenece a otra sucursal.”), venta ya asociada a otra orden, o abort 409 si la orden tiene otro sale_id. La localización Laravel puede variar para reglas estándar.

## Consulta de ventas para recuperar una respuesta perdida

`GET /ventas/mis-ventas` (`SaleController::ventasDelPOSAutenticado`) limita por `pos_location_id = auth()->id()` y devuelve las ventas del POS autenticado, relaciones de cliente/items/pagos y orden descendente por creación. Acepta `fecha_inicio`, `fecha_fin`, `payment_method`; el método hace `get()` sin paginación. Es el mecanismo existente para reconciliación manual autorizado por terminal, pero no acepta un identificador de operación del cliente.

`GET /ventas/pos/historial` es otra ruta de historial sin filtro de POS según su nombre/handler `ventasDelPOSAutenticadoSinFiltro`; no usarla como búsqueda acotada sin revisar cuidadosamente su scope. La consulta del historial no es una recuperación inequívoca si se perdió el id: fecha/cliente/importe/estado son coincidencias heurísticas y puede haber duplicados legítimos.

La venta tiene `invoice_token` UUID generado por el modelo `Sale` al crear, pero se genera en servidor y no se puede conocer si la respuesta se pierde. En `POST /v2/sales` no se encontró `Idempotency-Key`, `external_id`, UUID del cliente ni referencia de operación en reglas/servicio. `invoice_token` no implementa idempotencia.

## Fallo parcial: cobro exitoso, enlace fallido

Las llamadas de creación de venta y enlace a orden son endpoints/transacciones independientes; no comparten transacción. Tras un timeout del vínculo:

1. Consultar la orden con `GET /branches/{branchId}/service-orders/{orderId}` y confirmar si `sale_id` ya coincide.
2. Consultar `GET /ventas/mis-ventas` con el token del POS e inspeccionar los registros de la terminal/periodo para identificar la venta.
3. Si se identificó inequívocamente y la orden no tiene otra venta, reintentar **solo** `POST .../sale` con el mismo `sale_id`. Repetir el mismo vínculo no agrega historial duplicado.
4. Si solo hay coincidencia por cliente/fecha/importe, no volver a cobrar automáticamente; solicitar reconciliación operativa.

No enviar otra creación de venta, pagos ni inventario durante reintento de vínculo.

## Idempotencia futura (propuesta, no implementada)

Agregar opcionalmente un `client_operation_id` (UUID) al POST V2, persistido en `sales` nullable con unicidad por `pos_location_id` y esa clave; validar también una huella del body para rechazar reutilización con contenido distinto. Una repetición idéntica debería devolver la venta original. Requiere autorización explícita y migración aditiva; no se incorporó.

## Producto puntual por ID (actualización)

Se agregó `GET /api/pos/products/{productId}` para bearer POS; deriva contexto del token, devuelve producto e inventario dentro de tienda, sucursal y warehouses activos asignados y omite costo/margen. No cambia el catálogo paginado. Ver [contrato y fixtures](72-consulta-puntual-producto-pos.md). El precio sigue siendo preliminar; no corrige la aceptación de precio del V2.

## Pruebas y certeza

`ServiceOperationsTest` contiene prueba de venta vinculada: cliente ajeno/venta duplicada rechazada; en ese test la identidad es Store, no POS. Las suites actuales pasaron, pero no se ejercitaron estados de venta ni token POS real para attachSale. Los estados no restringidos se concluyen por ausencia de validación en el método, no por pruebas por estado.

Ejecución actual: `VehicleCatalogTest`, `ProductSearchTest`, `ServiceOperationsTest`, `PosModulesTest` — **70 pruebas, 680 aserciones**, SQLite en memoria. Sin prueba V2, sin MySQL y sin servicio externo.
