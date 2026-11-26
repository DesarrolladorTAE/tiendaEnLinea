# Auditoría integral y preparación de backend — Fase 8

## Dictamen

| Área | Estado con evidencia actual |
| --- | --- |
| Catálogo/compatibilidad vehicular v1 y v2 | Implementado y probado en SQLite; clasificación desconocida no se vuelve universal |
| Expediente, historial y QR | Implementado; pruebas de aislamiento/rotación existentes. El QR identifica, no autoriza. No se corrió prueba concurrente de rotación |
| Formularios versionados/inspección | Implementado y probado por Feature; inspección 25 puntos usa estructura provisional |
| Agenda/recursos/órdenes | Implementado y probado por Feature; falta un recorrido E2E único que reúna los subsistemas |
| Documentos de servicio | Implementados y PDFs renderizados en pruebas; originales del cliente y dispositivo físico pendientes |
| Reportes/costo histórico | Implementados y probados; `cost_tax_basis=unknown`, utilidad final pendiente de confirmación del cliente |
| PrintBridge comercial heredado | Rutas detectadas sin auth explícita; vulnerabilidad y consumidores requieren evaluación coordinada antes de cambiar contrato |
| Concurrencia MySQL | No verificada; bloqueo para despliegue integral |
| Integración React | Contrato consolidado en guía, listo para iniciar implementación; frontend no auditado ni cambiado |
| Producción | No autorizado ni listo para declarar listo |

Backend implementado en alcance: sí. Backend verificado en SQLite para rutas y procesos unitarios/Feature: parcialmente; varias suites prueban segmentos, no hay una prueba que complete todas las 17 etapas en una sola transacción/API. Backend listo para integración React: sí, con los contratos y límites anotados en `guia-integracion-react-fases-1-8.md`. Sistema listo para producción: no, bloqueado por concurrencia MySQL, confirmaciones fiscales, validación de despliegue de migraciones y revisión/transición de impresión heredada.

## Ejecución y resultados

La causa del supuesto fallo de clasificación en intercambio v2 fue la expectativa del fixture: el producto exportado tenía `is_vehicle_universal=false` y solo una marca comercial, pero la prueba exigía `true`. XLSX entregó explícitamente el valor `0`; el importador lo interpretó y preservó correctamente. Se corrigió el fixture para declarar universal explícitamente y el ciclo de exportación/importación pasó con 15 aserciones. Las seis columnas v1 se verifican sin cambios en la misma prueba. No se modificó comportamiento comercial para acomodar la expectativa errónea.

Resultado combinado de suites de servicios, formularios, documentos, expedientes, catálogo, reportes y WhatsApp: **77 aprobadas, 769 aserciones**. Es una selección de módulos con pruebas compartidas, no reemplaza el baseline histórico de 95/881: diferencias de fixtures y archivos ya agregados explican que el conteo no sea comparable como una sola suite única. El intento de añadir `TelorecargoPosTest` produjo 22 fallos 429 y 116 pases en conjunto; aislada produjo 26 fallos 429 y 4 pases. El endpoint `/pos/telorecargo/cotizaciones` declara explícitamente 20 solicitudes/minuto por IP; el archivo hace muchas solicitudes con IP de prueba común. No se desactivó el límite. Es contaminación/limitación del fixture de prueba y debe aislarse por actor/IP de test o reloj congelado en trabajo posterior; no prueba una regresión de fase 8.

Tours permanece en 169 pases y dos fallos conocidos 404/422 por `buyer_phone`. No se cambió tours. MySQL concurrente, pruebas físicas y documentos originales no están disponibles en el entorno.

## Exportación/importación vehicular

`GET /vehicle-compatibilities/export?branch_id={id}` conserva v1. `GET /vehicle-compatibilities/export?branch_id={id}&include_classification=1` produce v2 con columnas opcionales `Universal vehicular (1/0)` y `Marca comercial de la refacción`. Exporta relaciones normales y agrega filas sin vehículo para productos universales o con marca comercial. Importación existente admite esos encabezados opcionales. Si no se envían o quedan vacíos, las propiedades existentes se conservan. La clasificación `0` es explícita; una fila vacía no convierte a universal. Ciclo v2 probado con rangos, universal y SKU con cero inicial. No se hicieron cargas reales.

## PrintBridge: exposición y transición

Rutas visibles en `routes/api.php`:

| Método/ruta | Controlador/operación | Protección visible |
| --- | --- | --- |
| `POST /printbridge/print-sale/{sale}` | `PrintBridgeController::printSale` | Sin middleware en declaración |
| `POST /printbridge/print-test` | `PrintBridgeController::printTest` | Sin middleware en declaración |
| `GET /sales/{sale}/print-payload` | `SaleController::printPayload` | Sin middleware visible en declaración indicada |
| `POST /sales/{sale}/print-escpos` | `SaleController::printEscPos` | `auth:sanctum` |
| `GET /credit-accounts/{creditAccount}/print-payload` | `CreditAccountController::printPayload` | Dentro de grupo POS autenticado |
| `GET /recargas/{id}/print-payload` | Telorecargo POS | Grupo `api.auth:sanctum` |

El controlador de venta carga venta, tienda, ticket, partidas, cliente/posición según el método, compone ticket y puede abrir cajón/cortar/imprimir. La venta expone IDs, importes, partidas y metadatos; `print-test` opera con payload de prueba. La ruta pública por ID tiene riesgo de enumeración y exposición intertienda, sujeto a confirmar cualquier firma/token dentro de `SaleController::printPayload` y middleware global. Rutas `/printbridge/*` también necesitan comprobar la autorización en `printSale`/`printTest` y límites de contenido.

No se encontró en este repositorio cliente Android/Windows ni telemetría suficiente que identifique consumidores instalados. Propuesta: inventariar versiones activas con los responsables, añadir endpoint versionado autenticado que valide venta y tienda/POS y entregue payload, distribuir cliente compatible con token Sanctum/credencial de dispositivo, observar adopción y solo entonces restringir las rutas antiguas en una ventana de transición. No se alteraron rutas heredadas por riesgo de corte.

## Migraciones de fases 2–7

Inventario por bloque de fase y dependencias observadas. Ejecutar según prefijo/fecha y orden Laravel; las migraciones base anteriores del sistema deben estar aplicadas. Ninguna se corrió durante esta auditoría.

| Archivo | Cambios y dependencia principal | Reversión/riesgo |
| --- | --- | --- |
| `2026_11_11_120000_create_vehicle_catalog.php` | crea `vehicle_brands`, `vehicle_models`, `product_vehicle_compatibilities`; depende de `stores`, `products` | elimina catálogos y relaciones si se revierte con datos |
| `2026_11_11_160000_add_vehicle_catalog_settings_to_branches.php` | campos de modo/config de catálogo en `branches` | quitar configuración existente |
| `2026_11_19_120000_create_pos_modules_tables.php` | `pos_modules`, `store_pos_modules` y módulos generales | elimina asignaciones |
| `2026_11_19_130000_create_pos_location_modules_table.php` | permisos/override del POS | elimina permisos POS |
| `2026_11_23_120000_create_product_batch_inventory.php` | agrega flags en `products`; crea lotes, stocks, recibos, movimientos y consumo por partida | eliminación de historial y stock de lote al rollback |
| `2026_11_23_190000_add_pricing_to_warehouse_variant_stocks.php` | precio/costo de compra a stock de variante | elimina precios/costos de ubicación |
| `2026_11_23_200000_add_interface_design_to_pos_locations.php` | preferencia de interfaz POS | valor guardado |
| `2026_11_24_120000_default_classic_interface_design_for_pos_locations.php` | actualiza valores de interfaz | update reversible no restaurará cada valor previo automáticamente |
| `2026_11_24_130000_add_cash_report_warehouse_ids_to_pos_locations.php` | JSON de almacenes de reporte | elimina preferencia |
| `2026_11_25_000001_create_vehicles_and_service_relations.php` | crea `vehicles`; agrega `vehicle_id`, snapshots y odómetro en bookings/orders; FK a clientes/marcas/modelos | drop elimina expedientes, snapshots/odómetro; revisar datos antes de rollback |
| `2026_11_25_000002_register_vehicle_modules.php` | registra `vehicle_catalog`, `vehicle_records`, preserva asignaciones de tiendas | down conserva permisos deliberadamente |
| `2026_11_25_000003_create_service_form_tables.php` | crea plantillas y submissions con snapshots | drop elimina respuestas/plantillas |
| `2026_11_25_000004_register_service_forms_module.php` | registra módulo de formularios | verificar down en archivo antes de operar |
| `2026_11_25_000005_add_form_requirements_snapshot_to_service_orders.php` | JSON snapshot de requisitos en órdenes | eliminar snapshot histórico |
| `2026_11_26_000001_add_explicit_vehicle_universal_to_products.php` | `products.is_vehicle_universal`, `commercial_brand`, índice compuesto | elimina clasificación/marca capturadas al revertir |
| `2026_11_27_000001_add_unit_cost_at_sale_to_sale_items.php` | `sale_items.unit_cost_at_sale DECIMAL(18,6) NULL` | elimina costos históricos capturados al revertir |

El bloque de fase 7 es aditivo y nullable. Para desplegar después de respaldo y autorización, ejecutar `php artisan migrate --pretend` en staging, revisar SQL, luego `php artisan migrate --path=database/migrations/2026_11_26_000001_add_explicit_vehicle_universal_to_products.php` y `php artisan migrate --path=database/migrations/2026_11_27_000001_add_unit_cost_at_sale_to_sale_items.php`. No usar `migrate:fresh`, `refresh` ni rollback en datos reales. Código y esquema se revierten por separado; perder la columna de fase 7 descarta los nuevos snapshots de costo, y la fase 6 descarta universal/marca comercial.

## Módulos y permisos

| Función | Módulo/config | Store | POS | Alcance |
| --- | --- | --- | --- | --- |
| Compatibilidad vehicular | `vehicle_catalog`, ajuste branch | consulta/admin; administración por tienda | consulta en su branch, almacén asignado y ventas habilitadas | misma tienda/sucursal |
| Expediente/QR | `vehicle_records` | administra | consulta/operación si habilitado | misma tienda; branch para órdenes |
| Servicios/órdenes/agenda | `service_sales` | configura y opera | opera branch; no configura | misma tienda y sucursal |
| Formularios | `service_forms` | plantilla/configura | responde/cierra conforme estado | orden y sucursal |
| Costos/reportes | autenticación Store | permitido | 403 | tienda; sucursal validada |
| Documentos privados | `auth:sanctum`, scope servicio | permitido dentro tienda | permitido dentro branch | `private, no-store` |
| PrintBridge legado | rutas históricas | contrato por evaluar | consumidores por identificar | riesgo y transición pendientes |

## Concurrencia MySQL: procedimiento reproducible, no ejecutado

Crear MySQL desechable local/CI aislado por el equipo de infraestructura; nunca apuntar al `.env` de producción. Requisitos: motor MySQL en versión compatible con el servidor MTELMX, dos conexiones independientes, base `mtelmx_concurrency_test` sin datos reales y credenciales sin permisos fuera de esa base. Exportar en shell temporal:

```bash
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mtelmx_concurrency_test
DB_USERNAME=mtelmx_test
DB_PASSWORD=<secreto-local-de-pruebas>
APP_ENV=testing
```

Verificar `SELECT DATABASE(), @@hostname, @@version;`, abortar si hostname/base no corresponden al contenedor desechable; revisar configuración antes de migrar. Crear esquema con migraciones en base vacía de prueba (nunca `migrate:fresh` fuera del contenedor), sembrar tienda/branch/servicio/recursos/cliente ficticios y ejecutar dos procesos PHPUnit con conexiones distintas y barrera sincronizada para disponibilidad/reserva, recurso compartido, capacidad, reprogramación, conversión de orden idempotente, formulario, finalización, odómetro y rotación QR. Esperado: una sola reserva dentro de capacidad, una orden enlazada, una transición terminal efectiva y kilometraje monotónico/token anterior inválido. Borrar contenedor y volumen de prueba al finalizar. Esta guía no reemplaza ejecución; MySQL no está presente/configurado aquí y el bloqueo de concurrencia sigue activo.

## Rendimiento, pendientes y despliegue

La prueba de catálogo mide 500 productos/1,000 compatibilidades en SQLite y consultas acotadas; no es benchmark MySQL. Los reportes procesan items por chunks, pero el JSON semanal pagina tras acumular líneas en memoria; probar varios miles y luego optimizar si hace falta. Catálogos de varios miles en MySQL aún requieren benchmark aislado.

Pendientes del cliente: base fiscal de costos; semántica de caja fija/inversión/gastos; formato original de inspección y reportes; impresora física. Pendientes de entorno: MySQL concurrente; repositorios/telemetría Android y Windows para PrintBridge; esquema MySQL staging representativo. Los dos fallos tours 404/422 siguen apartados; no se cambió su contrato.

Despliegue futuro (no ejecutado): respaldo verificado de DB/código; confirmar motor/PHP/dependencias; revisión `migrate --pretend` en staging; aplicar migraciones autorizadas en orden; activar módulos selectivamente por administración de tienda, sin IDs codificados; smoke tests de venta, expediente, servicio, formulario, PDF, tour y reportes; revisar 401/403/404/422 y logs; detener ante migración inesperada, tenant cruzado, cambio de venta/ticket, error 429 inesperado o PDF privado cacheable. Reversión: detener tráfico, restaurar código compatible, evaluar datos capturados en columnas antes de revertir esquema; no ejecutar rollback que borre datos sin respaldo y autorización.
