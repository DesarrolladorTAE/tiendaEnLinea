# Integración frontend React — MTELMX

Paquete de transferencia para implementar el frontend sobre los contratos existentes del backend Laravel. La raíz HTTP es `/api` (salvo que el despliegue ya monte ese prefijo en el proxy). Los paths de este paquete se muestran sin `/api`. Enviar `Accept: application/json`; para mutaciones JSON, `Content-Type: application/json`. Usar Sanctum conforme al mecanismo ya configurado por MTELMX (cookie SPA o bearer token); no guardar credenciales en el repositorio.

## Lectura recomendada

El agente React debe leer primero los contratos exactos:

1. [Arquitectura general](01-arquitectura-general.md)
2. [Autenticación, módulos y permisos](02-autenticacion-modulos-permisos.md)
3. [Capacidades privadas, permisos y rutas efectivas](19-capacidades-privadas-permisos-rutas.md)
4. [Expedientes: contratos exactos](22-contratos-exactos-expedientes-vehiculares.md)
5. [Clientes y catálogos para expedientes](23-contratos-exactos-clientes-catalogos.md)
6. [Historial vehicular](24-contratos-exactos-historial-vehicular.md)
7. [QR y etiquetas](25-contratos-exactos-qr-etiquetas.md)
8. [Fixtures de expediente para React](26-fixtures-expedientes-vehiculares.md)
9. [Plantillas y asociaciones exactas](27-contratos-exactos-plantillas-formularios.md)
10. [Esquema dinámico y versionamiento](28-esquema-dinamico-versionamiento.md)
11. [Captura e inspecciones](29-contratos-exactos-captura-inspecciones.md)
12. [Plantilla exacta de 25 puntos](30-plantilla-inspeccion-25-puntos.md)
13. [PDF de órdenes y formularios](31-contratos-documentos-formularios.md)
14. [Fixtures de formularios](32-fixtures-formularios-dinamicos.md)
15. [Agenda y citas exactas](33-contratos-exactos-agenda-citas.md)
16. [Órdenes de servicio exactas](34-contratos-exactos-ordenes-servicio.md)
17. [Estados y transiciones](35-estados-transiciones-operativas.md)
18. [Recursos, kilometraje y formularios](36-recursos-kilometraje-formularios.md)
19. [Ventas, historial y documentos](37-ventas-historial-documentos-ordenes.md)
20. [Capacidades y seguimiento](38-capacidades-operativas-seguimiento.md)
21. [Fixtures de agenda y órdenes](39-fixtures-agenda-ordenes.md)
22. [Contratos exactos de servicios](15-contratos-exactos-configuracion-servicios.md)
23. [Contratos exactos de agenda y disponibilidad (resumen)](16-contratos-exactos-agenda-disponibilidad.md)
24. [Contratos exactos de recursos y técnicos](17-contratos-exactos-recursos-tecnicos.md)
25. [Contratos exactos de formularios asociados](18-contratos-exactos-formularios-asociados.md)
26. [Fixtures JSON restantes](20-fixtures-contratos-react.md)
27. [Inventario de endpoints](11-inventario-endpoints.md)
28. [Configuración de servicios y recursos (resumen)](03-configuracion-servicios-recursos.md)
29. [Expedientes vehiculares (resumen)](04-expedientes-vehiculares.md)
30. [Formularios e inspecciones (resumen)](05-formularios-dinamicos-inspecciones.md)
31. [Agenda, citas y órdenes (resumen)](06-agenda-citas-ordenes.md)
32. [Documentos, QR e impresión](07-documentos-qr-impresion.md)
33. [Buscador vehicular y POS](08-buscador-vehicular-pos.md)
34. [Importación y exportación vehicular](09-importacion-exportacion-vehicular.md)
35. [Reportes administrativos](10-reportes-administrativos.md)
36. [Flujos integrales](12-flujos-integrales.md)
37. [Limitaciones y pendientes](13-limitaciones-pendientes.md)
38. [Migraciones y despliegue](14-migraciones-despliegue.md)
39. [Informe original de auditoría de fase 8](21-informe-original-auditoria-fase-8.md)

## Fuente y certeza

La guía consolida `docs/guia-integracion-react-fases-1-8.md` y las guías de fases 4–8. Se contrastaron paths y métodos con `routes/api.php`. El endpoint inventory identifica controladores y middleware; para campos exactos de cuerpos/respuestas complejos, prevalecen `FormRequest`/`$request->validate()`, recursos JSON y pruebas Feature vinculadas. No usar ejemplos ilustrativos como valores reales. Cuando no se verificó un contrato exacto, está etiquetado expresamente.

Los documentos 15–19 y 22–32 conservan las fuentes y el alcance descritos en cada anexo. El documento 21 contiene el informe original de fase 8.

Los anexos 33–39 recogen el contrato informado en la entrega técnica previa. Se revisaron las dos ramas accesibles de [Backend-MTELMX](https://github.com/DesarrolladorTAE/Backend-MTELMX/branches). En `main` (`14fc966fb317860e35c6a778cbb02648760ac63e`), las rutas de reservas corresponden a tours y el `BookingController` general está vacío. El árbol carece de `ServiceOrderController`, `ServiceOperationScope` y `ServiceOperationsTest`. La rama `fix/stores-plan-id-migration` (`e69fdcd8027dad47eaee81b315485c040db4c8c0`) tampoco contiene esos artefactos.

Para cerrar la verificación se requiere el SHA, la rama o una copia de la versión operativa de Laravel con rutas, controladores de citas, disponibilidad y órdenes, validadores, modelos, scopes, middlewares y las pruebas Feature referenciadas. Quedan pendientes los cuerpos exactos de edición y transiciones de citas, las relaciones serializadas, los errores por acción y la autorización de ventas y documentos. Los fixtures del anexo 39 son sintéticos. No se ejecutó Laravel en esta revisión.

Este backend no es una autorización de despliegue. La concurrencia y mediciones de carga MySQL permanecen pendientes; dos fallos conocidos de tours permanecen documentados. Los documentos originales del cliente y la validación física de impresoras no están disponibles.

## Principios de integración

- Resolver capacidades desde configuración dinámica; eliminar la condición React `store.id === 566`.
- No confiar en `branch_id`, IDs ni datos de vehículo enviados por cliente si la identidad autenticada permite derivarlos.
- Un QR identifica el vehículo, pero no autoriza su lectura; la resolución está autenticada.
- El precio del buscador vehicular es preliminar. La venta debe pasar por las validaciones comerciales POS existentes.
- `null` significa dato desconocido en costos y métricas financieras; no convertirlo a cero.
- Los documentos privados deben descargarse con sesión/autorización y sin caché pública.

