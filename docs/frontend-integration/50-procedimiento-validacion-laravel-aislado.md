# 50. Validación de Laravel aislado

## Estado observado

No se ha identificado ni conectado una instancia Laravel/MySQL externa aislada autorizada para integración real. Las pruebas Feature ejecutadas aquí establecen conexión SQLite `:memory:` dentro de `setUp`, crean esquema ficticio y autentican factories/manual fixtures; algunas llaman `up()` de migración en esa conexión desechable. Esto valida controladores/servicios para los escenarios cubiertos, pero no reemplaza una instancia MySQL ni verifica el handoff real entre deployments Frontend/Laravel.

`phpunit.xml` fija `APP_ENV=testing` y servicios array, pero tiene comentadas las variables DB_CONNECTION/DB_DATABASE. Verificar que cada suite que se ejecute configure explícitamente SQLite in-memory o prepare su propia DB antes de correr; no asumir que el archivo phpunit por sí solo evita leer `.env`.

## Suites de este cierre

Comandos ejecutados (no usaron conexión de producción; comprobado por `setUp` de cada test):

```bash
php artisan test tests/Feature/VehicleCatalogTest.php
php artisan test tests/Feature/ProductSearchTest.php
php artisan test tests/Feature/ServiceOperationsTest.php
```

Resultados:

- `VehicleCatalogTest`: 38 passed, 394 assertions.
- `ProductSearchTest`: 12 passed, 130 assertions.
- `ServiceOperationsTest`: 14 passed, 107 assertions.
- Total suites seleccionadas: 64 test runs / 631 assertions; no consolidar como suites únicas de toda la aplicación.

Las pruebas de búsqueda POS `VehicleCatalogTest::test_phase_six_pos_only_sees_assigned_warehouse_stock` explícitamente retiran `CheckStoreAccess`; eso demuestra lógica de controller, no acceso end-to-end normal al endpoint privado.

## Preparar MySQL de prueba desechable (no ejecutado)

Requisitos: Docker ya instalado y autorizado por el operador; puerto local libre, almacenamiento desechable, credenciales ficticias temporales. No utilizar `.env` de producción ni copiar datos. Ejemplo opcional de contenedor local aislado (no ejecutado; requiere autorización/infraestructura):

```bash
docker run --rm --name mtelmx-phase6-mysql \
  -e MYSQL_ROOT_PASSWORD=disposable-root \
  -e MYSQL_DATABASE=mtelmx_phase6_test \
  -e MYSQL_USER=mtelmx_test \
  -e MYSQL_PASSWORD=disposable-test \
  -p 127.0.0.1:33316:3306 \
  mysql:8.0
```

En otra shell, esperar health/readiness y crear configuración aislada fuera de `.env` compartido; usar variables Laravel temporales sin imprimir su valor:

```bash
export APP_ENV=testing
export DB_CONNECTION=mysql
export DB_HOST=127.0.0.1
export DB_PORT=33316
export DB_DATABASE=mtelmx_phase6_test
export DB_USERNAME=mtelmx_test
export DB_PASSWORD=disposable-test
php artisan config:clear
php artisan migrate --env=testing
php artisan test tests/Feature/VehicleCatalogTest.php tests/Feature/ServiceOperationsTest.php
```

No correr esto contra el shell/worker de producción. Antes de `migrate`, verificar por configuración efectiva que host sea loopback/contendor local y DB exactamente `mtelmx_phase6_test`; detenerse si no es así. Mejor usar copia temporal de `.env.testing` con permisos privados y credenciales ficticias, no guardar en repositorio ni incluir en docs/ZIP. Asegurar DB sin datos reales; migrations crean esquema, no correr `migrate:fresh` contra instancias compartidas. El comando de prueba de PHPUnit debe volver a apuntarse al entorno al terminar; `unset DB_* APP_ENV` y detener contenedor si inició el operador. La migración inicial debe revisarse por compatibilidad con MySQL antes de ejecutar, ya que las suites actuales modelan tablas a mano.

El usuario de prueba debe tener derechos limitados solo a la base desechable (create/alter/index/select/insert/update/delete). `migrate` debe ser el primer escritor; luego fixtures sintéticos. No persistir logs con credenciales.

## Pruebas aisladas de integración entre React y Laravel

Requisitos antes de afirmar integración real: API levantada con config `testing`, DB distinta a producción, migraciones aplicadas a DB desechable, identidad Store y terminal POS ficticias, dos branches/sucursales, productos/compatibilidades y venta/orden sintéticas. Configurar base URL frontend con localhost, CORS/Sanctum para host de prueba, sin copiar token de staging/producción. Probar login terminal y `/pos/me`, módulos, búsqueda tradicional, búsqueda vehicular privada con middleware activo, venta V2, consulta de orden, `attachSale`, confirmando que el caso de falla parcial no repite cobro. `CheckStoreAccess` acepta Store y PosLocation por guards `store-api`/`pos-api`; la suite actual de vehículos quita ese middleware, de modo que aún falta esa evidencia de extremo a extremo.

### Limpieza

Al usar Docker disposable, detener contenedor (`docker stop mtelmx-phase6-mysql`; su `--rm` elimina contenedor). No usar volúmenes compartidos. Si se usó archivo de env temporal, removerlo de manera segura según política local y confirmar `git status` sin incluir secretos. No crear ni ejecutar comandos de limpieza contra DB persistente.

## Pendientes

- No existe evidencia MySQL real ni concurrencia en este cierre.
- No se ejecutó integración browser/frontend contra una API Laravel viva.
- Recorrido real de token POS por `CheckStoreAccess` y el buscador vehicular privado pendiente de Feature/integración; el código admite POS si parent store hasAccess y los módulos/scope están habilitados. No usar ruta pública como sustituto de inventario privado.
- La validación de asignación del warehouse al POS durante venta final debe aclararse/corregirse por autorización antes de depender de aislamiento por terminal.

