# Ventas de servicios y reportes

## Navegación

- Se retira Tours del menú administrativo. La configuración se conserva en Servicios → Salidas de tours. Las rutas anteriores siguen funcionando.
- POS → Ventas de servicios permite elegir servicio y salida, registrar una venta y consultar reservas, pasajeros y pagos usando las pantallas existentes.
- POS → Reportes de servicios es una sección independiente para consultar el manifiesto y descargar Excel.
- Administración también tiene Reportes de servicios (`/admin/reportes/servicios`), con la sucursal seleccionada.

Estas pantallas operan servicios de tipo `tour`; la venta de productos mantiene su flujo existente.

## Venta asistida

La creación usa `POST /api/branches/{branchId}/tours/departures/{departureId}/sales`. Ya no utiliza el alta administrativa de reservas como venta desde POS.

Se capturan comprador, teléfono de 10 dígitos, correo opcional, pasajeros, parada, tramo, transporte y observaciones. Se permite registrar un cobro inicial verificado o guardar sin pago y cobrar después en el detalle. El servidor calcula los importes; no se envía total ni subtotal. El POS se asigna por el token autenticado.

Solo se ofrece el alta en salidas programadas con cupo; el backend valida además la fecha futura y las reglas de negocio. Durante el envío se bloquean envíos simultáneos. Ante un fallo de red o HTTP 5xx se bloquea la repetición en ese formulario y se indica consultar las reservas antes de volver a vender.

La consulta de reservas no filtra por caja, por lo que incluye las compras públicas de la sucursal. Se reutilizan los módulos existentes de pasajeros, pagos y liquidación. Este cambio no agrega captura PayPal ni acciones de abordaje.

## Reportes

Se consulta `GET /api/branches/{branchId}/tours/departures/{departureId}/manifest`; la descarga agrega `format=xlsx`.

- Vista predeterminada: todas las reservas de la sucursal, incluidas las públicas.
- Desde POS se puede filtrar por la caja autenticada.
- Resumen: reservas, vendidos, disponibles, total, recibido y saldo, directamente del servidor.
- Tabla: pasajero, folio, trabajador, contacto, transporte, importes, abordaje de ida/regreso, referencia, observaciones y estado.
- Los importes nulos de filas agrupadas se conservan vacíos. No se suman pasajeros para calcular ingresos.
- Excel se descarga como blob usando la sesión Bearer y un nombre local; el token no se pone en la URL.

Los catálogos de salidas y reservas toleran la envoltura paginada `data.data`. La consulta del catálogo de servicios para estos flujos usa la raíz heredada `/branches`, sin `/api`, según la guía recibida. Requiere que el backend permita CORS para esa ruta. No se modificó globalmente el cliente HTTP ni el CRUD existente de Servicios.

## Verificación

`node scripts/verify-service-sales.cjs` verifica con clientes simulados el endpoint de venta, envío sin totales, errores de negocio, alcance del manifiesto, raíz del catálogo y lectura de envolturas paginadas.

Para aceptación con backend autenticado: registrar una venta con y sin cobro, rechazar sobrepago, comprobar compras públicas, consultar tras timeout, liquidar desde el detalle y comparar el manifiesto/Excel con los saldos del servidor. Estas operaciones requieren datos reales de prueba y no están cubiertas por las comprobaciones locales.
