# Anexo 81 — Habilitación controlada del POS

Fecha de verificación: 2026-11-27. Este anexo describe el código local y las pruebas SQLite ejecutadas en esta revisión. No acredita una prueba HTTP externa ni concurrencia MySQL.

## Estado

Se implementó la compuerta de idempotencia como capacidad independiente. Usa la clave `sales_v2_idempotency`; no depende de los módulos de servicios o vehículos. Para una operación nueva con `Idempotency-Key` se exige que el módulo esté explícitamente habilitado tanto en la tienda como en esa terminal POS. Sin el encabezado, el flujo V2 anterior continúa sin esta compuerta.

Existe un bloqueo para administrarla desde la API: la clave todavía no aparece en el registro de `pos_modules`. `PosModuleController` valida las claves contra ese registro y `PosModuleService` enumera sus filas. Las pruebas agregan la fila solo a su fixture SQLite. Por tanto, hasta autorizar e incorporar una migración de datos que registre una fila, la capacidad efectiva no se puede configurar ni consultar en una instalación real. El cambio requerido no necesita tabla ni columna: una inserción idempotente en `pos_modules`, sin preferencias para tiendas ni terminales.

No se ejecutó migración, no se modificó ninguna configuración de tienda o terminal y no se habilitó producción.

## Configuración y contratos

Las rutas están dentro del middleware `auth:sanctum` (prefijo `/api` en despliegue):

| Método y ruta | Actor y alcance | Uso |
|---|---|---|
| `GET /api/pos/modules?pos_location_id={id}` | Store autenticado; `pos_location_id`, si se envía, debe pertenecer a esa tienda. POS autenticado; el contexto se deriva de su terminal y rechaza otro `pos_location_id`. | Lista completa de capacidades para tienda/terminal. |
| `GET /api/pos/modules/enabled?pos_location_id={id}` | Igual contexto que arriba. | Devuelve solo entradas cuya propiedad `visible` es verdadera. No usar visibilidad como sustituto de `operational_enabled`. |
| `PUT /api/pos/modules` | Solo identidad `Store`; puede ajustar la tienda o una terminal propia mediante `pos_location_id`. | Configuración administrativa de módulos. |

`PUT` requiere `modules`, arreglo con al menos un elemento; cada elemento tiene `key` existente en `pos_modules` y `enabled` booleano/null. `null` solo se permite en un override por terminal y elimina el override para heredar. Para la configuración general se requiere `true` o `false`. Para habilitar una terminal primero debe estar habilitada la tienda. La respuesta es `{ "data": [ ...capacidades ] }`.

Cuando la fila `sales_v2_idempotency` esté registrada y el almacenamiento permita la configuración, la respuesta de cada entrada sigue el formato existente:

```json
{
  "key": "sales_v2_idempotency",
  "name": "Idempotencia de ventas V2",
  "sort_order": 14,
  "available": true,
  "enabled": true,
  "store_enabled": true,
  "visible": true,
  "source": "pos",
  "operational_enabled": true
}
```

La decisión de escritura usa `operational_enabled`, que solo es `true` si el POS está autenticado, la tienda tiene acceso, la preferencia de tienda es explícitamente `true` y existe un override de terminal explícitamente `true`. `available` refleja disponibilidad/plan; `enabled`/`visible` son estado de módulo/navegación. Los ejemplos anteriores son derivados del código y del fixture, no de un endpoint HTTP real.

Para habilitar una terminal piloto: administrador Store autenticado hace primero `PUT /api/pos/modules` con `[{"key":"sales_v2_idempotency","enabled":true}]` sin `pos_location_id`; después repite con el ID de la terminal propia. El catálogo de módulos debe estar registrado antes; actualmente ese paso está pendiente de autorización de migración. No hay activación global automática ni se reutiliza `sales` u otro módulo con significado distinto.

## Venta V2 con clave

Ruta: `POST /api/v2/sales`, middleware `auth:sanctum`; el controlador exige que el usuario autenticado sea una terminal POS activa y deriva tienda/sucursal/terminal del contexto POS. La clave se envía en el encabezado, no en el cuerpo:

```http
POST /api/v2/sales
Authorization: Bearer <POS_TOKEN>
Accept: application/json
Content-Type: application/json
Idempotency-Key: 2bb3f93a-cc52-485c-95c3-fd4e8fcf56ab
```

El cuerpo es el contrato V2 de venta existente, sin cambios; por ejemplo, el fixture mínimo de la prueba es:

```json
{
  "items": [{"product_id": 30, "quantity": 1, "unit_price": "10.00"}],
  "total_amount": "10.000000"
}
```

Una clave debe ser UUID. El hash SHA-256 se deriva del contenido normalizado por el controlador, incluyendo el contexto comercial preparado para la operación. Una clave nueva cuando la capacidad efectiva esté apagada responde `403` y no llama al creador de ventas. La primera operación aceptada responde `201`, incluye `sale`, `idempotency_key` y `replayed:false`. El mismo UUID y contenido responde `200`, `replayed:true`, con la venta existente; el UUID con contenido diferente responde `409` y `errors["Idempotency-Key"]`. La repetición y recuperación se procesan antes de exigir la capacidad, para poder recuperar operaciones ya confirmadas tras apagarla.

Sin `Idempotency-Key`, el cliente permanece en el flujo legado y no requiere activar esta capacidad. La ausencia de clave no queda protegida contra duplicación por este mecanismo.

Ejemplos de error:

```json
{"message":"La idempotencia de ventas V2 no está habilitada para esta terminal."}
```

```json
{
  "message":"La clave de idempotencia ya fue utilizada con otro contenido.",
  "errors":{"Idempotency-Key":["Usa una clave nueva para esta operación."]}
}
```

Una clave no UUID produce `422` de validación. Si las columnas de idempotencia no están disponibles, la operación con encabezado responde `503`.

## Recuperación

`GET /api/v2/sales/idempotency/{key}` usa `auth:sanctum` y solo acepta identidad `PosLocation`. Busca por `store_id`, `pos_location_id` autenticados y UUID; no consulta por tienda/terminal enviados por el cliente. No depende de que el módulo siga habilitado. Devuelve `200` con la forma de respuesta de repetición; clave inválida o no perteneciente a esa terminal produce `404`. La prueba Feature cubre el alcance por terminal. Nunca enviar una clave a una terminal distinta.

Ante timeout del POST: conservar UUID y cuerpo; consultar primero el GET de recuperación y, si no existe todavía, repetir el mismo POST con la misma clave y exactamente el mismo contenido. No generar otra clave ni volver a cobrar hasta reconciliar el estado. Las integraciones externas (WhatsApp, pagos externos u otras) no se vuelven idempotentes por esta garantía de base de datos; las pruebas no certifican sus efectos externos.

## CORS y React

`config/cors.php` aplica a `api/*`, permite métodos y encabezados `*`, cualquier origen y no usa credenciales CORS. Por configuración, `Idempotency-Key` está incluido en los encabezados permitidos para preflight. No se verificó un preflight HTTP real contra un servidor desplegado. Si la aplicación usa autenticación por cookie, la política actual `supports_credentials=false` requiere revisar el mecanismo CORS/Sanctum antes de servir React desde otro origen; no cambiarlo en este anexo.

```js
await api.post('/v2/sales', body, {
  headers: { 'Idempotency-Key': operationUuid }
});
// En error de red: GET /v2/sales/idempotency/{operationUuid}; no reemitir
// la operación con un UUID nuevo.
```

La clave debe crearse una vez por intención de venta y persistirse localmente hasta obtener resultado concluyente. No reutilizar una misma clave para una operación distinta.

## Persistencia existente

La migración ya existente `2026_11_28_000002_add_v2_sale_idempotency_to_sales.php` añade a `sales` `v2_idempotency_key` (`char(36)`, nullable), `v2_idempotency_hash` (`char(64)`, nullable) e índice único compuesto por `store_id`, `pos_location_id` y clave. Las claves legacy son `NULL`. No se requiere una migración adicional de esquema para activar la capacidad; sí falta autorizar una migración de registro de módulo en la tabla ya existente `pos_modules`. No borrar claves ni revertir la migración de esquema: revertirla elimina las columnas y el índice y destruye su historial.

## Verificación ejecutada y límites

Prueba ejecutada con SQLite en memoria: `PosV2IdempotencyTest`, `PosModulesTest`, `PosProductLookupTest`, `PosTerminalLifecycleTest` y `PosTokenIssuanceTest`: **30 aprobadas, 161 aserciones**. `php -l` aprobó en los archivos PHP modificados. Incluye defaults deshabilitados, habilitación explícita, legacy sin encabezado, replay y conflicto luego de apagar, alcance y recuperación. La fixture crea la fila de módulo, así que no prueba que la migración de catálogo exista.

La referencia previa era 123 pruebas focalizadas. Este conjunto es una selección específica; no se volvió a ejecutar esa suite completa ni se debe sumar 30 a 123 como un consolidado verificado. SQLite no demuestra concurrencia de MySQL. No existe aquí una instancia MySQL desechable autorizada ni servidor Laravel HTTP aislado; no se hicieron solicitudes de prueba a producción ni a `laravel_db` en este trabajo.

Para certificar concurrencia se necesita una instancia desechable de la versión MySQL/MariaDB que se vaya a soportar, una base nueva y credenciales exclusivas. Una vez autorizada, configurar `APP_ENV=testing`, `DB_CONNECTION=mysql`, `DB_DATABASE` dedicada y `DB_URL=` vacío; usar `CACHE_STORE=array`, `SESSION_DRIVER=array`, `QUEUE_CONNECTION=sync`, `MAIL_MAILER=log`, storage temporal y credenciales/tokens ficticios. Ejecutar migraciones únicamente contra esa instancia confirmada y seeders de fixture, levantar Laravel en loopback y lanzar dos conexiones/solicitudes simultáneas con la misma clave. Comprobar una fila de venta, partidas, pagos y movimientos únicos; después repetir con otro contenido (409), perder la respuesta tras commit y recuperar, apagar el módulo y recuperar de nuevo. No ejecutar este procedimiento contra `laravel_db` ni producción.

## Pendiente que requiere autorización

Autorizar una migración **solo de registro** para insertar idempotentemente `sales_v2_idempotency` en `pos_modules`, usando el mecanismo/columnas existentes y sin crear tabla, columna, preferencia ni habilitar tienda/terminal. Es necesaria para que `GET/PUT /api/pos/modules` pueda exponer y aceptar la configuración. Hasta entonces no puede activarse de manera operativa, aunque las rutas de venta y recuperación están preparadas.

La política comercial para autorización de precios/descuentos manuales permanece pendiente y fuera de este cambio. La idempotencia no certifica precios ni habilita ventas de producción.
