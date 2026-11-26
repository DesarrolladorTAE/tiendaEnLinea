# Reportes administrativos

## Endpoints y acceso

`auth:sanctum`; los reportes financieros validan identidad `Store`. No exponer costos/utilidades al usuario POS. No se identificó módulo separado de reportes.

| HTTP | Ruta | Uso |
|---|---|---|
| GET, PUT | `/reports/admin/settings` | leer/actualizar porcentajes administrativos |
| GET | `/reports/admin/weekly` | JSON semanal |
| GET | `/reports/admin/weekly/coverage` | cobertura de costos |
| GET | `/reports/admin/weekly/pdf`, `/weekly/excel` | exportar semana |
| GET | `/reports/admin/monthly` | JSON mensual |
| GET | `/reports/admin/monthly/pdf`, `/monthly/excel` | exportar mes |

Semana: `from`, `to` formato `YYYY-MM-DD`, máximo siete días inclusivos; se admiten `branch_id`, `product_id`, `category_id`; JSON admite `page`, `per_page`. Mes: `year`, `month`, opcional filtro de sucursal/producto/categoría conforme al controlador. Totales representan el periodo global, no una página.

## Semántica financiera

- Ventas reconocidas no se duplican al recibir abonos; cobros de ventas anteriores se identifican por fecha de cobro.
- Devoluciones/cancelaciones se contabilizan por evento y periodo según las reglas del servicio compartido.
- `unit_cost_at_sale=null` es costo desconocido; `0` es cero conocido.
- `cost_tax_basis` permanece `unknown`. Si falta costo/base fiscal, utilidad y distribución definitiva pueden ser `null`; no convertir unknown a cero.
- IVA trasladado no es ganancia. Los campos existentes gobiernan impuestos/descuentos; no recalcular CFDI.
- Asignación 60/40 es administrativa, no egreso real; configuración exige porcentajes no negativos que sumen 100. Pérdida no crea asignación positiva.
- Caja fija, inversión y gastos reales no disponibles si no hay fuente confiable: representar null/no disponible.

## Descargas

Usar query params idénticos a JSON para PDF/Excel. Descargar con autenticación; respuesta binaria. Los formatos son provisionales mientras falten originales de Autopartes Guerrero. No existe folio persistido consecutivo: los reportes son dinámicos bajo demanda.

