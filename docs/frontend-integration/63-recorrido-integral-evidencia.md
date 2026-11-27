# Recorrido integral

No se pudo demostrar una ejecución automatizada única de los 36 pasos en este entorno. Las operaciones están cubiertas parcialmente por suites Feature separadas, pero no se declara el flujo integral completado.

Evidencia parcial positiva: `ServiceOperationsTest` prueba disponibilidad, conflicto/reprogramación/cancelación, conversión idempotente, snapshots de formulario, recursos y scope; `ServiceFormsTest` prueba versionamiento, borradores, finalización e inspección 25 puntos; `VehicleRecordsTest` prueba relaciones e historial; `ServiceDocumentsTest` prueba PDF, QR, etiqueta y comprobante térmico; `ProductSearchTest` prueba buscador; `AdminFinancialReportsTest` prueba reportes.

Pendiente de integración: token POS real, crear venta V2 ficticia aislada, demostrar movimiento de inventario y costo histórico, vincular esa venta con orden, verificar todo en el mismo ciclo HTTP y comparar reportes derivados. La suite no se reemplaza por fixtures ni se reporta como aprobada.
