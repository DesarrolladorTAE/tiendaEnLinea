# Manual de administración: Recargas Telorecargo

Mi Tienda en Línea MX · Versión 1.0 · 29 de octubre de 2026

Guía para configurar la integración y la comisión, supervisar operaciones, consultar reportes y resolver incidencias de recargas desde el panel de tienda.

## 1. Para qué sirve y cómo ingresar

El panel Telorecargo concentra la configuración y la supervisión de las recargas de los puntos de venta de la tienda. Administración guarda la clave externa, define la comisión, consulta operaciones y revisa cobros que requieren conciliación.

1. Inicia sesión en el panel de administración de la tienda.
2. Abre Telorecargo desde el menú.
3. Comprueba el estado del encabezado: Integración configurada o Pendiente de configurar.
4. Identifica las pestañas Configuración y Operaciones y reporte.

Las compras de recarga y las solicitudes de saldo se realizan desde cada POS. Este manual explica las funciones del administrador; el manual del punto de venta contiene el procedimiento del cajero.

> CAPTURA A01 — Acceso administrativo. Muestra Telorecargo en el menú, el estado de la integración y las dos pestañas.

## 2. Preparar la conexión con Telorecargo

1. Entra a Configuración.
2. Localiza Conexión con Telorecargo.
3. Comprueba si aparece Sin configurar o Clave configurada.
4. Prepara la Clave externa mtelmx correspondiente a la cuenta de la tienda.
5. Comprueba que la cuenta y la clave sean las que deseas utilizar antes de guardarlas.

El saldo se comparte por toda la cuenta de la tienda. Tener una clave guardada no garantiza que el proveedor la acepte; la validez se comprueba al consultar Telorecargo desde el POS.

> CAPTURA A02 — Conexión. Incluye el estado, el campo de clave y las instrucciones, sin mostrar una credencial real.

## 3. Guardar o reemplazar la clave externa

1. Captura la credencial en Clave externa mtelmx.
2. Si no hay integración guardada pulsa Guardar clave.
3. Si ya existe y deseas cambiarla pulsa Reemplazar clave.
4. Espera el mensaje de resultado.
5. Comprueba que el campo quede vacío después del envío.
6. Usa Actualizar estado para volver a consultar la configuración guardada.

La clave guardada nunca se muestra en el campo. Si el envío falla, revisa el aviso antes de volver a capturarla. No incluyas una credencial visible en capturas o mensajes de soporte.

> CAPTURA A03 — Guardar clave. Muestra el campo protegido, Guardar clave o Reemplazar clave y el mensaje de resultado.

## 4. Definir la comisión fija por recarga

1. En Configuración localiza Comisión fija por recarga.
2. En Comisión (MXN) captura el importe adicional que cobrará la tienda.
3. Usa un importe no negativo con máximo dos decimales.
4. Pulsa Guardar comisión.
5. Espera Comisión actualizada y comprueba el valor mostrado.

Ejemplo: con una recarga de $100.00 y una comisión de $3.00, el cliente paga $103.00. La recarga y la comisión se registran separadas y se cobran en una sola venta.

La comisión no se cambia desde el cobro del cajero. Las ventas anteriores conservan sus importes. En esta versión el formulario admite una comisión máxima de $9,999.99 y requiere que la integración esté configurada.

> CAPTURA A04 — Comisión. Incluye Comisión (MXN), Guardar comisión y la confirmación del cambio.

## 5. Comprobar que el POS puede operar

1. Guarda la clave y la comisión en administración.
2. Inicia sesión en el POS que utilizará la tienda.
3. Abre Recargas Telorecargo desde el menú POS.
4. Comprueba que se consulte el saldo sin errores de acceso.
5. Verifica que aparezcan las compañías y que la comisión corresponda a la guardada.
6. Selecciona un producto y revisa el total antes de habilitar la operación habitual de caja.

Consultar catálogo o cotizar no equivale a comprar. Para esta comprobación no es necesario confirmar una recarga. Si falla el acceso, revisa la clave y los mensajes del servicio antes de realizar ventas.

> CAPTURA A05 — Verificación en POS. Muestra el saldo consultado, la comisión y las compañías disponibles.

## 6. Consultar el historial de la tienda

1. Regresa al panel Telorecargo y abre Operaciones y reporte.
2. Completa Desde y Hasta con el periodo que deseas revisar.
3. En Estado selecciona Todos o un estado específico.
4. Para precisar el alcance captura ID del POS, ID de sucursal o ID del trabajador.
5. Deja vacíos los filtros de identificador que no necesites.
6. Pulsa Aplicar filtros y espera los resultados.
7. Usa Anterior y Siguiente cuando haya varias páginas.
8. Pulsa Actualizar historial para consultar nuevamente los criterios aplicados.

Los identificadores son numéricos; no escribas el nombre de la caja o del trabajador en esos campos. El periodo debe ser válido, con Hasta igual o posterior a Desde y un rango máximo de 366 días.

> CAPTURA A06 — Filtros administrativos. Incluye fechas, Estado, los tres campos de ID, Aplicar filtros y los resultados.

## 7. Revisar el detalle de una operación

1. Localiza el registro por concepto, teléfono o referencia, fecha e importe.
2. Pulsa Detalle o Ver detalle / actualizar según la pantalla.
3. Revisa el concepto completo y el teléfono o referencia.
4. Comprueba POS, vendedor, importe recargado o abonado, comisión y total.
5. Identifica la venta, la transacción externa y el folio del proveedor cuando estén disponibles.
6. Revisa los pagos y cualquier resolución de cobro registrada.
7. Pulsa Cerrar para regresar al historial.

En el panel de tienda el detalle presenta la información recibida en el listado; abrirlo no realiza por sí mismo una consulta de recuperación de la venta. Para volver a consultar el listado utiliza Actualizar historial. La recuperación desde Consultar estado / recuperar venta y las acciones PDF, impresión y WhatsApp corresponden al POS.

> CAPTURA A07 — Detalle administrativo. Muestra el estado, los identificadores disponibles, importes, pagos y Cerrar.

## 8. Interpretar los estados antes de intervenir

1. Identifica si el registro es una recarga o una solicitud de saldo.
2. Si la recarga está Confirmada, comprueba que tenga una venta asociada.
3. Si muestra Venta local pendiente, pide verificar o recuperar la operación desde el POS antes de generar otra compra.
4. Ante Procesando, En revisión, Reintentable o Resultado por verificar conserva la operación y revisa el caso antes de reenviar.
5. Si aparece Rechazada, verifica si el dinero fue cobrado y si requiere una resolución.
6. Para solicitudes de saldo distingue Pendiente de aprobación de Saldo aprobado.

Una recarga confirmada con venta asociada puede entregar ticket desde el POS. Un registro pendiente o un error de impresión no justifica comprar de nuevo para el mismo cobro.

> CAPTURA A08 — Estados. Muestra ejemplos disponibles de registros confirmados, pendientes o rechazados, sin cambiar operaciones para fabricar la captura.

## 9. Consultar el reporte de recargas confirmadas

1. En Operaciones y reporte aplica el periodo y los filtros de POS, sucursal o trabajador.
2. Desplázate a Reporte de recargas confirmadas.
3. Revisa Recargas, Importe recargado, Comisiones y Total cobrado.
4. Comprueba el aviso de operaciones pendientes y Cobros por conciliar.
5. Pulsa Actualizar reporte para volver a consultar sus cifras.

El reporte comparte las fechas y los filtros de POS, sucursal y trabajador aplicados al historial. Cambiar Estado en el historial no modifica los totales del reporte, que corresponden a recargas confirmadas.

Ejemplo: si una operación confirmada registra $100.00 recargados y $3.00 de comisión, el total cobrado es $103.00. No agregues la comisión otra vez al total. Las comisiones no representan utilidad neta y las solicitudes de saldo no son ventas.

> CAPTURA A09 — Totales del reporte. Incluye el periodo aplicado, las cuatro cifras y el aviso de pendientes o cobros por conciliar.

## 10. Revisar el reporte por POS vendedor y medio de pago

1. Mantén aplicados los filtros del periodo que deseas supervisar.
2. En Por POS y vendedor revisa los grupos que devuelve el servicio.
3. Compara cantidad de recargas, importe recargado, comisión y cobrado de cada grupo.
4. En Por medio de pago revisa Efectivo, Débito, Crédito o Transferencia según los resultados.
5. Si detectas una diferencia, vuelve al historial y abre las operaciones del mismo periodo y alcance.

Estas cifras permiten revisar actividad y cobros. No equivalen por sí solas a efectivo físico en caja ni sustituyen la comprobación de la terminal o la transferencia correspondiente.

> CAPTURA A10 — Agrupaciones. Muestra Por POS y vendedor y Por medio de pago con datos del mismo periodo.

## 11. Conciliar con una transacción externa conocida

Esta acción aparece en el detalle administrativo de una recarga que todavía no está completada y no está rechazada. Permite verificar una transacción ya conocida; no realiza otra compra de recarga.

1. Verifica primero el caso en Telorecargo o Taecel y consigue el identificador real de la transacción.
2. En el historial de tienda localiza la misma recarga por teléfono, fecha e importe.
3. Abre Detalle y comprueba POS, referencia e identificadores disponibles.
4. Pulsa Conciliar con transacción conocida si aparece la acción.
5. Captura ID real de la transacción externa.
6. Revisa que el identificador pertenezca a esa misma operación.
7. Pulsa Confirmar conciliación y espera la respuesta.
8. Revisa el detalle o actualiza el historial para comprobar el resultado.

No inventes el identificador ni utilices el de otra recarga. Si el servicio rechaza la conciliación, conserva el mensaje y verifica el caso antes de volver a intentarlo. La respuesta determina el estado resultante; no supongas que toda conciliación termina en una venta confirmada.

> CAPTURA A11 — Conciliación. Incluye la operación seleccionada, el aviso, ID real de la transacción externa y Confirmar conciliación.

## 12. Registrar la resolución de un cobro rechazado

La acción se muestra para una recarga Rechazada, sin venta asociada y sin una resolución de cobro registrada. Antes de usarla debes haber devuelto realmente el dinero o comprobado que no se cobró.

1. Localiza la recarga rechazada y abre Detalle.
2. Comprueba teléfono, importe, fecha y POS con el responsable de caja.
3. Pulsa Registrar resolución del cobro.
4. En Resolución realizada elige Dinero devuelto o No se cobró según lo que realmente ocurrió.
5. Completa Nota con la explicación de la resolución, hasta 1,000 caracteres.
6. Revisa los datos y pulsa Confirmar constancia del cobro.
7. Espera la respuesta y comprueba Cobro resuelto y su fecha cuando se muestren.

Esta acción deja constancia; no ejecuta un reembolso bancario, no devuelve efectivo y no revierte una recarga. Si no has verificado el cobro o la devolución, resuelve primero esa comprobación con la tienda.

> CAPTURA A12 — Resolución del cobro. Muestra el estado rechazado, Resolución realizada, Nota y la confirmación de la constancia.

## 13. Supervisar saldo y solicitudes de abono

1. Pide al responsable del POS consultar Saldo compartido de la tienda y Actualizar saldo.
2. Para un depósito pendiente revisa junto con caja la referencia, el monto y el comprobante enviado.
3. Desde el POS abre Solicitudes de saldo y localiza la solicitud original.
4. Consulta su detalle y comprueba si está Pendiente de aprobación, Saldo aprobado o Rechazada.
5. Si el proveedor aprobó el abono, vuelve a actualizar el saldo.

El panel administrativo revisado no ofrece un botón para aprobar manualmente estos depósitos. La aprobación depende del proveedor. Las solicitudes de saldo se envían desde el POS y no crean ventas ni salidas de caja. No dupliques una solicitud para el mismo depósito sin resolver primero la original.

> CAPTURA A13 — Seguimiento de saldo desde el POS. Incluye referencia, monto y estado de la solicitud; esta imagen corresponde a la comprobación con caja.

## 14. Desconectar la integración

1. En Telorecargo abre Configuración.
2. Comprueba que la integración que vas a desconectar corresponde a la tienda.
3. Pulsa Desconectar.
4. Lee la confirmación: elimina la configuración local y, al volver a conectar, la comisión comienza en $0.00.
5. Si deseas continuar pulsa Desconectar integración; para conservarla pulsa Cancelar.
6. Comprueba el mensaje y el estado Sin configurar.

La desconexión local no revoca la clave en el proveedor. Para volver a operar debes configurar de nuevo la integración y revisar la comisión antes de vender desde los POS.

> CAPTURA A14 — Desconexión. Muestra el aviso y las acciones Cancelar y Desconectar integración.

## 15. Uso administrativo desde celular

1. Abre Telorecargo y selecciona la pestaña correspondiente.
2. Desplázate para revisar conexión, comisión o filtros.
3. En Operaciones y reporte revisa los registros como tarjetas y abre Ver detalle / actualizar.
4. Dentro del detalle desplázate hasta las acciones disponibles para ese estado.
5. Comprueba todos los datos antes de confirmar cambios o resoluciones.
6. Usa Cerrar para regresar al listado.

No confundas el título del acceso Ver detalle / actualizar con una consulta automática al proveedor: en administración el detalle muestra los datos del listado. Actualiza el historial para consultar de nuevo la información.

> CAPTURA A15 — Vista móvil administrativa. Incluye una captura de Configuración y otra de una operación en tarjetas.

## 16. Mensajes y dudas frecuentes

- El campo de clave quedó vacío: es el comportamiento previsto después de enviarla; la credencial guardada no se muestra.
- Clave configurada pero el POS falla: revisa la respuesta del POS y la validez de la clave en el proveedor.
- No puedo cambiar la comisión: comprueba que la integración esté configurada y el importe sea válido.
- No hay operaciones: revisa fechas, Estado y los identificadores aplicados; amplía el alcance si corresponde.
- El reporte no coincide con el listado: comprueba que el reporte cuenta recargas confirmadas y que Estado solo filtra el historial.
- Falta la venta asociada: solicita consultar o recuperar la operación desde el POS; no generes otra recarga para obtener el ticket.
- No aparece Conciliar con transacción conocida: revisa tipo y estado; no todas las operaciones permiten esa acción.
- No aparece Registrar resolución del cobro: comprueba que la recarga esté rechazada, sin venta y sin una resolución previa.
- Necesito aprobar un depósito: la aprobación depende del proveedor; consulta la solicitud original desde el POS.
- La sesión venció: inicia sesión de tienda nuevamente y vuelve a consultar el caso antes de intervenir.

## 17. Ejercicio de revisión administrativa

Sin cambiar datos de producción, identifica el estado de conexión y la comisión guardada. Abre Operaciones y reporte, aplica un periodo conocido y localiza una recarga confirmada. Comprueba teléfono, importes, POS, vendedor y venta asociada. Compara sus cifras con los totales del mismo periodo.

Para conocer la conciliación y la resolución de cobros, revisa los pasos y los campos con casos autorizados por la tienda. No confirmes cambios de clave, desconexiones, conciliaciones o constancias como si fueran una simulación.

## 18. Capturas y alcance de la guía

Sustituye cada recuadro CAPTURA por la imagen indicada. Usa la misma tienda y periodo de ejemplo, conserva visibles los nombres de botones y estados y oculta claves y datos sensibles antes de distribuir el documento.

Este manual cubre las acciones administrativas disponibles. El manual del punto de venta explica la compra de recargas, el cobro, la entrega de tickets, la recuperación de pedidos y el envío de solicitudes de saldo.
