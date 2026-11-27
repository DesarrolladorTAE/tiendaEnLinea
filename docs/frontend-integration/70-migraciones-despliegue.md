# Migraciones y preparación de despliegue

## Inventario relevante de fases 2–7 (orden temporal)

| Archivo | Efecto principal | Reversión/riesgo |
|---|---|---|
| `2026_09_02_103549_create_services_booking_tours_and_tracking_system.php` | Base de servicios, booking, tours y tracking | Drop elimina estructuras operativas compartidas; no revertir con datos. |
| `2026_09_02_105555_create_service_images_table.php` | Imágenes de servicio | Drop elimina referencias/archivos asociados según implementación. |
| `2026_11_11_120000_create_vehicle_catalog.php` | Crea `vehicle_brands`, `vehicle_models`, `product_vehicle_compatibilities` | Drop destruye catálogo/relaciones cargadas. |
| `2026_11_11_160000_add_vehicle_catalog_settings_to_branches.php` | Añade `catalog_search_mode`, `vehicle_compatibilities_enabled` a branches | Drop pierde configuración por sucursal. |
| `2026_11_19_120000_create_pos_modules_tables.php` | Crea configuración de módulos de tienda/POS | Drop destruye configuración/asignaciones. |
| `2026_11_19_130000_create_pos_location_modules_table.php` | Crea overrides de módulos por terminal POS | Drop elimina overrides por terminal. |
| `2026_11_23_120000_create_product_batch_inventory.php` | Flags de producto y estructuras de lote/stock/recibo/movimiento/consumo | Rollback destruye historial y stock de lotes. |
| `2026_11_23_190000_add_pricing_to_warehouse_variant_stocks.php` | Añade precio/costo al stock de variante por almacén | Drop pierde datos de precio/costo por ubicación. |
| `2026_11_23_200000_add_interface_design_to_pos_locations.php` | Preferencia de diseño de interfaz POS | Drop pierde preferencia guardada. |
| `2026_11_24_120000_default_classic_interface_design_for_pos_locations.php` | Normaliza valor de diseño predeterminado | Rollback no restaura necesariamente los valores anteriores por fila. |
| `2026_11_24_130000_add_cash_report_warehouse_ids_to_pos_locations.php` | Agrega JSON de almacenes autorizados para reporte de caja | Drop pierde selección de almacenes. |
| `2026_11_25_000001_create_vehicles_and_service_relations.php` | Crea `vehicles`; agrega relaciones vehicle a bookings/service_orders, snapshots/campos relacionados | Drop tablas/columnas destruye expediente y relaciones. |
| `2026_11_25_000002_register_vehicle_modules.php` | Registra módulos vehiculares en catálogo existente | Reversión elimina registros de módulo según migración. |
| `2026_11_25_000003_create_service_form_tables.php` | Crea `service_form_templates`, `service_form_submissions` | Drop destruye plantillas, versiones y capturas. |
| `2026_11_25_000004_register_service_forms_module.php` | Registra módulo formularios | Reversión afecta registro/config del módulo. |
| `2026_11_25_000005_add_form_requirements_snapshot_to_service_orders.php` | Añade snapshot de requisitos a órdenes | Drop pierde snapshots históricos. |
| `2026_11_26_000001_add_explicit_vehicle_universal_to_products.php` | Añade `products.is_vehicle_universal`, `commercial_brand` e índice | Drop pierde clasificación/marca y el índice. |
| `2026_11_27_000001_add_unit_cost_at_sale_to_sale_items.php` | Añade `sale_items.unit_cost_at_sale` nullable DECIMAL(18,6) | Drop pierde costos guardados desde migración. |

El inventario refleja las migraciones relacionadas con funcionalidades/ajustes de las fases según el registro de auditoría previo; no pretende enumerar todas las migraciones comerciales del producto. Requieren tablas base y el orden Laravel por timestamp. Las tablas nuevas señaladas son las del catálogo vehicular, lotes/inventario y formularios; esta fase no añadió ninguna. La migración de vehículos también altera tablas existentes. Revisar cada archivo y `migrate:status` en staging antes de producción. No se ejecutó ninguna migración en este cierre.

## Procedimiento (no ejecutado)

1. Respaldo verificado de BD y código/config; ventana de mantenimiento aprobada.
2. Confirmar motor/versión, espacio, `php artisan migrate:status` y conexión de destino por nombre/host; abortar ante cualquier duda de producción/tenant.
3. Respaldar datos y probar restauración en staging.
4. Desplegar código compatible; ejecutar `php artisan migrate --force` solo en destino autorizado, revisando salida por migración.
5. Limpiar cache/config/route según procedimiento del proyecto; validar permisos/módulos solo para tienda autorizada, sin activación global.
6. Pruebas humo de login, POS tradicional, tours, Telorecargo, servicios, documentos y reportes.
7. Si se revierte código tras migrar, normalmente dejar esquema aditivo; no hacer rollback automático: eliminar columnas/tables puede destruir datos capturados.

Comandos de inspección: `php artisan migrate:status`; aplicación autorizada: `php artisan migrate --force`. No usar `migrate:fresh`, `refresh` o rollback contra datos reales.
