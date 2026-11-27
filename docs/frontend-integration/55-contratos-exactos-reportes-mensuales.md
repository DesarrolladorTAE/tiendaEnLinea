# Contrato exacto — reporte administrativo mensual

## `GET /reports/admin/monthly`

Ruta bajo `auth:sanctum`; controller `AdminFinancialReportController::monthJson`; solo identidad Store. Parámetros:

| Parámetro | Requerido | Regla |
|---|---:|---|
| `year` | sí | integer 2000–2200 |
| `month` | sí | integer 1–12 |
| `branch_id` | no | integer ≥1, sucursal de la tienda autenticada |
| `product_id` | no | integer ≥1, producto de esa tienda |
| `category_id` | no | integer ≥1, categoría de esa tienda |

No tiene filtros diarios, estado, usuario/encargado, paginación ni ordenamiento. Sin `branch_id`, consolida todas las sucursales de la tienda. `weeks[]` se produce dividiendo el mes desde el día 1 hasta el domingo (fin de semana Carbon); el primer/último bloque se recorta al mes y los bloques son consecutivos sin solaparse. Cada bloque reusa exactamente `period()`, con parámetros producto/categoría iguales. No hay series diarias.

Respuesta:

```json
{
 "kind":"month","report_id":"MONTH-ALL-20261101-20261130","dynamic":true,
 "store":{"id":2,"name":"Tienda Demo"},"branch":null,
 "generated_at":"2026-12-01T09:00:00-06:00","timezone":"America/Mexico_City","logo_data":null,
 "report":{"year":2026,"month":11,"from":"2026-11-01","to":"2026-11-30",
  "weeks":[
   {"from":"2026-11-01","to":"2026-11-01","summary":{"sales_net_without_tax":"0.000000","known_cost_total":"0.000000","gross_profit":"0.000000","quantity_sold":"0.000000","quantity_returned":"0.000000","quantity_cancelled":"0.000000","quantity_net":"0.000000","sales_gross":"0.000000","discounts":"0.000000","tax_amount":"0.000000","sales_before_returns":"0.000000","returns_amount":"0.000000","cancellations_amount":"0.000000","missing_cost_lines":0,"missing_cost_quantity":"0.000000","cost_coverage":"complete","profit_status":"computed","collections":{"recorded_total":"0.000000","sale_payments":"0.000000","account_credit_payments":"0.000000","from_prior_sales_identified":"0.000000","coverage":"recorded_events_only"},"distribution":{"current_expenses_assigned":"0.000000","savings_assigned":"0.000000"},"commercial":{"sale_statuses_current":{},"isr_retention_recorded":"0.000000","credit_originated":"0.000000","credit_outstanding_current_for_period_sales":"0.000000","open_outstanding_current_for_period_sales":"0.000000","service_linked_sales_count":null},"fixed_cash":null,"investment":null,"actual_expenses":null,"warnings":["Caja fija, inversión y gastos reales carecen de una fuente financiera suficiente."]}}
  ],
  "totals":{"sales_net_without_tax":"0.000000","known_cost_total":"0.000000","collections":"0.000000","gross_profit":"0.000000","current_expenses_assigned_weekly_sum":"0.000000","savings_assigned_weekly_sum":"0.000000","distribution_on_month_profit":{"current_expenses_assigned":"0.000000","savings_assigned":"0.000000"}}
 }
}
```

Fixture estructural derivado de `AdminFinancialReport::month`; ejemplo ficticio. Los resúmenes semanales incluyen los campos de `period()` excepto `details`, más `warnings` dentro del objeto de semana. Los importes/cantidades son strings decimales de seis posiciones; los contadores son enteros; profit/distribución pueden ser `null`.

## Totales y conciliación

`totals` solo contiene ventas netas sin IVA, costo conocido, cobros, utilidad, suma de asignaciones semanales y asignación recalculada directamente sobre utilidad mensual. **No contiene** cantidades, impuestos, descuentos, devoluciones/cancelaciones, status counts ni cobertura total mensual. Para estas métricas recorrer `weeks[].summary`; la API no genera detalles agregados de productos para el mes.

Se suma semana a semana `sales_net_without_tax`, `known_cost_total`, collections. La utilidad mensual resulta `ventas netas - costos conocidos` solo si todas las semanas tienen `gross_profit` conocido; si alguna no, queda `null`. Las asignaciones semanales se suman por separado. `distribution_on_month_profit` aplica el porcentaje al total mensual, por lo que puede diferir de la suma semanal cuando hay semanas con pérdida.

Por construir `weeks` en intervalos de inicio/fin de mes recortados, no se incluyen fechas externas al mes y no se duplican operaciones entre semanas. El periodo mensual no se pagina. Los resultados son dinámicos, no cierres persistidos. Prueba `test_month_has_partial_weeks_and_isolates_tenants` valida límites parciales e aislamiento entre tiendas.

Errores: 401 no autenticado; 403 identidad no Store; 404 branch/product/category no perteneciente; 422 year/month o filtros inválidos. Cabecera privada `Cache-Control: private, no-store`. La timezone usada por cálculo viene de setting, metadata usa `config/app.timezone` (diferencia documentada en [57](57-distribucion-utilidad-limitaciones.md)).
