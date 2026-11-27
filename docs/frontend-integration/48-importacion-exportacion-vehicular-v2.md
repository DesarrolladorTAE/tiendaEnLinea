# 48. Importación/exportación vehicular v2

## Compatibilidad y rutas

Las rutas administrativas están dentro de `api.auth:sanctum` + `store.access`, y `VehicleCompatibilityService::context(..., write:true)` exige Store y capacidad de administración en sucursal:

- `GET /vehicle-compatibilities/export?branch_id={id}`: XLSX legacy de seis columnas, default; nombre `compatibilidades.xlsx`.
- `GET /vehicle-compatibilities/export?branch_id={id}&include_classification=1`: extensión v2 de ocho columnas; nombre `compatibilidades-v2.xlsx`.
- `POST /vehicle-compatibilities/import`: multipart `branch_id`, `archivo` y opcional `mode=upsert|replace`.
- `GET /vehicle-compatibilities/import/template`: plantilla legacy de seis columnas.
- `POST /products/import-with-vehicles`: importador compartido de producto existente y compatibilidad habilitado; Store-only.
- `GET /products/import-with-vehicles/template`: plantilla CSV de producto/vehículo, no es exportador de compatibilidades.

El endpoint de export descarga XLSX (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`); rama requerida; no hay paginación, máximo 10,000 filas. Los errores de validación de archivo son 422 `message/errors`.

## Columnas

Legacy preserva exactamente orden de seis headers: `SKU del producto, Marca del vehículo, Modelo del vehículo, Año inicial, Año final, Tipo de refacción` (`sku,vehicle_brand,vehicle_model,year_from,year_to,part_type`). V2 sólo agrega al final:

7. `Universal vehicular (1/0)` → `is_vehicle_universal`.
8. `Marca comercial de la refacción` → `commercial_brand`.

SKU se escribe como texto para ceros iniciales. Años son enteros 1886–2200, ambos extremos inclusivos; celda vacía es extremo abierto. Hasta 100 compatibilidades por `vehicle_compatibilities` JSON en el importador de producto. Marca/modelo se identifican por nombre y su relación; no crea productos desde importador de compatibilidad: SKU debe existir en la Store/branch seleccionada.

## Upsert y replace

- `upsert` default agrega rangos faltantes, no borra los anteriores. Compatibilidad duplicada no se duplica; categoría de `part_type` se agrega sin eliminar categorías existentes.
- `replace` opera por SKU agrupado: borra/reconstruye sus rangos solo si todas las filas de ese SKU son válidas. Cualquier fila inválida conserva el conjunto anterior completo y produce errores por fila.
- Productos/SKU ausentes no se eliminan.
- Clasificación opcional omitida o celda vacía no cambia `is_vehicle_universal` ni `commercial_brand` existentes.
- Se aplica regla Laravel `boolean` antes del parser; export usa 1/0. Aunque el normalizador posterior contempla strings `on/yes`, no asumir que pasan la validación booleana Laravel; usar `1`/`0` en CSV/XLSX. `sí` no es un valor documentado/permitido.
- Para producto con compatibilidades, export extendido repite clasificación y marca en cada fila. Para universal sin compatibilidades o producto sin compatibilidad pero con marca comercial, v2 escribe fila con las cuatro celdas de vehículo vacías más clasificación/marca. Import no presume universal a partir de compatibilidad vacía: requiere columna explícita con valor.
- Export legacy contiene filas con compatibilidad solamente y no transporta campos de clasificación. Si se necesita preservar universal/commercial_brand usar v2. No es backup integral de catálogo/products.

Headers inglés/canónico y headers españoles de plantilla se normalizan; agrega JSON column header `Compatibilidades adicionales (JSON)` en importador de productos. Import de compatibilidad requiere headers base exactos y permite clasificación adicional; rechaza columnas duplicadas/desconocidas. Archivos máx 20 MB, 10,000 data rows y 64 columns; datos empiezan fila3, headers fila2.

## Respuesta import

```json
{"message":"Importación procesada","resumen":{"total_filas":3,"compatibilidades_creadas":2,"compatibilidades_actualizadas":0,"sin_cambios":0,"errores":1},"errores_validacion":[{"fila":4,"sku":"000123","columna":"year_to","celda":"E4","motivo":"El año final debe ser mayor o igual al inicial."}]}
```

`compatibilidades_actualizadas` puede ser una métrica legacy; implementación resume created/unchanged/errors. No cambiar expectations en consumidor sin prueba. `replace` por SKU atomicidad descrita arriba.

## Evidencia

`VehicleCatalogTest::test_phase_eight_extended_vehicle_export_roundtrips_classification_without_breaking_legacy_format` corre en SQLite in-memory + XLSX temporal y verifica headers legacy F columns, clasificación y marca comercial round-trip, incluyendo universal sin relación. Tests adicionales verifican omisiones opcionales, replace de grupos inválidos, SKU y compatibilidad. No es carga real ni acceso a datos de tienda.

