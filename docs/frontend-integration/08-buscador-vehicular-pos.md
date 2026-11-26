# Buscador vehicular e integración POS

## Búsqueda tradicional y especializada

`GET /products/search` conserva la búsqueda POS normal (middleware `api.auth:sanctum`, `store.access`). `GET /products/search-by-vehicle` amplía búsqueda usando el mismo producto/inventario; el grupo también usa autenticación y aislamiento comercial. Marcas/modelos: `GET /vehicle-brands`, `GET /vehicle-models?brand_id=…`, años y tipos de pieza según inventario endpoints.

Filtros combinables opcionales: `q`, `name`, `sku`, `description`, `barcode`, `category_id`, `commercial_brand`, `brand_id`, `model_id`, `year`, `vehicle_id`, `service_order_id`, `warehouse_id`, `stock_status=all|in_stock|out_of_stock`, `include_compatible`, `include_universal`, `include_unknown`, `page`, `per_page` (máximo 100). Marca/modelo se validan; texto no se ejecuta como consulta separada que ignore compatibilidad. Contexto de expediente/orden es autoritativo y contradicciones producen 422.

## Clasificación

- `compatible`: match registrado de marca/modelo y año cuando proporcionado.
- `universal`: declaración explícita del producto.
- `unknown`: sin compatibilidad suficiente; producto sin relaciones no se presume universal.
- `year_unconfirmed`: marca/modelo candidatas, año no disponible; no mostrar etiqueta “compatible” confirmada.

## Ejemplo

```http
GET /api/products/search-by-vehicle?brand_id=10&model_id=31&year=2020&q=balatas&warehouse_id=7&stock_status=in_stock
```

Respuesta representativa (reducida; confirmar recurso actual):

```json
{"current_page":1,"per_page":20,"total":1,"data":[{"id":123,"sku":"000123","name":"Balatas delanteras","commercial_brand":"Marca refacción","price":156,"available_stock":8,"compatibility_status":"compatible","year_unconfirmed":false,"matching_compatibilities":[{"brand_id":10,"model_id":31,"year_from":2015,"year_to":2022}]}],"search_context":{"year_confirmed":true}}
```

`price` es preliminar; puede exigir selección de variante/almacén. No es precio definitivo ni autorización de descuento. POS debe volver a validar precio, impuestos, almacén, existencia, variante y permisos durante venta. La búsqueda no reserva inventario ni añade producto a carrito.

## Expediente y orden

Añadir `vehicle_id` para derivar contexto de expediente (requiere `vehicle_records`); o `service_order_id` para derivar vehículo y snapshot de orden (requiere acceso a servicio de esa sucursal). No enviar marca/modelo/año contradictorios. Si no hay vehículo, usar búsqueda normal.

## Configuración/admin

`GET /admin/products/{product}/vehicle-compatibilities` consulta relaciones; `PATCH /admin/products/{product}/automotive-details` clasifica `is_vehicle_universal` y `commercial_brand`. La administración/importación requieren actor y scope autorizados; no son endpoints de checkout.

En alta/edición de producto, `vehicle_compatibilities: []` (incluido JSON `"[]"` en multipart) significa **sin cambios** y no requiere que el catálogo esté habilitado. En producto nuevo no registra compatibilidades; al editar conserva las ya existentes. Las listas no vacías siguen sujetas al módulo, sucursal y autorización. Para formularios tradicionales puede omitirse el campo.

La venta vinculada a una orden sigue dos operaciones: usar endpoint de creación/checkout existente del POS y luego `POST /branches/{branchId}/service-orders/{orderId}/sale` con `sale_id`. La ruta vincula únicamente; no crea venta.

