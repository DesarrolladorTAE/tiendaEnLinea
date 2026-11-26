# Documentos, QR e impresión

## Rutas operativas privadas

Middleware `RequireServiceDocumentAuth` protege el grupo `/branches/{branchId}`. Se exige actor autenticado y scope de tienda/sucursal/permiso; no consumir por URL pública ni habilitar cache compartido.

| HTTP | Ruta | Respuesta |
|---|---|---|
| GET | `/branches/{branchId}/service-orders/{orderId}/document.pdf` | PDF orden |
| GET | `/branches/{branchId}/service-orders/{orderId}/forms/{submissionId}/document.pdf` | PDF de formulario |
| GET | `/branches/{branchId}/service-orders/{orderId}/thermal` | payload térmico, ancho/config existente |
| POST | `/branches/{branchId}/vehicles/resolve-qr` | resolver token autenticado |
| GET | `/branches/{branchId}/vehicles/{vehicleId}/qr.svg` | SVG QR |
| GET | `/branches/{branchId}/vehicles/{vehicleId}/label.pdf` | PDF etiqueta |
| POST | `/branches/{branchId}/vehicles/{vehicleId}/rotate-qr` | rotar token/inutilizar anterior |

La resolución recibe token QR; el cuerpo exacto se obtiene de `ServiceDocumentController::resolve`. El token permite localizar el expediente dentro de un usuario autenticado, no da acceso por sí mismo. Verificar respuesta con el controlador; no exponer campos personales ni historial innecesario.

## Documentos

Los PDFs de servicios usan snapshots históricos de atención. Formulario genérico, inspección de 25 puntos y etiqueta son privados. El diseño de inspección/formatos es provisional hasta cotejar originales. Reportes semanales/mensuales: rutas en el documento 10. La descarga en React debe usar fetch autenticado y blob, evitando URL compartible/cache público.

## Impresión

Payload térmico operacional separado de tickets comerciales. Reutilizar `TicketPayloadBuilder`, `PrintBridge` y configuración de impresión existentes solo cuando el consumidor compatible lo permita. No afirmar compatibilidad física: no hay modelo, protocolo, resolución y medio confirmados para etiquetadora.

Rutas heredadas `/printbridge/print-sale/{sale}`, `/printbridge/print-test`, `/sales/{sale}/print-payload` y rutas de impresión POS deben considerarse APIs comerciales existentes; algunas no declaran middleware visible en `routes/api.php`. No enviar allí PDFs privados de servicios. No se cambió su contrato porque los repositorios Android/Windows/consumidores externos no están disponibles.

