# Tutorial de recargas Telorecargo

Guía para personal de caja y administración de tienda.

## 1. Entrar al módulo

Desde el menú del punto de venta, abre **Recargas Telorecargo**. La tienda debe tener configurada la integración para que esta opción esté disponible.

Arriba verás el saldo disponible y la comisión actual. El saldo es compartido entre los puntos de venta de la tienda: otra caja puede utilizarlo. Presiona **Actualizar saldo** para consultar el valor más reciente.

El módulo tiene cuatro pestañas:

| Pestaña | Para qué sirve |
| --- | --- |
| Vender recarga | Elegir compañía, producto, teléfono y registrar el cobro. |
| Solicitar saldo | Consultar los datos para depositar y enviar un comprobante. |
| Historial de recargas | Consultar operaciones, estados y tickets anteriores. |
| Solicitudes de saldo | Dar seguimiento a los abonos solicitados. |

## 2. Vender una recarga

1. En **Vender recarga**, selecciona la compañía del cliente.
2. Dentro del modal, elige el monto o paquete. Puedes consultar más opciones con **Más montos y paquetes**.
3. Revisa el producto, su vigencia cuando esté disponible, la comisión y el total a cobrar. El sistema consulta el total al seleccionar el producto.
4. Captura los 10 dígitos del teléfono y vuelve a escribirlos en **Confirmar número**. Deben coincidir.
5. Si corresponde, selecciona un contacto y un vendedor. Son opcionales. Un contacto con teléfono válido puede llenar el número; verifica siempre que sea el que desea recargar el cliente.
6. Registra el pago como se explica en el siguiente apartado.
7. Presiona **Revisar y enviar recarga**.
8. Comprueba el teléfono, el producto, los importes y los pagos. Presiona **Confirmar y enviar** una sola vez.
9. Espera el resultado en el mismo modal. La secuencia superior muestra captura, procesamiento y finalización.

La recarga queda completada cuando está confirmada y tiene una venta asociada. Desde el resultado podrás consultar su ticket. Para atender a otro cliente, utiliza **Iniciar otra recarga** o elige una compañía después de cerrar una operación terminada.

**Antes de confirmar:** verifica el teléfono con el cliente. El módulo no ofrece una reversión de la recarga.

## 3. Registrar el cobro y calcular el cambio

Puedes registrar efectivo, tarjeta de débito, tarjeta de crédito o transferencia. Para combinar medios, utiliza **Agregar medio de pago**.

Los importes aplicados deben sumar exactamente el total, incluida la comisión. Los medios distintos de efectivo solicitan referencia y últimos cuatro dígitos según el formulario actual.

Ejemplo de pago en efectivo:

| Dato | Importe |
| --- | ---: |
| Recarga al teléfono | $100.00 |
| Comisión | $3.00 |
| Total a cobrar / importe aplicado | $103.00 |
| Efectivo recibido del cliente | $200.00 |
| Cambio a entregar | $97.00 |

En **Importe aplicado** captura $103.00; en **¿Con cuánto paga el cliente?**, $200.00. El efectivo recibido sirve para calcular el cambio y no aumenta el valor de la recarga.

Registrar tarjeta o transferencia en este formulario deja constancia del cobro; no realiza por sí mismo un cargo bancario. Verifica el cobro en el medio correspondiente.

## 4. Obtener el ticket

Las acciones de comprobante aparecen cuando la recarga está **Confirmada** y tiene una venta asociada. Están disponibles tanto al terminar como en el detalle del historial.

### Ver el PDF

Presiona **Ver ticket PDF**. El sistema obtiene el archivo con la sesión del POS y lo abre en otra pestaña. Si el navegador bloquea la ventana, permite las ventanas emergentes del sitio y vuelve a intentarlo.

### Imprimir

Presiona **Imprimir ticket**. El sistema obtiene el ticket preparado por el servidor y lo entrega al puente de impresión. Ese ticket ya incluye sus elementos de impresión; no es necesario volver a capturarlo.

Si el POS tiene habilitado el envío automático de impresión, el sistema intenta enviar el ticket al completarse la recarga. WhatsApp se ofrece como acción manual.

**Alcance actual de la configuración:** la recarga consulta la configuración del POS para decidir el envío automático y utiliza un puente compartido con ventas. La selección explícita de impresora y tipo de conexión todavía necesita unificarse con el flujo completo de tickets de venta. Antes de usarla en caja, comprueba que el ticket salga por la impresora esperada. El mensaje de envío al puente no confirma por sí solo que el papel haya salido.

Si falla la impresión, revisa la aplicación conectada, la impresora, su conexión y el papel. Después vuelve a presionar **Imprimir ticket**. **No vuelvas a comprar la recarga para obtener otra copia.**

### Enviar por WhatsApp

1. En el bloque **Envío por WhatsApp**, verifica el número del destinatario.
2. Captura los 10 dígitos; el formulario muestra el prefijo +52 por separado.
3. Presiona **Enviar ticket** y espera el resultado.

Puedes cambiar el destinatario si el cliente quiere recibirlo en otro número. Este envío utiliza la venta asociada y no realiza una nueva recarga. Si falla, verifica el número y la disponibilidad del servicio de WhatsApp de la tienda antes de reintentar.

## 5. Consultar el historial

1. Abre **Historial de recargas**.
2. Selecciona las fechas y, si lo necesitas, el estado.
3. Presiona **Aplicar filtros**. Utiliza **Actualizar historial** para volver a consultar.
4. Busca la operación por concepto, teléfono, fecha o importe y abre **Detalle**.

La columna **Concepto** muestra el concepto recibido; si no está disponible, utiliza el nombre o producto. El texto se limita a dos líneas para mantener la tabla compacta. El detalle permite ver el concepto completo, la referencia, los importes y los identificadores disponibles.

En móvil el historial se presenta en tarjetas. Las acciones de ticket son las mismas que en escritorio y solo aparecen cuando existe una recarga confirmada con venta asociada.

## 6. Entender los estados

| Estado visible | Qué significa y qué hacer |
| --- | --- |
| Confirmada | La recarga tiene una venta asociada. Puedes consultar, imprimir o enviar el ticket. |
| Procesando | El resultado todavía no está finalizado. Conserva el pedido y consulta su estado. |
| En revisión | La operación requiere verificación. No generes otra recarga para el mismo cobro. |
| Reintentable | Utiliza la acción del mismo pedido cuando esté habilitada; conserva sus datos originales. |
| Venta local pendiente | Falta la venta asociada. Consulta el estado o recupera la venta antes de obtener el ticket. |
| Rechazada | La recarga no terminó correctamente. Si recibiste dinero, coordina con la tienda la resolución del cobro. |
| Resultado por verificar | No hay un resultado concluyente. Conserva el pedido y verifica el estado. |

Si aparece “La recarga todavía no tiene una venta confirmada disponible para imprimir”, actualiza el estado desde la operación. No realices otra compra para generar un ticket.

## 7. Qué hacer si se corta internet o se cierra la pantalla

El sistema guarda el pedido antes de enviarlo y puede recuperarlo al regresar al módulo desde el mismo navegador y POS.

1. Entra de nuevo a **Recargas Telorecargo**.
2. Abre **Ver operación de recarga** si hay un pedido guardado.
3. Si tiene un identificador, utiliza **Consultar estado / recuperar** para comprobar el resultado.
4. Si corresponde un reenvío, usa **Reintentar el mismo pedido** y respeta el tiempo de espera indicado.

El reintento del pedido conserva sus datos y su clave para evitar duplicados. Es distinto de reintentar la impresión: **imprimir, abrir el PDF o enviar WhatsApp no vuelve a enviar la compra**.

Mientras una recarga siga pendiente, seleccionar una compañía abre su recuperación antes de permitir otra compra. No borres los datos del navegador ni cambies de caja para repetir una operación cuyo resultado aún desconoces.

## 8. Solicitar saldo

1. Abre **Solicitar saldo**.
2. Consulta los datos bancarios y la referencia o concepto que muestra el módulo. Puedes usar **Copiar datos con referencia**.
3. Realiza el depósito o transferencia con los datos verificados en pantalla. Si no aparece tu referencia, confírmala en tu cuenta de Telorecargo antes de depositar.
4. En el formulario registra el monto y la referencia bancaria de tu comprobante.
5. Adjunta el comprobante en JPG, PNG o PDF, de hasta 2 MB.
6. Presiona **Revisar solicitud de saldo**, comprueba los datos y confirma el envío.
7. Consulta el avance en **Solicitudes de saldo**. Después de la aprobación, actualiza el saldo disponible.

La referencia o concepto para hacer el depósito y la referencia bancaria del comprobante tienen propósitos diferentes: usa en cada campo el dato que solicita la pantalla.

Adjuntar el comprobante no acredita saldo inmediatamente. La aprobación depende del proveedor. La solicitud tampoco crea una venta ni registra una salida de caja. Si queda pendiente, da seguimiento a esa misma solicitud; no registres otra para el mismo depósito.

Los horarios y datos bancarios deben consultarse en la pantalla al realizar el trámite, donde se muestran las instrucciones vigentes del módulo.

## 9. Funciones de administración

En el panel de tienda, el menú **Telorecargo** permite configurar la integración y la comisión, consultar operaciones de los POS y revisar reportes.

Administración también puede conciliar una operación con una transacción externa conocida o registrar la resolución de un cobro rechazado. Estas acciones deben corresponder a una verificación real: registrar “devuelto” no devuelve dinero automáticamente.

El ticket de recarga no es un CFDI. El módulo no ofrece facturación ni devolución automática de una recarga.

## 10. Soluciones rápidas

| Situación | Acción |
| --- | --- |
| No aparecen compañías | Espera a que termine la consulta, revisa el aviso y usa **Actualizar compañías** cuando esté habilitado. |
| No carga el monto o total | Actualiza los productos o vuelve a consultar el total. Confirma únicamente una cotización válida. |
| Los teléfonos no coinciden | Corrige el número y su confirmación antes de continuar. |
| Los pagos no suman el total | Ajusta los importes aplicados e incluye la comisión una sola vez. |
| La compra queda pendiente | Consulta o recupera el mismo pedido; no generes otra compra. |
| No aparece el ticket | Revisa que la recarga esté confirmada y tenga venta asociada. |
| No imprime | Revisa el puente y la impresora; reintenta solo **Imprimir ticket**. |
| No abre el PDF | Permite ventanas emergentes y vuelve a abrir el comprobante. |
| No llega WhatsApp | Verifica los 10 dígitos y el resultado del envío; revisa el servicio de la tienda. |
| La sesión venció | Inicia sesión nuevamente en el POS y recupera la operación guardada. |
| El abono sigue pendiente | Consulta la misma solicitud y las instrucciones de atención; no dupliques el depósito ni la solicitud. |

**Rutina de caja:** confirmar teléfono → revisar total → verificar cobro → enviar una vez → comprobar resultado → entregar ticket.
