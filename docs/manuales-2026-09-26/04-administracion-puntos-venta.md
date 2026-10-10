# Manual de usuario: Crear y administrar Puntos de Venta

Mi Tienda en Línea MX · Edición del 26 de septiembre de 2026

Dirigido al administrador. Explica el alta, edición, accesos, asignación de almacenes y eliminación de cajas.

## 1. Qué es un punto de venta

Un punto de venta o POS es una caja asociada a una sucursal. Tiene nombre, código de usuario y contraseña o PIN. Esos accesos permiten abrir su panel para registrar ventas y utilizar las demás funciones disponibles.

El nombre sirve para identificar la caja, por ejemplo Caja mostrador. El código POS es el usuario de acceso. La contraseña generada tiene seis dígitos. La sucursal determina el contexto de trabajo, y los almacenes asignados intervienen en los productos disponibles para vender.

## 2. Abrir la administración de cajas

1. Entra al panel de administración.
2. Selecciona la sucursal.
3. Abre Punto de Venta en el menú.
4. Comprueba el encabezado Puntos de venta (POS) y el nombre de la sucursal.
5. Revisa el contador de cajas y el indicador Límite.

Si no hay sucursal activa, el sistema dirige a Sucursales. La flecha Cambiar sucursal te permite seleccionar otra.

Cada tarjeta muestra información de una caja, su código, contraseña oculta o visible, almacenes, indicador Sin almacén y acciones. El buscador permite localizar registros por nombre, código o código de acceso. Recargar vuelve a consultar los datos guardados.

> CAPTURA A01 — Administración de POS. Incluye sucursal, buscador, límite, botón de alta y tarjetas.

## 3. Crear una caja paso a paso

1. Comprueba que estás en la sucursal correcta.
2. Pulsa Nuevo POS para agregar un punto de venta.
3. Localiza la nueva tarjeta. Al principio es un registro pendiente de guardar.
4. En Editar nombre escribe un nombre reconocible, por ejemplo Caja mostrador o Caja entrada.
5. Revisa la contraseña de seis dígitos que se genera automáticamente.
6. Si quieres sustituirla, pulsa Generar.
7. Pulsa Guardar en esa tarjeta.
8. Espera POS creado correctamente.
9. Comprueba que la tarjeta tenga un código POS definitivo.
10. Configura sus almacenes y comprueba el acceso antes de entregarla al operador.

El aviso Nuevo POS agregado (completa el nombre y guarda) significa que se agregó una tarjeta al formulario; todavía falta Guardar para crearla. No intentes iniciar sesión con una tarjeta nueva sin guardar.

El nombre es obligatorio. Si se alcanzó el límite de cajas de la cuenta, el sistema muestra un aviso y no permite continuar con el alta. Revisa el límite visible en la sección.

> CAPTURA A02 — Tarjeta nueva. Muestra Editar nombre, contraseña generada y Guardar.

> CAPTURA A03 — Caja creada. Incluye código POS definitivo y confirmación de creación.

## 4. Cambiar el nombre de un punto de venta

1. Busca la caja por su nombre o código.
2. Pulsa el lápiz o la acción Editar para desplegar el panel de edición.
3. Modifica Editar nombre.
4. Pulsa Guardar en la misma tarjeta.
5. Espera POS actualizado correctamente.
6. Verifica que se muestre el nuevo nombre.

Cerrar el panel de edición solo lo contrae; no representa una confirmación de guardado ni una acción para deshacer cambios. Si necesitas descartar lo escrito y conservar lo que ya estaba guardado, vuelve a cargar la lista y revisa los valores. Recargar también descarta otros borradores pendientes de esa pantalla.

> CAPTURA A04 — Edición del nombre. Incluye el campo y el botón Guardar de la caja correspondiente.

## 5. Ver o cambiar la contraseña

Para verla:

1. Localiza Contraseña en la tarjeta correcta.
2. Pulsa el ojo Mostrar.
3. Consulta los dígitos.
4. Pulsa Ocultar para volver a cubrirlos.

Para generar una nueva:

1. Abre Editar en la caja.
2. Pulsa Generar.
3. Revisa el aviso Código de acceso generado (recuerda guardar).
4. Pulsa Guardar.
5. Espera POS actualizado correctamente.
6. Vuelve a copiar los accesos guardados y proporciona la nueva contraseña al operador correspondiente.

Generar sustituye la contraseña del borrador. Se envía al sistema al guardar. El código POS identifica la misma caja; no se cambia desde este formulario. La vista revisada no permite asegurar que cambiar el PIN cierre sesiones que ya estaban abiertas.

> CAPTURA A05 — Contraseña. Muestra los controles Mostrar/Ocultar y Generar usando un acceso de prueba.

## 6. Copiar los accesos de la caja

1. Guarda primero cualquier cambio de nombre o contraseña.
2. Pulsa Copiar accesos en la tarjeta.
3. Espera Accesos copiados al portapapeles.
4. Pega el contenido en el medio que utilizarás para entregarlo al operador.
5. Comprueba que incluya la sucursal, el usuario o código POS, la contraseña y la dirección de acceso.

El botón copia un mensaje; no lo envía automáticamente a otra persona. Evita pegarlo en una captura del manual que se distribuirá públicamente. Si no se puede copiar, revisa los permisos del navegador o utiliza otro navegador compatible.

La dirección incluida por la aplicación es https://mitiendaenlineamx.com.mx/prueba/pos. El usuario debe ingresar con el Código POS y el Código de acceso (PIN), no con el nombre descriptivo de la caja.

> CAPTURA A06 — Copiar accesos. Incluye el botón y el aviso de éxito; oculta o utiliza credenciales de prueba.

## 7. Asignar los almacenes que puede usar la caja

1. Guarda la caja si acabas de crearla.
2. Abre su acción de asignación de almacenes.
3. En Asignación de almacenes comprueba el nombre del POS.
4. Abre Almacenes asignados y selecciona uno o varios almacenes.
5. Desmarca o retira una selección si ese almacén no debe utilizarse en la caja.
6. Revisa el contador Seleccionados.
7. Decide si debe estar activo Mostrar productos sin almacén.
8. Pulsa Guardar.
9. Espera Asignaciones guardadas y comprueba los indicadores de la tarjeta.

Mostrar productos sin almacén permite vender productos que no están asignados a ningún almacén. Si lo desactivas, esos productos pueden dejar de estar disponibles en la caja. Elegir almacenes determina el alcance de ventas e inventario del POS; no registra una entrada de mercancía ni mueve existencias entre almacenes.

Si aparece Primero guarda el POS para poder asignar almacenes, cierra la ventana, guarda la tarjeta y vuelve a intentarlo. Cancelar cierra el diálogo sin enviar los cambios de asignación.

> CAPTURA A07 — Asignación de almacenes. Incluye selección múltiple, productos sin almacén, contador y Guardar.

## 8. Entrar a una caja desde el administrador

1. Localiza el POS correcto.
2. Guarda cualquier modificación pendiente.
3. Pulsa Iniciar sesión.
4. Espera que abra el panel de caja.
5. Comprueba Punto de Venta: seguido del nombre esperado.
6. Selecciona Venta u otra tarjeta del panel.

Iniciar sesión está deshabilitado si la tarjeta es nueva o tiene cambios sin guardar. Este acceso desde administración utiliza la sesión autorizada del administrador para abrir la caja. El operador que entra desde la dirección pública utiliza código y PIN.

Cuando entras desde administración y pulsas Cerrar sesión en el POS, la aplicación vuelve a la lista administrativa de puntos de venta. Esto no equivale a cerrar la sesión general del administrador.

> CAPTURA A08 — Entrada desde administración. Muestra Iniciar sesión y el panel resultante con el nombre de la caja.

## 9. Iniciar sesión con los accesos entregados al operador

1. Abre https://mitiendaenlineamx.com.mx/prueba/pos en el navegador o aplicación compatible.
2. Espera Acceso a Punto de Venta.
3. En Código POS escribe el usuario asignado, respetando sus caracteres y sin espacios adicionales.
4. En Código de acceso (PIN) escribe la contraseña de seis dígitos.
5. Pulsa Ingresar.
6. Comprueba el nombre de la caja antes de registrar una venta.

Si aparece Código o PIN incorrecto, comprueba que no estés usando el nombre de la caja como usuario y que el PIN sea el último guardado. Si el problema continúa, el administrador debe revisar los accesos y el estado del punto de venta.

Una sesión existente puede abrir el panel sin pedir de nuevo los campos. Comprueba siempre qué caja aparece en el encabezado. Para cambiar de caja, cierra esa sesión y entra con los otros accesos.

> CAPTURA A09 — Acceso público. Incluye Código POS, Código de acceso (PIN) e Ingresar.

## 10. Eliminar un punto de venta

1. Localiza la caja y verifica cuidadosamente su nombre, código y sucursal.
2. Pulsa Eliminar en su tarjeta.
3. Lee el aviso completo de confirmación.
4. Si deseas conservar la caja, cancela el diálogo.
5. Si corresponde eliminarla, pulsa Sí, eliminar definitivamente.
6. Espera POS eliminado.
7. Comprueba que desaparezca de la lista actualizada.

La aplicación advierte expresamente que se perderá la información relacionada, incluidas ventas, historial, cortes y registros asociados, y que la acción no se puede deshacer. Trata esta operación como definitiva. El alcance efectivo lo ejecuta el servicio; no se comprobó mediante una eliminación real al elaborar esta guía.

Si solo necesitas corregir un nombre o renovar el PIN, utiliza Editar y Guardar. La pantalla revisada no muestra un interruptor para suspender temporalmente una caja.

> CAPTURA A10 — Eliminación definitiva. Muestra el aviso completo y los botones de confirmación.

## 11. Problemas frecuentes

- Guardar está deshabilitado: comprueba que el nombre no esté vacío y que exista una modificación pendiente.
- Iniciar sesión está deshabilitado: guarda primero la caja o sus cambios.
- El nombre vuelve al anterior: confirma que el guardado terminó; contraer el panel no guarda.
- El operador no puede entrar: revisa código, último PIN guardado y mensaje de error. Genera otro PIN solo si necesitas reemplazarlo y guárdalo antes de entregarlo.
- La caja no muestra productos: comprueba sucursal, almacenes asignados, opción de productos sin almacén y existencia del catálogo.
- No aparecen almacenes para asignar: verifica que existan en la sucursal correspondiente.
- Se alcanzó el límite: revisa la capacidad disponible de la cuenta antes de agregar otra caja.
- Error al eliminar: comprueba el mensaje y recarga la lista para conocer el estado real antes de repetir.

## 12. Ejercicio de entrega al operador

En una sucursal de prueba crea Caja capacitación, guarda, asigna un almacén y comprueba la opción de productos sin almacén. Copia sus accesos guardados. Abre el acceso público en una sesión separada, ingresa con código y PIN y confirma el nombre. Consulta Venta y vuelve al panel. Cierra la sesión. La eliminación de una caja con historial debe reservarse para una decisión administrativa explícita.

## 13. Capturas y alcance

Los recuadros están listos para insertar capturas. Usa códigos de ejemplo en imágenes que se compartirán. Esta guía se basa en las pantallas revisadas el 26 de septiembre de 2026; no se crearon, editaron ni eliminaron cajas reales. Consulta el manual de Inicio de sesión y operación del POS para el uso detallado de cada módulo de caja.
