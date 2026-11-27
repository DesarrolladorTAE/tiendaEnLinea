# Anexo 82 — Frontend desplegable del POS

## Compilaciones

| Variable | Uso |
| --- | --- |
| `VITE_API_URL` | Obligatoria en staging. Apunta a la API aislada, con HTTP o HTTPS, sin credenciales, query ni fragmento. La compilación rechaza el dominio de producción y sus subdominios. Los clientes Axios restringen las solicitudes al origen configurado. |
| `VITE_POS_SERVICES` | `true` incluye la interfaz de Servicios, Expedientes y administración de estado de terminales en staging o desarrollo aislado. Por defecto se queda apagada. |
| `VITE_POS_VEHICLE` | `true` incluye el buscador especializado en staging o desarrollo aislado. Por defecto se queda apagado. |
| `VITE_SERVICE_TIMEZONE` | Zona horaria del piloto. El valor predeterminado es `America/Mexico_City`. |
| `VITE_ALLOW_PRODUCTION_API` | Mantener `false` para pruebas. El opt-in de desarrollo hacia producción desactiva los controles de piloto. |

Ejemplo de compilación de staging en PowerShell desde el repositorio, sin prerender remoto:

```powershell
$env:VITE_API_URL = 'http://127.0.0.1:48033/api/'
$env:VITE_ALLOW_PRODUCTION_API = 'false'
$env:VITE_POS_SERVICES = 'true'
$env:VITE_POS_VEHICLE = 'true'
$env:VITE_SERVICE_TIMEZONE = 'America/Mexico_City'
npx vite build --mode staging --manifest --outDir dist-staging
```

Compilar producción en una sesión con la configuración habitual de producción usando `npx vite build --mode production --manifest`. El artefacto de producción mantiene apagadas las nuevas funciones POS incluso si se suministran ambos flags con valor `true`. La URL de producción se valida con el mecanismo existente. Los flags se incorporan al compilar.

## Habilitación autenticada

- La terminal consulta `GET /pos/modules` con su bearer POS y sin enviar un ID de otra terminal. El listado visible legado se sigue obteniendo de `GET /pos/modules/enabled`. Si falla el catálogo completo, desaparecen las funciones nuevas y el menú tradicional puede seguir si su propia consulta respondió.
- `sales_v2_idempotency.operational_enabled=true` es la señal independiente para incluir `Idempotency-Key`. La ausencia del registro, una respuesta incompleta o un error de consulta conservan el POST tradicional. Los entornos, tiendas y terminales comparten el mismo código.
- `service_sales.operational_enabled` controla Agenda, Citas y Órdenes. Los expedientes agregan `vehicle_records` y el permiso de lectura o escritura. Las inspecciones agregan `service_forms` y la autorización de la orden. La búsqueda requiere `vehicle_catalog` y su autorización privada de sucursal. La vinculación exige el contexto operativo de una orden y respeta su tienda y sucursal.
- Un administrador Store configura módulos con `PUT /pos/modules`, primero a nivel tienda y luego con `pos_location_id` para el override de una terminal propia. Las operaciones siguen usando `POS_TOKEN`. Administración y reportes conservan el flujo con `AUTH_TOKEN`.

La recuperación consulta `GET /v2/sales/idempotency/{key}` con la misma terminal y sigue disponible si el módulo se apaga o la caja está cerrada. Guarda el UUID y, si procede, la referencia de orden y el estado de conflicto. Una confirmación recupera el comprobante y continúa el vínculo cuando la orden sigue autorizada. Un 404 mantiene bloqueada la operación incierta y un 409 pide revisión. El frontend no repite el cobro automáticamente.

## Certificación y reversión

La regresión frontend aprobó **437 pruebas en 80 suites**, con cero fallidas y cero omitidas. Las cuatro pruebas nuevas cubren piloto, control, error de catálogo y recuperación con idempotencia retirada y caja cerrada. Las compilaciones de staging y producción se generaron sin prerender remoto.

Chrome probó el mismo artefacto de staging contra un servidor HTTP local de fixtures. La terminal piloto accedió a Agenda. La de control mantuvo la Venta tradicional y no consultó las rutas de la sucursal. En la terminal de control con una referencia incierta apareció **Consultar venta** aun con la capacidad ausente. Las pruebas simuladas del checkout verificaron el encabezado y el uso del mismo UUID para recuperar. El servidor de capturas no registró ventas.

Capturas con datos ficticios de la [terminal piloto](../../tmp/pos-fase-final-capturas/piloto.png), la [terminal de control](../../tmp/pos-fase-final-capturas/control.png) y la [recuperación con capacidad retirada](../../tmp/pos-fase-final-capturas/recuperacion.png).

El anexo 81 indica que falta registrar `sales_v2_idempotency` en `pos_modules` para poder configurar la capacidad en Laravel real. El frontend presenta el comportamiento por defecto cuando la fila está ausente. La prueba operativa real requiere registro autorizado, Laravel/MySQL aislados y verificación HTTP del flujo de recuperación y concurrencia.

Para revertir un piloto, detener nuevos cobros y reconciliar operaciones inciertas usando la consulta de recuperación. Restaurar los overrides conforme al estado previo. Para preservar Tours, usar herencia si esa era la configuración previa. Mantener las columnas, claves, hashes y registros de ventas. Retirar el artefacto piloto después de reconciliar las referencias pendientes.
