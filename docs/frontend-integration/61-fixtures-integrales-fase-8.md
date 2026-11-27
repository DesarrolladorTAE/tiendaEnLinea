# Fixtures reutilizables y alcance de la evidencia

Las pruebas Feature existentes preparan entidades ficticias con esquemas SQLite definidos por suite. No existe un seeder único verificado que construya el escenario completo multi-tenant solicitado. No se añadieron seeders ni tablas durante esta entrega.

Para un ambiente MySQL desechable, preparar dos tiendas; dos sucursales de la primera y una de la segunda; actores Store/empleados y terminales POS con tokens sintéticos; capacidades distintas; almacenes asignados y no asignados; clientes y vehículos ficticios; servicios tradicionales y vehiculares; recursos y horarios; plantillas genéricas y la inspección; catálogo con compatibles/universal/unknown, variantes y costos null/cero/conocidos. Los IDs deben generarse por fixture, nunca fijarse a tiendas reales.

La evidencia disponible se encuentra en `VehicleRecordsTest`, `ServiceOperationsTest`, `ServiceFormsTest`, `ServiceDocumentsTest`, `VehicleCatalogTest`, `ProductSearchTest`, `AdminFinancialReportsTest` y demás suites listadas en [69](69-regresion-resultados.md). Son escenarios independientes: no equivalen a una única secuencia cliente→vehículo→cita→orden→inspección→venta.
