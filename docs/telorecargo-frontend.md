# Telorecargo: frontend de tienda y POS

## Accesos

- Tienda: menú **Telorecargo**, ruta `/admin/integraciones/telorecargo`. Configuración de clave y comisión, historial de todos los POS, reporte, conciliación con transacción externa conocida y constancia de devolución/no cobro.
- POS: menú **Recargas Telorecargo** dentro del POS existente. Saldo compartido, catálogo paginado por compañía, cotización, teléfono, vendedor/cliente opcionales, pagos mixtos, recarga, ticket e historiales. Pestaña **Solicitar saldo** para comprobantes JPG/PNG/PDF de hasta 2 MB.

La tarjeta de Recargas aparece inmediatamente después de Venta en el POS. Los menús administrativos usan iconos de Material en lugar de emojis. La presentación utiliza tarjetas adaptables, encabezados y pestañas con iconos. Los textos y cifras de paneles verdes y tarjetas seleccionadas son blancos; los logotipos conservan un fondo blanco para mantener sus colores legibles.

Las compañías y logos se obtienen del catálogo completo autenticado `GET /pos/telorecargo/companias`, sin parámetros de paginación. Telcel, Movistar y BAIT se muestran primero, si están disponibles. Se selecciona inicialmente la primera de estas compañías disponible; los demás proveedores conservan su orden relativo. Seleccionar una compañía reinicia página, producto y cotización, y consulta productos en servidor con `carrier_id=compania.id`. Los logotipos se relacionan con productos mediante `compania.id == producto.CarrierID`, sin adivinar IDs ni depender de la página actual de productos.

Se conserva el `Logotipo` recibido. Solo se muestran URLs absolutas HTTP/HTTPS sin credenciales incrustadas; rutas relativas, valores nulos o imágenes que fallan se sustituyen por un icono. Las imágenes se cargan mediante `img` sin Bearer, clave externa ni cliente Axios, y con `referrerPolicy="no-referrer"`. Los tamaños se adaptan a escritorio y móvil, manteniendo las proporciones con `object-fit: contain`. Un error de imagen no vuelve a cargar indefinidamente la URL fallida. La lista se consulta al entrar o manualmente; HTTP 429 bloquea la actualización durante los segundos indicados por `Retry-After`.

La tienda usa `AUTH_TOKEN`; el POS usa `POS_TOKEN`. Las llamadas se realizan únicamente contra `VITE_API_URL` o la base MiTiendaEnLinea existente, sin duplicar `/api`. No se llama al proveedor desde el navegador. No hay reintentos automáticos de POST ni polling de saldos/operaciones.

## Clave externa

El campo de clave es password, empieza vacío y se limpia al enviar, también si el guardado falla. El servicio HTTP independiente evita el interceptor de reporte automático de incidentes del panel: nunca envía el cuerpo de la credencial a logs ni analytics. Solo se guardan los metadatos devueltos por la API. La comisión se guarda mediante su endpoint separado. Desconectar exige confirmación y advierte del reinicio de comisión al volver a configurar; no revoca la clave en el proveedor.

## Pedidos, cobros y recuperación

Los cálculos de pagos usan centavos enteros. Recarga $100 + comisión $5 requiere pagos aplicados por $105. El efectivo recibido y su cambio se muestran en la interfaz; solo los importes aplicados se envían al backend. Tarjetas/transferencias requieren referencia y cuatro dígitos. Registrar un pago no ejecuta un cargo bancario.

Antes de enviar un pedido se confirma en IndexedDB su clave de idempotencia, cuerpo JSON exacto, cotización y resumen. Los depósitos incluyen el Blob original y su nombre, para reintentar con el mismo archivo. No se almacena la credencial externa. El almacenamiento se separa por ID del POS y tipo de pedido. Una escritura atómica evita que otra pestaña sustituya un pedido pendiente con otra clave. Si falla el almacenamiento, se bloquea el envío.

Al volver al módulo o recargar la pantalla se recupera el pedido. Los reintentos conservan clave y cuerpo, incluso con cotización vencida. Un timeout, conflicto, revisión o venta local pendiente no permite limpiar el pedido para generar otra clave. Solo una recarga confirmada con `sale_id` se presenta como venta finalizada. El detalle permite recuperar una venta local sin reenviar otra recarga externa. HTTP 429 conserva el pedido y bloquea su reenvío durante `Retry-After`, o un minuto si no viene indicado.

Únicamente un rechazo de validación HTTP 422 en el campo `cotizacion`, sin operación devuelta y en el primer envío, se trata como rechazo previo a la recarga: se requiere cotizar y confirmar otra vez. Los errores ambiguos conservan el original. No se crea una segunda venta por separado, no se descuenta inventario ni se ofrece CFDI/reversión externa desde este módulo.

Los tickets se descargan por el endpoint local con el Bearer POS como Blob. Las solicitudes de saldo no acreditan saldo, crean ventas o registran salidas de caja. Los estados se consultan al abrir el detalle o por acción del usuario. El saldo se vuelve a consultar al entrar, manualmente y al confirmar recargas o abonos.

## Historial y reportes

Los filtros y la paginación se envían al servidor. El historial POS mantiene el alcance de su sesión. Tienda agrega filtros por POS, sucursal y trabajador. El reporte muestra recargas confirmadas, importe recargado, comisiones, cobrado, agrupaciones por POS/vendedor y medio de pago, y pendientes por conciliar. No vuelve a sumar la comisión al total ni la denomina utilidad neta. Las recargas rechazadas sin venta pueden registrar una devolución/no cobro real con nota; la acción no devuelve dinero automáticamente.

## Verificación

Ejecutar `node scripts/test-telorecargo.cjs`. Prueba importes exactos, cotización y pago inválidos, teléfono, límites de fechas/archivos, separación de sesiones, payload permitido, persistencia antes de enviar, recuperación tras remontar, misma clave/cuerpo al reintentar, venta local pendiente, ticket autenticado y bytes del comprobante. Los servicios están simulados y no realizan recargas ni depósitos reales.

`node scripts/test-telorecargo-companies.cjs` verifica el endpoint de compañías, prioridad de marcas, relación por IDs, validación de URLs, carga de logos sin token, respaldo tras errores y texto blanco sobre fondos verdes.

Se comprueba además la sintaxis y compilación con Vite. Antes del primer uso productivo corresponde verificar una cuenta configurada y la forma efectiva del catálogo del proveedor, tal como indica el contrato del backend. La normalización admite arrays y envolturas `data`, `productos`, `Productos` o `products`, conservando `Codigo`, `Nombre`, `Descripcion`, `Monto`, `CarrierID` y `Vigencia`. Si el esquema no se reconoce, se informa el error y no se ofrece una compra basada en datos inventados.
