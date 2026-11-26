# Expedientes vehiculares

## Rutas

| HTTP | Ruta | Controlador/uso |
|---|---|---|
| GET, POST | `/vehicles` | `VehicleController::index/store` |
| GET, PUT, PATCH | `/vehicles/{vehicleId}` | `show/update` |
| GET | `/clients/{customerId}/vehicles` | vehículos de cliente tenant-scoped, paginados; POS no se restringe a branch en esta acción |
| GET | `/vehicles/{vehicleId}/history` | historial vehicular |
| PATCH | `/vehicles/{vehicleId}/service-orders/{orderId}/mileage` | odómetro ligado a visita/orden |
| PATCH | `/vehicles/{vehicleId}/status` | activar/desactivar expediente |

Rutas protegidas por `auth:sanctum`; la habilitación de expedientes requiere `vehicle_records`. La mayoría de las consultas de expediente se acotan a la tienda; `GET /vehicles` y `GET /vehicles/{id}` no filtran branch para POS. El endpoint de historial sí se restringe al branch del POS. Ver contrato exacto en [22](22-contratos-exactos-expedientes-vehiculares.md) y [24](24-contratos-exactos-historial-vehicular.md).

## Contrato de creación

`POST /vehicles` recibe IDs `customer_id`, `vehicle_brand_id`, `vehicle_model_id`; año/placas/VIN/kilometraje son opcionales. No hay campos color/notas. El validator se detalla en el documento 22. Marca/modelo son pareja validada por ID, pero los GET actuales de marcas/modelos están ligados a compatibilidades comerciales y requieren `vehicle_catalog`; el endpoint independiente para un selector de expediente no existe (documento 23).

```http
POST /api/vehicles
Content-Type: application/json
Accept: application/json

{"customer_id": CUSTOMER_ID, "vehicle_brand_id": BRAND_ID, "vehicle_model_id": MODEL_ID, "year": 2020}
```

Respuesta `201 {"data": vehicle}` con customer, brand y model; `public_token` está oculto. El documento 22 incluye forma y ejemplos verificados por controlador.

## Historial y snapshots

El historial no devuelve timeline/eventos unificados: expone paginadores independientes de `orders` y `bookings`. Órdenes incluyen snapshots, lectura de kilometraje de visita y metadatos de submissions; no incluyen cuerpo de inspección, relación `sale`, ni history events. Ver contrato exacto [24](24-contratos-exactos-historial-vehicular.md).

## QR

El QR contiene `MTELMX:VEHICLE:V1:<token>`; no es URL ni autorización. Los contratos de SVG, resolución, rotación y etiqueta están en [25](25-contratos-exactos-qr-etiquetas.md). No muestra VIN, teléfono ni historial.

