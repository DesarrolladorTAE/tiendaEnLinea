# Limitaciones y pendientes

Separar “implementado” de “verificado” en UI/documentación de proyecto:

| Tema | Estado conocido |
|---|---|
| Expedientes, forms, agenda, órdenes, QR, buscador, reportes | Implementados; pruebas por módulo disponibles, no un único flujo E2E integral ejecutado |
| Concurrencia MySQL | Pendiente de instancia aislada; SQLite no prueba locks MySQL. Bloqueo para despliegue integral |
| Rendimiento MySQL | Mediciones con grandes catálogos requieren base MySQL aislada; los datos/pruebas SQLite no sustituyen benchmark |
| PrintBridge heredado | Rutas comerciales sin middleware de auth visible identificadas; no modificadas. No se dispone de repos Android/Windows ni consumidores |
| 429 Telorecargo | Pruebas repetidas pueden compartir throttling/IP; conservar seguridad, no desactivar rate limits. Última línea reportada sin 429 |
| Tours | 169 aprobadas, 2 fallos conocidos del mismo caso: expected 404 / actual 422 por validación buyer_phone. No resolver en esta integración |
| Cost tax basis | `unknown` hasta confirmación del cliente sobre IVA recuperable del costo |
| Caja fija/inversión/gastos reales | No disponibles (null) por falta de fuente confiable; no inventar cero |
| Original inspección y reportes | No disponible para cotejo; diseño provisional |
| Impresión física | No verificada; falta modelo/protocolo/resolución/medio de impresora |
| Etiquetadora | Protocolo físico no implementado; integración condicionada a dispositivo |
| React | No se inspeccionó repositorio frontend en esta auditoría |
| Importación v2 | Test local ida/vuelta; no se hicieron importaciones masivas reales |

Base de referencia consolidada fase 8: 95 pruebas principales/881 assertions, 32 buscador/exportador tradicional y tours 169+2 fallidas conocidas; las corridas posteriores reportadas variaron por subset y deben consultarse en el informe de fase 8, no sumarse como total independiente. El test PDF WhatsApp fue aprobado. Esta carpeta no vuelve a ejecutar suites.

## Restricciones confirmadas para la integración React

- Zona horaria: disponibilidad usa `config('app.timezone')`; no acepta ni devuelve una zona horaria configurable por sucursal. No asumir TZ local del navegador.
- Disponibilidad: slots vacíos no indican causa y la respuesta no incluye contadores de capacidad ni duración efectiva. No cambió este contrato.
- Recursos: una colección semanal vacía elimina el filtro horario propio del recurso; los horarios del servicio, capacidad y reservas continúan limitando slots. La UI debe advertir antes de guardar la colección vacía.
- Concurrencia: no se añadió control por versión/ETag; la prueba concurrente en MySQL aislado sigue pendiente.
- Técnicos/empleados: `user_id` del recurso no se valida contra un listado común de técnicos elegibles; no inventar ni dar por validada esa relación.
- PrintBridge heredado, tours y Telorecargo: permanecen sin cambios; conservar autenticación/rate limiting actuales y contratos existentes.
- POS/CFDI: esta entrega no cambia flujo de cobro, precios definitivos, impuestos ni facturación. Las capacidades son informativas para UI; cada endpoint sigue siendo autoridad de acceso.

Verificación de estas correcciones puntuales: 80 pruebas aprobadas y 816 aserciones en las suites aisladas de formularios, operaciones de servicio, catálogo vehicular, capacidades privadas, módulos POS, expedientes y documentos. Es un subset relacionado y no se compara como reemplazo de la línea base completa de 109 pruebas.

