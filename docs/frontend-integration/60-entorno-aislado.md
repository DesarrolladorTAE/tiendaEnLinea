# Fase 8 — Entorno de pruebas aislado

## Estado observado

No se encontró una instancia MySQL expresamente autorizada. `docker ps` no mostró contenedores. El host tenía un listener en 3306, pero su base, propietario y propósito no se verificaron; no se conectó. La suite ejecutada usó SQLite `:memory:`. No se ejecutaron migraciones MySQL.

Para las pruebas Feature ejecutadas, la configuración se fijó **antes** de iniciar PHP para que el singleton de `RateLimiter` no heredara otro store:

```sh
APP_ENV=testing APP_CONFIG_CACHE=/tmp/mtelmx-phase8-config-isolated.php \
CACHE_STORE=array DB_CONNECTION=sqlite DB_DATABASE=:memory: \
SESSION_DRIVER=array QUEUE_CONNECTION=sync MAIL_MAILER=array \
php artisan test <suite>
```

No se copiaron datos reales. Antes de usar HTTP server, configúrese un `.env.testing` desechable con SQLite independiente, `MAIL_MAILER=array`, cola `sync`, cache `array`, filesystem local temporal, servicios externos falsos y sin credenciales comerciales. La configuración debe establecerse antes del bootstrap; limpiar cache dentro de `setUp()` no basta para un RateLimiter ya resuelto.

## Procedimiento MySQL desechable pendiente

Usar una instancia local administrada por el equipo, puerto aislado (por ejemplo 33306), base `mtelmx_phase8_test`, usuario exclusivo con privilegios solo sobre esa base, y confirmar nombre/host antes de migrar. Crear esquema desde una base vacía solo después de dicha confirmación. Ejecutar `php artisan migrate --env=testing`, seeders ficticios y suites concurrentes con conexiones distintas. No usar `migrate:fresh` en una instancia no desechable. Los comandos Docker pueden documentarse como alternativa, pero no se ejecutaron ni se instaló servicio en esta revisión.

La batería actual contiene pruebas Feature aisladas, no un servidor HTTP independiente ejercitado con tokens Sanctum de terminal de punta a punta. Esto queda pendiente.
