# Seguridad y aislamiento — evidencia disponible

En SQLite Feature se aprobaron casos de aislamiento en `VehicleRecordsTest` (marca/modelo, POS scope, cliente extranjero, relaciones booking/order), `ServiceOperationsTest` (tienda/sucursal/servicio/cliente), `ServiceFormsTest` (tienda/sucursal/permisos) y `ServiceDocumentsTest` (documentos privados y rotación QR). Estos tests no prueban un intercambio HTTP real con bearer POS atravesando todos los middleware; algunas suites usan `actingAs`/`Sanctum::actingAs` y otras aíslan middleware.

La revisión POS previa (documentos 51–53) identifica riesgos no corregidos: `/admin/pos-token` no compara ownership de la terminal solicitada con la tienda autenticada; `/v2/sales` no valida la asignación concreta de almacén a la terminal y confía en `unit_price`/descuento enviados para reconciliar importes. No se hicieron cobros de prueba contra infraestructura real ni se modificó lógica comercial. Dictamen: seguridad POS **no aprobada para habilitación** hasta corregir y validar estos riesgos en un ambiente aislado.

La autenticación administrativa no debe sustituirse por POS_TOKEN ni viceversa. Los documentos 51–53 contienen rutas y análisis del código. Pruebas HTTP bearer terminal real: pendientes.
