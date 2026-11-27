# 49. Fixtures del buscador POS

Los valores son ficticios y los cuerpos ilustrativos derivados del código; no son respuestas capturadas en todos los casos. Búsqueda/clasificación/warehouse/import tienen evidencia Feature en `VehicleCatalogTest`; búsqueda Store tradicional en `ProductSearchTest`. En el resultado el costo de compra se omite intencionalmente para no normalizar un campo que no necesita el frontend; el endpoint tradicional puede transportarlo hoy.

## Buscar POS tradicional

```http
GET /api/my-products-by-pos1?pos_location_id=6&q=balata&category_id=2&page=1&per_page=12
Authorization: Bearer <token-sanitizado-de-terminal>
```

```json
{"ok":true,"store_id":3,"branch_id":12,"pos":{"id":6,"name":"Mostrador","show_unassigned_products":false,"allowed_warehouses_count":1,"allowed_warehouses":[{"id":7,"name":"Bodega principal"}]},"products":[{"id":"123","sku":"000123","name":"Balata delantera","price":"156.00","iva":"0.1600","oe_number":"OE-001","stock":"8.000","use_warehouse_inventory":true,"warehouse_inventories":[{"warehouse_id":7,"warehouse_name":"Bodega principal","qty":8,"price":156}],"category_ids":[2],"categories":[{"id":2,"name":"Frenos"}],"pos_inventory":{"use_warehouse_inventory":true,"show_unassigned_products":false,"allowed_warehouse_ids":[7]}}],"meta":{"page":1,"per_page":12,"total":1,"last_page":1}}
```

Fixture derivado de `myProductsByPos1`; producto incluye más atributos de `Product::toBranchArray` (including purchase_cost) than abridged JSON.

## Search compatible (query manual)

```http
GET /api/products/search-by-vehicle?branch_id=12&brand_id=4&model_id=18&year=2020&q=balata&sku=000123&commercial_brand=Marca%20X&stock_status=in_stock&warehouse_id=7
```

```json
{"current_page":1,"data":[{"id":123,"branch_id":12,"sku":"000123","name":"Balata delantera","description":"Juego delantero","commercial_brand":"Marca X","barcode":"7500000000123","price":156,"price_requires_selection":false,"variant_options":[],"price_source":"warehouse","iva":0.16,"clave_producto_sat":"","clave_unidad_sat":"","unidad_medida_id":1,"unit_of_measure":"Pieza","stock":8,"available_stock":8,"in_stock":true,"categories":[{"id":2,"name":"Frenos"}],"compatibilities":[{"id":41,"brand_id":4,"vehicle_brand":"Nissan","model_id":18,"vehicle_model":"Versa","year_from":2015,"year_to":2022}],"matching_compatibilities":[{"id":41,"brand_id":4,"vehicle_brand":"Nissan","model_id":18,"vehicle_model":"Versa","year_from":2015,"year_to":2022}],"compatibility_status":"compatible","year_unconfirmed":false,"is_vehicle_universal":false,"image":null,"has_vehicle_compatibilities":true,"vehicle_compatibilities_count":1}],"first_page_url":"…","from":1,"last_page":1,"last_page_url":"…","links":[],"next_page_url":null,"path":"…","per_page":20,"prev_page_url":null,"to":1,"total":1,"catalog_settings":{"vehicle_feature_available":true,"catalog_search_mode":"both","vehicle_compatibilities_enabled":true},"search_context":{"vehicle_id":null,"service_order_id":null,"year_confirmed":true}}
```

**No llamar desde POS antes de resolver `store.access` middleware gap**. Test controller path did exercise PosLocation only while middleware was disabled.

## Explicit universal

Query selection should include `include_universal=1`; if also want matching parts, send `include_compatible=1`.

```json
{"data":[{"id":124,"sku":"000124","name":"Aceite universal","compatibilities":[],"matching_compatibilities":[],"compatibility_status":"universal","year_unconfirmed":false,"is_vehicle_universal":true,"available_stock":0,"in_stock":false,"price":null,"price_requires_selection":true,"price_source":"selection_required","variant_options":[]}] ,"total":1}
```

## Unknown / no year

```json
{"data":[{"id":125,"sku":"000125","name":"Pieza con rango registrado","compatibility_status":"unknown","year_unconfirmed":true,"is_vehicle_universal":false,"matching_compatibilities":[{"id":42,"brand_id":4,"vehicle_brand":"Nissan","model_id":18,"vehicle_model":"Versa","year_from":2015,"year_to":null}]}],"total":1}
```

## Expediente u orden

```http
GET /api/products/search-by-vehicle?service_order_id=77&q=filtro&include_compatible=1
```

`search_context` success illustrative: `{"vehicle_id":82,"service_order_id":77,"year_confirmed":true}`. Snapshot year/brand/model governs. `vehicle_id` solo: `?vehicle_id=82&sku=000125`. Never add conflicting `year/brand_id/model_id`; 422 `errors.field`.

## Sin stock / almacén no permitido

With `stock_status=out_of_stock`, product can be returned only if other filters/context include it; `available_stock:0,in_stock:false`. `warehouse_id` outside effective list: 404 (Laravel may return standard Not Found body). No other warehouse values should be copied from an unauthenticated UI.

El listado POS tradicional puede presentar el desglose por warehouse ya ligado:

```json
{"pos":{"id":6,"allowed_warehouses_count":2,"allowed_warehouses":[{"id":7,"name":"Bodega principal"},{"id":8,"name":"Bodega mostrador"}]},"products":[{"id":"123","sku":"000123","name":"Balata delantera","pos_inventory":{"allowed_warehouse_ids":[7,8]},"warehouse_inventories":[{"warehouse_id":7,"warehouse_name":"Bodega principal","qty":8,"price":156},{"warehouse_id":8,"warehouse_name":"Bodega mostrador","qty":3,"price":158}]}],"meta":{"page":1,"per_page":12,"total":1,"last_page":1}}
```

Illustrative shape derived from `toBranchArray`; `/products/search-by-vehicle` instead returns aggregate stock unless `warehouse_id` selects one. An unassigned warehouse query fails HTTP 404; no payload shape is guaranteed by `abort(404)`.

No stock, price selection required (illustrative):

```json
{"id":126,"sku":"000126","name":"Filtro especial","available_stock":0,"stock":0,"in_stock":false,"price":null,"price_requires_selection":true,"price_source":"selection_required","variant_options":[]}
```

## Cart mapping

```json
{"product_id":123,"variant_id":null,"quantity":"1.000","warehouse_id":7,"unit_price":"156.000000","discount_percent":"0.00"}
```

Fields shown are the V2 sale item shape, not a cart API. The frontend passes item to existing POS state, not POST until customer confirms sale.

## Venta creada

```json
{"message":"Venta registrada correctamente (V2).","sale":{"id":901,"store_id":3,"pos_location_id":6,"client_id":14,"status":"paid","total_amount":"156.000000","paid_amount":"156.000000","items":[{"product_id":123,"variant_id":null,"warehouse_id":7,"quantity":"1.000","unit_price":"156.000000","unit_cost_at_sale":"80.000000"}],"payments":[{"method":"efectivo","amount":"156.000000"}]},"total_amount":"156.000000","iva_total":"21.517241","isr_retention_applied":false,"isr_retention_total":"0.000000","net_total_amount":"156.000000","payments":[],"change_amount":null,"whatsapp":{"attempted":false,"sent":false},"document_settings":{},"document_action":{}}
```

Production JSON depends on loaded model relations and schema. HTTP 201. This example does not guarantee cost column exists in every deployed schema.

## Venta creada, asociación rechazada

Sequence: V2 returns HTTP 201 with `sale.id=901`; subsequent attach body `{ "sale_id": 901 }` can return HTTP 422 when sale client differs from order customer:

```json
{"message":"The given data was invalid.","errors":{"sale_id":["El cliente de la venta no coincide."]}}
```

The sale is already created. Keep `901`, show partial completion, inspect order and retry only the association if appropriate. Never repeat V2 sale POST.

## Orden y vínculo

```http
GET /api/branches/12/service-orders/77
POST /api/branches/12/service-orders/77/sale
{"sale_id":901}
```

After link, `GET order` returns `data.sale_id=901` and compact `data.sale` relation. Successful post returns updated `data` order. Duplicate after timeout: read order; if sale_id matches do not repeat charge. Otherwise retry only association.

Vínculo exitoso confirmado por `ServiceOperationsTest::test_sale_link_rejects_foreign_client_and_duplicate_order` en HTTP 200; el cuerpo es `{"data":<ServiceOrder raw>}`. Cuando la orden pertenece a otra branch/tienda, POST lookup queda scopeado y responde 404; no asumir mensaje exacto. El error 422 `La venta pertenece a otra sucursal.` se refiere a venta cuyo POS terminal no es de la branch de ruta.

## Módulo deshabilitado

HTTP 403. Si falla `VehicleFeature::available`, el abort usa el mensaje `El catálogo vehicular no está habilitado para esta tienda.`; envelope JSON completo depende del exception handler. Render traditional POS search and handle endpoint 403, but do not infer that public `catalog_settings` grants authorization.

## Error fixtures

```json
{"message":"The given data was invalid.","errors":{"model_id":["The selected model id is invalid."]}}
```

Illustrative Laravel 422 envelope; exact validation message may be localized by rule. Cross-context mismatch messages observed in source include `El filtro contradice el vehículo registrado.` and map to `errors.year|brand_id|model_id`. Foreign order/vehicle usually scoped 404. Conflicting sale link: HTTP 409; validation errors for customer mismatch or sale already linked elsewhere: 422 `errors.sale_id`.

## Evidence map

- Feature assertions: `VehicleCatalogTest` phase 6 tests for filter classification, warehouse scope, historic snapshot precedence, POS warehouse visibility, large result pagination/no duplicates, and phase-8 Excel classification roundtrip.
- Feature assertions: `ProductSearchTest` tests exact/prefix search, OE optional, pagination, scope, no writes, and warehouse stock.
- Fixture-only: combined POS sale/attach response and cart adaptation; shown here as contract-derived JSON, not result emitted by a run in this delivery.

