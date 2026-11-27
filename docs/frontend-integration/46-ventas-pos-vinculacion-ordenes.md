# 46. Ventas V2, órdenes y fallos parciales

## Venta POS V2

`POST /v2/sales`, `SaleV2Controller::store`, `auth:sanctum`; el consumidor esperado es PosLocation. El método no tiene guard explícito `instanceof PosLocation` en la entrada; asume actor con relación `store` e ID de terminal. No asumir que el token Store es intercambiable con token terminal.

Body validado por controller:

```json
{
  "client_id": 14,
  "is_pending_sale": false,
  "pending_has_advance": false,
  "pending_due_at": null,
  "pending_note": null,
  "is_credit_sale": false,
  "credit_due_at": null,
  "items": [{"product_id":123,"variant_id":null,"batch_id":null,"warehouse_id":7,"quantity":"1.000","unit_price":"156.000000","original_price":"156.000000","discount_percent":"0.00","worker_id":null}],
  "payments": [{"method":"efectivo","amount":"156.000000"}],
  "total_amount":"156.000000"
}
```

`client_id` nullable exists clientes; flags boolean nullable; pending date nullable date, note max500; credit date nullable date; items required array min1 with product_id required exists, variant/batch/warehouse/worker optional; quantity .001–3 decimal places; unit/original price nullable ≥0 six decimals; discount 0–100 two decimals. Payments nullable; method `efectivo|td|tc|transferencia`; amount >0 six decimals; tarjeta/transferencia requieren referencia max50 y últimos4 dígitos numéricos. `total_amount` requerido ≥0 seis decimales. Venta a crédito exige cliente y automáticamente marca `is_pending_sale=true`; el controller genera error 422 si falta. Item totals are recalculated; submitted total must equal computed total or 422. Service V2 checks product store, variant belongs to product, required variant, warehouse active+same store+branch, stock, and decrements during successful commercial sale. Search does not.

Controller overwrites store, POS location, channel=`pos`; payment settlement determines sale status (`paid` when amount collected enough, else `open`), and credit logic can establish credit status. A pending order is a distinct flag/state, not just an unpaid sale. Do not map sale state based on UI assumptions; read `sale.status`, flags and paid/total fields.

Success HTTP 201:

```json
{"message":"Venta registrada correctamente (V2).","sale":{"id":901,"store_id":3,"pos_location_id":6,"client_id":14,"status":"paid","total_amount":"156.000000","paid_amount":"156.000000","items":[{"id":1,"product_id":123,"variant_id":null,"warehouse_id":7,"quantity":"1.000","unit_price":"156.000000","unit_cost_at_sale":"80.000000","total_price":"156.000000"}],"payments":[{"id":1,"method":"efectivo","amount":"156.000000"}]},"total_amount":"156.000000","iva_total":"21.517241","isr_retention_applied":false,"isr_retention_total":"0.000000","net_total_amount":"156.000000","payments":[],"change_amount":null,"whatsapp":{"attempted":false,"sent":false},"document_settings":{},"document_action":{}}
```

Response includes message, sale full loaded model, totals/tax/retention, payments/change, WhatsApp outcome, document settings/action; included exact nested sale properties vary with columns/relationships and should be typed using actual response. Cost `unit_cost_at_sale` is only attached when migration/schema column exists and `SaleCostSnapshot::available()`. It captures warehouse purchase cost if column exists and non-null, else variant purchase cost or product purchase cost; null stays unknown, scale 6. Captured as sale item is created in transaction, before inventory decrement in service block. Existing migration may not be deployed in every environment, so frontend must not require it to render a sale.

## Read sale after creation

`GET /ventas/mis-ventas` is scoped by `pos_location_id=auth()->id()` and returns `{ventas,devoluciones,cancelaciones}` including this POS's sale rows, client, items and payments; optional filters `fecha_inicio` and `fecha_fin` apply together; payment_method optional. It is unpaginated and can be a large response. `GET /pos/historial-unificado` is POS/Store token, scoped by inferred store/POS but returns heterogeneous sales/payments/refunds/cancellations, not only sales. `GET /ventas/{id}` has detailed folio/status/client/totals but controller lacks tenant scoping; do not use as a safe cross-tenant detail fetch. See 41 for full source table.

## Query order from POS

The service route group uses `auth:sanctum`; `ServiceOperationScope` accepts Store or PosLocation, checks branch ownership and service_sales/plan access, and applies terminal `service_sales` false override. POS is limited to its exact branch by `TourScope`. The terminal can request a known order using `GET /branches/{branchId}/service-orders/{orderId}` and see `data` order and `forms_progress`; order list `GET /branches/{branchId}/service-orders` is paginated (default20 max100) and can filter `customer_id,vehicle_id,service_id,resource_id,status,date_from,date_to`. No search by folio text; user must use known ID/order list. Detail includes snapshots, history, forms summary, and sale summary if linked. Use branch path matching terminal; private order read is an API route, not POS-token parameter on admin endpoints.

## Link sale to order

`POST /branches/{branchId}/service-orders/{orderId}/sale` with `{"sale_id":901}`. Store or POS on branch, same `service_sales` scope. It validates store, sale client equals order customer, sale terminal is same branch, and sale not linked to other order. One scalar sale_id per order; no unlink or replacement. Repeated same ID has idempotent effect (no second association/history); different sale ID after link is 409. History event `sale_attached` once. Response is updated order, not sale summary. It does not check sale's commercial/payment state: open, paid, pending, credit, cancelled/refunded states are not tested by this method. This is a real contract gap; no frontend claim that canceled/refunded links are safe. Do not add new business restriction in frontend other than communicate current response.

## Partial success: sale created, attach failed

Sale and attach are separate HTTP/database transactions. They are not atomic together. On attach failure:

1. Keep returned `sale.id` from HTTP 201 and show the sale was created; do not repeat `POST /v2/sales`.
2. Query order again with `GET /branches/{branchId}/service-orders/{orderId}`. If `data.sale_id` equals created sale ID, linking succeeded despite a lost response; stop.
3. If not linked, retry only `POST .../{orderId}/sale` with the same `sale_id`. Same-ID is idempotent if the first call actually succeeded.
4. If 409/422 persists, retain the sale ID and report/link support; do not charge, create second sale, decrement stock or try a different sale ID.

POS can also locate its created sale in `/ventas/mis-ventas`, but that endpoint is a full unpaginated list; avoid it when POST response and order detail suffice. No endpoint atomically creates sale+order relation.

