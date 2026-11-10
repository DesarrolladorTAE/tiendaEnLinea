# Operación de envíos en administración y POS

En **Pedidos web y comprobantes**, cada pedido de productos activo incluye **Entrega / envío** en su tarjeta y en su detalle para consultar el seguimiento o registrar un envío. La gestión de envíos ya no aparece en el historial de ventas ni en la configuración. La configuración conserva el mantenimiento de modalidades, canales y puntos.

Las ventas canceladas y los pedidos rechazados no muestran accesos al historial ni cambios del envío. Se vuelve a consultar el pedido antes de abrir el seguimiento, recargarlo o guardar una actualización; si la venta fue cancelada desde otra pantalla, se cierra el seguimiento sin enviar cambios. Esta regla oculta la operación en el frontend y conserva los registros históricos almacenados por el servidor.

En el carrito del POS, selecciona la modalidad de entrega y completa destinatario, domicilio o punto de entrega y consentimiento para WhatsApp. La configuración se vuelve a consultar antes de cobrar. Si la opción dejó de estar disponible, la operación se detiene conservando el formulario. Cuando se solicita entrega, `shipment` se incluye en `POST /v2/sales`; sin entrega se omite. El costo informado no modifica los pagos ni los totales de la venta.

La configuración existente en **Envíos de productos** administra ajustes, canales, logos, modalidades y puntos. La creación privada exige `settings.enabled` y `settings.allow_pos`, método y canal activos; el POS solo usa su token. Los envíos existentes se pueden seguir operando aunque se deshabiliten las nuevas altas. El servidor valida la pertenencia a tienda y sucursal.

El detalle muestra folio, destinatario, entrega, guía, enlaces seguros HTTP(S), historial público y estado de los avisos. Solo ofrece las transiciones permitidas por el contrato. Entregado y cancelado son estados cerrados. Cancelar un envío no cancela ni reembolsa la venta.

Cada actualización genera una clave UUID. Los reintentos del mismo contenido, incluso después de recargar el detalle, conservan la clave tras un error. Una acción distinta genera otra clave. Un conflicto 409 recarga el detalle sin reenviar automáticamente. Los errores conservan el formulario y un 403 oculta la acción rechazada.

La etiqueta **Venta en línea** utiliza `is_online` o un origen explícito (`source`, `origin` o `channel`: `online`, `public`, `web`, `catalog`). Los pedidos de productos de la bandeja de pagos del catálogo se identifican como ventas en línea por su procedencia. Un envío o una transferencia por sí solos no acreditan ese origen. El contrato compartido no incluye un endpoint para cambiar manualmente el origen de una venta; no se añade una escritura local que pueda contradecir al servidor.

Verificación: pruebas de configuración privada, transiciones, idempotencia y conflictos, bloqueo de permisos, validación previa al cobro e inclusión/omisión de `shipment` en la venta.
