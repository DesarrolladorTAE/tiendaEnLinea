# Cierre POS y preparación de migraciones

Fecha de revisión: 2026-11-27. Esta revisión fue de código y pruebas locales. No se conectó a una base de datos configurada en `.env`, no se ejecutaron migraciones y no se usó producción.

## Dictamen resumido

| Área | Estado | Evidencia / condición |
|---|---|---|
| Token POS limitado a tienda propietaria | Aprobado en pruebas SQLite | `POST /admin/pos-token` busca terminal por `store_id`, verifica tienda activa/acceso y sucursal activa; solo emite un `sell-only` token. |
| Almacenes en V2 | Aprobado en pruebas SQLite | Se valida contra asignación de terminal, tienda, sucursal y estado activo, antes de escribir y otra vez dentro de la transacción. |
| Módulos operativos | Parcial | `PosModuleService`, scope operativo y pruebas respetan módulos de tienda/terminal. `service_sales` es módulo preexistente y su ausencia de preferencia de tienda equivale a habilitado; revisar esa configuración antes de habilitar terminales. |
| Expedientes compartidos por tienda | Aprobado en pruebas SQLite | Vehículos se consultan por tienda; las operaciones y el historial de servicios usan alcance de sucursal. No se añade `branch_id` a `vehicles`. |
| MySQL aislado | Pendiente | No se localizó ni verificó una instancia desechable autorizada. |
| Producción | No autorizado/recomendado aún | Primero ejecutar ensayo MySQL aislado, revisar duración/bloqueos y validar configuración efectiva de módulos. |

## Correcciones y archivos relevantes

- `routes/api.php`: emisión segura en `POST /admin/pos-token`; identidad Store, tienda activa con acceso, terminal de esa tienda y sucursal activa; una sola llamada a `createToken`, ability conservada `sell-only`, respuesta conservada `{"token":"..."}`.
- `app/Services/POS/PosWarehouseAuthorization.php`: autorización de almacenes V2 para productos con inventario por almacén. Los productos con inventario tradicional a nivel producto no requieren almacén, preservando el contrato anterior.
- `app/Http/Controllers/Pos/SaleV2Controller.php` y `app/Services/PointOfSaleServiceV2.php`: validación previa y validación transaccional para cerrar la carrera entre comprobar asignación y registrar la venta.
- `app/Services/PosModuleService.php`, `app/Http/Controllers/POS/PosModuleController.php`: capacidades efectivas de tienda y terminal. Los módulos `vehicle_catalog`, `vehicle_records`, `service_forms` y `service_sales` se someten a gate de tienda; no es posible habilitar el override POS si el módulo está apagado en la tienda.
- `app/Http/Controllers/ClienteController.php`: escrituras de administración de clientes desde terminal requieren el módulo visible; las lecturas siguen disponibles para carrito/crédito/venta.
- Pruebas: `tests/Feature/PosTokenIssuanceTest.php`, `PosProductLookupTest.php`, `PosModulesTest.php`, `VehicleRecordsTest.php`, `ServiceOperationsTest.php`, `ServiceFormsTest.php`, `VehicleCatalogTest.php`, `ProductSearchTest.php`, `OfflineCheckoutTotalTest.php`.

## Resultado de regresión

Comando focalizado, con SQLite en memoria y sin migraciones del entorno configurado:

```bash
env DB_CONNECTION=sqlite DB_DATABASE=:memory: DB_URL= php artisan test \
  tests/Feature/PosTokenIssuanceTest.php \
  tests/Feature/PosProductLookupTest.php \
  tests/Feature/PosModulesTest.php \
  tests/Feature/VehicleRecordsTest.php \
  tests/Feature/ServiceOperationsTest.php \
  tests/Feature/ServiceFormsTest.php \
  tests/Feature/VehicleCatalogTest.php \
  tests/Feature/ProductSearchTest.php \
  tests/Feature/OfflineCheckoutTotalTest.php
```

Resultado: **106 pruebas aprobadas, 954 aserciones**. Es evidencia SQLite/Feature, no evidencia de concurrencia MySQL ni de despliegue HTTP real.

La ejecución completa anterior en SQLite terminó en 559 aprobadas y 51 fallidas; incluyó fallos de Telorecargo por 429, los dos fallos conocidos de tours 404/422 y fallos de otros módulos. No se atribuyen a este cambio sin evidencia causal.

## Revisión de las siete migraciones

Orden por timestamp (dependencias de esquema existentes se indican por nombre):

| Orden | Migración | Efectos y datos | Compatibilidad / riesgos |
|---:|---|---|---|
| 1 | `2026_11_25_000001_create_vehicles_and_service_relations` | Crea `vehicles`; agrega `vehicle_id` nullable, índices y snapshots nullable a `bookings` y `service_orders`. No hay backfill. | FK requiere `stores`, `clientes`, `vehicle_brands`, `vehicle_models`, `bookings` y `service_orders` previas y tipos compatibles. Crea índices únicos por tienda para placas/VIN normalizados solo en la tabla nueva. DDL e índices sobre tablas existentes pueden bloquear según tamaño/versión MySQL. |
| 2 | `2026_11_25_000002_register_vehicle_modules` | `updateOrInsert` de `vehicle_catalog` y `vehicle_records`. Si existe `branches.vehicle_compatibilities_enabled`, inserta/actualiza `store_pos_modules.enabled=true` solo para tiendas con al menos una sucursal con esa bandera. No activa `vehicle_records`. | Sí modifica datos de configuración. Conserva acceso legacy de catálogo, pero puede sobreescribir un `enabled=false` explícito en `store_pos_modules` para una tienda que aún tenga la bandera de sucursal activa. Revisar ese caso antes del despliegue; si el `false` representa una decisión explícita actual, la migración requiere ajuste/autorización antes de producción. |
| 3 | `2026_11_25_000003_create_service_form_tables` | Crea `service_form_templates` y `service_form_submissions`, con FK/índices/únicos. No backfill ni crea plantillas. | Requiere stores y service_orders. Restricciones únicas: `(store_id,key)`, `(service_order_id,service_form_template_id)` y `(store_id,folio)`. No afectan registros antiguos porque las tablas son nuevas. |
| 4 | `2026_11_25_000004_register_service_forms_module` | Registra/actualiza la fila `service_forms` en `pos_modules`; no crea `store_pos_modules` ni overrides terminales. | No habilita automáticamente formularios en tiendas existentes. Conserva assignments en `down()`. |
| 5 | `2026_11_25_000005_add_form_requirements_snapshot_to_service_orders` | Agrega JSON nullable `form_requirements_snapshot`. Sin backfill. | Compatible con órdenes existentes por ser nullable. Puede bloquear brevemente la tabla en versiones/configuraciones que no hagan instant DDL. |
| 6 | `2026_11_26_000001_add_explicit_vehicle_universal_to_products` | Agrega `products.is_vehicle_universal` boolean default false, `commercial_brand` nullable e índice `(store_id, commercial_brand)`. Sin backfill explícito. | La columna con default puede requerir reconstrucción/bloqueo en ciertos MySQL. Productos previos quedan `false`/`NULL`; no se clasifican como universales. Reversión elimina datos de esas columnas. |
| 7 | `2026_11_27_000001_add_unit_cost_at_sale_to_sale_items` | Agrega `sale_items.unit_cost_at_sale DECIMAL(18,6) NULL`. Sin backfill. | Ventas anteriores permanecen desconocidas (`NULL`); no se copia el costo actual. DDL sobre sale_items puede bloquear. `down()` elimina costos capturados tras migrar: pérdida irreversible de esos datos. |

### Suficiencia y configuración posterior

Las siete cubren las estructuras de vehículos, formularios, snapshots, universal explícito y costo histórico descritas en ellas, asumiendo que el esquema base del servidor ya contiene las tablas y columnas preexistentes requeridas. No puede confirmarse suficiencia respecto del servidor sin su `migrate:status`, versión/esquema y una restauración de respaldo en entorno aislado.

No se crean automáticamente plantillas, datos de vehículos ni formularios. La migración 2 es el único backfill/configuración selectiva: conserva habilitación del catálogo anterior a nivel tienda para sucursales con compatibilidad habilitada. `vehicle_records` y `service_forms` quedan apagados por defecto en `PosModuleService` cuando no hay preferencia. `vehicle_catalog` sin preferencia usa la configuración heredada de sucursales. `service_sales` es módulo preexistente (registrado en migración 2026-11-19), no uno de los siete; su configuración preexistente debe verificarse, porque el servicio trata la ausencia de preferencia como habilitada.

Las migraciones de registro son SQL `updateOrInsert`, por eso `migrate --pretend` no necesariamente muestra su efecto de datos. La migración 2 debe recibir una comprobación adicional en MySQL con fixtures que contengan: una tienda legacy con compatibilidad activa y sin preferencia; una con `enabled=false` explícito y compatibilidad activa; una con compatibilidad apagada; y una tienda nueva. El caso de `false` explícito debe resolverse antes de producción.

**Hallazgo de habilitación operativa:** las siete migraciones no asignan `service_sales` a tiendas, pero `PosModuleService` y `ServiceOperationScope` tratan la falta de una preferencia Store para el módulo preexistente `service_sales` como habilitado (y el override POS ausente hereda ese estado). Así, la migración no realiza un backfill global, pero la lógica runtime puede mostrar/permitir agenda y órdenes a una terminal sin denegación explícita, sujeto a plan, sucursal y acceso. No recomiendo activar el menú POS ni declarar el control “solo terminales elegidas” completo hasta que se revisen las preferencias reales de las tiendas y se determine una política segura de default. Cambiar el default puede retirar funcionalidad heredada; requiere despliegue por etapas y decisión del cliente.

Los `down()` de 1, 3, 5, 6 y 7 eliminan tablas/columnas y, por tanto, todo dato nuevo almacenado en ellas. Los `down()` de 2 y 4 conservan registros de módulo y asignaciones. DDL MySQL puede hacer commit implícito; no asumir rollback atómico de toda la secuencia.

## Propuesta de precios y descuentos — no implementada

**Problema.** `SaleV2Controller` valida que `unit_price >= 0`, precisión y porcentajes de descuento dentro del rango, pero normalizar/validar sintaxis no demuestra autorización comercial del precio recibido. Campos revisados: `unit_price`, `original_price`, `discount_percent`; existen variantes, almacenes y cantidades con reglas propias. No modificar precios sin resolver qué identidades pueden aplicar precio manual y qué políticas preexistentes aplican.

**Cambio mínimo propuesto.** Centralizar validación de línea en el escritor/servicio V2 existente: recuperar producto/variante dentro del store y almacén autorizado; calcular precio esperado mediante la misma política existente; aceptar diferencia solo cuando el actor tenga la capacidad comercial existente para precio manual/descuento, registrar valor original y motivo conforme al mecanismo actual. Rechazar sin escritura si precio/descuento no está autorizado. Primero inventariar y reutilizar toda autorización vigente; no imponer precio de catálogo a operaciones legítimas.

**Archivos candidatos:** `app/Http/Controllers/Pos/SaleV2Controller.php`, `app/Services/PointOfSaleServiceV2.php` y servicio de pricing existente localizado por la siguiente autorización. **Migración:** no se anticipa si basta con autorización/validación existente; si auditoría encuentra que no se persiste actor/motivo y el negocio lo exige, presentar esquema por separado antes de tocarlo. **Compatibilidad/reversión:** habilitar inicialmente detrás de configuración por tienda/terminal con observación de rechazos; desplegar código con modo observación y revertir al comportamiento anterior si bloquea un caso legítimo, sin borrar ventas.

## Propuesta de desactivación de terminales — no implementada

**Problema.** No hay un campo/estado general de terminal inactiva comprobado en `pos_locations`; el endpoint de emisión verifica sucursal activa, pero eso no revoca por sí mismo tokens Sanctum existentes. **Solución mínima:** columna nullable o boolean `is_active` con default `true` para no bloquear terminales existentes; administración para cambiarla; al autenticar y en middleware POS verificar terminal activa; revocación de tokens de esa terminal mediante `currentAccessToken()->delete()` al desactivar o acción explícita. Acordar si sucursal inactiva suspende terminal. **Archivos:** migración aditiva, `PosLocation`, flujo de `POSAuthController`, middleware de identidad/CheckStoreAccess y administración de terminal. **Impacto:** activas por defecto conserva legado. **Reversión:** reactivar las terminales antes de rollback; al revertir se pierde el estado de desactivación. Requiere autorización de esquema y de flujo de autenticación.

## Propuesta de idempotencia y recuperación de venta — no implementada

**Problema.** Sin clave por operación, una respuesta perdida deja ambigüedad; buscar por fecha/importe/cliente no identifica inequívocamente y reintentar puede duplicar venta, pagos e inventario. **Solución:** agregar una clave UUID por solicitud única en alcance `(store_id,pos_location_id,idempotency_key)`, hash canónico de la petición, estado de procesamiento y referencia a la venta final; reservar la clave bajo unique constraint antes de ejecutar cobro, dentro de una transacción compatible, y coordinar inventario/pagos para que la repetición devuelva el resultado original. Misma clave con payload distinto devuelve conflicto. Para respuestas perdidas, consulta autenticada por clave desde la misma terminal. **Archivos:** migración/tabla o columnas, `SaleV2Controller`, escritor V2, modelo de venta/operación, endpoint de consulta y contrato POS. La opción de estructura requiere decisión de esquema y una prueba MySQL concurrente; no se implementa aquí. **Reversión:** detener generación de claves cliente, preservar historial; no retirar índice/registro mientras existan solicitudes referenciadas. Sin esquema, recuperación actual solo puede hacerse manualmente por historial autorizado y no es inequívoca.

## Procedimiento reproducible de ensayo MySQL aislado

No ejecutar hasta que una persona confirme explícitamente que host/base son de pruebas desechables y estén aislados de producción. No apuntar `.env` compartido del servidor. Ejemplo para MySQL local ya instalado/autorizado; no se instala ni inicia infraestructura aquí:

1. Crear una instancia/servicio desechable separado y una base vacía, p. ej. `mtelmx_pos_migration_test_20261127`; credencial exclusiva con privilegios solo en esa base. Usar MySQL **8.0+** como objetivo de prueba recomendado; la versión de producción sigue sin confirmarse. Requisitos de PHP del proyecto: **8.2+**, Composer según `composer.lock`, extensiones `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `fileinfo`, `gd` (verificar extensiones adicionales del lock/deployment).
2. En una copia de trabajo del API (sin secretos), configurar un `.env.testing` local con:

```dotenv
APP_ENV=testing
APP_DEBUG=true
APP_KEY=base64:GENERAR_CLAVE_EXCLUSIVA_LOCAL
APP_URL=http://127.0.0.1:8000
APP_TIMEZONE=America/Mexico_City
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3307
DB_DATABASE=mtelmx_pos_migration_test_20261127
DB_USERNAME=mtelmx_test
DB_PASSWORD=SECRETO_LOCAL_NO_REUTILIZADO
SESSION_DRIVER=array
CACHE_STORE=array
QUEUE_CONNECTION=sync
MAIL_MAILER=log
FILESYSTEM_DISK=local
```

No copiar claves o credenciales de `.env` real. No configurar Conekta, PayPal, WhatsApp, CFDI ni proveedores; usar fake/log/sandbox de tests. Redis, queue worker y scheduler no son necesarios para este ensayo.

3. Validar antes de Artisan: `php -v`, `composer check-platform-reqs`; consultar en consola interactiva `SELECT DATABASE(), @@hostname, @@version;` y detenerse si base/host no coinciden con el entorno desechable aprobado. Confirmar `APP_ENV=testing` y que `DB_URL` está vacío para que no reemplace la conexión declarada.
4. Instalar dependencias solo si el entorno autorizado ya cuenta con el lock: `composer install --no-interaction`. No ejecutar `DatabaseSeeder` ni `migrate:fresh`. Para un esquema representativo desde cero, aplicar migraciones base en orden sobre esa base vacía y, después, los siete archivos enumerados; inspeccionar `php artisan migrate:status` y guardar salida. Para verificar solo las siete en un clon de esquema sin datos personales, restaurar un dump estructural saneado (sin filas) y ejecutar `php artisan migrate --force` apuntando al nombre exacto de prueba. Las migraciones 2 y 4 requieren después verificar SQL/data con fixtures. No usar un clon con datos reales.
5. Fixture focalizado y ficticio: crear dos tiendas A/B; dos sucursales A1/A2 y B1; terminales POS en A1/A2/B1; habilitar modules/features explícitamente solo en A1; asignar almacén A1-W1 a POS A1 y dejar A1-W2 sin asignar, además de B1-W3 e inactivo; clientes/vehículos solo en sus tiendas; servicios y plantillas en A1; productos de inventario almacén y tradicional con costos `NULL` y `0`. Para la regresión ya existen fixtures por prueba en `PosTokenIssuanceTest`, `PosProductLookupTest`, `PosModulesTest`, `VehicleRecordsTest`, `ServiceOperationsTest` y `ServiceFormsTest`; pueden ejecutarse con `DB_CONNECTION=sqlite` o contra el MySQL desechable, pero las pruebas que crean esquemas manualmente están diseñadas primordialmente para SQLite y no sustituyen una migración completa representativa.
6. Ensayo de migraciones MySQL: registrar antes/después `migrate:status`, `SHOW CREATE TABLE` de `vehicles`, `bookings`, `service_orders`, formularios, `products`, `sale_items`; validar filas de module assignments de los cuatro escenarios legacy; confirmar productos existentes `is_vehicle_universal=0`, `commercial_brand=NULL` y ventas anteriores `unit_cost_at_sale=NULL`. Medir duración y metadata locks de cada migración; revisar logs/`performance_schema.metadata_locks` en instancia desechable.
7. API de prueba para React: servir únicamente en loopback/LAN VPN de pruebas, configurar CORS con el origen exacto de Vite (p. ej. `http://localhost:5173`), `SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173`, `SESSION_DOMAIN` coherente solo si se usa cookie Sanctum; para tokens Bearer Sanctum no compartir `AUTH_TOKEN` administrativo con `POS_TOKEN`. En frontend: `VITE_API_URL=http://127.0.0.1:8000/api`. Crear Store/terminal ficticios y tokens mediante operaciones de prueba; nunca tokenear una terminal real.
8. Limpieza: detener el servidor local; verificar otra vez nombre/base; eliminar únicamente la base desechable y revocar credenciales exclusivas. Nunca correr `db:wipe`, `migrate:fresh` o `rollback` si no se confirmó el nombre exacto de esa base.

Los fixtures de Feature actuales usan factories/creación de esquema en SQLite y no constituyen por sí mismos un seeder MySQL general. Se recomienda primero usar un dump **solo de esquema**, migraciones y un seeder dedicado de sandbox en una solicitud autorizada posterior; no se creó ni ejecutó un seeder general en esta actividad.

## Recomendación de autorización

- **Migraciones de prueba MySQL:** autorizables después de confirmar host, base, credencial desechable y versión; todavía no ejecutadas.
- **Migraciones en producción:** no autorizar todavía. Antes: resolver el `enabled=false` explícito potencialmente sobrescrito por migración 2; ensayar duración/locks sobre esquema MySQL representativo; tener respaldo verificable y ventana de rollback; comprobar estado real de migraciones del servidor sin alterar datos.
- **Habilitar módulos POS en producción:** no recomendado todavía por falta de validación MySQL/HTTP, default permisivo de `service_sales` cuando falta preferencia y pendientes de precios/idempotencia/estado de terminal. No habilitar globalmente; activar por tienda y terminal autorizadas tras completar esas verificaciones.

No se alteraron migraciones, no se ejecutó Artisan contra una base del servidor, no se hicieron ventas reales, despliegue, commit ni push.
