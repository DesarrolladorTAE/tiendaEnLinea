# Envíos desde catálogos públicos por sucursal

## Reglas

- Disponible para Profesional o Avanzado vigentes (`plan_id` 3 o 4), con el complemento de pasarela de pagos activo y envíos públicos habilitados.
- El backend debe ampliar la regla de `requirements.professional_plan` para aceptar ambos planes en la configuración pública y en las dos rutas de creación. Se conserva el nombre del campo del contrato. El frontend no sustituye una denegación del servidor por una comprobación local del plan.
- La autorización proviene de `GET /public/branches/{branchId}/shipping-config`. El frontend exige `enabled` y los tres campos de `requirements` en true. No infiere permisos de plantillas o credenciales PayPal.
- La sucursal del catálogo determina el origen del pedido. El cliente no elige una caja o POS. El backend valida la sucursal y selecciona su primer POS por ID.
- Los envíos existentes conservan acceso al seguimiento aunque después venza el plan o complemento.

## Implementación

- Configuración administrativa disponible en `/admin/envios`, accesible desde el menú lateral, Administración y el botón de Sitio Web. Incluye interruptores generales, avisos, URL de seguimiento, canales y logos, métodos y puntos por sucursal. Consume las rutas privadas de `/shipping` con el token existente de tienda.

- `PersnalizacionSitio.jsx` pasa `data.branch.id` a `Catalogo`, al carrito y al checkout.
- Al abrir el checkout se carga la configuración pública y se comprueba que corresponda a la tienda y sucursal. Cambiar de sucursal cancela consultas anteriores y reinicia la selección de entrega.
- El formulario muestra métodos activos, dirección o punto según modalidad, datos del destinatario y consentimiento opcional para WhatsApp. El domicilio principal del checkout sigue siendo obligatorio incluso para recogida.
- El checkout con comprobante envía `branch_id` y serializa `shipment` con `JSON.stringify`. Conserva los campos del checkout existente. El costo del envío se informa sin agregarlo a los totales ni afirmar que fue cobrado.
- Si la configuración está deshabilitada, no se muestra la selección ni se envía `shipment`; la compra normal continúa. Un error al cargar la configuración requiere reintentar antes de enviar el pedido de esa sucursal.
- Ante un 422 de `shipment`, se muestran los errores como texto y se recarga la configuración conservando los datos. No se reenvía automáticamente la compra. Si se revoca la entrega, el comprador debe elegir expresamente continuar sin envío.
- La confirmación muestra folio, estado y enlace generado por el servidor desde `shipping_tracking`. El carrito se limpia al cerrar esta confirmación para que el enlace permanezca disponible.
- Seguimiento público en `/seguimiento` y `/tienda/:storeSlug/seguimiento`: folio manual, parámetro `tracking_token`, historial, guía y enlace externo. No usa polling ni modifica ventas.
- Configuración y seguimiento respetan `Retry-After` ante 429. La página de seguimiento se excluye del inicio de GTM y de los eventos de navegación. Se configura `no-referrer` antes de cargar scripts externos.
- Los servicios públicos de configuración y seguimiento usan un cliente separado del cliente autenticado. No requieren Bearer. Este repositorio no contiene el backend Laravel.

## Alcance de PayPal

La selección de envío está integrada a transferencia, depósito y OXXO con comprobante. La captura existente de PayPal se conserva. El frontend no obtiene actualmente un `sale_token` documentado en esa captura; no asocia envíos usando solamente `sale_id` ni repite capturas de pago. Para habilitar esa asociación se necesita el contrato autorizado de respuesta de captura con venta, token y sucursal. Cuando hay opciones con comprobante, PayPal informa cómo acceder a la compra con envío.

## Verificación

- `node scripts/test-shipping.mjs`: requisitos de acceso, correspondencia de tienda/sucursal, puntos, direcciones incompatibles, consentimiento, teléfono, enlaces y espera de reintentos.
- `src/hooks/usePublicShippingConfig.test.jsx`: carga al abrir, respuesta tardía de otra sucursal, revocación y 429.
- `src/components/checkout/CheckoutPayModal.test.jsx`: payload multipart con sucursal y envío, importes conservados, confirmación y rechazo 422 sin reenvío automático.

Se bloquean compras simultáneas desde el formulario. No se presupone idempotencia de `offline-orders` ante resultados de red inciertos ni se reintenta automáticamente la creación de pedidos.
