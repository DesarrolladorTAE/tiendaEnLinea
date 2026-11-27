# Validación de almacenes y precios durante el cobro POS

## Estado actualizado (2026-11-27)

La autorización de warehouses de V2 ya se implementó: el preflight valida la asignación `pos_location_warehouse` antes del writer y el servicio la repite dentro de la transacción. Los escenarios de almacén no autorizado ya no se aceptan en el código actual. Pruebas Feature SQLite añadidas: 7 aprobadas/36 aserciones en `PosProductLookupTest`; el HTTP de rechazo confirma que no se llama al escritor y que no cambia stock. El resultado no es una venta exitosa V2 real ni evidencia MySQL. El análisis debajo queda como antecedente del hallazgo. El precio arbitrario sigue abierto y bloquea habilitación; detalles en [anexo 75](75-integracion-operativa-pos-seguridad.md).

## Análisis previo a la corrección

## Ruta y fuente de identidad

`POST /v2/sales` → `App\Http\Controllers\Pos\SaleV2Controller::store` → `PointOfSaleServiceV2::createSale`. Middleware declarado: `auth:sanctum`. La ruta no añade `store.access`. El controller toma `$request->user()` como terminal, obtiene su tienda y asigna `store_id`, `pos_location_id` y `channel=pos` desde esa identidad, no del body.

## Configuración de almacenes: nombres y significado

- `pos.allowed_warehouses` es una salida JSON informativa de `GET /my-products-by-pos1`: lista `{id,name}` derivada de la relación `PosLocation::warehouses` / tabla pivote `pos_location_warehouse`.
- `pos_inventory.allowed_warehouse_ids` en cada producto es la misma allowlist serializada para que la UI filtre datos; no es una autorización del cobro.
- `warehouse_ids` aparece en operaciones de configuración/reporte de caja (por ejemplo `PosCashController`) y no es el campo de autorización que `PointOfSaleServiceV2` consulta durante el cobro.
- El endpoint de listado recibe `pos_location_id` como query parameter y solo compara que el POS seleccionado pertenezca a la misma tienda del actor. No exige que un actor POS use su propio id. Un token de terminal puede por tanto consultar productos/almacenes permitidos de otra terminal de su misma tienda. Recomendación mínima: para actor `PosLocation`, fijar el id al actor autenticado; no se modificó.
- El servicio de venta V2 valida `warehouse_id` contra almacén activo de la misma tienda y, si la terminal tiene branch_id, la misma sucursal. **No verifica el pivote `pos_location_warehouse`**. Una terminal puede enviar un almacén activo de su misma sucursal no asignado a ella y el código permite usarlo si hay stock.

### Resultados por escenario solicitados (derivados del validador/servicio; no son ejecución HTTP)

| Almacén enviado | Resultado esperado según código | Persistencia |
|---|---|---|
| uno de dos almacenes asignados, tienda/sucursal correctas, activo y con stock | aceptado | decremento en ese almacén |
| misma sucursal, misma tienda, activo pero **no asignado a terminal** | **aceptado: brecha comprobada** | puede descontar stock |
| otra sucursal de la misma tienda | 422 `warehouse_id` (“no pertenece a la sucursal del POS”) | excepción dentro de transacción; se revierte el alta de venta/items/pagos/inventario |
| otra tienda | 422 `warehouse_id` (“Almacén inválido para esta tienda”) | transacción revierte |
| inactivo | 422 `warehouse_id` (“Almacén inválido para esta tienda”) | transacción revierte |
| sin almacén en producto con `use_warehouse_inventory` | 422 (“Debes seleccionar almacén…”) | transacción revierte |

No se envió una petición manipulada real. La aceptación de almacén de la misma sucursal no asignado es una conclusión directa de la consulta faltante en `PointOfSaleServiceV2`. No se registró evidencia de venta parcial en los escenarios rechazados; `createSale()` envuelve la operación en `DB::transaction`, y las validaciones listadas lanzan excepción. Debe añadirse una prueba transaccional de conteos de venta, partidas, pagos y existencias antes de cerrar el riesgo.

**Corrección mínima propuesta, pendiente de autorización para cambiar lógica comercial:** validar `warehouse_id` contra el pivote del `$posUser->id` además de tienda/sucursal/activo, dentro de la misma transacción, antes de consultar precio o descontar. No ampliar `warehouse_ids` como alternativa implícita.

## Precios que se envían a V2

El controller acepta por partida:

- `unit_price`: nullable, numérico, >= 0, hasta 6 decimales.
- `original_price`: nullable, numérico, >= 0, hasta 6 decimales.
- `discount_percent`: nullable, 0–100, hasta 2 decimales.
- `quantity`: requerida, >= 0.001, hasta 3 decimales.
- `warehouse_id`: nullable integer.

`PointOfSaleServiceV2` determina precio original de `original_price` enviado cuando viene, si no precio de inventario de ese almacén, precio de variante o `products.price`. Si se manda `unit_price`, el servicio lo utiliza como precio descontado; con `discount_percent` también presente conserva ambos valores. Sin `unit_price`, aplica el porcentaje enviado o el descuento guardado en el producto. El importe total e IVA se recalculan usando el precio recibido y el IVA del producto; el cliente debe enviar `total_amount` que coincida con esa suma. Esto es una comprobación aritmética, no una verificación de que el precio/descuento haya sido autorizado por catálogo o por permiso.

**Conclusión:** una petición manipulada puede registrar un `unit_price` arbitrario >= 0 (y `original_price`/descuento también), coordinando `total_amount`. En el flujo inspeccionado no se vuelve a obtener ni rechazar el precio final del servidor, no se comprueba permiso de override ni descuento máximo, y no se aplica un motor de promociones aquí. Los impuestos se calculan desde `product.iva`; usa decimal/bcmath y persistencia monetaria a seis decimales. Retenciones ISR se resuelven con configuración del cliente/tienda en servicio. No modifica reglas fiscales en esta revisión.

El buscador vehicular expone precio y stock preliminares; la respuesta no constituye autorización para aceptar un `unit_price` del frontend. La brecha está en la recepción del cobro V2, no en la búsqueda.

## Seguridad y consistencia

El controller convierte errores de validación del servicio a HTTP 422 `{"message":"Error de stock / almacén","errors":{...}}`; otros throwables se convierten en HTTP 500 genérico. El total distinto al calculado con los valores recibidos causa 422 y rollback. La ruta no valida en sí acceso de plan/módulo/Store activo y no valida el pivote de almacén.

## Pruebas y alcance

La ejecución del conjunto aislado de cuatro suites dio 70 passed/680 assertions. No contiene prueba de `POST /v2/sales`, ni cubre almacén mismo-branch no asignado ni manipulación de unit_price. No existe aquí evidencia de prueba MySQL ni de HTTP externa.

## Dictamen

Riesgo **alto/crítico para habilitar cobro POS con terminales**, por autorización de almacén incompleta y precio enviado aceptado. No corregido en esta entrega porque la instrucción prohíbe cambiar lógica comercial sin autorización. Pruebas mínimas requeridas antes de habilitar: rechazo de almacén no asignado; rollback completo en fallos; fuente del precio del servidor/permiso explícito de override; y test de aislamiento de ruta con POS token.
