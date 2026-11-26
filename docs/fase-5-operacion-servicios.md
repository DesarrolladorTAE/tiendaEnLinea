# Fase 5 de MTELMX — Agenda, citas y órdenes de servicio

La implementación usa el contrato reportado en [los anexos 33–39](frontend-integration/README.md#fuente-y-certeza). Las pruebas del frontend usan respuestas simuladas. La revisión operativa de Laravel sigue pendiente y condiciona el cierre integral y el paso a fase 6.

## Rutas administrativas

| Ruta | Pantalla |
|---|---|
| `/admin/services/agenda?branch_id=…` | Agenda semanal inicial, vista diaria y listado |
| `/admin/services/bookings?branch_id=…` | Listado de citas y programación |
| `/admin/services/bookings/:bookingId?branch_id=…` | Detalle, confirmación, llegada y conversión |
| `/admin/services/orders?branch_id=…` | Listado paginado y recepción directa |
| `/admin/services/orders/:orderId?branch_id=…` | Ficha, estados, asignación, inspecciones, documentos y próxima visita |
| `/admin/services/orders/:orderId/forms[/:submissionId]?branch_id=…` | Rutas existentes de captura e inspección |

Agenda y citas comparten pantalla y conservan sus propios puntos de entrada. Los intervalos diario y semanal consumen todas las páginas antes de presentar las citas. Listado y órdenes conservan la paginación del servidor. Las tablas pasan a tarjetas en móvil. La agenda usa la fecha y las horas locales tal como llegan de Laravel. La fecha inicial supone `America/Mexico_City`, que es la zona de los ejemplos, y el selector de horarios muestra la zona recibida desde disponibilidad.

## Endpoints consumidos

Las rutas de la tabla usan el prefijo de API existente. `B` representa `/branches/{branchId}`.

| Método | Ruta |
|---|---|
| GET | `B/bookings`, `B/bookings/{bookingId}` |
| POST | `B/bookings`, `B/bookings/{bookingId}/confirm`, `B/bookings/{bookingId}/arrival`, `B/bookings/{bookingId}/service-order` |
| GET | `B/services`, `B/services/{serviceId}`, `B/services/{serviceId}/resources`, `B/services/{serviceId}/availability` |
| GET, POST | `B/service-orders` |
| GET, PATCH | `B/service-orders/{orderId}` |
| POST | `B/service-orders/{orderId}/{start,complete,cancel,sale,next-booking}` |
| PATCH | `B/service-orders/{orderId}/resource` |
| PATCH | `/vehicles/{vehicleId}/service-orders/{orderId}/mileage` |
| GET | `B/service-orders/{orderId}/document.pdf`, `B/service-orders/{orderId}/forms/{submissionId}/document.pdf`, `B/service-orders/{orderId}/thermal` |
| GET, POST | `/clientes/simple`, `/clientes/quick-store`, respectivamente |
| GET | `/clients/{customerId}/vehicles`, `/admin/branches/{branch}/catalog-settings` |

## Estados y acciones

| Registro | Estado | Acciones de la interfaz |
|---|---|---|
| Cita | `pending` | Confirmar |
| Cita | `confirmed` | Registrar llegada o abrir orden |
| Cita | `arrived` | Abrir orden |
| Cita | `completed`, `cancelled` | Consultar |
| Orden | `pending` | Iniciar, editar, asignar recurso, cancelar con motivo |
| Orden | `in_progress` | Finalizar cuando no queden formularios obligatorios, editar, asignar recurso, cancelar con motivo |
| Orden | `completed`, `cancelled` | Consultar ficha y documentos, programar siguiente visita |

La orden muestra el vínculo de venta mediante ID existente, sujeto a la validación del endpoint. Laravel decide la elegibilidad del recurso y los requisitos definitivos del cierre. La interfaz consulta el detalle tras cada mutación exitosa y ante un conflicto 409. Un cambio de sucursal desmonta el contexto de la operación y cancela las peticiones correspondientes. Para altas se conserva la clave idempotente al reintentar la misma captura. La conversión usa el ID devuelto por Laravel.

## Matriz de autorización

| Operación | Regla aplicada |
|---|---|
| Agenda y órdenes administrativas | Sesión Store, sucursal seleccionada y respuesta autorizada del ámbito operativo de Laravel. El anexo 38 documenta `service_sales`, plan y pertenencia. |
| Vehículo | Capacidad privada `vehicle_records` para leer o escribir. El contrato del servicio determina `none`, `optional` o `required`. |
| Inspecciones | Capacidad privada `service_forms`. La pantalla existente verifica el permiso de captura y usa la versión histórica. |
| PDF, comprobante térmico | Cliente administrativo y validación privada del servidor. El térmico se consulta en 58 u 80 mm. |
| POS | El contrato reporta alcance por terminal y sucursal. Estas rutas del frontend operan solo en administración, con el cliente de `AUTH_TOKEN`. |

## Reutilización e inventario

- Nuevos: `ServiceOperationsPage.jsx`, `OperationIntake.jsx`, `OperationOrder.jsx`, `serviceOperations.js` y dos suites automatizadas.
- Modificados: `AdminRouteConfig.jsx`, `menuConfig.js`, `Sidebar.jsx`, `ServiceListPage.jsx` y `VehicleRecordFields.jsx`. El alta rápida de cliente se extrajo de este último archivo para compartirla con recepción.
- Reutilizados: Material UI, AdminLayout y su contexto, Axios administrativo, `serviceService`, los selectores y servicios de expedientes, `OrderFormCapture` y `DynamicForm` a través de sus rutas existentes, y `ModalPDFPreview`.

## Pendientes de contrato y alcance

- El anexo 33 identifica `PATCH B/bookings/{bookingId}` y los POST `/reschedule` y `/cancel`, pero falta confirmar las claves exactas, nulabilidad y omisión del recurso, el campo y longitud del motivo, los horarios permitidos al excluir la propia cita y las respuestas por estado. Esas mutaciones y el cambio de recurso de la cita quedan pendientes. La reasignación de una orden sí está integrada mediante su contrato independiente.
- No hay filtro de texto o folio del lado de Laravel para citas u órdenes en los anexos. Se usan fechas, estado, servicio, recurso, cliente y vehículo. La vista mensual queda pendiente de medir el volumen en un entorno aislado.
- La venta se vincula por ID existente. El detalle asociado solo expone los atributos reportados por Laravel, sin folio comercial ni fecha. Falta verificar elegibilidad y respuesta real en un entorno aislado antes de ampliar la búsqueda o pasar a fase 6.
- El siguiente servicio se programa desde una orden y conserva el contexto que deriva Laravel. El contrato no declara una relación histórica de seguimiento ni recordatorios.
- La fuente operativa Laravel, su zona horaria efectiva por entorno, las respuestas reales, la concurrencia en el motor de producción y la impresión física quedan sin comprobar. La fase 6 requiere autorización independiente.


## Verificación

- Las dos suites nuevas aprobaron 12 de 12 casos. Cubren las rutas directas, rechazo 403, aislamiento de sucursal, paginación del periodo, disponibilidad agotada, selección vehicular requerida, reintentos idempotentes, doble envío y un recorrido simulado hasta inspección y cierre.
- La ejecución completa anterior a la última prueba adicional aprobó 364 casos en 73 suites. Los tres fallos de la suite restante corresponden a ProfitFactorControl.test.jsx y también aparecieron en la primera regresión. Las suites de expedientes y formularios aprobaron.
- Vite compiló con manifiesto en modo producción y sin ejecutar scripts de prerender. La revisión visual usó únicamente respuestas simuladas y datos ficticios.
- Capturas en tmp/fase-5-capturas/ con agenda de escritorio y móvil, programación, recepción y ficha de orden con inspección obligatoria pendiente.
