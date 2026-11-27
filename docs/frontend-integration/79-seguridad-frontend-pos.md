# Seguridad frontend del POS

Integración basada en el anexo 78 entregado por el backend. Se usa la habilitación de desarrollo `VITE_POS_SERVICES=true` con `VITE_API_URL` aislada y `VITE_ALLOW_PRODUCTION_API=false`. El estado de terminal, la nueva operación y la recuperación V2 quedan desactivados en compilaciones de producción.

## Terminales y módulos

El administrador confirma `PUT /pos/{pos}` con `{"is_active":false}` o `{"is_active":true}` y verifica `pos.is_active` en la respuesta. La confirmación explica la revocación de sesiones y la necesidad de iniciar sesión otra vez. El login muestra el mensaje documentado para una terminal desactivada.

La agenda y las órdenes requieren `service_sales.operational_enabled` en el catálogo privado. El diálogo de módulos permite establecer un override explícito en la terminal cuando la tienda ya habilitó el módulo. Los tours y la visibilidad heredada siguen usando su señal previa. Los expedientes conservan las capacidades efectivas de `vehicle_records`. Las capturas dependen de `service_forms` y de la habilitación de las operaciones de servicio.

## Cobro V2 y recuperación

El checkout reserva un UUID antes de enviar `POST /v2/sales` y lo transmite mediante `Idempotency-Key`. El registro local solo contiene el UUID y, cuando corresponde, el ID de la orden y la marca de conflicto. La clave de almacenamiento identifica la terminal. El cuerpo del cobro conserva sus importes, descuentos, almacenes, variantes, pagos, crédito y ventas pendientes.

Si falla el transporte, se pierde la respuesta o el resultado no permite confirmar la venta, se conserva el registro y se bloquea el siguiente cobro. **Consultar venta** usa `GET /v2/sales/idempotency/{key}` con el cliente POS y abre el comprobante existente. Una venta recuperada con orden verifica el contexto antes de usar la vinculación existente. Un 404 mantiene el bloqueo porque la transacción original aún podría estar en curso. Un 409 identifica un conflicto y requiere revisión sin reenvío desde el POS. La aplicación no usa el historial ni credenciales del administrador como alternativa a la recuperación autenticada.

## Certificación pendiente

El backend reportó evidencia en SQLite con escritor de ventas simulado. La certificación requiere Laravel/MySQL aislados con las migraciones 8 y 9, una prueba HTTP con bearer POS, concurrencia sobre el índice único, recuperación de comprobantes y validación del flujo V2 completo. Sigue pendiente la política de autorización de precios y descuentos manuales.

## Evidencia visual

Capturas con datos ficticios de [desactivación](../../tmp/pos-seguridad-capturas/desactivar.png), [reactivación](../../tmp/pos-seguridad-capturas/activar.png), [módulos](../../tmp/pos-seguridad-capturas/modulos.png), [consulta de venta](../../tmp/pos-seguridad-capturas/recuperacion.png) y [conflicto de idempotencia](../../tmp/pos-seguridad-capturas/conflicto.png).
