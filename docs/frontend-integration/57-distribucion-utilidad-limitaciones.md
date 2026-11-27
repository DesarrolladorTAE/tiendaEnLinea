# Distribución administrativa y conceptos no disponibles

## Configuración actual

Rutas bajo `auth:sanctum`, controlador `AdminFinancialReportController`; solo actor `Store` puede consultar/cambiarla. POS token y cualquier otro actor: 403 `Solo la tienda puede consultar costos y utilidades.` No hay permiso independiente de reportes ni alcance configurable por sucursal.

### `GET /reports/admin/settings`

Devuelve `{"data":{"current_expenses_percent":"60.00","savings_percent":"40.00","cost_tax_basis":"unknown","timezone":"<config/app.timezone>"}}` cuando usa defaults. Lee ajustes de `sales_document_settings` por `(store_id, branch_scope=0, document_type=admin_report, channel=api)` y fusiona claves guardadas con defaults. Al persistir, conserva la representación JSON de los porcentajes enviados (por ejemplo, request integer puede volver como número); React debe tipar ambos como valor numérico y no depender de que siempre sean strings.

### `PUT /reports/admin/settings`

Body obligatorio:

```json
{"current_expenses_percent":60,"savings_percent":40,"cost_tax_basis":"unknown","timezone":"America/Mexico_City"}
```

`current_expenses_percent` y `savings_percent` required numeric 0–100; su suma debe ser exactamente 100 comparada a seis decimales (`bcadd/bccomp`). Opcionales: `cost_tax_basis` `net|gross|unknown`; `timezone` debe pasar regla Laravel `timezone`. Campos omitidos opcionales conservan el ajuste existente. Persiste JSON en tabla existente `sales_document_settings`; si la tabla no existe, responde 422 indicando que se apliquen migraciones de configuración. No crea movimientos financieros. Respuesta `{"data": <objeto settings>}` con `private, no-store`.

Errores de suma y validación son 422 con forma Laravel `message` + `errors` por campo. 401 no autenticado; 403 actor no Store.

## Fórmula, redondeo y montos asignados

Si `gross_profit` es `null`, ambos campos `distribution.current_expenses_assigned` y `savings_assigned` son `null`. Si utilidad <= 0, utilidad se mantiene (pérdida negativa) y ambas asignaciones son `0.000000`. Si positiva, gastos = utilidad * porcentaje gastos /100 con escala 6; ahorro = utilidad - gastos (residuo exacto a seis decimales para que no se pierda centavo/unidad mínima).

La distribución semanal es administrativa, no gasto/ahorro efectivamente movido. El mes muestra suma semanal (`current_expenses_assigned_weekly_sum`, `savings_assigned_weekly_sum`) y una distribución distinta, calculada directamente sobre utilidad mensual (`distribution_on_month_profit`). No asumir igualdad si semanas con pérdidas.

## Campos no disponibles

`fixed_cash`, `investment`, `actual_expenses` son `null`; PDF los imprime como no disponibles. Caja fija, inversión, gastos reales y ahorro efectivamente depositado no cuentan con fuente confiable integrada al cálculo. No convertirlos en 0 ni representar porcentaje asignado como gasto real.

`cost_tax_basis` permanece `unknown` hasta confirmación del cliente sobre si el costo guardado incluye IVA y su recuperabilidad. Nunca se ajusta ni se modifica CFDI. La utilidad no queda disponible mientras `unknown` o `gross`.

## Decisiones del cliente pendientes

Confirmar en un proceso futuro separado: (1) significado fiscal del costo e IVA acreditable; (2) definición operativa de caja fija; (3) fuente de inversión; (4) qué libro registra gastos reales; (5) si la distribución 60/40 debe ser semanal o mensual; (6) si el reporte debe conservar cierres inmutables. No existe persistencia de reportes/folios consecutivos. `report_id` es derivado de tipo/sucursal/fechas; `dynamic=true` indica consulta dinámica, no documento archivado.
