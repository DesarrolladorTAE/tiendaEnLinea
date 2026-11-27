# Concurrencia MySQL — pendiente bloqueante

No se ejecutaron pruebas MySQL porque no se identificó una instancia autorizada/desechable. SQLite Feature no demuestra bloqueos, aislamiento ni contención concurrente de MySQL.

En la instancia desechable documentada en [60](60-entorno-aislado.md), preparar dos conexiones independientes y ejecutar carreras sobre último cupo, reprogramación, conversión de booking, captura/finalización de formulario, vínculo de ventas y última existencia. Registrar resultado de cada conexión, estado final y filas/eventos. Repetir con cancelación/devolución cuando la operación exista. Limpiar destruyendo únicamente la base temporal.

No hay evidencia de seguridad concurrente MySQL. Edición concurrente de agenda carece de precondición/versionado atómico según contratos 16/17: permanece riesgo de última escritura. Este punto bloquea el dictamen de despliegue integral.
