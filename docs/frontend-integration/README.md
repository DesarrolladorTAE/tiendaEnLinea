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
40. [Mutaciones exactas de citas: edición, reprogramación, cancelación y recurso](40-contratos-exactos-mutaciones-citas.md)
41. [Vinculación de ventas y zona horaria](41-contratos-vinculacion-ventas-zona-horaria.md)
42. [Fixtures de cierre de fase 5](42-fixtures-cierre-fase-5.md)
43. [Contrato exacto del buscador POS](43-contratos-exactos-buscador-pos.md)
44. [Compatibilidades y contexto vehicular](44-compatibilidades-contexto-vehicular.md)
45. [Inventarios, precios y carrito POS](45-inventarios-precios-carrito-pos.md)
46. [Ventas POS y vínculo con órdenes](46-ventas-pos-vinculacion-ordenes.md)
47. [Capacidades y seguridad POS](47-capacidades-seguridad-pos.md)
48. [Importación/exportación vehicular v2](48-importacion-exportacion-vehicular-v2.md)
49. [Fixtures del buscador POS](49-fixtures-buscador-pos.md)
50. [Validación Laravel aislada](50-procedimiento-validacion-laravel-aislado.md)
51. [Validación de autenticación POS y aislamiento](51-validacion-autenticacion-pos.md)
52. [Validación de almacenes y precios del cobro](52-validacion-almacenes-precios-cobro.md)
53. [Reconciliación de ventas y vínculo con órdenes](53-reconciliacion-ventas-vinculacion.md)
54. [Contrato del reporte semanal](54-contratos-exactos-reportes-semanales.md)
55. [Contrato del reporte mensual](55-contratos-exactos-reportes-mensuales.md)
56. [Costos históricos y base fiscal](56-costos-historicos-base-fiscal.md)
57. [Distribución de utilidad y limitaciones](57-distribucion-utilidad-limitaciones.md)
58. [Exportaciones, permisos y rendimiento](58-exportaciones-reportes-permisos.md)
59. [Fixtures de reportes administrativos](59-fixtures-reportes-administrativos.md)
75. [Integración operativa POS y seguridad](75-integracion-operativa-pos-seguridad.md)
77. [Cierre POS y preparación de migraciones](77-cierre-pos-y-preparacion-migraciones.md)
78. [Correcciones finales POS y preparación de migraciones](78-correcciones-finales-pos-migraciones.md)
81. [Habilitación controlada del POS e idempotencia por terminal](81-habilitacion-controlada-pos.md)

## Fuente y certeza

### Certificación operativa y consulta puntual POS

Leer [contrato de lookup POS](72-consulta-puntual-producto-pos.md), [propuesta de Laravel/MySQL para React](73-entorno-prueba-frontend-laravel.md) y [dictamen actualizado](74-certificacion-operativa.md). La regresión SQLite de lookup, búsqueda y catálogo pasó 55 pruebas/548 aserciones. V2 sigue bloqueado por autorización de almacenes y validación de precios; no hubo HTTP externo ni MySQL.

### Cierre técnico fase 8 (2026-11-27)

Leer también [entorno aislado](60-entorno-aislado.md), [fixtures](61-fixtures-integrales-fase-8.md), [seguridad](62-seguridad-http-aislamiento.md), [evidencia de flujo](63-recorrido-integral-evidencia.md), [concurrencia MySQL](64-concurrencia-mysql.md), [recuperación comercial](65-recuperacion-comercial.md), [validación financiera](66-validacion-financiera.md), [rendimiento](67-rendimiento.md), [documentos](68-documentos-qr-impresion.md), [regresión](69-regresion-resultados.md), [migraciones](70-migraciones-despliegue.md) y [dictamen](71-bloqueos-dictamen.md). La ejecución aislada fijó configuración antes del bootstrap; obtuvo 256 pass/1 fail (Tours 404/422 conocido) y una batería adicional de 54 pass/3 fail por falta de tabla `sale_payments` en el esquema de prueba de TaeConta. No hubo HTTP real, MySQL ni flujo único integral. No habilitar POS: ver riesgos de almacenes/precio/token en 51–53.

La guía consolida `docs/guia-integracion-react-fases-1-8.md` y las guías de fases 4–8. Se contrastaron paths y métodos con `routes/api.php`. El endpoint inventory identifica controladores y middleware; para campos exactos de cuerpos/respuestas complejos, prevalecen `FormRequest`/`$request->validate()`, recursos JSON y pruebas Feature vinculadas. No usar ejemplos ilustrativos como valores reales. Cuando no se verificó un contrato exacto, está etiquetado expresamente.

Los documentos 15–19, 22–25, 27–31 y 33–38 son anexos contrastados con rutas, controladores, validadores y scopes. Los documentos 20, 26, 32 y 39 contienen fixtures ilustrativos salvo cuando se marca evidencia Feature; no implican por sí mismos ejecución de pruebas en esta entrega. Los documentos 21 y 33–39 registran hallazgos operativos y evidencia consultada; los ejemplos no implican ejecución de pruebas en esta entrega. El documento 21 contiene el informe original de fase 8.

Los documentos 40–42 cierran contratos operativos de mutaciones de citas, asociación de ventas y timezone. Los fixtures 42 distinguen evidencia de `ServiceOperationsTest` de ejemplos derivados del código. La zona horaria es global (`config/app.timezone`); las consultas de ventas existentes no conforman un buscador seguro de ventas elegibles por orden y sucursal.

Los documentos 43–50 son el paquete de preparación de fase 6. El buscador vehicular privado admite POS según guards/scope de código; falta una prueba Feature que recorra `CheckStoreAccess` con un token terminal, porque la prueba de controlador lo desactiva. El listado POS tradicional y el catálogo público son contratos distintos. No usar datos públicos como fallback para inventario/precio privado.

Los documentos 51–53 contienen la revisión de seguridad POS original y su estado anterior a los fixes. El anexo 75 actualiza el dictamen: emisión cross-tenant y almacenes no asignados fueron corregidos y probados con SQLite aislado; precio V2 continúa aceptando importes enviados sin comprobar autorización comercial. El vínculo venta–orden admite POS bajo ServiceOperationScope, es idempotente al repetir el mismo vínculo y no filtra estados comerciales. No hay HTTP real ni MySQL.

El anexo 77 registró 106 pruebas/954 aserciones y las siete migraciones originales. El anexo 78 registra su ejecución posterior en la base local `laravel_db` (APP_ENV=local): las siete migraciones pendientes quedaron aplicadas, junto con las dos migraciones recientes que ya estaban aplicadas; no se tocó producción. La regresión focalizada pasó 114 pruebas/1,003 aserciones SQLite. Precio manual permanece pendiente de decisión comercial; no hubo DDL MySQL de producción ni HTTP real. No habilitar cobro V2 en producción hasta definir autorización de precios y completar certificación MySQL/HTTP.

Los documentos 54–59 contienen contratos y evidencia de reportes administrativos. `AdminFinancialReportsTest` configura SQLite `:memory:`; en esta entrega pasó **6 pruebas y 70 aserciones**. No hubo medición MySQL/volumen. Los reportes solo aceptan Store autenticado, filtran por tienda y opcionalmente una sucursal; omitida ésta, consolidan la tienda. `cost_tax_basis` permite cambiarse mediante el endpoint de settings existente, pero su default sigue `unknown` hasta confirmación del cliente. Reportes son dinámicos, no cierres persistidos.

Este backend no es una autorización de despliegue. La concurrencia y mediciones de carga MySQL permanecen pendientes; dos fallos conocidos de tours permanecen documentados. Los documentos originales del cliente y la validación física de impresoras no están disponibles.

El anexo 81 documenta la compuerta independiente de idempotencia POS y las pruebas SQLite focalizadas (30/161). Falta registrar `sales_v2_idempotency` en `pos_modules`; no hay capacidad habilitable desde la API hasta autorizar esa migración de datos. No se ejecutó migración ni prueba HTTP/MySQL real. Las solicitudes legacy sin `Idempotency-Key` permanecen compatibles.

## Principios de integración

- Resolver capacidades desde configuración dinámica; eliminar la condición React `store.id === 566`.
- No confiar en `branch_id`, IDs ni datos de vehículo enviados por cliente si la identidad autenticada permite derivarlos.
- Un QR identifica el vehículo, pero no autoriza su lectura; la resolución está autenticada.
- El precio del buscador vehicular es preliminar; además, la ruta V2 actualmente acepta `unit_price` enviado y valida el total solo contra ese precio. Consultar [52](52-validacion-almacenes-precios-cobro.md); no asumir una validación de precio autorizado.
- `null` significa dato desconocido en costos y métricas financieras; no convertirlo a cero.
- Los documentos privados deben descargarse con sesión/autorización y sin caché pública.

