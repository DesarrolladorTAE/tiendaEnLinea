# 45. Inventarios, precios y carrito POS

## Terminal y almacenes

`POST /pos/login` crea token Sanctum para `PosLocation`; `POST /pos/me` devuelve `id,store_id,name,code,interface_design,abilities` y configuración de recordatorio fiscal. Usar ese actor; no compartir token Store con POS ni AUTH_TOKEN con POS_TOKEN.

`GET /my-products-by-pos1?pos_location_id={id}` resuelve POS de la misma tienda del actor y carga su relación `warehouses` vía `pos_location_warehouse`. Envelope informa `allowed_warehouses` y cada producto `pos_inventory.allowed_warehouse_ids`. `show_unassigned_products=false` limita resultados a productos con inventario por almacén; true puede incluir productos generales con `branch_id=null` y no inventariados. Si no hay warehouse asignados y false, devuelve productos vacío.

La ruta tradicional sólo comprueba que el `pos_location_id` de query pertenece a la tienda del actor; no obliga al POS autenticado a usar su propio ID. Frontend debe usar exactamente `GET /pos/me.id` (o la identidad ya validada al login), no un selector de POS arbitrario.

El buscador vehicular privado permite `warehouse_id`: para Store compone almacenes activos de branch seleccionada (si no branch, almacenes de la tienda); para POS filtra por `pos_location_warehouse`, y si no existe pivote no considera almacenes. Un warehouse no autorizado da 404. `stock_status=in_stock|out_of_stock` actúa sobre existencia calculada en almacenes efectivos. El resultado vehicular presenta cantidad agregada `stock`/`available_stock` para los warehouses del contexto, no desglose por warehouse; con `warehouse_id` seleccionado restringe a ese uno. `variant_options[].available_stock` también agrega existencias permitidas.

Inventario de lotes: la expresión de stock suma `on_hand_qty - reserved_qty - quarantine_qty`, sólo lotes activos, no caducados y según policy/precisión. Fuera de inventario por lotes la consulta suma stock aggregate de simple/variants. `in_stock` es `available_stock>0`. No se reserva existencia en búsqueda.

**Advertencia de contrato de venta:** `PointOfSaleServiceV2` valida que el warehouse elegido esté activo y sea de misma tienda/branch del POS, además de stock suficiente, pero en el segmento inspeccionado no verifica la relación pivote `pos_location_warehouse`. La búsqueda sí restringe por ese pivote. No permitir que React eluda la lista autorizada; corresponde al backend validar pivot en venta si la policy requiere limitar también el servidor de cobro. No modificarlo dentro de esta actividad documental.

## Precio devuelto por el buscador vehicular

Campos: `price`, `price_requires_selection`, `price_source`, `variant_options[]`, `iva`, claves SAT, unidad. Origen `warehouse|product|selection_required`; variante puede usar `warehouse|variant|product`. Si hay variantes, `has_variants`, o producto con inventario warehouse sin un warehouse explícito, `price=null`, `price_requires_selection=true`. Con warehouse explícito, si existe columna `price` por warehouse, se usa; fallback a variante y producto. `iva`/SAT se copian del producto. Respuesta no calcula listas de precio ni promociones; no incluye un objeto de descuento/promoción. No incluye costo.

Precio es informativo para escoger SKU/variante/warehouse; no equivale a cotización inmutable. El `POST /v2/sales` recalcula precio original desde fila warehouse/variante/producto, aplica descuento recibido o descuento producto según el código, valida total y stock, calcula IVA y persiste importes. El campo `unit_price` puede enviarse por el contrato V2 y se toma como precio de línea; si se envía junto a `discount_percent`, ambos son aceptados según reglas de V2. Por eso frontend debe conservar validaciones UI/roles actuales del POS y no tratar el resultado de búsqueda como precio autorizado para override.

El buscador no resuelve promociones/listas de precio comerciales; esta búsqueda no debe introducir su cálculo. El precio final se materializa solo al confirmar venta V2 existente (`POST /v2/sales`), con almacén/variante y reglas actuales de servicio.

## Datos mínimos al carrito existente

No existe API de carrito en backend. El frontend puede adaptar un resultado al shape ya usado por POS; datos de backend disponibles:

```json
{"product_id":123,"variant_id":null,"quantity":1,"warehouse_id":7,"unit_price":"156.000000","discount_percent":"0.00"}
```

Para la venta V2, cada item acepta `product_id` requerido, `variant_id` nullable, `batch_id` nullable, `warehouse_id` nullable, `worker_id` nullable, `quantity` requerido decimal máx.3 (min .001), `unit_price` nullable decimal máx.6, `original_price` nullable decimal máx.6, `discount_percent` nullable 0–100 máx.2. Producto warehouse exige warehouse; variantes requieren variant_id. Este no es un contrato nuevo de carrito: adaptar al estado y componentes POS actuales.

La respuesta vehicular no contiene todos los campos fiscales/de carrito usados por V2 en un único shape (p. ej. lot/batch, trabajadores/selecciones de unidad extendida). Si se requieren, consultar el producto por endpoint POS existente o mantener la selección resultante del catálogo POS normal. Evitar mutar compra/costo desde frontend.

## Riesgos de exposición

`Product::toBranchArray()` usado por `/my-products-by-pos1` actualmente serializa `purchase_cost` en producto, almacén y variante; también `profit_factor`. El filtro recorta almacenes mostrados, pero no elimina esos campos. Documentar que React no debe mostrarlos; la API sí los transporta. Considerar esto un pendiente de minimización de datos/autorización, no resuelto por un permiso de vista.

El lookup puntual `/api/pos/products/{productId}` aplica allowlist POS y omite recursivamente esos campos sin alterar el serializador compartido; ver [72](72-consulta-puntual-producto-pos.md).

