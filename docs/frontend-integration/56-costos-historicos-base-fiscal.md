# Costos históricos y base fiscal

## Snapshot `sale_items.unit_cost_at_sale`

La migración existente agrega una columna nullable `DECIMAL(18,6)`; el modelo la serializa con seis decimales. No se reconstruyen ventas históricas. `SaleCostSnapshot` se consulta al crear cada partida y solo escribe si `Schema::hasColumn('sale_items','unit_cost_at_sale')`; ambientes sin la columna producen costo histórico desconocido en el reporte.

Precedencia de `SaleCostSnapshot::resolve(product, variant, warehouse)`:

1. Si el producto usa inventario por almacén y hay `warehouse_id`, usa `purchase_cost` de stock de producto/variante del almacén si la columna existe y el valor no es null.
2. Si no se resolvió y existe variante con costo no null, usa costo de variante.
3. Usa `products.purchase_cost`; null permanece null. Cero explícito se preserva como `0.000000`.

El reporte considera `unit_cost_at_sale` costo unitario por cantidad neta y aplica bcmath escala 6. La base fiscal no se inferiere de esos datos.

## Cobertura de mecanismos observados

| Flujo | Snapshot encontrado | Límite |
|---|---|---|
| POS V2 (`PointOfSaleServiceV2`) | Sí, llama resolver con producto, variante y almacén elegido al crear `sale_items`. | Captura fuentes de costo configuradas, no costo por lote/consumo FIFO. |
| POS tradicional (`PointOfSaleService`) | Sí. | Llama `resolve($product)` sin variante/almacén; para ventas con variantes o almacén puede caer al costo base del producto, no al costo específico realmente consumido. Importe comercial calcula con floats/redondeo 2, snapshot sigue 6. |
| Telorecargo | Sí al finalizar operación local. | Genera productos técnicos: costo compra se establece al importe del concepto recarga y cero para comisión. No representa costo real de mercancía ni es comparable sin criterio separado. |
| Cambio de producto en devolución | Sí para la nueva partida, con producto/variante/warehouse enviados. | La partida original mantiene su costo y el evento de devolución reduce costo histórico de la cantidad devuelta. |
| Venta previa a migración o columna no disponible | No hay backfill. | Cost `null`, desconocido. No utilizar costo actual para reconstruir. |

Esta lectura cubre los flujos comerciales principales encontrados; no declara exhaustivo todo código de terceros/integraciones que escriban directamente `sale_items`. La suite de reportes verifica resolver null/cero/precedencia, pero no una prueba combinatoria por cada canal.

## Devoluciones y cancelaciones

El reporte selecciona partidas por `sale_items.created_at` y eventos por fecha `devoluciones.fecha` / `cancelaciones.fecha`. Una devolución o cancelación reduce cantidades, venta neta, impuesto, descuento computado y costo conocido en el periodo del evento, proporcionalmente a `cantidad / cantidad original`. Una venta creada en otro periodo puede aparecer en el periodo del evento con la cantidad original de esa línea en cero y el evento como negativo; no se vuelve a sumar venta bruta.

El estado actual de la venta no excluye la partida del periodo original. `commercial_status` refleja el status actual y `sale_statuses_current` agrupa estados actuales de ventas creadas dentro del periodo. Por eso el importe de periodo previo puede mantenerse mientras sus indicadores de estado cambian en la consulta dinámica. No es cierre inmutable.

## Base fiscal `cost_tax_basis`

Valores validados en `PUT /reports/admin/settings`: `net`, `gross`, `unknown`; default `unknown` en `AdminReportSettings`. Ajuste store-global JSON, no por sucursal. El único caso que habilita `gross_profit` es `net`, declarado por cliente/administrador; el código no determina si IVA de compra es recuperable ni convierte un costo bruto a neto.

- `net`: calcula `sales_net_without_tax - known_cost_total` si todas las líneas netas tienen costo.
- `gross`: el costo total se conserva para transparencia, pero profit queda `null` (no se asume base comparable).
- `unknown`: profit queda `null`.
- Si faltan costos: profit `null` aunque base sea `net`; `profit_status=incomplete_cost`.

No se usa `products.purchase_cost` al generar reportes; únicamente snapshot histórico. Consultar [57](57-distribucion-utilidad-limitaciones.md) para endpoint de ajustes y sus validaciones.
