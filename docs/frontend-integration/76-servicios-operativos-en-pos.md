# Servicios operativos en el POS de MTELMX

El POS existente muestra **Servicios** con `service_sales`. Desde ahí se abre la agenda, el listado de citas y órdenes, la recepción sin cita y el historial operativo de órdenes con filtros de fecha, estado, servicio, técnico, cliente y vehículo. **Expedientes vehiculares** usa `vehicle_records`. La orden enlaza a la captura de inspecciones con `service_forms` y a la venta con `sales`. El catálogo especializado conserva su habilitación propia mediante `vehicle_catalog`.

`POSServiceWorkspace` aporta cliente HTTP, capacidades y rutas a las pantallas compartidas. Reutiliza `ServiceOperationsPage`, `BookingEditor`, `OperationIntake`, `OperationOrder`, `VehicleRecordsPage`, `VehicleRecordFields`, `VehicleRecordHistory`, `OrderFormCapture` y `DynamicForm`. La navegación permanece en `POSDashboard`, que conserva el carrito al cambiar de sección. La orden se entrega al flujo de venta mediante estado de navegación y su identidad se verifica de nuevo en Laravel antes del cobro. `VehicleProductSearch`, el detalle puntual de producto y el checkout V2 conservan sus reglas comerciales.

## Desarrollo controlado

Configurar `VITE_POS_SERVICES=true`, `VITE_ALLOW_PRODUCTION_API=false`, `VITE_API_URL` de Laravel aislado y `VITE_SERVICE_TIMEZONE` del entorno de pruebas. Para certificar el buscador especializado también se requiere `VITE_POS_VEHICLE=true`. Reiniciar Vite al cambiar estas variables. La compilación de producción y el desarrollo configurado para usar la API de producción mantienen cerrada la navegación nueva.

La terminal usa `axiosClientPOS` y `POS_TOKEN`. La sucursal proviene de `POST /pos/me`; si la respuesta omite el dato se confirma tienda, sucursal e identidad con `GET /my-products-by-pos1`. En la operación nueva se requiere inicio de sesión directo de terminal. El administrador conserva su cliente y `AUTH_TOKEN`.

La configuración de módulos mantiene el diálogo administrativo existente. Laravel decide `available`, `enabled`, `visible` y las acciones autorizadas. Los expedientes se comparten en la tienda y el historial vehicular queda en la sucursal autenticada. Desde POS se ocultan cambios de estado, rotación de QR, constructor de formularios y demás controles administrativos.

## Contratos utilizados

| Área | Rutas relativas a la base de API |
| --- | --- |
| Contexto y módulos | `POST /pos/me`, `GET /my-products-by-pos1`, `GET /pos/modules/enabled`, `GET /pos/modules`, `GET /admin/branches/{branch}/catalog-settings` con bearer POS |
| Agenda y recepción | `GET /branches/{branch}/services*` para servicios, disponibilidad y recursos asociados, `/branches/{branch}/bookings*` para citas, llegada y conversión |
| Órdenes e historial | `/branches/{branch}/service-orders*` para listado, detalle, alta, asignación, transiciones, próxima cita, vínculo y documentos |
| Clientes y vehículos | `GET /clientes/simple`, `POST /clientes/quick-store` con `customers`, `/vehicles*`, `GET /clients/{customer}/vehicles` y catálogos de marcas/modelos autorizados |
| Inspecciones | `/service-orders/{order}/forms*` y `GET /branches/{branch}/service-orders/{order}/forms/{submission}/document.pdf` |
| Refacciones y venta | Conserva `GET /pos/products/{productId}`, `POST /v2/sales` y la vinculación de la venta confirmada con la orden |

Ante 401, 403 o 404, las pantallas muestran el error y el reintento vuelve a consultar. El flujo de venta conserva el identificador para reintentar el vínculo pendiente. Si queda incierto si el checkout fue procesado, la terminal bloquea el reenvío automático y conserva la advertencia durante la navegación.

## Verificación frontend

La regresión completa aprobó **428 pruebas en 80 suites**, con cero fallidas y cero omitidas. Las 13 pruebas añadidas cubren visibilidad, acceso directo, conservación del carrito, sucursal de terminal, recepción sin duplicados, expedientes, inspecciones, cambio de terminal y recuperación de errores. La revisión posterior de las áreas afectadas aprobó 80 pruebas en 8 suites. Vite compiló sin prerender remoto y el bundle principal fue de **252.26 kB gzip**.

Capturas con datos ficticios de [Servicios](../../tmp/pos-servicios-capturas/servicios.png), [Agenda](../../tmp/pos-servicios-capturas/agenda.png), [Órdenes](../../tmp/pos-servicios-capturas/ordenes.png), [Expedientes](../../tmp/pos-servicios-capturas/expedientes.png) e [Inspecciones](../../tmp/pos-servicios-capturas/inspecciones.png).

## Certificación pendiente

Las pruebas frontend usan respuestas simuladas. La certificación requiere Laravel y MySQL aislados, terminales y sucursales ficticias, pruebas HTTP con bearer real, aislamiento de almacenes y revisión de precios y descuentos en V2. El estado activo de terminal e idempotencia del cobro siguen sujetos a los contratos y decisiones descritos en el documento 75. Los resultados simulados no autorizan activar producción.
