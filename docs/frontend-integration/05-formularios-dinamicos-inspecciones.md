# Formularios dinámicos e inspecciones

## Endpoints reales

Todos requieren `auth:sanctum`. Módulo aplicable: `service_forms` (`FormFeature`) y alcance de tienda/sucursal del servicio/orden.

| HTTP | Ruta | Uso |
|---|---|---|
| GET, POST | `/service-form-templates` | listar/crear plantilla |
| GET | `/service-form-templates/{templateId}` | consultar plantilla |
| PUT, PATCH | `/service-form-templates/{templateId}` | actualizar metadatos/schema; schema distinto incrementa versión |
| POST | `/service-form-templates/{templateId}/duplicate` | duplicar |
| PATCH | `/service-form-templates/{templateId}/status` | activar/desactivar |
| POST | `/service-form-templates/install/vehicle-inspection-25` | instalar estructura de inspección 25 puntos |
| GET, PUT | `/branches/{branchId}/services/{serviceId}/forms` | leer/configurar asociaciones requeridas u opcionales |
| GET | `/service-orders/{orderId}/forms` | listar requisitos y capturas |
| POST | `/service-orders/{orderId}/forms` | iniciar captura |
| GET | `/service-orders/{orderId}/forms/{submissionId}` | consultar envío |
| PUT, PATCH | misma ruta | guardar borrador |
| POST | misma ruta + `/complete` | finalizar |
| POST | misma ruta + `/cancel` | cancelar con motivo |
| GET | misma ruta + `/summary` | resumen calculado |
| GET | `/branches/{branchId}/service-orders/{orderId}/forms/{submissionId}/document.pdf` | PDF privado branch-scoped (ver documento 31) |

## Versionado

Al iniciar un envío se conserva snapshot de schema/versión. Cambios posteriores a la plantilla no modifican respuestas históricas. React debe renderizar el esquema guardado en el envío, no consultar la plantilla vigente para reinterpretar respuestas.

Estados internos exactos: `draft`, `completed`, `cancelled`. Transiciones y permisos están en el documento 29. Completar la orden con un formulario requerido pendiente se valida en el flujo de órdenes.

## Payload

Los campos de schema y respuestas son dinámicos. Tipos, reglas, límites y snapshots se documentan en 28; contratos de captura en 29. Renderizar el schema snapshot de la submission, no la plantilla vigente.

## Inspección 25 puntos

La estructura exacta implementada está en 30 y la genera `POST /service-form-templates/install/vehicle-inspection-25`. Es provisional hasta cotejar el PDF original de Autopartes Guerrero. El frontend debe renderizar schema, no mantener una definición paralela.

