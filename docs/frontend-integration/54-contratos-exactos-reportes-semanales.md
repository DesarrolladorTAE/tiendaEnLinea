# Contrato exacto — reporte administrativo semanal

Base de rutas: `/api/reports/admin`; las rutas requieren `auth:sanctum`. El controlador es `App\Http\Controllers\Reportes\AdminFinancialReportController`; acepta únicamente actor `App\Models\Store`. Un token POS autenticado responde 403. El ámbito de tienda viene de la identidad, nunca de query. Si se omite `branch_id`, se consolida toda la tienda; si se envía, la sucursal debe pertenecer a esa tienda (404 si no). No hay permiso RBAC separado ni comprobación de módulo/plan en este controlador.

## `GET /reports/admin/weekly`

Parámetros:

| Parámetro | Requerido | Regla | Efecto |
|---|---:|---|---|
| `from` | sí | fecha `Y-m-d` | Inicio inclusivo, día completo, en timezone de ajustes. |
| `to` | sí | `Y-m-d`, después o igual a `from` | Fin inclusivo, día completo. Diferencia máxima 6 días: 7 fechas inclusivas. |
| `branch_id` | no | integer ≥1 | Sucursal de la misma tienda. Omitido consolida tienda. |
| `product_id` | no | integer ≥1 | Producto de misma tienda; filtra partidas. |
| `category_id` | no | integer ≥1 | Categoría de misma tienda; filtra partidas por pivote. |
| `page` | no | integer ≥1, default 1 | Página de `details`, no cambia summary. |
| `per_page` | no | integer 1–100, default 20 | Tamaño página detalles. |

No existen filtros de estado, encargado, usuario, ordenamiento ni múltiples sucursales seleccionables. El orden de detalle es por `sale_item_id` ascendente. El límite del periodo se valida sobre fechas calendáricas (`diffInDays <= 6`), no sobre timestamps enviados.

Respuesta real (estructura; importes y cantidades son strings con seis decimales, `null` representa desconocido/no disponible):

```json
{
  "kind":"week","report_id":"WEEK-2-20261102-20261108","dynamic":true,
  "store":{"id":2,"name":"Tienda Demo"},"branch":{"id":5,"name":"Centro"},
  "generated_at":"2026-11-08T18:00:00-06:00","timezone":"America/Mexico_City","logo_data":null,
  "report":{
    "from":"2026-11-02","to":"2026-11-08",
    "summary":{
      "quantity_sold":"2.000000","quantity_returned":"0.000000","quantity_cancelled":"0.000000","quantity_net":"2.000000",
      "sales_gross":"232.000000","discounts":"8.000000","tax_amount":"32.000000",
      "sales_before_returns":"232.000000","returns_amount":"0.000000","cancellations_amount":"0.000000",
      "sales_net_without_tax":"200.000000","known_cost_total":"80.000000","gross_profit":"120.000000",
      "missing_cost_lines":0,"missing_cost_quantity":"0.000000","cost_coverage":"complete","profit_status":"computed",
      "distribution":{"current_expenses_assigned":"72.000000","savings_assigned":"48.000000"},
      "collections":{"recorded_total":"100.000000","sale_payments":"100.000000","account_credit_payments":"0.000000","from_prior_sales_identified":"0.000000","coverage":"recorded_events_only"},
      "commercial":{"sale_statuses_current":{"paid":1},"isr_retention_recorded":"0.000000","credit_originated":"0.000000","credit_outstanding_current_for_period_sales":"0.000000","open_outstanding_current_for_period_sales":"0.000000","service_linked_sales_count":0},
      "fixed_cash":null,"investment":null,"actual_expenses":null
    },
    "details":[{"sale_item_id":700,"sale_id":900,"product_id":45,"sku":"00045","description":"Balata","commercial_status":"paid","unit_price":"116.000000","unit_cost_at_sale":"40.000000","cost_status":"recorded_at_sale","quantity_sold":"2.000000","quantity_returned":"0.000000","quantity_cancelled":"0.000000","quantity_net":"2.000000","sales_gross":"232.000000","discounts":"8.000000","sales_before_returns":"232.000000","returns_amount":"0.000000","cancellations_amount":"0.000000","tax_amount":"32.000000","sales_net_without_tax":"200.000000","known_cost_total":"80.000000","gross_profit":"120.000000"}],
    "detail_pagination":{"current_page":1,"per_page":20,"total":1},
    "warnings":["Caja fija, inversión y gastos reales carecen de una fuente financiera suficiente."]
  }
}
```

El fixture es derivado de `AdminFinancialReport::period` y metadata del controlador; la forma de respuestas fue comprobada por pruebas, pero esos IDs/valores del ejemplo son ficticios.

Cada fila representa una partida `sale_items` (agrupada por `sale_item_id`), no un agregado único por producto/SKU. SKU y descripción se leen de `products` actualmente; no son snapshot histórico del texto.

### Campos del resumen

- Unidades: `quantity_sold`, `quantity_returned`, `quantity_cancelled`, `quantity_net`.
- Importe antes/después de eventos: `sales_gross`, `sales_before_returns`, `returns_amount`, `cancellations_amount`, `sales_net_without_tax`.
- Ajustes: `discounts`, `tax_amount`.
- Costo/ganancia: `known_cost_total`, `gross_profit`, `missing_cost_lines`, `missing_cost_quantity`, `cost_coverage`, `profit_status`.
- Asignación: `distribution.current_expenses_assigned`, `distribution.savings_assigned`.
- Cobros: `collections.recorded_total`, `sale_payments`, `account_credit_payments`, `from_prior_sales_identified`, `coverage`.
- Indicadores no equivalentes a ingresos: `commercial.sale_statuses_current`, `isr_retention_recorded`, `credit_originated`, saldos actuales, `service_linked_sales_count`.
- No disponibles: `fixed_cash`, `investment`, `actual_expenses` siempre `null`.

`profit_status`: `incomplete_cost` si falta algún costo neto distinto de cero; si no, `computed` solo cuando `cost_tax_basis=net`; de otro modo `tax_basis_unconfirmed`. `cost_coverage` es `complete|incomplete`. El total global se calcula antes de cortar `details`; no sumar únicamente una página para obtener el resumen.

Headers: `Cache-Control: private, no-store`. Errores: 401 sin autenticación; 403 actor no Store; 404 sucursal/producto/categoría fuera de tienda o inexistente; 422 validación (incluye fecha, rango de 7 días, página, filtros).

## `GET /reports/admin/weekly/coverage`

Usa los mismos parámetros/validaciones semanales y scope. JSON solo devuelve `kind, report_id, dynamic, store, branch, generated_at, timezone, logo_data` y `cost_coverage, profit_status, missing_cost_lines, missing_cost_quantity, warnings`. No incluye detalles. `private, no-store`.

## Zona horaria

El servicio parsea `from/to` con `settings.timezone`, almacena timestamps desde inicio de `from` hasta fin de `to` inclusive. Sin ajuste guardado, timezone por defecto es `config('app.timezone')`. La metadata del endpoint usa directamente `config('app.timezone')`, no el timezone guardado; si tienda lo cambió, metadata puede diferir del cálculo. Ver [57](57-distribucion-utilidad-limitaciones.md).
