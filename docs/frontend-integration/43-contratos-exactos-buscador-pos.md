# 43. Contratos exactos del buscador y POS

## Hallazgo que condiciona la integración

Hay tres rutas distintas que no deben confundirse:

1. `GET /products/search` (`ProductSearchController`) es búsqueda privada de cuenta Store. Está en `api.auth:sanctum` + `store.access`; el controlador exige `request.user instanceof Store`. No es la búsqueda POS.
2. `GET /my-products-by-pos1` es el catálogo/búsqueda POS paginado. Está solo bajo `auth:sanctum`; usa `pos_location_id` query, catálogo y almacenes del POS. La ruta legacy `GET /my-products-by-pos` descarga productos de la branch sin paginar ni filtrar por almacén en su respuesta.
3. `GET /products/search-by-vehicle` es el buscador vehicular privado dentro de `api.auth:sanctum` + `store.access`. `CheckStoreAccess` comprueba los guards Sanctum `store-api` y `pos-api`; en el segundo obtiene la tienda de `PosLocation` y requiere `store->hasAccess()`. `VehicleCompatibilityService::context()` acepta POS, obliga su branch y rechaza override terminal disabled para los módulos `vehicle_catalog` o `sales`. Por tanto el código permite la identidad POS si token/guard y tienda son válidos. Aun así, `VehicleCatalogTest` retira explícitamente `CheckStoreAccess`, por lo que la suite no verifica el recorrido token→middleware→controlador; registrar como cobertura de middleware pendiente, no como ruta inexistente.

La ruta pública `/public/storefront/{branchSlug}/{vehicleAction}` es otra superficie: solo consulta productos visibles/configuración pública y no debe servir para recuperar almacenes, existencia privada, expediente u órdenes.

## Búsqueda Store tradicional

`GET /products/search`, `ProductSearchController::__invoke`, Middleware `api.auth:sanctum`, `store.access`; identidad efectiva Store. Parámetros:

| Query | Validación/efecto |
|---|---|
| `q` | requerido string máx.255; trim; no vacío; prefijo de nombre/SKU/OE; wildcards escapados |
| `branch_id` | nullable integer ≥1, debe pertenecer a Store; omitido consulta todas sus branches |
| `field` | opcional `all|name|sku|oe_number`, default `all` |
| `page` | integer ≥1, default 1 |
| `per_page` | integer 1–100, default 20 |

Ordena coincidencia exacta antes y después `name,id`, paginación Laravel determinista y elimina duplicados por UNION. Incluye valores almacenados de precio/costo/factor/impuesto y cantidades warehouse calculadas para la página; la lista de almacenes de esta ruta se limita a tienda/sucursal de producto, no es un contrato POS-terminal. No buscar por barcode/category/commercial brand en este endpoint.

Respuesta paginada Laravel: `current_page,data,first_page_url,from,last_page,last_page_url,links,next_page_url,path,per_page,prev_page_url,to,total`. `data[]` conserva campos seleccionados del producto como `id,branch_id,name,sku,oe_number,profit_factor,purchase_cost,base_price,price,iva,visible,has_variants,use_warehouse_inventory`; puede agregar `vehicle_compatibilities_count,has_vehicle_compatibilities`, `warehouse_stocks[]` (`warehouse_id,warehouse_name,qty`) y en productos por lote `batch_tracking_enabled,expiration_required,available_qty` (y `available_qty` por almacén). La precisión/forma puede aparecer numérica al serializar.

Para mantener una búsqueda tradicional de POS sin catálogo vehicular, React debe seguir consumiendo `/my-products-by-pos1`/contrato POS existente y no llamar a la ruta vehicular. El módulo no altera automáticamente el endpoint tradicional.

## Búsqueda POS tradicional paginada

`GET /my-products-by-pos1` → `ProductController::myProductsByPos1`, `auth:sanctum` (token Sanctum de terminal o Store). Query: `pos_location_id` requerido entero efectivo (ausencia 422); `q` opcional recortado, busca nombre/SKU; `category_id` opcional; `page` default1; `per_page` default12, no positivo vuelve a12, máximo200. No busca barcode ni OE en el código mostrado. Respuesta `{ok,store_id,branch_id,pos,products,meta}`; `meta={page,per_page,total,last_page}`. `pos` incluye `id,name,show_unassigned_products,allowed_warehouses_count,allowed_warehouses[{id,name}]`. Producto sale por `Product::toBranchArray()` más `category_ids,categories` y `pos_inventory`.

El controlador verifica que el POS query pertenezca a la misma tienda que el actor, pero no exige que un actor PosLocation use su propio ID: una terminal podría enviar otro POS de su misma tienda. En frontend usar siempre el `pos_location_id` devuelto por el token (`POST /pos/me`) y no permitir escogerlo manualmente. La ruta legacy `my-products-by-pos` requiere también `pos_location_id`, entrega todos los productos branch en memoria y no tiene paginación ni asignación warehouse equivalente; preferir la ruta `...by-pos1` que la app ya utilice, verificando consumidores.

## Filtros privados de búsqueda vehicular

La ruta exacta es `GET /products/search-by-vehicle`, `VehicleCatalogController::search`, grupo `api.auth:sanctum` + `store.access`. Es GET/query; no tiene FormRequest dedicado. Este path es el privado; el adapter público es `GET /public/storefront/{branchSlug}/search-by-vehicle`.

Parámetros admitidos por el validador (todos opcionales):

| Parámetro | Regla |
|---|---|
| `branch_id` | nullable integer ≥1 en `VehicleCompatibilityService::context`; POS solo puede usar su branch; Store puede omitir y abarcar tienda |
| `brand_id`,`model_id`,`category_id`,`vehicle_id`,`service_order_id`,`warehouse_id` | nullable/sometimes integer ≥1; IDs se resuelven dentro de tienda/branch/contexto; category también branch |
| `year` | nullable integer 1886–2200 |
| `q`,`name`,`sku`,`description`,`barcode` | strings máx.191 |
| `commercial_brand` | string máx.120, igualdad tras trim |
| `stock_status` | `all|in_stock|out_of_stock`, default `all` |
| `universal_only`,`without_vehicle_compatibilities`,`include_compatible`,`include_universal`,`include_unknown` | boolean Laravel |
| `page` | integer ≥1, default paginador Laravel 1 |
| `per_page` | integer 1–100, default20 |

Los filtros de texto y vehículo se combinan con AND: el texto no reemplaza ni omite la relación vehicular. `q` hace OR entre SKU/nombre/descripciones y, si existe la columna, marca comercial; añade barcode vía `product_units` si la tabla existe. Los filtros `sku`, `name`, `description`, `barcode` se aplican además separadamente (AND); barcode exacto. Categoría y marca comercial también son AND. Orden `products.name`, `products.id`; no hay parámetro sort. La ruta privada exige disponibilidad general `vehicle_catalog`, pero el método `search` no comprueba `catalog_search_mode` ni `vehicle_compatibilities_enabled` de branch como autorización de búsqueda.

Reglas de conflicto y errores: modelo de otra marca (cuando se envían ambos) o ID fuera de ámbito 404; `universal_only=1`/`without_vehicle_compatibilities=1` junto a marca/modelo/año 422; barcode cuando no hay tabla de unidades 422; warehouse ajeno/no asignado 404; stock filter inválido 422; catálogo no habilitado 403; método POST 405 (test lo confirma); no autenticado 401. La respuesta pública rechaza `vehicle_id/service_order_id` con 422 y `warehouse_id` con 403.

## Esqueleto real de respuesta

Es `LengthAwarePaginator::toArray()` más `catalog_settings` y `search_context`:

```json
{
  "current_page": 1,
  "data": [{
    "id": 123, "branch_id": 12, "sku": "000123", "name": "Balata delantera",
    "description": "Juego delantero", "commercial_brand": "Marca X", "barcode": "7500000000123",
    "price": 156, "price_requires_selection": false, "variant_options": [],
    "price_source": "warehouse", "iva": 0.16, "clave_producto_sat": "", "clave_unidad_sat": "",
    "unidad_medida_id": 1, "unit_of_measure": "Pieza", "stock": 8, "available_stock": 8, "in_stock": true,
    "categories": [{"id": 2,"name":"Frenos"}], "compatibilities": [], "matching_compatibilities": [],
    "compatibility_status": "compatible", "year_unconfirmed": false,
    "is_vehicle_universal": false, "image": null,
    "has_vehicle_compatibilities": true, "vehicle_compatibilities_count": 1
  }],
  "first_page_url": "…", "from": 1, "last_page": 1, "last_page_url": "…",
  "links": [], "next_page_url": null, "path": "…", "per_page": 20,
  "prev_page_url": null, "to": 1, "total": 1,
  "catalog_settings": {"vehicle_feature_available":true,"catalog_search_mode":"both","vehicle_compatibilities_enabled":true},
  "search_context": {"vehicle_id":null,"service_order_id":null,"year_confirmed":null}
}
```

Producto adicionalmente incluye `vehicle_compatibilities[]` con `{id,brand_id,vehicle_brand,model_id,vehicle_model,year_from,year_to}`, y matching tiene el mismo shape. Variantes `variant_options[]` contienen `{id,sku,name,image,price,price_source,available_stock}`. Ejemplo ilustrativo; campos opcionales dependen de esquema/relaciones.

## Puntos no implementados para integrar fase 6

- No hay endpoint privado vehicular cuyo acceso por POS token haya quedado comprobado atravesando el middleware actual.
- No hay endpoint de carrito; seleccionar producto significa entregar al carrito POS existente su `product_id`, `variant_id`, quantity, `warehouse_id` y precio acordado por las reglas existentes.
- El resultado de búsqueda es una vista/estimación; no reserva ni cambia existencias.
- El `my-products-by-pos1` serializer puede incluir `purchase_cost` en producto, warehouse stocks y variantes. Controlar permisos del frontend no elimina la exposición API; no usar ese campo como precio y reportar a backend si la política exige ocultarlo.
- No hay catálogo privado que devuelva incompatibles como resultado; un producto sin match se excluye por default. `compatibility_status` no contiene `incompatible`.

Pruebas Feature que respaldan contratos/clasificación: `VehicleCatalogTest::test_phase_six_combines_vehicle_text_year_and_explicit_classification`, `...authorized_warehouse_stock_and_price_are_read_only`, `...vehicle_and_order_context_use_authorized_historical_identity`, `...pos_only_sees_assigned_warehouse_stock`, `...large_catalog_paginates_without_duplicate_products_or_n_plus_one`; test suite únicamente retiró `CheckStoreAccess` al crear sesión POS para el caso privado.

