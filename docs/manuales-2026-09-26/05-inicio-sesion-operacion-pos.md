# Manual de usuario: Inicio de sesión y operación del Punto de Venta

Mi Tienda en Línea MX · Edición del 26 de septiembre de 2026

Guía para el operador de caja. Explica las acciones del panel de POS, sus campos, el orden de captura y cómo comprobar el resultado.

## 1. Antes de comenzar

Necesitas el Código POS y el PIN proporcionados por el administrador. Los productos, precios y existencias deben estar registrados previamente. La caja debe tener asignados los almacenes que utilizará y, si corresponde, permiso para mostrar productos sin almacén.

Ten identificado el equipo con el que imprimirás. El formato del ticket se personaliza desde administración; la aplicación o conexión de impresión se selecciona dentro del POS.

En este manual, pulsar significa hacer clic en computadora o tocar en pantalla. Escribir un dato no lo guarda por sí solo: debes utilizar el botón de confirmación indicado y esperar el resultado.

## 2. Iniciar sesión con código y PIN

1. Abre https://mitiendaenlineamx.com.mx/prueba/pos.
2. Espera la ventana Acceso a Punto de Venta.
3. En Código POS escribe el código que recibiste. No escribas el nombre descriptivo de la caja.
4. En Código de acceso (PIN) escribe los seis dígitos de la contraseña vigente.
5. Pulsa Ingresar una vez y espera.
6. Comprueba que el encabezado muestre Punto de Venta: y el nombre de tu caja.
7. Si aparece otra caja, cierra esa sesión y vuelve a entrar con tus accesos.

Si aparece Código o PIN incorrecto, revisa los caracteres, espacios y el último PIN guardado. Si el administrador cambió la contraseña, pide la vigente. Si la sesión ya estaba activa, el panel puede abrirse sin solicitar los campos.

Desde administración también se puede abrir una caja con Iniciar sesión en su tarjeta. Esa ruta se explica en el manual de Administración de Puntos de Venta.

> CAPTURA O01 — Inicio de sesión. Incluye Código POS, PIN e Ingresar, usando datos de prueba.

## 3. Reconocer el panel principal

El panel presenta estas opciones:

- Venta: formar un carrito y registrar el cobro, una venta pendiente o una venta a crédito.
- Historial: consultar operaciones, detalles, tickets y acciones disponibles sobre ventas.
- Ventas Pendientes: consultar saldos de ventas abiertas y registrar abonos.
- Módulo de crédito: consultar cuentas de fiado, movimientos, abonos y liquidaciones.
- Clientes: crear, consultar, editar y eliminar clientes cuando la cuenta lo permita.
- Facturas: consultar ventas y utilizar las acciones de facturación habilitadas.
- Notas Internas: registrar tareas y observaciones.
- Configuración punto de venta: elegir conectividad y aplicación de impresión.
- Ventas de servicios: consultar tours, salidas, reservaciones, pasajeros y pagos.
- Reportes de servicios: consultar el manifiesto y descargarlo en Excel.
- Próximamente: tarjeta deshabilitada que no abre una función operativa.

Para regresar utiliza Regresar al Panel, Volver al POS o el botón equivalente de cada vista. Antes de abandonar Venta, termina o registra la operación que tengas en curso: el carrito de esa pantalla no debe considerarse un borrador guardado para recuperarlo después de salir.

> CAPTURA O02 — Panel completo. Incluye todas las tarjetas y Cerrar sesión.

## 4. Abrir Venta y localizar productos

1. En el panel pulsa Venta.
2. En Buscar producto (nombre o SKU) escribe una parte del nombre o código.
3. Espera a que se actualice la lista.
4. Si necesitas limitar la búsqueda, selecciona una categoría en la barra de categorías.
5. Recorre las páginas de productos cuando haya más resultados.
6. Para ampliar la consulta, borra el texto y retira el filtro de categoría o selecciona la opción general disponible.
7. Comprueba nombre, precio, existencia y variantes antes de agregar.

Si usas un lector de códigos, comprueba que el artículo correcto se agregue al carrito. Si no lo encuentra, busca el SKU manualmente y verifica categoría y página; no supongas que el producto no existe por un único intento de lectura.

> CAPTURA O03 — Catálogo de Venta. Incluye buscador, categorías, tarjetas y paginación.

## 5. Agregar un producto simple

1. Busca el producto.
2. Pulsa su acción para agregarlo al carrito.
3. Si no requiere elegir almacén, comprueba que aparezca una línea en el carrito.
4. Si se abre el selector Almacén, selecciona la ubicación de la mercancía.
5. Revisa la existencia disponible y confirma la acción de agregar.
6. Comprueba en el carrito el nombre, almacén cuando aplique, cantidad y precio unitario.

Un artículo puede estar disponible en varios almacenes. La selección determina de qué ubicación se solicita descontar la mercancía al registrar la venta. Si aparece Stock insuficiente, revisa existencia y cantidad antes de continuar.

> CAPTURA O04 — Producto por almacén. Muestra selección de almacén y confirmación para agregar.

## 6. Agregar una variante

1. Localiza el producto que muestra Variantes.
2. Abre su vista de detalle o selección de variantes.
3. Identifica la versión correcta por nombre, atributos e imagen, como talla o color.
4. Selecciona la variante.
5. Elige su almacén si aparece el selector.
6. Revisa precio y existencia de esa combinación.
7. Pulsa la acción para agregarla y comprueba la línea en el carrito.
8. Repite si necesitas otra variante del mismo producto.

No intercambies las existencias globales del producto con las de una variante o almacén. Verifica cada línea antes de cobrar.

> CAPTURA O05 — Variantes. Incluye selección de versión, atributos, almacén, existencia y botón de agregar.

## 7. Cambiar cantidades y retirar artículos

1. Abre el carrito. En celular utiliza su botón para mostrarlo.
2. Localiza la línea exacta del artículo, incluyendo variante y almacén.
3. Para aumentar unidades enteras utiliza +.
4. Para disminuir utiliza −. Cuando la cantidad es una unidad o menor, esta acción retira la línea.
5. Para una cantidad decimal escribe directamente el valor positivo con punto, por ejemplo 1.5, y sal del campo.
6. Comprueba que el subtotal de la línea y el total del carrito se actualicen.
7. Para retirar toda una línea pulsa su papelera.

Los botones + y − trabajan sobre cantidades enteras; para conservar precisión en cantidades fraccionarias usa el campo. Una cantidad vacía o cero puede hacer que la línea se retire al salir del campo. Quitar artículos del carrito aún sin cobrar no elimina sus registros del catálogo.

> CAPTURA O06 — Carrito. Incluye cantidad editable, +, −, papelera, subtotales y total.

## 8. Aplicar o modificar un descuento de venta

1. En la línea del carrito pulsa Editar descuento, identificado con el símbolo de porcentaje.
2. En Cambiar descuento revisa Precio original.
3. Escribe Descuento (%) o modifica Precio final.
4. Comprueba el valor calculado en el otro campo.
5. Pulsa Aplicar cambios.
6. Verifica Descuento aplicado correctamente y el nuevo precio del carrito.

El precio final debe ser mayor que cero y no superar el precio original. Un descuento que deje el artículo en cero no pasa esta validación. Para volver al precio original, introduce descuento 0 o el precio original y aplica el cambio. Cerrar abandona la ventana sin aplicar una modificación nueva.

Este ajuste corresponde a la línea de la venta en curso. El descuento del catálogo se administra en Productos.

> CAPTURA O07 — Descuento. Incluye porcentaje, precio final, precio original y Aplicar cambios.

## 9. Asignar un trabajador a un artículo

1. Si aparece el selector de trabajador en la línea del carrito, ábrelo.
2. Elige al trabajador que corresponde a esa partida.
3. Comprueba el indicador de selección.
4. Repite por cada artículo que lo necesite.
5. Para retirarlo, usa la opción sin trabajador del selector.

El control aparece cuando el POS dispone de trabajadores cargados. Seleccionar un trabajador en una partida no inicia una sesión diferente ni cambia el código de caja.

> CAPTURA O08 — Trabajador por partida. Muestra el selector y una asignación de ejemplo.

## 10. Seleccionar o crear rápidamente un cliente

Para seleccionar uno existente:

1. En el carrito abre Seleccionar cliente.
2. Busca por alias o teléfono.
3. Selecciona el registro correcto y revisa su identificación.
4. Si elegiste otro por error, utiliza Quitar cliente y vuelve a seleccionar.

Para crearlo sin salir del carrito:

1. Pulsa la acción de agregar cliente junto al selector.
2. Escribe Nombre / alias y Teléfono.
3. Pulsa el botón de guardar de la ventana.
4. Espera el resultado y comprueba que el cliente quede seleccionado.

El alta rápida requiere nombre y teléfono. Los demás datos se completan desde Clientes. Si se muestra una consulta de retención ISR, espera el cálculo del sistema y revisa el importe final a pagar antes de capturar el cobro. El operador consulta ese resultado; el manual no determina cuándo corresponde una retención.

> CAPTURA O09 — Cliente en el carrito. Incluye selector, alta rápida y cliente seleccionado.

## 11. Cobrar en efectivo

1. Revisa productos, cantidades, descuentos y cliente.
2. Comprueba el importe del botón Cobrar.
3. En Método(s) de pago deja seleccionado Efectivo y retira otros métodos si no se utilizarán.
4. En Efectivo recibido escribe el dinero entregado por el cliente.
5. Comprueba que alcance el total y revisa el cambio calculado.
6. Pulsa Cobrar una vez.
7. Espera la confirmación de registro y la apertura del ticket.
8. Entrega el cambio correspondiente y el ticket por el medio elegido.

Ejemplo: para un total de 116.00 y efectivo recibido de 200.00, el cambio es 84.00. El sistema rechaza efectivo que no cubra el total.

> CAPTURA O10 — Cobro en efectivo. Muestra total, recibido, cambio y Cobrar.

## 12. Cobrar con tarjeta o transferencia

1. Revisa el total y registra el pago por el medio utilizado en tu operación.
2. Selecciona Tarjeta Débito, Tarjeta Crédito o Transferencia en el carrito.
3. Completa Referencia con la referencia o autorización correspondiente.
4. Completa Últimos 4 cuando aparezca. En esta pantalla también se solicita para Transferencia; captura los dígitos de referencia definidos para ese registro.
5. Comprueba que no quede seleccionado otro método por error.
6. Pulsa Cobrar y espera la confirmación.
7. Consulta o entrega el ticket.

Seleccionar un método y capturar una referencia registra cómo se pagó la venta. Esta pantalla no muestra un proceso de autorización de tarjeta bancaria; comprueba que el pago haya sido recibido antes de registrarlo como cobrado.

> CAPTURA O11 — Pago no efectivo. Incluye método, referencia, últimos cuatro dígitos y Cobrar.

## 13. Registrar un pago combinado

1. En Método(s) de pago selecciona dos o hasta tres métodos.
2. Escribe el Monto correspondiente a cada método.
3. Completa referencia y últimos cuatro dígitos para los métodos que los soliciten.
4. Revisa Suma de pagos.
5. Ajusta los importes para que cubran el total real de la operación.
6. Si aparece Cambio, comprueba que corresponda al dinero que vas a devolver.
7. Pulsa Cobrar una sola vez y verifica el ticket.

Cada monto debe ser mayor que cero. Si los importes no cubren el total, el sistema indica cuánto falta. Ejemplo: una venta de 300.00 puede registrarse con 100.00 en efectivo y 200.00 con tarjeta.

> CAPTURA O12 — Pago combinado. Incluye dos métodos, montos, referencias y suma de pagos.

## 14. Guardar una venta pendiente sin anticipo

1. Forma el carrito y, de preferencia, selecciona un cliente para identificarlo después.
2. Activa la opción de venta pendiente del carrito.
3. En la ventana que aparece elige la opción sin pago o sin anticipo.
4. Revisa el resumen Venta pendiente sin anticipo y su total pendiente.
5. Pulsa Guardar pendiente.
6. Espera la confirmación y revisa el ticket.
7. Entra a Ventas Pendientes y comprueba que la operación figure como abierta.

Elegir sin pago en la ventana no guarda la venta completa: todavía falta Guardar pendiente. Los campos de fecha compromiso y nota se muestran en el formulario de anticipo de esta versión; no supongas que estarán disponibles en todas las rutas sin anticipo.

> CAPTURA O13 — Pendiente sin anticipo. Muestra la elección y Guardar pendiente en el carrito.

## 15. Guardar una venta pendiente con anticipo

1. Forma el carrito y activa venta pendiente.
2. Elige la opción para registrar anticipo.
3. En Monto del anticipo escribe un valor mayor que cero y menor al total.
4. Selecciona Método de pago.
5. Completa Referencia y Últimos 4 dígitos cuando se soliciten.
6. Captura Fecha compromiso de pago restante y Nota del pendiente si necesitas esa información.
7. Guarda el anticipo en la ventana.
8. Revisa en el carrito el anticipo, saldo restante, fecha y nota.
9. Si hay un error, pulsa Editar anticipo y corrígelo.
10. Pulsa Guardar pendiente para registrar la venta completa.
11. Comprueba su estado en Ventas Pendientes.

Ejemplo: total 500.00, anticipo 200.00, pendiente 300.00. Si el cliente cubre todo, utiliza un cobro completo; el formulario de anticipo rechaza un valor igual o mayor al total.

> CAPTURA O14 — Anticipo. Incluye monto, método, referencia, fecha, nota y resumen del restante.

## 16. Vender a crédito o fiado

1. Selecciona un cliente en el carrito.
2. Espera a que se consulte su cuenta de fiado.
3. Revisa si tiene crédito activo y el importe disponible.
4. Activa Venta a Crédito.
5. Comprueba el monto y la fecha de pago cuando exista.
6. Pulsa Guardar crédito.
7. Espera la confirmación y revisa la operación en Módulo de crédito.

Se requiere cliente, cuenta de fiado configurada y activa, y crédito disponible suficiente cuando tiene límite. Si está bloqueado, abre Clientes para revisar la cuenta o consulta al administrador. Activar crédito desactiva la configuración de venta pendiente ordinaria y sus anticipos en el carrito.

> CAPTURA O15 — Venta a Crédito. Incluye cliente, disponibilidad, fecha y Guardar crédito.

## 17. Consultar, imprimir o enviar el ticket al terminar

1. Espera que termine el registro de la venta y se abra el ticket.
2. Revisa folio, productos, cantidades, importes y pago.
3. Para imprimir por la conexión configurada, pulsa la acción identificada con la aplicación o impresora seleccionada.
4. Espera el aviso de envío y comprueba el papel en la impresora.
5. Para WhatsApp, escribe Número WhatsApp con 10 dígitos y pulsa el botón de envío.
6. Comprueba la confirmación y cierra el ticket para continuar.

Un aviso de envío a la aplicación no sustituye comprobar la impresión física. Si falla la vista previa o la impresión después de registrar la venta, busca la operación en Historial y vuelve a abrir su ticket; no vuelvas a cobrarla solo para obtener otro comprobante.

Desde los visores del historial o de pendientes también pueden aparecer Imprimir PDF, Descargar ticket, teléfono del cliente u Otro número. Usa esas acciones según el visor abierto. Cerrar el visor no cancela la venta registrada.

> CAPTURA O16 — Ticket después del cobro. Incluye vista previa, conexión, teléfono y envío por WhatsApp.

## 18. Consultar el historial de operaciones

1. Regresa al panel y abre Historial.
2. En Consulta elige Por día o Rango personalizado.
3. Selecciona Fecha inicio y, para el rango, Fecha fin.
4. Selecciona Método de pago o Todos los métodos.
5. Pulsa Aplicar.
6. Revisa el resumen, los movimientos agrupados y los importes.
7. Usa los controles de navegación disponibles para recorrer resultados.
8. Para comenzar otra consulta pulsa Limpiar y ajusta nuevamente los filtros.

El historial puede mostrar ventas y distintos movimientos de pago. No cuentes cada fila como una venta nueva. Las acciones disponibles varían según el tipo de movimiento y si tiene una venta relacionada.

> CAPTURA O17 — Historial. Incluye filtros, resumen, movimientos y acciones de una fila.

## 19. Abrir detalles o recuperar un ticket

Para consultar el detalle:

1. Localiza la venta en Historial.
2. Pulsa Detalles, identificado con un ojo.
3. Revisa estado, productos, cantidades, pagos, anticipos, referencias y observaciones que aparezcan.
4. Comprueba que corresponda a la operación buscada y pulsa Cerrar.

Para recuperar el ticket:

1. Pulsa Ticket en la fila de la venta.
2. Espera la vista previa.
3. Pulsa Descargar ticket para guardar el PDF, o utiliza la acción de impresión configurada.
4. Para enviarlo por WhatsApp, completa el número en el visor y confirma el envío.
5. Cierra la ventana al terminar.

> CAPTURA O18 — Detalles de venta. Incluye productos y desglose de pagos.

> CAPTURA O19 — Ticket desde Historial. Incluye descarga, envío y conexión de impresión.

## 20. Asignar o retirar un cliente después de la venta

1. En Historial localiza una fila con venta relacionada.
2. Pulsa Cliente.
3. En el selector elige al cliente correcto.
4. Pulsa la acción de guardar de esa ventana.
5. Espera la confirmación y comprueba el cliente asociado.
6. Si necesitas retirarlo, utiliza Quitar cliente y verifica el resultado.

No uses esta acción para modificar los datos personales del cliente; esos datos se editan desde Clientes. La operación puede ser rechazada por las reglas del servicio según el estado de la venta.

> CAPTURA O20 — Cliente de una venta. Incluye selector, guardar y quitar cliente.

## 21. Cancelar totalmente una venta

1. En Historial identifica la venta correcta.
2. Si la fila ofrece Cancelar venta, pulsa esa acción.
3. En Cancelación total de venta verifica el número de operación.
4. Escribe Motivo de cancelación. Es obligatorio y permite hasta 500 caracteres.
5. Lee el aviso sobre los registros y reportes relacionados.
6. Pulsa la acción de confirmación de cancelación.
7. Espera Venta cancelada correctamente y consulta el estado actualizado.

Cerrar abandona la ventana sin confirmar una cancelación. La acción solo aparece para ciertos tipos de movimiento. El efecto sobre existencias y pagos debe comprobarse en el resultado del servicio; el formulario no confirma una devolución bancaria automática.

> CAPTURA O21 — Cancelación total. Incluye número de venta, motivo y confirmación.

## 22. Registrar un reembolso total

1. Localiza la venta en Historial.
2. Si está disponible, pulsa Devolver.
3. Comprueba que se abra Reembolso total de venta.
4. Revisa la venta y la cantidad de productos incluidos.
5. Escribe Motivo del reembolso, hasta 500 caracteres.
6. Confirma el reembolso con el botón de la ventana.
7. Espera Reembolso total registrado correctamente y revisa la operación actualizada.

Esta acción incluye todos los productos que siguen en estado vendido dentro de esa venta. No ofrece selección de cantidades parciales. Registrar el reembolso en el sistema no demuestra por sí mismo que el dinero se haya devuelto por una terminal bancaria; comprueba el resultado operativo correspondiente.

> CAPTURA O22 — Reembolso total. Incluye motivo, productos incluidos y confirmación.

## 23. Consultar Ventas Pendientes y registrar un abono

1. Abre Ventas Pendientes desde el panel.
2. Revisa Total vendido, Pagado / anticipos y Saldo pendiente.
3. Identifica la tarjeta correcta por sus datos y estado Con anticipo o Sin pago.
4. Pulsa Detalles para revisar productos, pagos y compromiso registrado, o Ticket para consultar su comprobante.
5. Pulsa la acción para abonar.
6. En Monto a abonar escribe un importe mayor que cero y no superior al saldo pendiente.
7. Selecciona Método de pago y completa referencia y cuatro dígitos cuando se soliciten.
8. Confirma el abono y espera el aviso de éxito.
9. Si queda saldo, comprueba el nuevo pendiente.
10. Si se liquidó, la venta deja la lista de abiertas y el sistema pregunta si deseas imprimir o ver el ticket actualizado.

Usa Actualizar para consultar nuevamente los datos. Ejemplo: pendiente 300.00, abono 100.00, nuevo saldo 200.00. Si el cliente paga 300.00, revisa el resultado de liquidación antes de buscarla nuevamente como pendiente.

> CAPTURA O23 — Ventas Pendientes. Incluye resumen, tarjeta y acciones Detalles, Ticket y abono.

> CAPTURA O24 — Abono a pendiente. Incluye saldo anterior, monto, método y confirmación.

## 24. Consultar las cuentas de crédito

1. Abre Módulo de crédito.
2. Busca por cliente o teléfono.
3. Revisa Créditos activos, Con deuda y Saldo total.
4. En la cuenta revisa Activo/Inactivo, Vencido cuando aparezca, Saldo, Límite y Disponible.
5. Usa la paginación para recorrer más cuentas.
6. Pulsa Actualizar para volver a consultar los datos.

Un saldo corresponde a la cuenta del cliente y puede incluir varias ventas. Para revisar el origen de los cargos abre Ver historial.

> CAPTURA O25 — Crédito. Incluye búsqueda, resumen y cuenta con saldo, límite y acciones.

## 25. Registrar un abono general al crédito

1. En la cuenta del cliente pulsa Registrar abono.
2. Comprueba el saldo actual y el cliente.
3. Escribe Monto del abono, o activa la opción para pagar toda la deuda si ese es el importe recibido.
4. Selecciona Método de pago.
5. Para tarjeta completa los últimos cuatro dígitos; para transferencia completa los cuatro dígitos de referencia y la referencia cuando corresponda.
6. Agrega Notas si necesitas identificar el pago.
7. Confirma el abono y espera Abono registrado correctamente.
8. Revisa el nuevo saldo en la cuenta y su historial.

El abono debe ser mayor que cero y no superar la deuda. El abono general se envía a la cuenta; para liquidar una venta específica utiliza Liquidar ticket desde su historial.

> CAPTURA O26 — Abono a crédito. Incluye opción de pago completo, monto, método y notas.

## 26. Historial de crédito, estado de cuenta y liquidación de ticket

Para consultar movimientos y reportes:

1. En la cuenta pulsa Ver historial.
2. Revisa las columnas Fecha, Concepto, Venta / Productos, Cargo, Abono, Reversión y Saldo al momento.
3. Abre Ver ticket en una venta para consultar su comprobante.
4. Utiliza el botón PDF del encabezado para abrir el estado de cuenta.
5. En el visor puedes descargarlo o enviarlo por WhatsApp usando el número del cliente o uno alternativo, según las opciones presentadas.
6. Utiliza Excel para descargar el reporte tabular.

Para liquidar un ticket específico:

1. Identifica la venta con saldo dentro del historial.
2. Pulsa Liquidar ticket.
3. Comprueba el importe pendiente; esta acción liquida ese saldo completo.
4. Selecciona el método y completa referencia y cuatro dígitos si corresponde.
5. Añade notas si las necesitas y confirma.
6. Espera Ticket liquidado correctamente y revisa el saldo del ticket y de la cuenta.

En la versión revisada, el envío directo del estado de cuenta a la impresora desde el encabezado del historial tiene una función pendiente de implementación. Si aparece un aviso técnico al usarla, utiliza el PDF; no lo interpretes como un registro nuevo de pago.

> CAPTURA O27 — Historial de crédito. Incluye cargos, abonos, Ver ticket, Liquidar ticket, PDF y Excel.

> CAPTURA O28 — Liquidación de ticket. Incluye número de venta, saldo completo, método y confirmación.

## 27. Crear, buscar y editar clientes

1. Abre Clientes.
2. Usa Buscar cliente para buscar por nombre, RFC, email o teléfono. Recargar actualiza la lista y la X limpia la búsqueda.
3. Pulsa la acción de nuevo cliente.
4. Escribe Nombre, obligatorio.
5. Completa los datos disponibles: RFC, Razón social, C.P. fiscal, Régimen, Teléfono y Email (fiscal).
6. Si capturas teléfono, usa 10 dígitos. Si capturas código postal fiscal, usa 5 dígitos.
7. Guarda y comprueba que aparezca en la lista.

Para editar, busca al cliente, pulsa Editar, cambia sus campos y guarda. Revisa los mensajes antes de cerrar. La aplicación normaliza el RFC a mayúsculas y sin espacios al enviarlo.

La disponibilidad de crear, editar o eliminar puede depender del plan. Revisa el aviso de la pantalla y el contador de clientes si se muestra un límite.

> CAPTURA O29 — Clientes. Incluye buscador, contador, acciones y formulario de alta o edición.

## 28. Eliminar un cliente y consultar sus compras

Para eliminar:

1. Localiza el cliente correcto.
2. Pulsa su papelera o acción Eliminar.
3. Revisa la confirmación y cancela si no corresponde.
4. Confirma la eliminación cuando proceda.
5. Espera el resultado y comprueba la lista. Si se rechaza, consulta el motivo del aviso.

Para consultar compras:

1. Abre la acción de historial del cliente.
2. Selecciona Mes y Estado cuando quieras filtrar.
3. Aplica los filtros y revisa ventas, fechas, estados de pago y totales.
4. Expande una venta para ver sus productos, cantidades, precios e importes.
5. Utiliza PDF o Excel para obtener el reporte disponible.
6. Limpia los filtros o cierra la ventana al terminar.

El historial del cliente muestra sus compras; el historial de crédito muestra cargos y abonos de su cuenta de fiado. Utiliza el que corresponda a la consulta.

> CAPTURA O30 — Historial de cliente. Incluye mes, estado, detalle de productos y exportaciones.

## 29. Habilitar o ajustar el fiado de un cliente

1. En Clientes abre la acción de Fiado del registro correcto.
2. Revisa Saldo actual y Disponible.
3. En Límite de fiado escribe el importe autorizado. El formulario permite dejarlo vacío para una cuenta sin límite; verifica la indicación que aparece.
4. En Fecha final de pago elige una fecha si necesitas vencimiento; vacío significa sin fecha límite en esta pantalla.
5. Activa o desactiva Permitir fiado a este cliente.
6. Guarda la configuración y espera la confirmación.
7. Regresa a la venta y selecciona de nuevo al cliente para consultar su estado actualizado.

El límite no puede ser negativo. Si el nuevo límite queda por debajo de la deuda actual, la ventana muestra un aviso. Desactivar fiado no representa por sí solo el pago de la deuda existente.

> CAPTURA O31 — Configuración de fiado. Incluye límite, fecha, estado y saldo actual.

## 30. Consultar Facturas y facturar una venta

1. Abre Facturas desde el panel.
2. Comprueba si la cuenta muestra Taeconta activo o Acceso restringido.
3. Selecciona Mes o escribe Buscar por folio y ejecuta la búsqueda.
4. Recorre los días o utiliza la vista de todos los registros disponible en la tabla.
5. Localiza la venta y revisa su estado de facturación.
6. Si ofrece Facturar, púlsalo.
7. Comprueba folio, fecha, total, método de pago y conceptos de la venta.
8. En Buscar cliente existente selecciona el receptor, o captura un cliente nuevo con Nombre o alias, RFC, Razón social, C.P. fiscal, Régimen fiscal, Teléfono y Email fiscal según los datos correspondientes.
9. Selecciona Uso de CFDI entre las opciones que presenta el formulario.
10. Revisa los datos y pulsa la acción de facturar de la ventana.
11. Espera la respuesta y consulta el estado actualizado de la venta.

Los datos de un cliente existente pueden aparecer bloqueados en este formulario. Si necesitas corregirlos, revísalos en Clientes antes de emitir. La pantalla también puede indicar Mes anterior / bloqueada o No facturable por mes anterior; es una restricción de esta aplicación, no una explicación de plazos legales.

Si se informa un error, consulta el detalle del estado antes de repetir la emisión. El sistema y el servicio de facturación validan los datos enviados.

> CAPTURA O32 — Facturas. Incluye mes, folio, estado y acción Facturar.

> CAPTURA O33 — Formulario de facturación. Incluye venta, receptor, datos fiscales y Uso de CFDI.

## 31. Ver o enviar los documentos de una factura

1. Localiza la venta facturada.
2. En Ver selecciona PDF o XML según el documento que necesites.
3. Consulta el visor y sus opciones de descarga disponibles.
4. Para enviarlo, en WhatsApp selecciona PDF o XML.
5. En la ventana de envío selecciona el destinatario del cliente o captura Número externo según las opciones disponibles.
6. Revisa el teléfono y confirma el envío.
7. Espera el aviso de resultado y cierra la ventana.

PDF y XML pueden estar deshabilitados hasta que los documentos estén disponibles. Una factura en proceso o con error debe revisarse antes de volver a solicitarla.

> CAPTURA O34 — Documentos fiscales. Incluye selectores Ver y WhatsApp, y ventana de destinatario.

## 32. Crear una nota interna

1. Abre Notas Internas.
2. Pulsa la acción de nueva nota.
3. Escribe Título si quieres identificarla rápidamente; es opcional.
4. Completa Descripción, que es obligatoria.
5. Selecciona el estado: Pendiente, En progreso, Completada o Cancelada.
6. Si necesitas una referencia de fecha, completa Recordar en.
7. Marca Marcar como destacada si deseas identificarla con estrella.
8. Guarda y comprueba la nota en la lista.

Recordar en almacena una fecha visible en la nota. La vista revisada no permite asegurar que se envíe una notificación automática fuera de la pantalla.

> CAPTURA O35 — Nueva nota. Incluye descripción, estado, recordatorio y destacada.

## 33. Buscar, editar, destacar y eliminar notas

1. Usa Buscar nota para localizar texto del título o descripción.
2. Filtra con Todas o los estados disponibles.
3. Activa el filtro de destacadas cuando quieras consultar las notas con estrella.
4. Pulsa la estrella de una nota para destacarla o quitar esa condición.
5. Cambia el estado desde su selector cuando avance la tarea.
6. Para modificar texto o fecha, pulsa Editar, corrige y guarda.
7. Para borrarla, pulsa Eliminar, revisa la confirmación y confirma o cancela.
8. Usa Recargar si necesitas consultar nuevamente la lista.

Cambiar el estado a Cancelada conserva la nota como registro. Eliminar solicita borrarla. Si no ves una nota, limpia texto, estado y filtro de destacadas antes de crear otra.

> CAPTURA O36 — Lista de notas. Incluye búsqueda, filtros, estrella, estado, edición y papelera.

## 34. Configurar conectividad y consultar aplicaciones disponibles

1. Abre Configuración punto de venta.
2. Activa Activar módulo de conectividad si utilizarás una aplicación conectada.
3. Selecciona Tipo de aplicación: Windows USB, Windows IP / LAN, Android USB, Android IP / LAN, iPhone IP / LAN, iPhone Bluetooth BLE o WhatsApp.
4. Revisa el ajuste Enviar payload automáticamente después de cada venta.
5. Pulsa el botón de guardar y espera Configuración guardada correctamente.
6. Consulta las aplicaciones disponibles que muestra la misma sección. Abre su información para revisar compatibilidad y utiliza su opción de descarga cuando corresponda.
7. Configura la aplicación y el equipo antes de probar un ticket.
8. Desde el ticket usa el botón de la conexión seleccionada y comprueba el resultado.

Si activas el módulo, debes seleccionar una aplicación. Windows USB/IP necesita la aplicación de escritorio; Android USB/IP necesita la aplicación Android; iPhone IP/BLE depende de la aplicación compatible. Para impresoras de red, el administrador debe revisar la IP y el puerto del ticket.

La opción de envío automático se guarda en la configuración, pero no se confirmó que todas las rutas de ticket ejecuten ese envío sin pulsar un botón. Valida su comportamiento y utiliza el envío manual cuando sea necesario. WhatsApp se envía desde su botón y requiere destinatario.

> CAPTURA O37 — Conectividad y aplicaciones. Incluye tipo de aplicación, guardar e información de una aplicación disponible.

## 35. Consultar servicios y sus salidas

1. En el panel abre Ventas de servicios.
2. Selecciona el tour o servicio de la lista.
3. En Salidas revisa fecha, horario, precio, estado y disponibilidad.
4. Filtra por Fecha y Estado si lo necesitas; Limpiar filtros amplía la consulta.
5. Abre el detalle de la salida para revisar regreso estimado y notas.
6. Utiliza la acción de reservaciones para consultar las ventas de esa salida, o Nueva venta cuando esté disponible.

El alta de venta se ofrece en salidas programadas con cupo. Si no está disponible, revisa estado y lugares; el servicio también puede rechazar una operación por sus reglas de fecha o disponibilidad. La caja consulta tours y salidas; la creación y edición del catálogo de servicios y salidas corresponden a administración.

> CAPTURA O38 — Servicios y salidas. Incluye filtros, cupo y acceso a reservaciones o Nueva venta.

## 36. Registrar una venta de servicio

1. Dentro de una salida disponible pulsa Nueva venta.
2. En Nueva venta de servicio escribe Nombre del comprador y Teléfono de 10 dígitos.
3. Captura Correo del comprador si lo tienes.
4. Selecciona Parada de abordaje.
5. Elige Modalidad de pago: Anticipo o Pago completo.
6. Selecciona Viaje: Ida y regreso, Solo ida o Solo regreso.
7. Revisa Requiere transporte.
8. Escribe Nombre y Apellidos de cada pasajero. Usa Agregar pasajero para otra persona y Quitar para retirar una fila; debe quedar al menos una.
9. Añade Observaciones si corresponde.
10. Si todavía no has recibido dinero, deja desactivado Registrar cobro inicial.
11. Si ya lo recibiste, activa Registrar cobro inicial, escribe Importe recibido, selecciona Método de pago, captura Referencia cuando la tengas y marca Verifiqué que el cobro fue recibido.
12. Pulsa Registrar venta una sola vez.
13. Espera Reservación guardada y localiza el registro en la lista.

El sistema calcula el precio y el anticipo; elegir una modalidad no registra por sí solo dinero recibido. Puedes guardar sin cobro y registrar el pago desde el detalle después. Un cobro inicial requiere importe positivo con máximo dos decimales y la verificación marcada.

Si aparece No se pudo confirmar el resultado, cierra y actualiza las reservaciones antes de intentar otra venta. Esa advertencia indica que se desconoce si la solicitud se completó; repetirla inmediatamente puede duplicar el registro.

> CAPTURA O39 — Nueva venta de servicio. Incluye comprador, parada, pasajeros, transporte y cobro inicial.

## 37. Consultar, editar y cancelar una reservación

1. Abre las reservaciones de la salida.
2. Localiza el registro por los datos mostrados y abre su detalle.
3. Revisa resumen, fecha de salida, pasajeros y pagos.
4. Para modificarla, pulsa Editar reservación.
5. Revisa Cliente de la reservación, Cantidad de pasajeros, Referencia externa, Estado y Notas.
6. Registrado por es informativo y puede aparecer sin asignar; no se captura libremente en ese campo.
7. Guarda con Guardar reservación y comprueba el nuevo resumen.
8. Para cancelarla, utiliza Cancelar reservación desde el detalle, lee la confirmación y acepta solo si corresponde.

La cantidad de pasajeros debe ser un entero entre 1 y el máximo permitido. Cancelar una reservación libera los lugares según las reglas del servicio; no equivale a registrar una devolución de dinero. Revisa los pagos por separado.

Las reservaciones consultadas pueden incluir compras públicas de la sucursal, no únicamente las generadas por tu caja. Comprueba el registro antes de modificarlo.

> CAPTURA O40 — Detalle y edición de reservación. Incluye resumen, cantidad, estado y acciones.

## 38. Agregar o crear pasajeros en una reservación

1. En el detalle de una reservación activa localiza Pasajeros.
2. Comprueba el contador de pasajeros activos y lugares reservados.
3. Pulsa Agregar pasajero si hay espacio disponible.
4. Busca por nombre, apellido, teléfono, correo o código.
5. Pulsa Seleccionar en el registro correcto. Ya asignado indica que ese pasajero no puede repetirse en la misma reservación.
6. Si no existe, pulsa Crear nuevo pasajero.
7. Escribe Nombre, obligatorio, y completa Apellidos, Teléfono, Correo, Fecha de nacimiento, Género, Contacto de emergencia, Teléfono de emergencia y Notas según la información disponible.
8. Pulsa Crear y seleccionar. Si se informa que fue creado pero no aparece seleccionado, búscalo y selecciónalo antes de crear otro.
9. Completa la asignación según el siguiente apartado.

> CAPTURA O41 — Selección y alta de pasajero. Incluye buscador, Crear nuevo pasajero y datos de contacto.

## 39. Asignar, editar o cancelar un pasajero

1. En Asignar pasajero comprueba el nombre.
2. Selecciona Parada de abordaje y revisa horario, tiempo de abordaje y ajuste de precio informativos.
3. Selecciona Tipo de viaje y Requiere transporte.
4. Captura Asiento si lo conoces.
5. Revisa Estado y Notas.
6. Pulsa Guardar asignación.
7. Para modificar estos datos, abre Editar en la tarjeta del pasajero, corrige y guarda.
8. Para retirarlo de la reservación, usa su acción de cancelación y confirma Sí, cancelar pasajero.

La cancelación conserva el registro y su historial. Retirar pasajeros no reduce necesariamente la cantidad de lugares reservados; consulta el aviso del contador y la cantidad de la reservación. El campo Estado de abordaje, cuando aparece, es de solo lectura en esta ventana; no representa un botón para registrar abordaje.

> CAPTURA O42 — Asignación del pasajero. Incluye parada, viaje, transporte, asiento, estado y guardar.

## 40. Registrar un pago de reservación

1. En el detalle de la reservación abre Pagos y revisa total, pagado y saldo.
2. Pulsa Registrar pago si hay saldo pendiente.
3. Elige Tipo de pago: Anticipo, Abono, Liquidación o Pago completo.
4. Selecciona Método de pago entre las opciones presentadas.
5. Escribe Monto positivo, con máximo dos decimales y dentro del límite mostrado.
6. Captura Fecha y hora del pago.
7. Agrega Referencia y Notas si corresponden.
8. Selecciona Estado del registro. Pendiente no representa dinero cobrado; Confirmado declara que recibiste el importe.
9. Pulsa Confirmar cobro si está confirmado o Guardar registro para el estado elegido.
10. Espera el resultado y revisa el saldo actualizado por el sistema.

Si se guardó el pago pero aparece un aviso de que falta actualizar el saldo, pulsa Actualizar saldo. No registres otro pago para resolver un problema de actualización de la consulta.

> CAPTURA O43 — Pago de reservación. Incluye tipo, método, monto, fecha, estado y confirmación.

## 41. Editar o cancelar un pago de servicio y registrar devolución

Para corregir un registro:

1. En Historial de pagos localiza la tarjeta correcta.
2. Utiliza Editar cuando esté disponible.
3. Revisa el máximo permitido para reemplazar el importe y modifica los campos necesarios.
4. Guarda y comprueba el resumen financiero.
5. Para anular el registro, utiliza su acción de cancelación y confirma Sí, cancelar registro; espera el recálculo del saldo.

Para registrar dinero devuelto:

1. Comprueba que exista un importe pagado y pulsa Registrar devolución.
2. Revisa el neto confirmado y el límite permitido.
3. Captura método, monto, fecha, referencia, notas y estado.
4. Si ya entregaste el dinero, utiliza el estado confirmado y pulsa Confirmar devolución.
5. Lee y acepta la confirmación adicional.
6. Comprueba el nuevo monto pagado y el historial.

Cancelar un registro de pago y registrar una devolución son acciones distintas. Solo los registros confirmados afectan el saldo según el aviso del formulario. Elegir Pago en línea como método registra una clasificación; esta ventana no muestra un proceso de cobro PayPal.

> CAPTURA O44 — Correcciones y devolución. Incluye acciones de un pago y formulario de devolución.

## 42. Consultar Reportes de servicios y descargar el manifiesto

1. Regresa al panel y pulsa Reportes de servicios.
2. Selecciona Servicio.
3. Selecciona Salida por fecha, hora e identificador.
4. En Reservas incluidas elige Todas las reservas de la sucursal o Solo este punto de venta.
5. Espera la consulta; usa Actualizar para solicitar datos nuevamente.
6. Revisa el resumen de reservas, vendidos, disponibles, total, recibido y saldo.
7. Consulta las filas del manifiesto: pasajero, folio, contacto, transporte, importes, abordaje, referencia, observaciones y estado, según las columnas mostradas.
8. Pulsa Descargar Excel y espera a que termine la descarga.
9. Abre el archivo y comprueba que corresponda al servicio, salida y alcance seleccionados.

Las filas agrupadas pueden dejar importes vacíos. Usa el resumen del sistema para los totales; no sumes el precio de la reservación una vez por cada pasajero. No hay pasajeros en este manifiesto significa que la selección no devuelve filas.

> CAPTURA O45 — Reportes de servicios. Incluye servicio, salida, alcance, resumen, manifiesto y Descargar Excel.

## 43. Finalizar el trabajo y cerrar sesión

1. Comprueba que las ventas, pendientes o pagos que estabas capturando tengan una confirmación de registro.
2. Cierra los visores o formularios que ya terminaste de utilizar.
3. Vuelve al panel.
4. Pulsa Cerrar sesión y espera Cerrando….
5. Si entraste con código y PIN, vuelve la dirección de acceso del POS. Si entraste desde administración, vuelve la lista administrativa de cajas.

Cerrar sesión no registra un corte de caja. El panel revisado no contiene una acción operativa de apertura, arqueo o corte, aunque algunos avisos mencionen registros de cortes relacionados. No los des por realizados al salir.

> CAPTURA O46 — Cierre de sesión. Incluye el botón y la pantalla de destino.

## 44. Qué revisar cuando una acción falla

- No aparecen productos: confirma caja, sucursal, filtros, almacenes asignados y opción de productos sin almacén con el administrador.
- Stock insuficiente: revisa cantidad, variante y almacén. Una existencia mostrada antes del cobro puede cambiar por otras operaciones.
- No se puede cobrar: revisa métodos, montos, referencia, cuatro dígitos y total a pagar.
- No puedes activar crédito: confirma cliente, cuenta activa y disponible.
- No puedes registrar un abono: verifica que sea positivo y no exceda el saldo.
- La venta se confirmó pero no abre el ticket: consúltala en Historial y recupera el comprobante.
- No sabes si se guardó una venta o pago: actualiza la consulta correspondiente antes de repetir la acción.
- La impresora no responde: confirma la aplicación instalada, tipo de conexión y configuración de red cuando aplique.
- No abre Facturas o ciertas acciones de Clientes: revisa el aviso de plan, complemento o permiso.
- No puedes vender una salida de servicio: comprueba estado, fecha, cupo y parada disponible.
- Una reservación mantiene lugares después de cancelar un pasajero: revisa Cantidad de pasajeros en la reservación; las asignaciones y los lugares reservados son datos diferentes.
- No puedes repetir una venta de servicio después de un error de red: consulta primero las reservaciones; la ventana bloquea reenvíos cuando el resultado es incierto.

## 45. Prácticas de capacitación

Práctica 1, venta pagada: entra a una caja de prueba, agrega dos productos, cambia una cantidad, aplica un descuento válido, selecciona cliente, registra efectivo suficiente y revisa cambio y ticket. Localiza después la venta en Historial y descarga su ticket.

Práctica 2, saldo pendiente: registra una venta de prueba de 500.00 con anticipo de 200.00. Consulta sus 300.00 restantes, registra un abono de 100.00 y después liquida los 200.00 restantes. Comprueba el ticket final.

Práctica 3, crédito: configura una cuenta de prueba autorizada, registra una venta a crédito, consulta su historial y utiliza la liquidación de ticket. Revisa el saldo de la cuenta antes y después.

Práctica 4, servicio: en una salida de prueba disponible registra una reservación sin cobro inicial, consulta sus pasajeros, registra un pago confirmado y descarga el manifiesto del POS. Comprueba los saldos del resumen.

Realiza las prácticas con datos y caja destinados a capacitación. Cada Guardar o Cobrar confirmado registra una operación; no son simulaciones automáticas del sistema.

## 46. Capturas y alcance de la guía

Reemplaza los recuadros CAPTURA con imágenes de tu instalación. Para ventanas largas puedes insertar varias capturas bajo el mismo número. Usa clientes y credenciales de prueba en el material que compartirás.

Esta guía se elaboró con las vistas del proyecto disponibles el 26 de septiembre de 2026. No se realizaron ventas, pagos, cancelaciones, emisiones, envíos o impresiones reales durante la preparación. Los avisos del servicio y las opciones habilitadas para la cuenta determinan qué operaciones pueden completarse en una sesión real.
