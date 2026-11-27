# Propuesta de Laravel + MySQL aislado para React

## Requisitos comprobados

- `composer.json`: PHP `^8.2`, Laravel `^12.0`, Sanctum `^4.0`. Host revisado: PHP 8.2.29 y Composer 2.8.6.
- `composer check-platform-reqs --no-dev` aprobó. Hay `pdo_mysql`, `pdo_sqlite`, `bcmath`, `gd`, `curl`, `dom`, `fileinfo`, `intl`, `mbstring`, `openssl`, `zip` y XML. Ejecutar `composer check-platform-reqs` en el futuro host.
- Propuesta: MySQL 8.4 LTS para instancia nueva. Laravel 12 documenta MySQL 5.7+; ello no demuestra compatibilidad de cada migración MTELMX con cualquier versión. [Laravel 12 DB](https://laravel.com/docs/12.x/database), [recomendación MySQL 8.4 LTS](https://laravel.com/blog/laravel-february-product-updates).

## Preparación (no ejecutada)

1. Crear MySQL desechable, puerto aislado, base `mtelmx_phase8_test`, usuario con grants únicamente sobre esa base. Confirmar por administrador que host/base no sean producción. El listener 3306 observado antes sigue sin identificar y no se usó.
2. Backend: `composer install --no-interaction --prefer-dist`; verificar `php artisan --version`, extensiones, `composer check-platform-reqs`.
3. `.env.testing` local fuera de Git, por ejemplo:

```dotenv
APP_ENV=testing
APP_DEBUG=true
APP_URL=http://<backend-host>:8000
FRONTEND_URL=http://<frontend-host>:5173
DB_CONNECTION=mysql
DB_HOST=<host-mysql-desechable>
DB_PORT=<puerto-aislado>
DB_DATABASE=mtelmx_phase8_test
DB_USERNAME=<usuario-exclusivo-test>
DB_PASSWORD=<secreto-local-no-compartido>
CACHE_STORE=array
SESSION_DRIVER=array
QUEUE_CONNECTION=sync
MAIL_MAILER=array
FILESYSTEM_DISK=local
BROADCAST_CONNECTION=log
SANCTUM_STATEFUL_DOMAINS=<frontend-host>:5173
```

4. Generar APP_KEY solo en checkout aislado: `php artisan key:generate --env=testing`. Storage separado y sintético.
5. Credenciales comerciales vacías; Conekta test sin claves; PayPal sandbox sin claves; URLs TAE, Telorecargo, WhatsApp/Chatingboot/TBT a sink local. Bloquear egress desde PHP salvo MySQL. Sin workers/cron; queue sync, mail array; tests con `Http::fake`/gateways fake. No llamar pagos, CFDI, WhatsApp ni proveedores.
6. Verificar `php artisan migrate:status --env=testing`, host y base. Solo tras confirmación explícita del aislamiento y autorización ejecutar `php artisan migrate --env=testing`; luego usar datos ficticios.

No existe seeder integral multi-tenant fase 8. **No ejecutar el `DatabaseSeeder` actual**: llama `BranchPerStoreSeeder` y `BackfillBranchIdFromStoreIdSeeder`, no limitados a fixtures nuevos. Las suites Feature construyen SQLite propio. Hace falta seeder específico con tiendas/sucursales, Store/admin, empleados, POS y módulos, almacenes asignados, clientes/vehículos, servicios/recursos, plantillas/productos/variantes/costos. No se ejecutaron migraciones ni se creó ese seeder.

## Conexión React

Solo después de aislar red: `php artisan serve --host=0.0.0.0 --port=8000 --env=testing`; firewall/VPN permite únicamente host React. En `.env.local`: `VITE_API_URL=http://<backend-host>:8000/api`. API prefijo `/api`. Enviar bearer token en Authorization, no en URL. CORS actual incluye `api/*`, origen/headers/métodos `*`, `supports_credentials=false`: usar bearer, no asumir cookie SPA cross-origin. No exponer el server a Internet.

Seeder específico: obtener POS_TOKEN por `/api/pos/login` con código/access_code ficticio y AUTH_TOKEN por login administrativo. No intercambiar credenciales. El modelo no tiene bandera `PosLocation.is_active`; no se puede afirmar su validación.
