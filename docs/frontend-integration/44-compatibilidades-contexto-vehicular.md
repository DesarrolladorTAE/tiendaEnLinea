# 44. Compatibilidad y contexto vehicular

## Catálogos privados y públicos

| Contrato | Ruta privada | Acción pública |
|---|---|---|
| Marcas | `GET /vehicle-brands?branch_id={id}` | `GET /public/storefront/{branchSlug}/vehicle-brands` |
| Modelos | `GET /vehicle-models?branch_id={id}&brand_id={id}` | `GET /public/storefront/{branchSlug}/vehicle-models?brand_id={id}` |
| Años | `GET /vehicle-years?branch_id={id}&brand_id={id}&model_id={id}` | `GET /public/storefront/{branchSlug}/vehicle-years?...` |
| Categorías/refacción | `GET /vehicle-part-types?...` | `GET /public/storefront/{branchSlug}/vehicle-part-types?...` |
| Productos | `GET /products/search-by-vehicle?...` | `GET /public/storefront/{branchSlug}/search-by-vehicle?...` |

Las rutas privadas usan `api.auth:sanctum` y `store.access` desde `routes/api.php`; brands/models/years/part types llaman al mismo `VehicleCatalogController`. Rigen los límites de acceso por POS del documento 43: no se debe considerar confirmada su operatividad con POS token. La capa de servicio contempla POS, pero `CheckStoreAccess` y tests impiden comprobarla de extremo a extremo. Las rutas públicas no reciben `branch_id` autoritativo del cliente: el adapter resuelve branch por slug y exige tienda activa/disponible y `catalog_search_mode` vehicle/both; sólo productos `visible`.

Respuesta: marcas `{data:[{id,name}]}`; modelos `{data:[{id,vehicle_brand_id,name}]}`; años `{data:[...],has_open_ranges:boolean,ranges:[{year_from,year_to}]}`; categorías `{data:[{id,branch_id,name}]}`. No hay paginación ni parámetro de texto para estos catálogos en el código revisado. Se filtran a entidades presentes en compatibilidades de productos vigentes del ámbito.

No existe `/vehicle-brands` dependiente de `vehicle_records`; selección manual es catálogo de compatibilidades `vehicle_catalog`. Consultar expedientes sí necesita `vehicle_records`. Para `vehicle_id`, el buscador requiere `VehicleFeature::recordsEnabled`; para actor POS además bloquea si el override terminal `vehicle_records` está explícitamente false y limita al vehículo con orden en su branch. Terminal con módulo vehicular de catálogo no adquiere permiso general de expediente.

## Modalidad A: vehículo manual

Query `brand_id`, `model_id`, `year` (cualquiera es opcional). `filters()` valida tipos/rango y que marca exista en tienda, modelo pertenezca a una marca del store y además coincida con brand_id cuando ambos presentes. Usar `model_id` sin brand_id es válido; `year` puede usarse con filtro de texto sin modelo y limita matches a relaciones que cubren ese año. Rangos inclusive; `year_from=null` es sin límite inferior; `year_to=null` sin límite superior.

Sin año, coincidencias de marca/modelo no se etiquetan confirmadas: un matching existente entrega `compatibility_status=unknown`, `year_unconfirmed=true`. La interfaz debe explicar que falta año.

## Modalidad B: `vehicle_id`

El backend deriva brand/model/year del expediente; si el vehículo no tiene año, no agrega filtro de año. Envío adicional de filtros manuales que contradigan el expediente produce 422 `errors.<field>`. Si se selecciona POS, código requiere que vehicle tenga orden histórica en el branch del POS; hay módulo `vehicle_records`. El ID debe pertenecer a tienda. El endpoint no crea relaciones, citas, ventas ni movimientos.

## Modalidad C: `service_order_id`

La orden se busca por tienda; si branch se seleccionó, la orden debe ser de ella (desacuerdo da 422), y `ServiceOperationScope::branch` autoriza tienda/POS y branch. Deriva el vehículo vinculado y utiliza primero `vehicle_snapshot` para brand/model/year. Si snapshot tiene IDs históricos se priorizan; si faltan, resuelve por nombres de snapshot en el catálogo. Si no puede reconstruir marca/modelo históricos, devuelve 422 `service_order_id`; no sustituye silenciosamente por los datos actuales. Si no existe snapshot, usa los datos del vehículo actual. `vehicle_id` extra debe coincidir con la orden/vehículo; si la orden no tiene vehículo, agregar uno distinto da 422. Orden sin vehículo admite texto convencional, salida sin derivar filtros vehiculares.

La prueba `test_phase_six_vehicle_and_order_context_use_authorized_historical_identity` cambia el año actual del expediente luego de crear snapshot y verifica que la búsqueda por orden conserva compatibilidad con año histórico. También prueba vehículo ajeno, orden de otra sucursal, orden sin vehículo y filtros contradictorios.

## Precedencia

1. Se valida la pareja brand/model manual antes del contexto.
2. Si `service_order_id` existe, se carga la orden y snapshot; un branch explícito incompatible falla.
3. Si `vehicle_id` también existe, debe ser el de esa orden (si hay) y coincide con vehicle derivado.
4. Contexto derivado establece los campos brand/model/year. Un parámetro manual distinto no sobrescribe: error 422. Valores iguales son aceptables.
5. Orden con snapshot resuelve IDs/nombres snapshot antes del expediente corriente.

No enviar parámetros contradictorios; enviar solo `service_order_id` y los filtros textuales/categoría/commercial brand/stock que se quieran combinar.

## Clasificación exacta de resultado

- `compatible`: filtro vehicular coincide con al menos una relación y el año proporcionado cae en rango, o marca/model del vehículo derivado con año disponible coinciden.
- `universal`: `products.is_vehicle_universal=true` si no hay coincidencia registrada evaluada. Si universal y compatible específica coinciden, status queda `compatible` por precedencia del código, aunque `is_vehicle_universal` siga true.
- `unknown`: sin match suficientemente confirmado; incluye falta de año con candidatas, productos sin relaciones/no universales y consultas sin contexto para no universal.
- No hay `incompatible`. Con contexto de vehículo el filtro por defecto devuelve solo compatibles. `include_universal=1` añade universales; `include_unknown=1` añade unknown; `include_compatible=1` controla compatibles. Si se especifica cualquier include flag, defaults pasan a compatible=false, universal=false, unknown=false salvo flags enviados. Por tanto enviar solo `include_universal=1` retorna universales además de cualquier compatible solamente si se envía también `include_compatible=1`.
- Sin filtros vehículo ni flags, se permite búsqueda de texto normal; status de una fila se deriva como universal o unknown, no como compatibilidad.
- `universal_only=1` y alias `without_vehicle_compatibilities=1` ejecutan `doesntHave(vehicleCompatibilities)`: incluyen productos sin relaciones tanto marcados como universales como sin clasificación. No son sinónimo confiable de `is_vehicle_universal=true`; preferir `include_universal` para clasificación explícita. Al combinar alias con filtros vehiculares se responde 422.
- Una relación específica que no cubre los filtros no se informa como resultado incompatible; simplemente no contribuye al match.

## Disponibilidad y rango

`matching_compatibilities` contiene todas las relaciones coincidentes (distinct de productos por query; sin duplicar producto por múltiples rangos). Para cada compatibilidad: `id,brand_id,vehicle_brand,model_id,vehicle_model,year_from,year_to`. Año abierto se presenta `null`; el consumidor no debe convertirlo a un año fijo. No se afirma ajuste mecánico fuera de los datos registrados.

