# Manual de usuario: Entradas y Movimientos de Inventario

Mi Tienda en Línea MX · Versión 1.0 · 19 de septiembre de 2026

Guía de entradas, salidas, proveedores, comprobantes, historiales y productos por reabastecer.

## 1. Para qué sirve y cómo ingresar

La opción Entradas Producto abre Movimientos de Inventario. Permite registrar mercancía que ingresa o se retira de una sucursal, relacionar compras con proveedores y consultar los movimientos y sus documentos.

Una Entrada aumenta existencias. Una Salida disminuye existencias, por ejemplo por merma, daño o consumo interno. El costo de compra registrado en las entradas permite actualizar la información de costos y su historial según el resultado del servicio.

1. Ingresa al panel y selecciona una sucursal.
2. Abre Entradas Producto.
3. Revisa Sucursal activa en el encabezado.
4. Usa la flecha Cambiar sucursal si deseas trabajar en otra.

Los productos deben existir antes de registrar sus movimientos. Prepara producto, variante si aplica, almacén, cantidad y costo. Si tienes comprobante, prepara también sus datos y archivos.

> CAPTURA E01 — Acceso. Muestra el menú, Movimientos de Inventario y la sucursal activa.

## 2. Vista principal

La parte superior ofrece Registrar Movimiento, Nuevo Proveedor, Historial por Producto e Historial por Proveedor. También muestra la cantidad de registros cargados.

Debajo aparecen Historial General de Movimientos y Productos por Reabastecer. En pantallas pequeñas se acomodan verticalmente. La pantalla trabaja con los datos de la sucursal activa.

Un movimiento con varios productos tiene varias partidas. Los registros del historial pueden representar esas partidas; no interpretes el contador como una cantidad de facturas únicas.

> CAPTURA E02 — Vista general. Incluye botones, contador, historial y panel de reabastecimiento.

## 3. Crear un proveedor

1. Pulsa Nuevo Proveedor.
2. En Información general escribe Nombre del proveedor, que es obligatorio, y Contacto si lo tienes.
3. Completa RFC en Datos fiscales si corresponde.
4. Indica Teléfono, Correo electrónico, Dirección y Notas según la información disponible.
5. Pulsa Guardar proveedor.
6. Espera Proveedor creado correctamente y comprueba que aparezca en la lista de la ventana.
7. Cierra la ventana para volver a los movimientos.

El proveedor es opcional al registrar una entrada, pero asociarlo permite consultar posteriormente su historial.

> CAPTURA E03 — Alta de proveedor. Incluye todos los grupos de datos y Guardar proveedor.

## 4. Editar y eliminar proveedores

La ventana abierta desde Nuevo Proveedor también permite administrar los proveedores existentes.

Para editar, localiza el proveedor, pulsa su acción de edición, modifica los campos y pulsa Actualizar proveedor. Espera Proveedor actualizado correctamente y revisa la lista.

Para eliminar, pulsa la acción de eliminación del proveedor. Revisa el nombre en la pregunta y confirma con Sí, eliminar o cancela. Si el servicio rechaza la operación, consulta el aviso; no supongas que desaparecieron movimientos asociados.

Si acabas de eliminar un proveedor, vuelve a abrir la sección antes de registrar otra entrada para actualizar las opciones disponibles.

> CAPTURA E04 — Administración de proveedores. Muestra la lista y las acciones de edición y eliminación.

> CAPTURA E05 — Editar o eliminar proveedor. Incluye Actualizar proveedor y, en otra imagen si hace falta, la confirmación de eliminación.

## 5. Registrar una entrada

1. Pulsa Registrar Movimiento.
2. En Tipo de movimiento selecciona Entrada.
3. Escribe Nombre de la entrada, por ejemplo Compra de filtros de septiembre.
4. Si corresponde, selecciona Proveedor opcional.
5. Completa UUID factura, Folio y Fecha factura con los datos disponibles.
6. Adjunta PDF y XML de la compra si los tienes.
7. Completa las partidas de productos siguiendo el siguiente apartado.
8. Revisa Resumen y pulsa Guardar entrada.
9. Espera Entrada registrada correctamente. La ventana se cierra y se actualizan el historial y la lista de productos por reabastecer.

Cancelar cierra el formulario sin registrar un movimiento nuevo. La actualización de existencias se solicita al guardar, no al escribir las cantidades.

> CAPTURA E06 — Encabezado de entrada. Muestra Tipo de movimiento, Nombre de la entrada, proveedor, UUID, folio y fecha.

## 6. Completar las partidas de productos

Una partida es una línea del movimiento con producto, cantidad, costo y descripción propios.

1. En Buscar producto escribe nombre o SKU y selecciona el artículo de la lista.
2. Si tiene variantes, elige la correspondiente en Buscar variante. Para productos sin ellas se muestra Sin variantes.
3. Selecciona Almacén cuando corresponda.
4. Revisa Costo de compra. Aunque aparezca un valor precargado, comprueba que corresponda al costo real de esa recepción.
5. Indica Cantidad mayor que cero; puedes utilizar decimales cuando corresponda.
6. Comprueba Subtotal: cantidad multiplicada por costo unitario.
7. En Descripción de la partida agrega observaciones como lote especial o entrega parcial.
8. Usa Agregar producto o el icono Agregar partida para incluir más artículos.
9. Usa Eliminar partida para quitar una línea antes de guardar. Debe permanecer al menos una fila.

Al cambiar el producto se limpia la variante y el almacén: vuelve a seleccionarlos. Al cambiar de variante también se limpia el almacén. Antes de guardar verifica cada partida; las filas sin producto o con cantidad cero no se envían como partidas válidas.

Ejemplo: 5 unidades con costo de compra 80.00 producen un subtotal de 400.00. Si agregas otra partida de 2 unidades a 50.00, el total del formulario será 500.00.

El Resumen suma los subtotales. En la versión revisada no hay un cálculo adicional de impuestos en este formulario; el Total mostrado coincide con el Subtotal.

> CAPTURA E07 — Partida. Incluye producto, variante, almacén, costo, cantidad, subtotal y descripción.

> CAPTURA E08 — Varias partidas y resumen. Muestra Agregar producto, Eliminar partida, totales y Guardar entrada.

## 7. Elegir el almacén correcto

Si el producto ya usa inventario por almacén, debes seleccionar uno antes de guardar. El selector puede mostrar el stock de cada almacén para facilitar la elección.

Si el producto no lo usa, puede aparecer Sin almacén. La pantalla advierte que seleccionar un almacén lo vincula al inventario por almacén; revisa esta elección antes de registrar el movimiento.

Para una variante con existencias por almacén, selecciona el almacén de esa variante. Una entrada dirigida a una variante y un almacén debe comprobarse posteriormente en ese mismo contexto.

> CAPTURA E09 — Selector de almacén. Muestra las opciones, sus existencias cuando estén disponibles y el aviso de obligatoriedad.

## 8. Adjuntar PDF y XML

Los adjuntos están disponibles al registrar una Entrada.

1. En Archivos de factura pulsa Subir PDF y selecciona el archivo.
2. Pulsa Subir XML si cuentas con ese archivo.
3. Comprueba los nombres de los archivos seleccionados.
4. Para retirar una selección antes de guardar, usa la X de su etiqueta.
5. Completa y guarda la entrada para enviar los archivos con el movimiento.

Adjuntar archivos no completa automáticamente los productos o cantidades en esta vista: captura las partidas y los datos del comprobante. La pantalla no muestra un importador masivo CSV de entradas. La importación CSV de Productos carga el catálogo y se explica en su propio manual.

> CAPTURA E10 — Adjuntos. Muestra Subir PDF, Subir XML y los nombres de los archivos seleccionados.

## 9. Registrar una salida

1. Pulsa Registrar Movimiento y selecciona Salida.
2. Escribe Motivo de la salida, por ejemplo Producto dañado.
3. Completa UUID / Referencia, Folio y Fecha salida si corresponden.
4. Selecciona los productos, variantes y almacenes de origen.
5. Revisa Costo referencial, introduce la Cantidad a retirar y describe cada partida.
6. Revisa el total y pulsa Guardar salida.
7. Espera Salida registrada correctamente y comprueba las existencias resultantes.

La pantalla indica que no se permiten salidas mayores al stock disponible ni existencias negativas. En Salida no se muestra el selector de proveedor ni la sección para adjuntar archivos de factura.

Ejemplo: con 15 unidades disponibles, una salida de 2 deja 13, siempre que no existan otros movimientos al mismo tiempo.

> CAPTURA E11 — Salida. Muestra motivo, producto, almacén de origen, cantidad y Guardar salida.

## 10. Consultar el historial general

1. En Historial General de Movimientos usa Buscar movimiento.
2. Escribe parte del nombre de la entrada, producto, proveedor, folio, sucursal, descripción o almacén.
3. En Filtro selecciona Mostrar todo, Con folio/factura o Sin folio/factura.
4. Revisa Entrada / Producto, Descripción, Fecha, Cantidad, Costo y Subtotal.
5. Usa la paginación inferior para recorrer los resultados, en grupos de 16.
6. Borra la búsqueda y vuelve a Mostrar todo para ampliar la consulta.

Los filtros Con folio/factura y Sin folio/factura se basan en tener UUID o folio registrado. No indican necesariamente si se adjuntó un archivo PDF.

La tabla general conserva algunos títulos que dicen Entrada aunque la sección también registra salidas. Para consultar el tipo, stock anterior y stock nuevo, revisa las tarjetas de los historiales por producto o proveedor cuando esos datos estén disponibles.

La vista general solicita hasta 1,000 registros. Para buscar periodos concretos utiliza los historiales por producto o proveedor; no tomes el listado cargado como garantía de que contiene todos los registros históricos.

> CAPTURA E12 — Historial filtrado. Incluye búsqueda, filtro de factura, columnas, resultados y páginas.

## 11. Ver y descargar el PDF de un movimiento

1. En una fila del historial general pulsa Ver PDF.
2. Espera la vista previa del documento generado para el registro.
3. Pulsa Abrir para verlo en una pestaña nueva o Descargar PDF para guardarlo.
4. Cierra el visor para volver al historial.

El PDF generado del movimiento no debe confundirse con el archivo de factura que adjuntaste al registrar la compra. La vista revisada solicita el documento generado del registro.

Si aparece No se encontró el ID de la entrada, ese registro no tiene una referencia de documento disponible para el visor. Si permanece en Cargando PDF…, cierra y vuelve a intentar; si persiste, comunica el registro al administrador.

> CAPTURA E13 — Visor PDF. Incluye documento, apertura en pestaña, descarga y cierre.

## 12. Historial por producto y variante

1. Pulsa Historial por Producto.
2. Busca y selecciona el producto.
3. Si tiene variantes, utiliza el selector de variante para precisar la consulta cuando lo necesites.
4. En Filtro selecciona Todos o Rango de fechas.
5. Para un rango, completa Desde y Hasta.
6. Pulsa Consultar.
7. Revisa Movimientos encontrados y sus tarjetas: producto, Entrada o Salida, fecha, documento, proveedor o motivo, cantidad, costo, stock anterior, stock nuevo y subtotal, según los datos disponibles.
8. Usa PDF o Excel para descargar el reporte de la selección y el periodo establecidos.

Si cambias producto, variante o fechas, vuelve a pulsar Consultar para actualizar los resultados antes de compararlos con un reporte.

> CAPTURA E14 — Historial por producto. Muestra producto, variante, rango, Consultar y exportaciones.

## 13. Historial por proveedor

1. Pulsa Historial por Proveedor.
2. Selecciona uno en Buscar proveedor.
3. Elige Todos o Rango de fechas; completa Desde y Hasta cuando aplique.
4. Pulsa Consultar y revisa los movimientos encontrados.
5. Usa PDF o Excel para descargar el reporte con los criterios elegidos.

Las entradas registradas sin proveedor no se pueden localizar como compras de un proveedor específico en este selector.

> CAPTURA E15 — Historial por proveedor. Incluye proveedor, fechas, resultados y botones de reporte.

## 14. Consultar el detalle de un movimiento

En las tarjetas de los historiales por producto o proveedor, pulsa Detalle. Se abre el formulario en modo consulta con el tipo de movimiento, datos generales y la partida seleccionada. Los campos están bloqueados y la acción disponible es Cerrar.

Este detalle no es un editor y puede mostrar únicamente la partida seleccionada de un movimiento que contenía varios productos.

La sección revisada no ofrece acciones para editar o eliminar movimientos ya guardados. Si necesitas corregir uno, comunica el registro y el cambio requerido al administrador; no lo registres de nuevo como si fuera una operación adicional sin revisar antes el historial.

> CAPTURA E16 — Detalle de movimiento. Muestra los campos de solo lectura y Cerrar.

## 15. Productos por Reabastecer

Este panel ayuda a identificar artículos con existencias bajas usando el valor Mínimo de la consulta.

1. En Mínimo escribe un valor positivo; la pantalla inicia en 20.
2. Pulsa Buscar y espera el resultado.
3. Revisa el contador, nombres y existencias de la lista. Desplázate dentro del panel para ver más productos.
4. Pulsa Ver información completa junto a un artículo para consultar su detalle.
5. Usa Excel o PDF para descargar la lista correspondiente al mínimo elegido.

Cambiar Mínimo modifica la consulta del panel; no edita las existencias ni los mínimos de cada producto. Si se deja vacío o en cero, esta versión utiliza 20 como referencia para la solicitud.

Cuando no hay resultados se muestra No hay productos por debajo del mínimo. Si esperabas ver artículos, verifica sucursal, mínimo y que la consulta haya cargado correctamente.

> CAPTURA E17 — Productos por Reabastecer. Incluye Mínimo, Buscar, lista, contador y botones Excel/PDF.

## 16. Detalle de un producto por reabastecer

Desde Ver información completa se abre una ficha de consulta con imagen, stock, precio, costo, tipo de inventario y estado. Según el producto, incluye información general, categorías y etiquetas, datos SAT, descripciones, inventario por almacén y variantes.

Comprueba el almacén y la variante mostrados al interpretar las existencias. Cierra con la X para regresar al panel. Para registrar mercancía nueva utiliza Registrar Movimiento en la vista principal.

> CAPTURA E18 — Ficha del producto. Incluye stock contextual, almacenes y variantes cuando correspondan.

## 17. Uso desde celular

Los botones y paneles se acomodan verticalmente. Los formularios de movimientos y proveedores pueden ocupar toda la pantalla. Desplázate dentro de la ventana para revisar todos los campos y utiliza Cancelar o Cerrar al terminar. En un movimiento nuevo, revisa todas las partidas antes de Guardar entrada o Guardar salida.

> CAPTURA E19 — Vista móvil. Inserta una imagen de la pantalla principal y otra del formulario de movimiento.

## 18. Mensajes y dudas frecuentes

- Seleccione una sucursal: vuelve a Sucursales, elige una y abre la sección.
- Ingrese el nombre del proveedor: completa Nombre del proveedor.
- Agrega al menos un producto válido: selecciona un producto y una cantidad mayor que cero.
- El producto ya maneja inventario por almacén: selecciona el almacén de esa partida.
- No aparece un producto: comprueba la sucursal y que ya exista en Productos; cierra y vuelve a abrir el registro para actualizar la lista.
- La salida fue rechazada: revisa cantidad, variante, almacén y el stock disponible, junto con el mensaje del sistema.
- Error al registrar entrada o salida: conserva el mensaje y revisa el historial antes de repetir la operación, para comprobar si se guardó.
- No encuentro un movimiento: comprueba sucursal, filtros, producto, variante y fechas; utiliza los historiales específicos para ampliar la consulta.
- No aparece el reporte: espera a que termine la descarga y comprueba que la consulta tenga producto o proveedor seleccionado cuando corresponda.
- Necesito importar una factura: PDF y XML se adjuntan como respaldo; esta vista no ofrece llenado automático de partidas a partir de ellos.

## 19. Ejercicio de práctica

En una sucursal de prueba, crea un proveedor llamado Proveedor de prueba. Selecciona un producto con 10 unidades iniciales y registra una entrada de 5 a costo 80.00: el subtotal será 400.00 y la existencia esperada será 15. Consulta su historial y el detalle. Registra una salida de 2 por daño: la existencia esperada será 13 si no hubo otros movimientos. Finalmente, consulta el historial del proveedor y descarga un reporte.

## 20. Capturas y alcance de la guía

Sustituye cada recuadro CAPTURA por la imagen indicada. Mantén una misma sucursal de ejemplo y conserva visibles los nombres de los botones. Agrega imágenes adicionales si una ventana requiere varias capturas.

Guía elaborada a partir de las pantallas y acciones del proyecto. No se registraron compras, salidas ni proveedores reales ni se verificó el contenido generado de los reportes con una sesión activa. Las reglas adicionales del servicio pueden producir avisos que deben revisarse al operar.
