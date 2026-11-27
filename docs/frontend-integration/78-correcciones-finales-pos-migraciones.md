# Anexo 78 — Correcciones finales POS y preparación de migraciones

Fecha: 2026-11-27. Revisión en código y pruebas Feature aisladas con SQLite en memoria. Actualización posterior: a petición del usuario se aplicaron las migraciones pendientes en la conexión local `laravel_db` (MariaDB/MySQL en `127.0.0.1`, `APP_ENV=local`). No se conectó ni migró producción; no hubo ventas ni despliegues.

## Estado y alcance

| Solicitud | Resultado | Evidencia / límite |
|---|---|---|
| Token administrativo solo para terminal de la tienda autenticada | Corregido y aprobado | `POST /admin/pos-token` valida identidad `Store`, acceso activo, propiedad, sucursal activa y terminal activa; una sola llamada a `createToken`, ability `sell-only`. `PosTokenIssuanceTest`. |
| Terminales desactivables y sesiones revocadas | Implementado y aprobado en SQLite | `PUT /pos/{pos}` con `is_active`; Store dueño; revoca solo los tokens de esa terminal. Login y emisión administrativa bloqueados al desactivar. `PosTerminalLifecycleTest`. |
| Almacenes de V2 dentro del alcance POS | Conservado y aprobado en SQLite | `PosWarehouseAuthorization` valida antes del escritor y vuelve a validar dentro de la transacción. `PosProductLookupTest`. No prueba concurrencia MySQL. |
| `service_sales` explícito para operación nueva POS | Implementado y aprobado en SQLite | Requiere habilitación general explícita y override explícito true en esa terminal. Nuevas operaciones usan `ServiceOperationScope`; formularios POS requieren además ambos módulos. Tours permanecen bajo su scope previo. Navegación/compatibilidad heredada no se apaga por este gate nuevo. |
| Migración de módulos vehiculares | Corregida y aprobada por casos SQLite | Inserta módulos faltantes sin reescribir metadatos; la configuración legacy crea el fallback solo si no existe configuración explícita; `enabled=false` prevalece; no toca overrides terminales. |
| Idempotencia de ventas V2 | Implementada y aprobada funcionalmente en SQLite con escritor simulado | Clave UUID, hash canónico, restricción única por tienda/terminal, recuperación autenticada. SQLite no certifica carreras concurrentes ni toda la transacción comercial real. |
| Validación de precio/descuento enviado por POS | **Pendiente de decisión comercial** | El backend no tiene una política verificable para autorizar precio manual por partida. No se impuso un bloqueo que pueda romper operaciones existentes. |
| Concurrencia MySQL | Pendiente / bloqueo de certificación | No existe instancia MySQL desechable confirmada para esta revisión. |

## Migración vehicular corregida

Archivo: `database/migrations/2026_11_25_000002_register_vehicle_modules.php`.

- Registra `vehicle_catalog` y `vehicle_records` mediante `insertOrIgnore`, preservando metadatos ya registrados.
- Para tiendas con `branches.vehicle_compatibilities_enabled=true`, agrega la decisión legacy `vehicle_catalog=true` solo cuando no existe fila para esa tienda/módulo. Un false explícito se conserva.
- No crea decisiones de `vehicle_records` ni activa el módulo indiscriminadamente.
- No modifica `pos_location_modules`; los overrides explícitos true/false permanecen intactos.
- Es repetible sin duplicar ni reescribir las decisiones existentes.

La información recibida previamente indica que en el servidor objetivo las siete migraciones originales estaban pendientes. No se consultó ninguna base para confirmarlo durante este trabajo. Si otro ambiente relevante ejecutó la versión anterior, la migración original ya no repara filas que aquella hubiera sobrescrito; comparar respaldo/historial de configuración y aplicar una reconciliación controlada allí, nunca inferir ni restaurar falsos automáticamente.

## Operación POS de servicios

`GET /pos/modules` y `GET /pos/modules/enabled` continúan siendo las fuentes privadas de configuración para una identidad Store o POS autenticada. Cada elemento conserva `available`, `enabled`, `store_enabled`, `visible`, `source` y ahora incluye `operational_enabled`:

- Para `service_sales`, `operational_enabled` solo puede ser true cuando el módulo está disponible por acceso/plan, existe una fila explícita store-level `enabled=true` y existe override de esa terminal `enabled=true`.
- Las nuevas pantallas de agenda/órdenes deben comprobar esa señal antes de mostrarse. El backend vuelve a exigirla en `ServiceOperationScope`; no se considera autorización suficiente que el módulo sea visible.
- El administrador habilita el módulo general con `PUT /pos/modules`, luego la terminal con `PUT /pos/modules` y `pos_location_id`. Si la tienda lo tiene apagado, el override terminal true devuelve 422.
- Configuración general, plantillas, horarios y reportes permanecen Store/admin. Las APIs de Tours no se cambiaron.
- Las lecturas comerciales y funciones previas de clientes/ventas no se someten al nuevo gate; `customers` conserva la semántica existente. La decisión visual del módulo no equivale a quitar autorizaciones comerciales.

Para terminal: `GET /pos/modules?pos_location_id=<propia-id>` devuelve configuración efectiva; POS no puede consultar otra terminal. No transmitir `pos_location_id` desde una identidad POS distinta.

## Estado activo de terminal

Nueva migración: `2026_11_28_000001_add_active_state_to_pos_locations.php`.

- Tabla/columna: `pos_locations.is_active BOOLEAN NOT NULL DEFAULT TRUE` en instalaciones migradas; terminales existentes conservan operación activa al incorporarse la columna.
- Modelo: cast boolean y método `isOperationallyActive()` tolerante a esquemas previos sin columna.
- Admin Store: `PUT /pos/{pos}`, cuerpo parcial `{"is_active": false}` o `{"is_active": true}`. La ruta exige sesión Sanctum, actor Store y ownership del POS. La respuesta contiene `pos.is_active`.
- Login POS: `POST /pos/login` devuelve 403 JSON `{"message":"Esta terminal POS está desactivada."}` cuando la terminal está inactiva.
- Emisión desde administrador: `POST /admin/pos-token` devuelve 403 para terminal inactiva y no emite token.
- Tokens existentes: al cambiar el estado, se borran únicamente los tokens pertenecientes a esa terminal. Activarla no revive tokens antiguos; debe emitirse una sesión nueva.
- Requests que ya pasaron autenticación antes del cambio pueden terminar; el cambio no cancela operaciones que ya están ejecutándose en otro proceso.
- La ruta de administración ya estaba presente. No se añadió un permiso RBAC nuevo: se conserva el control Store propietario.

Reversión de esta migración elimina la columna y por ello borra el estado activo/inactivo registrado. Reactivar terminales y evaluar impacto antes de rollback. No ejecutar rollback sin respaldo y autorización.

## Precios, descuentos e impuestos: decisión pendiente

V2 valida formato y rango de `unit_price`, `original_price` y `discount_percent`, pero el escritor usa valores recibidos para la partida y calcula impuestos con la configuración/tasa del producto. También obtiene un precio preliminar por almacén/variante/producto si el cliente no envía precio. No se encontró una autorización de precio manual ligada a una partida/operación; la comprobación de contraseña existente no forma un permiso comercial transaccional y reusable para V2.

Por tanto, no se puede implementar con evidencia una regla como “solo admin”, PIN, precio mínimo, precio de catálogo obligatorio o descuento máximo. El endpoint no cambia en este anexo. Antes de bloquear o recalcular precios, el negocio debe especificar quién autoriza cambios manuales, cómo se registra la aprobación en terminales, qué precios por almacén/variante/cantidad y promociones son válidos y cómo se conserva el flujo tradicional. Hasta entonces, V2 mantiene su comportamiento actual y su riesgo de manipulación cliente debe considerarse **crítico** para habilitar terminales con venta real. El usuario ya fue consultado sobre la política, sin decisión recibida al cierre.

## Idempotencia de POST /v2/sales

Migración nueva: `2026_11_28_000002_add_v2_sale_idempotency_to_sales.php`.

- `sales.v2_idempotency_key CHAR(36) NULL`.
- `sales.v2_idempotency_hash CHAR(64) NULL`.
- Índice único `(store_id, pos_location_id, v2_idempotency_key)` con nombre `sales_v2_idempotency_scope_unique`.
- Filas históricas y clientes antiguos quedan con null; el índice permite varias claves null. Solicitudes sin header conservan el flujo previo y **no** tienen protección de duplicación.
- El hash SHA-256 se calcula sobre el cuerpo normalizado, ordenando las claves asociativas y preservando el orden de arrays/listas. La clave se limita a UUID.
- El escritor V2 guarda clave/hash junto con la fila de venta dentro de su transacción de venta. La transacción actual agrupa registro de venta, partidas, pagos/crédito e inventario; un error previo al commit revierte esa operación de base de datos.
- Solicitud repetida con misma clave y hash: `POST /v2/sales` responde 200 con la misma venta y `replayed: true`; no vuelve a ejecutar escritor ni reenvía WhatsApp.
- Clave existente con contenido distinto: HTTP 409 `{"message":"La clave de idempotencia ya fue utilizada con otro contenido.","errors":{"Idempotency-Key":["Usa una clave nueva para esta operación."]}}`.
- UUID inválido: HTTP 422. Esquema todavía no migrado: 503 para el cliente que envía la clave (los clientes sin header mantienen compatibilidad).
- Recuperación: `GET /v2/sales/idempotency/{key}`, `auth:sanctum`, POS autenticado; busca por tienda y terminal de esa sesión, devuelve la venta existente con `replayed:true`, 404 si no pertenece/no existe. Nunca usar otro token para recuperar.
- Primera creación conserva HTTP 201 y agrega `replayed:false` e `idempotency_key` a la respuesta existente.
- Colisión concurrente de la misma clave depende de la restricción única MySQL; la prueba SQLite ejercita replay/conflicto/alcance, no demuestra bloqueo concurrente MySQL.

El envío automático de WhatsApp ocurre después de la creación de la venta. El replay evita repetir ese efecto externo, pero la transacción SQL no garantiza entrega de WhatsApp si el proceso cae después del commit y antes del envío. No se reintenta automáticamente el cobro ni se atribuye idempotencia a CFDI, proveedores o integraciones externas.

### Ejemplos de cliente POS

Primera operación:

```http
POST /api/v2/sales
Authorization: Bearer <POS_TOKEN>
Idempotency-Key: a50cbd21-9951-4c92-961a-26d51f85544e
Content-Type: application/json
```

```json
{"items":[{"product_id":501,"quantity":"1.000","warehouse_id":71,"unit_price":"250.000000"}],"total_amount":"250.000000","payments":[{"method":"efectivo","amount":"250.000000"}]}
```

Recuperación tras pérdida de respuesta:

```http
GET /api/v2/sales/idempotency/a50cbd21-9951-4c92-961a-26d51f85544e
Authorization: Bearer <POS_TOKEN>
```

La misma clave con contenido diferente devuelve 409. Para una venta nueva, generar otro UUID. El UUID no sustituye autorización, validación del almacén ni confirmación comercial.

## Inventario definitivo de migraciones del alcance

Orden por timestamp; incluye las siete pendientes originales informadas, la migración 2 ya corregida y las dos aditivas de esta autorización. No se ejecutó ninguna:

| Orden | Archivo | Cambios / datos históricos |
|---:|---|---|
| 1 | `2026_11_25_000001_create_vehicles_and_service_relations` | Crea `vehicles`; agrega relaciones/snapshots nullable a `bookings` y `service_orders`, índices/FK. Sin backfill; FK de borrado restrictivo. |
| 2 | `2026_11_25_000002_register_vehicle_modules` | Registros faltantes de catálogo/expedientes; fallback sólo de catálogo vehicular legacy. Ahora conserva settings existentes. No cambia filas POS por terminal. |
| 3 | `2026_11_25_000003_create_service_form_tables` | Crea `service_form_templates` y `service_form_submissions`, índices únicos y de consulta. Sin migración de capturas históricas. |
| 4 | `2026_11_25_000004_register_service_forms_module` | Registra `service_forms` en `pos_modules` con `updateOrInsert`; no habilita por sí sola el módulo para tiendas o terminales. Revisar metadatos si key ya existía. |
| 5 | `2026_11_25_000005_add_form_requirements_snapshot_to_service_orders` | Agrega `service_orders.form_requirements_snapshot JSON NULL`; sin backfill. |
| 6 | `2026_11_26_000001_add_explicit_vehicle_universal_to_products` | Agrega `products.is_vehicle_universal BOOLEAN DEFAULT false`, `commercial_brand VARCHAR(120) NULL` e índice `(store_id, commercial_brand)`. Default false para productos existentes; no clasificación automática como universal. |
| 7 | `2026_11_27_000001_add_unit_cost_at_sale_to_sale_items` | Agrega `sale_items.unit_cost_at_sale DECIMAL(18,6) NULL`; sin reconstrucción histórica. |
| 8 | `2026_11_28_000001_add_active_state_to_pos_locations` | Agrega `pos_locations.is_active BOOLEAN DEFAULT true`; compatibilidad operativa de terminales existentes. Sin eliminación de terminales. |
| 9 | `2026_11_28_000002_add_v2_sale_idempotency_to_sales` | Agrega dos CHAR nullable e índice único compuesto; no altera ventas pasadas, permite clientes antiguos sin clave. |

El orden 1–7 es el orden reportado para el servidor objetivo; 8–9 deben ir después. En instalaciones que ya ejecutaron una migración 2 anterior y esta reescribió settings explícitos, no existe forma segura de inferir el valor previo: comparar respaldo/auditoría y reconciliar manualmente. El cambio de archivo no vuelve a ejecutar migraciones ya registradas.

Riesgos operativos: crear tablas/FK/índices (#1, #3) y alterar tablas existentes (#1, #5–9) puede tomar metadata locks según tamaño/engine/version MySQL. Medir en instancia desechable con esquema representativo; el índice único de idempotencia sobre NULL existentes no debería encontrar conflictos si todas las filas históricas quedan null, pero verificar columnas/tipos/índices antes de ejecutar. No `migrate:fresh`, `refresh`, rollback ni DDL en producción durante este trabajo.

Comprobaciones para una futura instancia diferente, solo tras autorizar y confirmar su identidad:

```bash
php artisan migrate:status
php artisan migrate --pretend
php artisan migrate --force
php artisan migrate:status
```

Ejecutar con `.env.testing` independiente y base desechable confirmada; `--pretend` no sustituye revisión de código ni mide todos los efectos internos. Respaldar y verificar `SHOW CREATE TABLE`/filas después de cada bloque.

### Ejecución realizada en la base local

Antes de DDL se verificó `APP_ENV=local`, conexión `mysql`, host `127.0.0.1`, base `laravel_db`; la migración terminal ya estaba aplicada como batch 138 y la migración de idempotencia como batch 139. Se ejecutó `php artisan migrate --force` en esa conexión. Laravel aplicó exactamente las siete pendientes de alcance, todas en batch 140: `2026_11_25_000001` a `2026_11_25_000005`, `2026_11_26_000001` y `2026_11_27_000001`. No se ejecutó seeder. Un nuevo `migrate:status` mostró esas siete, más las dos anteriores, como `Ran`; no quedaron pendientes en la lista actual. La verificación de esquema confirmó `vehicles`, `service_form_templates`, `service_form_submissions`, `products.is_vehicle_universal`, `products.commercial_brand`, `sale_items.unit_cost_at_sale`, `service_orders.form_requirements_snapshot`, `pos_locations.is_active` y `sales.v2_idempotency_key`.

Esto certifica solo la conexión local `laravel_db`; no demuestra que el dominio público use esa base ni corrige por sí solo el 500 de producción. No ejecutar las mismas migraciones en producción sin comprobar su estado directamente allí y revisar el plan de despliegue.

## Pruebas y evidencia

Comando final (SQLite `:memory:`):

```bash
env DB_CONNECTION=sqlite DB_DATABASE=:memory: DB_URL= php artisan test \
 tests/Feature/VehicleModuleMigrationTest.php \
 tests/Feature/PosTerminalLifecycleTest.php \
 tests/Feature/PosTokenIssuanceTest.php \
 tests/Feature/PosV2IdempotencyTest.php \
 tests/Feature/PosModulesTest.php \
 tests/Feature/ServiceOperationsTest.php \
 tests/Feature/ServiceFormsTest.php \
 tests/Feature/VehicleRecordsTest.php \
 tests/Feature/VehicleCatalogTest.php \
 tests/Feature/PosProductLookupTest.php \
 tests/Feature/ProductSearchTest.php \
 tests/Feature/OfflineCheckoutTotalTest.php
```

Resultado final: **114 pruebas aprobadas, 1,003 aserciones; 0 fallidas**. Frente a la línea focalizada informada de 106/954, son 8 pruebas y 49 aserciones adicionales. Hubo una ejecución intermedia con 10 fallos que reveló un closure sin capturar `$pos`, un fixture con `$moduleId` indefinido y la persistencia faltante de la clave/hash; se corrigieron y se repitió todo el comando. Sintaxis `php -l` comprobada en archivos de aplicación, migraciones y tests modificados. Los tests de idempotencia usan un escritor simulado y no certifican una venta V2 completa ni carrera MySQL.

No se ejecutaron suites HTTP reales ni MySQL independiente. El rate limiter/Telorecargo, Tours, CFDI, pagos externos, físico de impresoras y el precio manual no se alteraron.

## Decisión comercial pendiente: precio manual

Para completar la validación servidor de `unit_price`, `original_price` y `discount_percent`, falta definir una política explícita: ¿qué identidad puede autorizar precio manual/descuento por línea desde POS, y cómo se valida (permiso actual, contraseña/PIN de supervisor, o regla de descuento máximo)? Hasta contar con respuesta no se impone un límite nuevo, porque podría cambiar el flujo comercial de tiendas existentes. Se recomienda mantener bloqueado el cobro V2 en producción junto con la falta de ensayo MySQL/HTTP.

## Dictamen

- Correcciones de token/almacenes/aislamiento: implementadas y verificadas por pruebas SQLite.
- Módulos de agenda/órdenes: gate efectivo de tienda+terminal implementado; navegación legacy se mantiene.
- Estado activo terminal: implementado y probado; migración no aplicada.
- Idempotencia V2: implementada, columnas/migración no aplicadas; pruebas Feature SQLite positivas, concurrencia MySQL pendiente.
- Precio/descuento manipulado: no corregido porque falta política comercial concreta. Riesgo crítico para habilitar cobro V2.
- Migraciones locales del alcance: ejecutadas y verificadas en `laravel_db` como se describe arriba. No se ejecutaron en una instancia MySQL desechable separada ni se midieron bloqueos sobre esquema productivo.
- Migraciones de producción: no recomendadas hasta ensayo MySQL, revisión de config explícita existente, política de precios, respaldo y ventana autorizada.
- Nuevos módulos POS: no habilitar en producción todavía. Activación futura solo por tienda y terminal, con inventario/configuración validados; no global.
- No hay certificación de MySQL concurrente, integración HTTP React–Laravel o servicios externos.
