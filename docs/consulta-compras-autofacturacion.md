# Consulta de compras y autofacturación

En Sitio Web → Editor → Avanzado, activar “Mostrar pestaña de compras y facturación”. Se guarda en `settings.customer_sales_enabled` por sucursal. Requiere plan >= 3, tienda vigente y complemento 4 adquirido y vigente en `/mis-complementos`; un error de consulta bloquea la activación. Se conserva `settings.customer_sales_expires_at` para ocultar la pestaña al vencer el complemento aunque la respuesta pública no incluya complementos.

El enlace “Mis compras y facturación” abre una vista independiente (`?vista=compras#customer_sales`) que sustituye todo el contenido del catálogo, incluso cuando el sitio usa navegación continua. Conserva la sucursal, admite enlaces directos, historial del navegador y dominios personalizados. “Volver a la tienda” restaura el catálogo. En escritorio el historial se presenta en una tabla que ocupa el ancho disponible; por debajo de 900 px cambia a un resumen por compra, sin tabla ni desplazamiento horizontal. Cada resumen incluye fecha, total, estado de la venta, facturación y descargas. El formulario de búsqueda se reorganiza en una o dos columnas y el diálogo fiscal ocupa toda la pantalla en móviles. Se adoptan colores, tipografía, radios, sombras y botones del sitio. La consulta usa el slug de la tienda, no el de la sucursal, porque las ventas se consultan por tienda.

## Configuración del servidor

- `VITE_PUBLIC_SALES_API_URL` permite configurar el prefijo efectivo de las rutas públicas. Por defecto se usa `VITE_API_URL` o `https://mitiendaenlineamx.com.mx/api`. Si el servidor expone `/public` directamente, configurar la variable con el origen sin `/api`.
- El backend debe guardar y devolver estas claves dentro del JSON `settings`, igual que las opciones actuales del sitio.
- Para reflejar revocaciones o renovaciones posteriores sin volver a guardar el sitio, la respuesta pública debe incluir `capabilities.autofacturacion` (booleano efectivo y vigente) o `complementos` con el estado y fechas de la compra. Se admiten también `plan.capabilities.autofacturacion` y `store.complementos`. Sin estos datos se usa la configuración guardada y su fecha de vencimiento; una revocación anticipada no puede detectarse desde este repositorio frontend. Las operaciones fiscales siempre dependen de las validaciones del servidor.
- Aplicar en el backend la migración `2026_10_27_000001_index_public_customer_sales.php` indicada en el contrato proporcionado. Este repositorio no contiene ese backend.
- Configurar CORS para los dominios públicos de las tiendas y conservar `Cache-Control: no-store, private` en las respuestas.

## Flujo

POST de búsqueda por mes y dato exacto (correo, teléfono o RFC no genérico), con paginación mediante nuevos POST. Los enlaces firmados se usan completos sin reconstruir sus parámetros. Las peticiones usan un cliente HTTP independiente, sin token del panel ni envío de respuestas a reportes de incidentes. Los datos de búsqueda, enlaces y receptor fiscal permanecen solo en memoria del componente.

La emisión exige vista previa, conceptos con claves fiscales y confirmación explícita del cliente. Cambiar los datos fiscales invalida la vista previa. Después de timbrar se consulta de nuevo para obtener los enlaces de PDF/XML actualizados. No se amplían plazos fiscales ni se generan automáticamente facturas durante las verificaciones del frontend.

Una venta pagada (`status: paid`) no está bloqueada por estar pagada: el pago completo es un requisito. La disponibilidad de “Generar factura” depende de `puede_facturar` y los enlaces de vista previa/timbrado entregados por el backend. El estado de pago y el estado de factura se muestran por separado. Si la API marca `puede_facturar: false`, el frontend no lo modifica por el hecho de que la venta aparezca como pagada; el servidor también revisa periodo, configuración de la tienda y CFDI ya emitido.

## Carga y navegación directa

La resolución de sucursal y la carga del sitio comparten un solo ciclo, dependiente únicamente de tienda, sucursal solicitada e intento de recarga. Cambiar `vista` o el fragmento no repite la consulta del sitio. Cada petición tiene un límite de 15 segundos y se cancela al cambiar de tienda/sucursal o desmontar la página. Si falla la conexión, se muestra un error con “Reintentar”.

`node scripts/test-storefront-loading.cjs` comprueba con React y servicios simulados las URLs directas de compras/galería, los cambios de vista, el caso de sucursal resuelta sin cambio, errores y reintentos, el acceso alternativo cuando falla la lista de sucursales y el descarte de respuestas antiguas. No contacta servicios reales.
