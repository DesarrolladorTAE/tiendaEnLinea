# Migraciones y despliegue

## Migraciones

Inventario de migraciones relevantes de fases 2–7 (requieren las tablas base existentes del sistema):

| Archivo | Estructura/cambio | Riesgo de rollback |
|---|---|---|
| `2026_11_11_120000_create_vehicle_catalog.php` | crea marcas/modelos/compatibilidades; depende de stores/products | pérdida de catálogos/relaciones |
| `2026_11_11_160000_add_vehicle_catalog_settings_to_branches.php` | configuración vehicular en branches | pérdida de preferencias |
| `2026_11_19_120000_create_pos_modules_tables.php` | configuración de módulos POS/tienda | pérdida de configuración |
| `2026_11_19_130000_create_pos_location_modules_table.php` | overrides por terminal | pérdida de overrides |
| `2026_11_24_130000_add_cash_report_warehouse_ids_to_pos_locations.php` | JSON de almacenes visibles en reportes POS | pérdida de preferencia |
| `2026_11_25_000001_create_vehicles_and_service_relations.php` | crea vehicles; agrega vehicle_id, snapshots, odómetro y FKs en bookings/orders | pérdida de expedientes e historial |
| `2026_11_25_000002_register_vehicle_modules.php` | registra `vehicle_catalog`, `vehicle_records` | down conserva asignaciones según auditoría |
| `2026_11_25_000003_create_service_form_tables.php` | crea plantillas y submissions con snapshots | pérdida de respuestas/plantillas |
| `2026_11_25_000004_register_service_forms_module.php` | registra `service_forms` | revisar down antes de operar |
| `2026_11_25_000005_add_form_requirements_snapshot_to_service_orders.php` | JSON de requisitos congelados en órdenes | pérdida de snapshot histórico |
| `2026_11_26_000001_add_explicit_vehicle_universal_to_products.php` | `products.is_vehicle_universal`, `commercial_brand`, índice | pérdida de clasificación/marca |
| `2026_11_27_000001_add_unit_cost_at_sale_to_sale_items.php` | `sale_items.unit_cost_at_sale DECIMAL(18,6) NULL` | pérdida de costos históricos capturados |

Las migraciones base de servicios `2026_09_02_103549_create_services_booking_tours_and_tracking_system.php` y `2026_09_02_105555_create_service_images_table.php` preceden a las relaciones vehiculares. El repositorio contiene además migraciones comerciales fuera de las fases objeto de esta entrega. La auditoría completa está en [auditoria-fase-8-y-despliegue.md](../auditoria-fase-8-y-despliegue.md).

No ejecutar migraciones desde frontend. Operador debe verificar nombre de base, respaldo, versión y estado del esquema. En staging, el operador autorizado puede ejecutar `php artisan migrate:pretend`, revisar SQL y después `php artisan migrate --force`. Para aplicación acotada de columnas nuevas, paths: `database/migrations/2026_11_26_000001_add_explicit_vehicle_universal_to_products.php` y `database/migrations/2026_11_27_000001_add_unit_cost_at_sale_to_sale_items.php`. Este paquete no ejecuta migraciones ni recomienda ejecutarlas en producción sin ventana y aprobación operativa.

## Despliegue (procedimiento, no ejecutado)

1. Acordar ventana y congelar escrituras administrativas.
2. Respaldar código y base; comprobar restauración del respaldo.
3. Confirmar entorno y motor/versiones; excluir producción de cualquier prueba.
4. Ejecutar `php artisan migrate:status`; revisar plan/archivos y dependencias.
5. En staging aislado, aplicar `php artisan migrate --force` solo después de aprobación operativa.
6. Verificar columnas `products.is_vehicle_universal` y `products.commercial_brand`, constraints y módulos.
7. Habilitar módulos únicamente a tiendas autorizadas por configuración, nunca por IDs codificados.
8. Ejecutar pruebas de humo auth, POS, servicios, PDF, búsqueda, reportes y tours; revisar logs/429.
9. Parar si hay error de migración, fuga cross-store, cambio POS, inconsistencias financieras o rutas de documento no autorizadas.

## Reversión

Revertir código y esquema son acciones distintas. No usar `migrate:fresh`, `migrate:refresh` ni rollback en bases con datos reales. Antes de rollback, confirmar si `down()` elimina datos (por ejemplo clasificación universal/marca comercial); exportar/respaldar contenido nuevo. Preferir forward-fix si hubo escrituras. Los comandos exactos deben seleccionarse del inventario de auditoría con el operador de base; no ejecutar rollback automáticamente.

## Condiciones de producción pendientes

Concurrencia MySQL aislado, benchmark MySQL, revisión formal de exposición/compatibilidad PrintBridge, resolución de dos fallos de tours por separado, decisiones fiscales y validación física siguen pendientes según documento 13. El backend no está declarado listo para producción por este paquete.

