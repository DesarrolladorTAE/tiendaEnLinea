# Exportaciones, permisos y límites operativos

## Export endpoints

Todos usan el mismo controlador, mismos filtros y misma función de cálculo que sus JSON; rutas protegidas por `auth:sanctum`, actor exclusivamente Store y scope de datos por `store_id` autenticado. No hay POS token ni permiso de exportación separado. Sucursal fuera de la tienda da 404; parámetros inválidos 422; no autenticado 401; actor no Store 403. Respuesta privada/no-cache.

| Método y ruta | Parámetros | Respuesta |
|---|---|---|
| GET `/reports/admin/weekly/pdf` | `from,to` requeridos; opcionales `branch_id,product_id,category_id` | descarga DomPDF `application/pdf`, letter horizontal, nombre `WEEK-{branch_id o ALL}-{from sin guiones}-{to sin guiones}.pdf`. Renderiza todas las filas de semana. |
| GET `/reports/admin/weekly/excel` | mismos filtros semanales | XLSX `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, nombre `reporte-semanal.xlsx`; contiene todas las filas, no solo la página JSON. SKU explícitamente como texto, cantidades/importes numéricos cuando no null. |
| GET `/reports/admin/monthly/pdf` | `year,month` requeridos; filtros opcionales | PDF letter horizontal, nombre derivado `MONTH-...pdf`; una fila por semana parcial, totales mensuales. |
| GET `/reports/admin/monthly/excel` | mismos filtros mensuales | XLSX `reporte-mensual.xlsx`; hoja “Reporte mensual”, semanas parciales y totales seleccionados. |

No hay parámetros `page/per_page` en export controller; el helper semanal crea detalle completo y exporta ese conjunto. Los totales no deben recalcularse desde la página JSON. Excel escribe valores monetarios como números de hoja (casting float para PhpSpreadsheet), por lo que puede mostrar representación decimal distinta de la cadena JSON a seis posiciones por formato de celda; JSON/servicio usan strings y aritmética bc. PDF imprime strings del servicio. No se confirmó formato numérico específico de Excel (número de decimales en visualización). En la fila total mensual, el código solo llena ventas netas sin IVA, cobros y costo conocido; las celdas de ganancia/asignación del total quedan vacías, aunque esos valores estén en JSON y PDF.

## Catálogos/filtros

No existe endpoint de catálogo dedicado a reportes. `branch_id`, `product_id`, `category_id` son IDs opcionales validados dentro de la tienda. El controlador verifica pertenencia del branch/product/category, con 404 para ajenos o inexistentes. Un `branch_id` único filtra sucursal; omission consolida todas. No acepta array de sucursales. La selección UI puede reutilizar endpoints administrativos ya disponibles, tras comprobar su propio scope; no asumir que `/branches` público o datos de terminal POS autorizan reportes.

## Protección de datos

JSON, cobertura y ajustes responden `Cache-Control: private, no-store`; PDF/Excel se descargan con la autenticación de Store y las mismas reglas de scope. El controller no permite POS para proteger costos/utilidad. La ruta legacy `/reporte-utilidades/pdf` es independiente y no sustituye estos contratos.

## Consultas y rendimiento

El periodo consulta sale items en bloques `chunkById(300)` y consulta devoluciones/cancelaciones por evento, agrega con decimales y conserva las líneas agregadas en memoria hasta devolver/exportar. La paginación de JSON se aplica **después** de agregar todos los detalles; reduce payload, no el trabajo de consulta ni memoria. Semana limita a 7 días; mes limita un mes, año 2000–2200. No se observó límite de exportaciones por número de partidas. Monthly ejecuta `period()` para cada segmento semanal; incluye agregaciones de pagos/indicadores cada vez.

No se ejecutó volumen MySQL ni medición productiva. La prueba Feature crea esquema mínimo SQLite en memoria y fixtures pequeños. No se verificó el plan de índices en MySQL ni la memoria de XLSX para tiendas grandes; carga Spreadsheet en memoria antes de streamDownload. No afirmar escalabilidad probada para catálogos/ventas masivas.

## Evidencia de prueba

`tests/Feature/AdminFinancialReportsTest.php` configura explícitamente SQLite `:memory:`. Prueba aislamiento por tiendas/sucursales, filtros, costos, fechas parciales, devolución/cancelación, settings, rol POS 403, PDF con magic `%PDF`, XLSX con firma `PK`, columnas y ausencia de escrituras financieras al consultar. Ejecución en esta revisión: **6 pruebas aprobadas, 70 aserciones**. Esto no es prueba MySQL ni descarga HTTP externa.
