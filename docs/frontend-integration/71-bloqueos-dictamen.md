# Bloqueos y dictamen fase 8

| Dimensión | Estado | Evidencia/pendiente |
|---|---|---|
| Backend implementado | Parcial | Código de fases 1–7 presente; no implica validación integral. |
| Tests automatizados | Parcial | 310 pass/4 fail en ejecuciones dirigidas (algunas heredadas); fallo tours conocido y tres fallos por esquema incompleto de fixture fiscal. |
| HTTP real aislado | Pendiente | No existe instancia Laravel aislada autorizada identificada. |
| MySQL | Bloqueado externo | Host 3306 sin identidad autorizada; no conectar. Concurrencia/rendimiento pendientes. |
| Flujo integral único | Pendiente | Cobertura separada, sin cadena completa ni venta V2 aislada. |
| Seguridad POS | Bloqueado | Riesgos de ownership al emitir token, almacén asignado y precio manipulable en documentos 51–53; requiere corrección/autorización independiente. |
| Reportes financieros | Parcial | Suite SQLite 6/70; base fiscal unknown, costo incompleto y cruces integrales no comprobados en MySQL. |
| Impresión física | Pendiente | Sin modelo/protocolo/dispositivo. PDF/payload digital sí tienen pruebas Feature. |
| React–Laravel | Parcial | Frontend unitario reporta 402 tests/78 suites/Vite, pero integración HTTP real no comprobada. |
| Preparación producción | **No aprobado** | Bloqueos de MySQL, seguridad POS, flujo integral y reconciliación comercial. |

Pendientes cliente: base fiscal del costo/IVA recuperable, criterio de ingresos, significado de caja fija/inversión/gastos, formato original inspección/reportes y especificación de impresora etiquetadora.

Los dos fallos conocidos de tours 404/422 siguen abiertos. Las fallas de `TaeContaCreditPaymentMethodTest` requieren fixture SQL completo y nueva ejecución. No se hicieron cambios de expectativas.
