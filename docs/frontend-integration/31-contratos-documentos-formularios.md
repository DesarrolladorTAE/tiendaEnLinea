# 31. Documentos PDF de órdenes y formularios

Fuentes: `routes/api.php`, middleware `RequireServiceDocumentAuth`, `ServiceDocumentController`, `ServiceDocumentData`, vistas `resources/views/service-documents/*`, `FormFeature`, `ServiceOperationScope`, pruebas `tests/Feature/ServiceDocumentsTest.php`.

## Endpoints

| Método y ruta | Controller | Resultado |
|---|---|---|
| GET `/branches/{branchId}/service-orders/{orderId}/document.pdf` | `orderPdf` | PDF de orden operativa |
| GET `/branches/{branchId}/service-orders/{orderId}/forms/{submissionId}/document.pdf` | `formPdf` | PDF de submission generic/inspection |

Ambas requieren Sanctum en middleware de grupo `RequireServiceDocumentAuth`; verifica acceso a branch y orden vía `ServiceOperationScope`. `formPdf` verifica además `FormFeature` (`service_forms`, plan y POS override). El actor aceptado efectivamente es Store o POS autenticado según scope; POS solo orden de su branch. Recurso ajeno/inexistente: 404; módulo/permiso bloqueado: 403; no Sanctum: 401. Sin query/body.

Respuesta 200 `application/pdf`, descarga `orden-{order_code}.pdf` o `formulario-{folio}.pdf`; `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`. El método DomPDF usa vistas internas y remote assets deshabilitados. El nombre descargado incorpora folio/identificador, no es URL pública.

## Fuente histórica

PDF de formulario consulta submission por `store_id + service_order_id + id` y construye su documento desde `schema_snapshot`, `answers`, `context_snapshot`, `template_version`, status y folio. No lee schema vigente de la plantilla para renderizar. Así, cambiar o desactivar plantilla no altera el contenido histórico.

PDF de orden usa snapshots de orden y, cuando existen, snapshots de servicio/sucursal/técnico guardados en eventos de orden; lista solo formularios `completed` asociados, mostrando folio/título/fecha, no expone borradores como detalle completado. PDF genérico y de inspección comparten endpoint; `kind=inspection25` selecciona vista especializada. Estados no están restringidos por el controller al descargar (submission debe existir y pertenecer a orden), incluyendo borrador/cancelado en endpoint directo; el documento representa el status. La operación es de generación/descarga, no impresión física.

PDF de formulario presenta secciones/campos traducidos a texto, valores históricos, observación, recomendación, explicación, summary y disclaimers del schema snapshot. La prueba de `ServiceDocumentsTest` valida descarga privada y scope; pruebas de `ServiceFormsTest` validan snapshots/versiones, pero no toda la composición visual en cada tamaño de página. La inspección y reportes siguen provisionales hasta cotejar originales del cliente.

## Ejemplo React

```js
const response = await fetch(`${api}/branches/${branchId}/service-orders/${orderId}/forms/${submissionId}/document.pdf`, {
  headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
  credentials: 'include'
});
if (!response.ok) throw await response.json();
const blob = await response.blob(); // crear object URL temporal y revocarla al cerrar
```

No persistir URLs públicas ni usar caché compartido. Evidencia: `ServiceDocumentsTest` escenarios de formulario PDF válido, submission ajena/no encontrada y branch no autorizada. Los códigos 401/403/404 derivan de middleware/scope; fallo del renderizador puede producir 5xx. No hay endpoint de listar documentos por separado.
