# Fixtures de reportes administrativos

Los valores de este documento son ficticios y estructurales salvo donde se identifica una prueba. No enviar fixtures a producción.

## Semana con costo íntegro (derivado del código; formato respaldado por Feature)

Solicitud:

```http
GET /api/reports/admin/weekly?branch_id=5&from=2026-11-02&to=2026-11-08&per_page=20&page=1
Authorization: Bearer <store-token>
Accept: application/json
```

Respuesta mínima ilustrativa:

```json
{"kind":"week","report_id":"WEEK-5-20261102-20261108","dynamic":true,
"store":{"id":2,"name":"Demo"},"branch":{"id":5,"name":"Centro"},"generated_at":"2026-11-08T20:00:00-06:00","timezone":"America/Mexico_City","logo_data":null,
"report":{"from":"2026-11-02","to":"2026-11-08","summary":{"quantity_sold":"1.000000","quantity_returned":"0.000000","quantity_cancelled":"0.000000","quantity_net":"1.000000","sales_gross":"116.000000","discounts":"0.000000","tax_amount":"16.000000","sales_before_returns":"116.000000","returns_amount":"0.000000","cancellations_amount":"0.000000","sales_net_without_tax":"100.000000","known_cost_total":"50.000000","gross_profit":"50.000000","missing_cost_lines":0,"missing_cost_quantity":"0.000000","cost_coverage":"complete","profit_status":"computed","distribution":{"current_expenses_assigned":"30.000000","savings_assigned":"20.000000"},"collections":{"recorded_total":"116.000000","sale_payments":"116.000000","account_credit_payments":"0.000000","from_prior_sales_identified":"0.000000","coverage":"recorded_events_only"},"commercial":{"sale_statuses_current":{"paid":1},"isr_retention_recorded":"0.000000","credit_originated":"0.000000","credit_outstanding_current_for_period_sales":"0.000000","open_outstanding_current_for_period_sales":"0.000000","service_linked_sales_count":null},"fixed_cash":null,"investment":null,"actual_expenses":null},"details":[{"sale_item_id":1,"sale_id":1,"product_id":1,"sku":"0001","description":"Filtro","commercial_status":"paid","unit_price":"116.000000","unit_cost_at_sale":"50.000000","cost_status":"recorded_at_sale","quantity_sold":"1.000000","quantity_returned":"0.000000","quantity_cancelled":"0.000000","quantity_net":"1.000000","sales_gross":"116.000000","discounts":"0.000000","sales_before_returns":"116.000000","returns_amount":"0.000000","cancellations_amount":"0.000000","tax_amount":"16.000000","sales_net_without_tax":"100.000000","known_cost_total":"50.000000","gross_profit":"50.000000"}],"detail_pagination":{"current_page":1,"per_page":20,"total":1},"warnings":["Caja fija, inversión y gastos reales carecen de una fuente financiera suficiente."]}}
```

`AdminFinancialReportsTest::test_settings_permissions_pdf_excel_and_read_only_reports` ejecutó un caso equivalente y comprobó gross profit, cobertura, PDF, Excel y que consultar no modifica `sale_items`.

## Costos incompletos, cero y base desconocida (respuesta obtenida en Feature)

`test_unknown_cost_blocks_profit_and_zero_cost_is_known` comprobó: costo `0` serializa `"0.000000"`, null da `cost_status="unknown"`, `cost_coverage="incomplete"`, `gross_profit=null`. Al cambiar el costo actual de producto, el reporte del snapshot no cambia.

## Devolución/cancelación y cobranza (Feature)

`test_returns_cancelled_quantities_and_collections_do_not_repeat_sales` verificó cantidades vendidas 2, devueltas 0.5, canceladas 0.5; ventas netas sin IVA 100; devoluciones 58; cancelaciones 58; costo conocido 10; utilidad 90; cobros 50; de éstos, 30 provienen de una venta anterior identificada. La prueba muestra que eventos se aplican por fecha evento sin volver a contar las ventas como cobros.

## Base desconocida y pérdida (Feature)

Sin configurar base fiscal, even con cobertura completa: `profit_status="tax_basis_unconfirmed"`, `gross_profit=null`; no se distribuye utilidad desconocida. Con base `net` y pérdida `-10.000000`, la pérdida se conserva y las dos asignaciones son `0.000000`.

## Reporte mensual (forma derivada, validación Feature)

```json
{"kind":"month","report_id":"MONTH-5-20261101-20261130","dynamic":true,"store":{"id":2,"name":"Demo"},"branch":{"id":5,"name":"Centro"},"generated_at":"2026-12-01T09:00:00-06:00","timezone":"America/Mexico_City","logo_data":null,"report":{"year":2026,"month":11,"from":"2026-11-01","to":"2026-11-30","weeks":[{"from":"2026-11-01","to":"2026-11-01","summary":{"sales_net_without_tax":"100.000000","collections":{"recorded_total":"0.000000"},"known_cost_total":"40.000000","gross_profit":"60.000000","distribution":{"current_expenses_assigned":"36.000000","savings_assigned":"24.000000"},"cost_coverage":"complete"}}],"totals":{"sales_net_without_tax":"100.000000","known_cost_total":"40.000000","collections":"0.000000","gross_profit":"60.000000","current_expenses_assigned_weekly_sum":"36.000000","savings_assigned_weekly_sum":"24.000000","distribution_on_month_profit":{"current_expenses_assigned":"36.000000","savings_assigned":"24.000000"}}}}
```

Es un fragmento ilustrativo reducido de resumen; respuesta real incluye más campos en cada summary semanal. `test_month_has_partial_weeks_and_isolates_tenants` comprobó corte mensual, aislamiento y que PDF/XLSX se generen.

## Ajustes (request/respuesta)

```http
PUT /api/reports/admin/settings
Content-Type: application/json
```

```json
{"current_expenses_percent":70,"savings_percent":30,"cost_tax_basis":"net","timezone":"America/Mexico_City"}
```

```json
{"data":{"current_expenses_percent":70,"savings_percent":30,"cost_tax_basis":"net","timezone":"America/Mexico_City"}}
```

Respuesta de ejemplo derivada del código. `AdminFinancialReportsTest` comprobó que 70+40 responde 422 y que settings válidos permiten calcular.

## Sin actividad, paginación, error de acceso y descargas

- Periodo vacío: con `cost_tax_basis=net`, sumas/ganancia serán cero, `cost_coverage=complete`; asignaciones cero. `fixed_cash`, `investment`, `actual_expenses` siguen null. Derivado del código; no es fixture de prueba explícito.
- Paginar semanal: añadir `page=2&per_page=10`; `detail_pagination.total` es total de todas las líneas antes de slice y summary continúa completo. Derivado de controlador; sin prueba específica de segundo page localizada.
- Base fiscal unknown: ver fixture Feature anterior; utilidad null. Costos null dan cobertura incompleta. Cero no equivale a null.
- Sucursal ajena: 404, probado entre tienda/branch en `test_month_has_partial_weeks_and_isolates_tenants`.
- POS token: 403 al pedir JSON de reportes, probado por `test_settings_permissions_pdf_excel_and_read_only_reports` con `PosLocation` autenticado (Sanctum actingAs, no token HTTP bearer).
- PDF: HTTP 200, firma de contenido `%PDF` comprobada; `Content-Type` `application/pdf` implícito en descarga DomPDF.
- Excel: HTTP 200, stream ZIP/XLSX empieza `PK`; SKU conserva texto `0001`; importes/cantidades numéricos en hojas.
- No se verificó una respuesta binaria de error para descargas; validación del controlador y errores JSON Laravel aplican antes de generar archivo.
