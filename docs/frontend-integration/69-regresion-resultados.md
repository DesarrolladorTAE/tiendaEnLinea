# Suites y regresiones — cierre fase 8

## Entorno

Las ejecuciones de cierre fijaron configuración antes del bootstrap con `APP_ENV=testing`, `APP_CONFIG_CACHE=/tmp/mtelmx-phase8-config-isolated.php`, `CACHE_STORE=array`, `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`, sesión array, cola sync y correo array. Así RateLimiter usa cache efímera. Una primera ejecución previa sin override produjo 429 cruzados de Telorecargo y no se toma como línea base válida.

## Ejecuciones

- Batería dirigida: 256 aprobadas, 1 fallida, 2,784 aserciones. El único fallo fue el caso conocido de tours `test_public_hides_inactive_services_past_departures_and_bad_tokens`: esperaba 404 para consulta pública de folio sin `buyer_phone`, recibió 422 de validación. No se cambió expectativa ni lógica.
- Batería comercial/fiscal adicional: 54 aprobadas, 3 fallidas, 349 aserciones. Las tres fallas son de `TaeContaCreditPaymentMethodTest`: el esquema SQLite de la prueba no crea `sale_payments`, y el servicio consulta esa tabla. No es evidencia de defecto funcional ni de preexistencia; requiere completar fixture/schema de prueba o validar en esquema real aislado. No se cambió esa suite.
- Conteo agregado de ejecuciones (sin deduplicar pruebas heredadas entre suites): 310 pass, 4 fail. Las 4 fallas están explicadas arriba; no equivalen a 314 casos únicos necesariamente.
- `TelorecargoPosTest`: 30 pruebas/409 aserciones aprobadas aislada. Una corrección test-only limpia buckets RateLimiter para tokens ficticios entre pruebas, preservando el test de límite compartido.
- `AdminFinancialReportsTest`: 6/70; incluida en la primera batería.
- `SalesDocumentsTest`: 43 aprobadas; incluida en primera batería, con preview PDF funcionando.

La batería incluyó VehicleCatalog, ProductSearch, ServiceOperations, ServiceForms, VehicleRecords, ServiceDocuments, SalesDocuments, AdminFinancialReports, ProductExcelExport, Telorecargo, TelorecargoCredential, TourApi y TourPdfWhatsApp. WhatsApp PDF aprobado con gateway HTTP falso.

## Cambios locales de esta actividad

- `resources/views/tickets/ticket.blade.php`: acceso nullable a `original_price` en fixtures/datos que no envían esa propiedad; evita 500 sin alterar cálculo comercial.
- `tests/Feature/TelorecargoPosTest.php`: aislamiento de claves de rate limiter para tokens sintéticos entre casos; no desactiva el limitador.

No se modificó lógica de tours, precios, cobro, almacenes, reportes o esquema. Preservar los demás cambios locales preexistentes.

Ejecución posterior de cierre: `PosProductLookupTest`, `ProductSearchTest`, `VehicleCatalogTest` — **55 aprobadas, 548 aserciones**. La nueva ruta utiliza bearer Sanctum de fixture, pero es Laravel Feature SQLite; no equivale a petición HTTP remota ni MySQL.
