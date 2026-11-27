# Documentos, QR e impresión

En la batería aislada, `ServiceDocumentsTest` aprobó tres pruebas: snapshots de documentos después de cambios maestros; privacidad/scope de PDF, etiqueta y rotación QR; comprobante operativo y validación 58/80 mm. `SalesDocumentsTest` aprobó 43 pruebas, incluida vista previa de PDF tras la corrección descrita en [69](69-regresion-resultados.md).

No se revisaron físicamente impresoras ni se ejecutó PrintBridge con dispositivos. La inspección 25 puntos sigue provisional sin el original del cliente. La suite confirma generación de artefactos, no legibilidad física ni compatibilidad de protocolo. QR no sustituye autenticación.

PrintBridge heredado y consumidores externos continúan sin cambios; ver la evaluación y transición de documentos 07/51–53. Sin repositorios Android/Windows disponibles, consumidores y versiones no pueden confirmarse en esta ejecución.
