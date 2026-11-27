# 41. Vinculación de ventas y zona horaria

Documento contrastado con `routes/api.php`, `ServiceOrderController::attachSale`, `ServiceOperationScope`, `SaleController`, `SaleV2Controller`, `config/app.php` y `tests/Feature/ServiceOperationsTest.php`. Los ejemplos son ilustrativos con datos ficticios, salvo donde se cita expresamente una prueba.

## Vincular una venta a una orden

`POST /branches/{branchId}/service-orders/{orderId}/sale` (`auth:sanctum`) ejecuta `ServiceOrderController::attachSale`. El scope admite Store propietario de la sucursal o POS de la misma tienda y sucursal, y exige las condiciones operativas `service_sales`/feature de plan. No es un endpoint de cobro.

Petición JSON, único campo:

```json
{"sale_id":901}
```

`sale_id`: requerido, entero ≥1. El controlador bloquea la orden y venta durante la operación, resuelve la venta dentro de la tienda de la sucursal, exige que `sale.client_id` no sea null y sea igual a `order.customer_id`, y exige que `sale.pos_location_id` corresponda a una terminal de la misma tienda y sucursal. La venta no debe estar ya vinculada a otra orden.

No se valida el estado de la orden ni el de la venta: el código no filtra por estados pagada/abierta/crédito/cancelada/devuelta. No debe interpretarse como aprobación comercial de esas ventas. La operación no modifica pago, total, inventario, impuestos ni estado comercial. La regla efectiva es una venta por orden (`service_orders.sale_id`) y una orden por venta. No existe endpoint de reemplazo o desvinculación.

Primera asociación: respuesta 200 `{"data": <ServiceOrder actualizado>}`; el recurso es el modelo crudo, y no carga una relación `sale`. Registra `service_order_history.event_type=sale_attached`, description `Venta vinculada.`, metadata con `sale_id` y actor. Repetir el mismo ID devuelve la orden sin duplicar la asociación/evento; intentar otro ID en la misma orden da 409. Venta ya asociada a otra orden, cliente discordante, venta sin cliente o terminal de otra sucursal dan 422 en `errors.sale_id`. Venta/orden/sucursal fuera de scope o inexistentes dan 404; no autenticado 401; módulo/actor no autorizado 403.

Ejemplo de respuesta ilustrativa (campos conforme a `ServiceOrder`; pueden variar según casts/atributos del modelo):

```json
{"data":{"id":77,"store_id":3,"branch_id":12,"order_code":"OS-2026-000077","booking_id":21,"customer_id":14,"vehicle_id":82,"service_id":8,"resource_id":6,"sale_id":901,"status_id":2,"visit_mileage":58200,"created_at":"2026-11-26T09:00:00.000000Z","updated_at":"2026-11-26T11:00:00.000000Z"}}
```

La prueba `ServiceOperationsTest::test_sale_link_rejects_foreign_client_and_duplicate_order` verifica scope ajeno, éxito y rechazo de venta ya vinculada; no ejercita todos los estados de pago/cancelación. No hay prueba que demuestre aceptación comercial segura de ventas canceladas/devueltas.

## Fuentes existentes para seleccionar una venta

No existe una búsqueda dedicada que devuelva ventas elegibles para una orden, aplicando simultáneamente tienda, sucursal, cliente y estados. La validación final corresponde al POST de asociación.

| Método/ruta | Identidad y scope observado | Forma/reserva |
|---|---|---|
| `GET /admin/ventas` | `api.auth:sanctum`; `SaleController::index2`; Store actual (`store_id=auth()->id()`) | `fecha_inicio`, `fecha_fin` (solo filtra si ambos), `pos_location_id`; JSON lista no paginada con `id,store_id,pos_location_id,total_amount,paid_amount,status,created_at,invoice_id,items_count` y POS. No filtra cliente ni garantiza sucursal elegible. |
| `GET /ventas/mis-ventas` | `auth:sanctum`; `ventasDelPOSAutenticado`; consulta por ID del actor como POS | Filtros opcionales `fecha_inicio` + `fecha_fin` y `payment_method`; objeto `{ventas,devoluciones,cancelaciones}`. Las ventas incluyen identificadores, cliente, importes, estado, fecha, factura, artículos y pagos; respuesta amplia, no paginada. Código no verifica explícitamente tipo de actor. |
| `GET /ventas/pos/historial` | `auth:sanctum`; POS actual y periodo mes/año | Lista sin paginación, limitada al terminal; datos básicos, menos útil para enlazar cliente. |
| `GET /pos/historial-unificado` | `auth:sanctum`; `SaleV2Controller::historialUnificadoPOS`; tienda y terminal del actor | Respuesta `{ok,pos_location_id,filters,summary,rows}`; filas heterogéneas de ventas, cobros, crédito, devoluciones/cancelaciones. No es listado exclusivo de ventas elegibles. |

`GET /ventas/{id}` (`SaleController::showw`) puede devolver folio comercial `#<id>`, fecha, totales, cliente, estado y datos de pagos/crédito, pero no se observó scope de tienda/sucursal en el controlador. `GET /sales/{sale}` tampoco demuestra aquí autorización de tenant. No usar esas rutas como selector administrativo seguro sin corregir/confirmar su aislamiento fuera de esta actividad.

Para una integración prudente, usar el listado autorizado apropiado a la identidad y sucursal, presentar `id`, fecha, importes y estado que realmente entrega, y tratar la vinculación como operación de resultado incierto hasta obtener su respuesta. El POST de vínculo devuelve `sale_id` en la orden, pero no el folio ni el resumen de la venta. La lista admin expone `invoice_id`, no un folio comercial separado; el detalle que expone folio carece de scope confirmado. Propuesta mínima si UI requiere esos datos: endpoint de búsqueda/detalle de venta elegible con scope tenant+sucursal+cliente, permisos existentes y campos mínimos, sujeto a autorización aparte. No implementado.

## Zona horaria

La fuente efectiva actual es `config('app.timezone')` en `config/app.php`, con valor `America/Mexico_City`. No se encontró override de zona horaria en Store o Branch. Disponibilidad incluye `data.timezone`, pero se obtiene después de consultar con `date`; `/perfil/mi-tienda`, `/pos/me` y `/admin/branches/{branchId}/catalog-settings` no ofrecen una señal previa de zona horaria.

Por ahora React debe usar la zona global indicada por despliegue (la respuesta de availability confirma el valor efectivo) al elegir el día y mostrar horas. No enviar zona como si Laravel la aceptara: booking y reschedule validan fecha `Y-m-d` y hora local `H:i`; el backend calcula el final.

Propuesta no implementada: agregar `timezone` a una respuesta privada existente de configuración de agenda/sucursal, manteniendo la respuesta anterior y derivándolo de `config('app.timezone')`. No almacenar o asumir zona por tienda/sucursal hasta que exista requerimiento y política de conversión.

