# Manual de usuario: Productos

Mi Tienda en Línea MX · Versión 1.0 · 19 de septiembre de 2026

Guía de consulta, creación, edición, eliminación, categorías, variantes, almacenes, imágenes, etiquetas e importación CSV.

## 1. Para qué sirve y cómo ingresar

Productos reúne el catálogo de la sucursal: códigos, nombres, precios, existencias, clasificación y datos para mostrar los artículos en el sitio web. Las entradas y salidas posteriores de mercancía se registran en Entradas Producto, cuya pantalla se llama Movimientos de Inventario.

1. Ingresa al panel de administración.
2. Selecciona la sucursal que vas a administrar.
3. Abre Productos y comprueba la etiqueta Sucursal del encabezado.
4. Usa Cambiar sucursal si necesitas trabajar con otra.

Sin una sucursal activa, el sistema te dirige a Sucursales. Antes de crear un producto, prepara su código, nombre, precio final, tasa de IVA, existencias iniciales y descripciones corta y larga.

> CAPTURA P01 — Acceso a Productos. Muestra el menú, la sucursal activa y el encabezado Lista de Productos.

## 2. Vista Lista de Productos

La pantalla muestra el contador de productos creados y el límite de la cuenta, el buscador, las acciones de importación cuando están habilitadas y Crear Producto.

La tabla presenta número de fila, Nombre, Precio, IVA, Stock, Categorías y Acciones. El IVA puede aparecer como porcentaje o Exento. Cuando corresponde, Stock muestra Con Variaciones.

En Categorías, un 0 indica que no hay categorías asignadas; si hay una se muestra su nombre, y si hay varias se muestra la cantidad. El icono junto a ese indicador abre Administrar categorías.

Acciones de cada fila:

- Lápiz: Editar producto.
- Impresora: Imprimir etiquetas.
- Imagen: Agregar Imágenes y consultar las existentes.
- Papelera: Eliminar el producto.

La lista muestra 10 productos por página. Usa los controles inferiores para cambiar de página. En pantallas pequeñas puedes desplazar horizontalmente la tabla para consultar las acciones.

> CAPTURA P02 — Tabla y acciones. Incluye productos, indicadores de categorías, iconos y paginación.

## 3. Buscar un producto

1. Escribe una parte del nombre en el buscador.
2. La lista se filtra automáticamente y vuelve a la primera página.
3. Borra el texto para recuperar la lista completa de la sucursal.

Este buscador filtra por nombre. Si aparece No hay productos disponibles, revisa el texto y la sucursal activa antes de crear otro registro.

> CAPTURA P03 — Búsqueda. Muestra el texto escrito y los resultados filtrados.

## 4. Crear un producto: recorrido completo

1. Pulsa Crear Producto.
2. Completa Información del Producto.
3. Abre Inventario y Descuento e indica las existencias iniciales si no usarás variantes.
4. Configura Variantes y Multi-almacenes si corresponden a tu artículo.
5. Revisa Sitio Web y completa las dos Descripciones.
6. Selecciona imágenes y categorías si las necesitas.
7. Pulsa Guardar Producto, espera la confirmación y verifica el registro en la lista.

Las secciones del formulario se despliegan al pulsar sus títulos. Si no puedes guardar, abre las secciones para localizar los campos con errores.

> CAPTURA P04 — Formulario completo. Muestra Crear Producto, los títulos de las ocho secciones y Guardar Producto.

## 5. Información del Producto

- Código: identificador o SKU del artículo. Es obligatorio; conserva los ceros iniciales si forman parte del código.
- Nombre: nombre con el que identificarás el producto. Es obligatorio.
- Precio Final (incluye IVA): precio de venta con IVA incluido. Es obligatorio.
- Tasa de IVA: selecciona la opción que corresponda al producto entre 16%, 8%, 0% y EXENTO. Es obligatoria.
- Precio Base (SIN IVA): importe calculado por el sistema. Recalcular base permite actualizarlo a partir del precio final y la tasa seleccionada.
- Costo de Compra: costo del artículo. Es diferente del precio de venta.

Ejemplo de captura: código FIL001, nombre Filtro de aceite, precio final 116.00 y tasa 16%; la base es 100.00. Es un ejemplo de uso del formulario.

En edición, Costo de Compra puede ser de solo lectura. Si tu cuenta no tiene permiso para modificarlo directamente, el formulario indica que debes actualizarlo desde Entradas Producto.

> CAPTURA P05 — Datos principales. Incluye Código, Nombre, precio final, IVA, base y costo de compra.

## 6. Inventario, unidades, claves y descuento

Al crear un producto sin variantes, Stock es obligatorio y debe ser mayor o igual a cero. Es la existencia inicial; acepta cantidades decimales. Al editar ese producto, el stock global es de solo lectura y se actualiza mediante movimientos de inventario.

Para Unidad de Medida, Clave Producto/Servicio y Clave Unidad, escribe al menos dos caracteres y selecciona una sugerencia. Por ejemplo, puedes buscar una unidad por su nombre. Verifica que la opción elegida corresponda al artículo.

En Descuento (%) escribe el porcentaje deseado. Si es mayor que cero, aparece Fin de la Oferta para indicar fecha y hora.

> CAPTURA P06 — Inventario y Descuento. Muestra Stock, selectores de unidades y claves, descuento y fecha de oferta.

## 7. Variantes del producto

Una variante representa una versión del mismo artículo: una talla, color, sabor o presentación. Cada variante puede tener su propio código, existencias e imagen.

1. Abre Variantes y pulsa Agregar variante.
2. Escribe un Nombre que permita distinguirla, como Rojo / Mediana.
3. Completa SKU si lo necesitas y Stock (total variante).
4. Indica Precio y Costo compra si corresponden. La pantalla indica que el precio vacío usa el del producto.
5. Selecciona Activo: Sí o No.
6. Opcionalmente selecciona una Imagen variante y revisa su vista previa.
7. Usa Agregar atributo para introducir pares como Color = Rojo y Talla = Mediana. La X quita un atributo del formulario.
8. Repite para las demás versiones. Sumar stock a producto suma las existencias de las variantes en el formulario.
9. Guarda o actualiza el producto para enviar los cambios.

Eliminar dentro de una variante quita esa fila del formulario. Revisa el conjunto antes de guardar. Para modificar una variante, entra a Editar producto, cambia sus datos y pulsa Actualizar Producto. Para cambiar su imagen, selecciona otro archivo; si no seleccionas uno, se conserva la imagen actual.

Si no agregas variantes, se usa el stock normal del producto. El botón de ayuda de Variantes explica existencias, almacenes, mínimo, máximo, reorden y ubicación.

> CAPTURA P07 — Variante. Incluye nombre, SKU, stock, precio, costo, estado, imagen y atributos.

> CAPTURA P08 — Ayuda de variantes. Muestra la explicación y su botón Cerrar.

## 8. Multi-almacenes sin variantes

Utiliza esta sección si repartirás las existencias entre almacenes de la sucursal. Los almacenes deben existir previamente.

1. Abre Multi-almacenes (Almacenes).
2. Activa Usar inventario por almacén (multi-almacén).
3. Pulsa Agregar almacén y selecciona uno.
4. Indica Stock en almacén y, si procede, Precio y Costo opcionales. Si estos últimos quedan vacíos, se usa el valor global.
5. Agrega los demás almacenes, sin repetirlos.
6. Comprueba que Total asignado sea igual al Stock global y guarda el producto.

Ejemplo: con 30 unidades globales puedes asignar 20 a un almacén y 10 a otro. La suma debe coincidir exactamente. Repartir en partes iguales ayuda a distribuir unidades enteras; para cantidades decimales realiza el reparto manual y verifica el total.

Quitar elimina una fila de asignación del formulario. Revisa la distribución antes de guardar. Si el inventario por almacén está desactivado, se utilizan stock y precio globales.

> CAPTURA P09 — Distribución por almacén. Muestra dos almacenes y la confirmación de que la suma coincide.

## 9. Multi-almacenes con variantes

1. En Multi-almacenes, activa el inventario por almacén y selecciona los almacenes que utilizarás.
2. Regresa a Variantes y abre el inventario por almacén de cada variante.
3. Usa Crear filas con almacenes seleccionados para generar las filas de distribución.
4. Distribuye el stock de esa variante entre sus almacenes, sin duplicar un almacén.
5. Completa los campos de control que necesites: Mínimo, Máximo, Reorden y Ubicación (bin).
6. Repite con cada variante y guarda el producto.

La suma de existencias por almacén debe coincidir con el stock total de cada variante. Mínimo es una referencia de existencias bajas; Máximo, una referencia de capacidad; Reorden, una referencia para volver a surtir; Ubicación ayuda a localizar el artículo, por ejemplo Pasillo 2, Rack B.

> CAPTURA P10 — Almacenes de una variante. Incluye stock, mínimo, máximo, reorden y ubicación.

## 10. Sitio Web y Descripciones

En Sitio Web encontrarás Calificación (0-5), ¿Es nuevo? y ¿Visible en tu página?. Configura estos datos según cómo deseas presentar el artículo. Desactivar su visibilidad permite conservar el registro del producto mientras cambias su configuración de publicación.

En Descripciones completa Descripción Corta y Descripción Larga; ambas son obligatorias. Usa la corta para identificar lo esencial y la larga para características, presentación o contenido.

> CAPTURA P11 — Sitio Web y Descripciones. Incluye los interruptores y ambas descripciones.

## 11. Imágenes: agregar, consultar, cambiar y eliminar

Al crear el producto puedes seleccionar hasta 6 imágenes, de máximo 2 MB cada una, en Imágenes del Producto. Revisa las miniaturas y guarda el producto.

Para administrar imágenes de un producto existente:

1. Regresa a Lista de Productos y pulsa su icono Agregar Imágenes.
2. Consulta las imágenes actuales.
3. Selecciona uno o varios archivos y pulsa Agregar Imagen. El total, contando las existentes, no puede superar 6; cada archivo debe ser una imagen de máximo 2 MB.
4. Espera a que termine Subiendo… y verifica que aparezcan las nuevas imágenes.
5. Para borrar una, pulsa Eliminar debajo de ella y confirma ¿Eliminar esta imagen?.
6. Para reemplazar una imagen principal, elimina la que ya no utilizarás y agrega la nueva.
7. Usa Volver a productos para regresar.

Si aparece Variaciones del producto, cada tarjeta permite seleccionar un archivo y pulsar Cambiar Imagen. Las imágenes de las variantes del formulario también se pueden modificar desde la sección Variantes.

> CAPTURA P12 — Gestor de imágenes. Muestra el selector, Agregar Imagen, miniaturas, Eliminar y Volver a productos.

## 12. Asignar o quitar categorías de un producto

Desde el formulario de creación o edición:

1. Abre Categorías y selecciona las opciones necesarias.
2. Puedes elegir categorías sueltas o hijas.
3. Si eliges un padre identificado con «guardar todas sus hijas», se asignan sus hijas al guardar.
4. Pulsa Guardar Producto o Actualizar Producto.

Desde la lista:

1. Pulsa Administrar categorías junto al indicador de categorías del producto.
2. Revisa Categorías actuales.
3. Usa Agregar o quitar categorías para buscar y seleccionar varias opciones.
4. Los padres aparecen como encabezados; en esta ventana seleccionas sus hijas o las sueltas del grupo Otras.
5. Para quitar una asignación, pulsa la X de la categoría seleccionada.
6. Pulsa Guardar y comprueba el resultado. Cancelar descarta lo que aún no guardaste.

Quitar una categoría de un producto modifica su asignación; la categoría sigue disponible en el catálogo. Si quieres dejar un producto sin categorías, quita todas desde esta ventana y guarda.

> CAPTURA P13 — Selector del formulario. Muestra una categoría padre con la indicación guardar todas sus hijas.

> CAPTURA P14 — Categorías de un producto. Muestra categorías actuales, grupos, selección múltiple, Cancelar y Guardar.

## 13. Crear, editar y eliminar categorías

Abre Categorías desde el menú y comprueba la sucursal. La vista muestra contadores y dos bloques: Padres (con hijas) y Sueltas. Padre agrupa otras categorías; Hija pertenece a un padre; Suelta no tiene padre ni hijas.

Crear una suelta:

1. Pulsa Nueva categoría o Crear nueva.
2. Escribe Nombre.
3. Deja «¿Va dentro de un Padre?» en «NO (Se queda suelta)».
4. Pulsa Guardar y comprueba Categoría creada.

Crear un padre y una hija:

1. Crea primero Refacciones como suelta.
2. Abre Nueva categoría, escribe Filtros y selecciona Refacciones como padre.
3. Guarda. Refacciones aparecerá en Padres (con hijas) y Filtros dentro de su tarjeta.

Editar:

1. Pulsa el lápiz de la categoría.
2. Cambia su nombre o, si tu plan lo permite, su padre.
3. Para separar una hija, elige «NO (Se queda suelta)».
4. Pulsa Actualizar y revisa el resultado.

Usa Cerrar o la X si quieres descartar una edición. En la versión actual, Limpiar vacía los campos y cambia el formulario a creación de una categoría nueva.

Eliminar:

1. Pulsa la papelera de la categoría.
2. Revisa el nombre después de «Vas a borrar:».
3. Elige Cancelar o confirma con Eliminar.
4. Comprueba Categoría eliminada y revisa la organización restante.

Al borrar un padre, sus hijas pueden quedar sueltas según las reglas del servicio. El efecto sobre las asignaciones a productos no está confirmado en las vistas revisadas. Si un padre queda sin hijas, se muestra en Sueltas.

Cuando el plan muestra Solo SUELTAS, no puedes crear jerarquía. Ver planes permite consultar las opciones disponibles. El icono ¿Cómo funciona? abre una ayuda con las definiciones; Entendido la cierra.

> CAPTURA P15 — Administración de categorías. Muestra sucursal, contadores, padres, hijas y sueltas.

> CAPTURA P16 — Crear o editar categoría. Muestra Nombre, selector de padre y Guardar o Actualizar.

> CAPTURA P17 — Eliminar categoría. Muestra el nombre y los botones de confirmación.

## 14. Editar un producto

1. Busca el producto y pulsa Editar producto.
2. Revisa que el título sea Editar Producto.
3. Abre las secciones que deseas modificar y actualiza los campos.
4. Revisa categorías, variantes y distribución por almacén si realizaste cambios en ellas.
5. Pulsa Actualizar Producto y comprueba los datos en la lista.

El stock global de un producto sin variantes se modifica desde Entradas Producto. El costo de compra también puede estar bloqueado según tus permisos. Las imágenes principales se administran con Agregar Imágenes desde la lista.

> CAPTURA P18 — Edición. Muestra Actualizar Producto y los avisos de stock o costo de solo lectura.

## 15. Eliminar un producto

1. Localiza el producto en la sucursal correcta.
2. Pulsa su papelera.
3. El navegador pregunta ¿Eliminar este producto?. Cancela si no corresponde o acepta para continuar.
4. Si la operación se completa, el producto desaparece de la lista. Si falla, aparece Error al eliminar.

Esta pantalla no ofrece un botón para deshacer la eliminación. Si solo deseas cambiar la publicación en la página, revisa el interruptor de visibilidad del formulario.

> CAPTURA P19 — Confirmación de eliminación del producto. Incluye el diálogo del navegador y el producto de referencia.

## 16. Importar productos desde CSV

La importación aparece cuando el plan o complemento de la cuenta la habilita. Usa Descargar CSV de ejemplo como plantilla; un archivo Excel con extensión .xlsx no es el archivo CSV solicitado.

1. Selecciona la sucursal de destino y comprueba su nombre.
2. Pulsa Descargar CSV de ejemplo.
3. Abre una copia en tu hoja de cálculo y conserva los encabezados exactos.
4. Sustituye las filas de ejemplo por tus productos, una fila por artículo.
5. Conserva los códigos como texto para no perder ceros iniciales. Introduce importes sin signo de moneda y con punto decimal.
6. Guarda como CSV delimitado por comas, preferentemente UTF-8, y comprueba que la primera línea conserve las columnas de la plantilla.
7. Pulsa Importar productos CSV y selecciona el archivo .csv. La carga comienza al seleccionarlo.
8. Espera mientras aparece Importando CSV… y revisa el mensaje de resultado.
9. Busca los productos importados y comprueba nombres, precios, IVA y existencias.

> CAPTURA P20 — Acceso a importación. Muestra Importar productos CSV y Descargar CSV de ejemplo.

Columnas de la plantilla, en su orden original:

- sku: código del producto. Ejemplo FIL001.
- name: nombre del producto. Ejemplo Filtro de aceite.
- price: precio final. Ejemplo 116.00.
- discount: porcentaje de descuento. Ejemplo 0.
- new: indicador de nuevo; la plantilla usa 1 para sí y 0 para no.
- saleCount: dato de cantidad de ventas incluido en la plantilla. Ejemplo 0.
- rating: calificación. Ejemplo 4.5.
- shortDescription: descripción corta.
- fullDescription: descripción larga.
- base_price: precio sin IVA. Ejemplo 100.00.
- iva: tasa en decimal. La plantilla usa 0.16 para 16%.
- visible: indicador de visibilidad; la plantilla usa 1 para sí y 0 para no.
- stock: existencias. Ejemplo 10.

La plantilla contiene 13 columnas. Usa las herramientas de exportación de tu hoja de cálculo para que los textos con comas se guarden correctamente entre comillas.

La plantilla disponible no incluye categorías, imágenes, variantes, almacenes ni costo de compra; completa esos datos desde el formulario después de importar. Tampoco documenta cómo representar EXENTO. Las vistas no especifican si un código repetido actualiza o duplica un producto ni si un error revierte todas las filas: antes de repetir una carga, verifica los registros que ya aparecieron.

> CAPTURA P21 — Plantilla CSV. Muestra los 13 encabezados y una fila de ejemplo.

> CAPTURA P22 — Resultado de importación. Muestra el aviso y los productos incorporados a la lista.

## 17. Imprimir etiquetas

1. En la fila del producto, pulsa Imprimir etiquetas.
2. Selecciona Tamaño: 38 × 25, 50 × 30, 60 × 40, 70 × 35 o 100 × 50 mm.
3. Para otra medida, elige Personalizada e indica Ancho (mm) y Alto (mm).
4. Revisa la vista previa PDF.
5. Utiliza los controles de impresión o descarga del visor. Abrir en pestaña permite consultar el PDF por separado.
6. Comprueba que el tamaño de papel de la impresión corresponda a las etiquetas y cierra la ventana al terminar.

> CAPTURA P23 — Etiqueta PDF. Incluye tamaño, dimensiones, vista previa y Abrir en pestaña.

## 18. Límites, mensajes y solución de problemas

- Límite alcanzado: consulta el contador del encabezado. El alta depende de la capacidad del plan. En esta versión el formulario puede mostrar el mismo bloqueo al intentar editar cuando el límite está alcanzado; comunícalo al administrador.
- Falta Código, Nombre, Precio, IVA, Stock o Descripciones: completa el campo señalado; Stock aplica al alta sin variantes.
- La suma por almacén no coincide: corrige las cantidades para igualar el stock global o el de la variante correspondiente.
- Almacén repetido o sin seleccionar: revisa cada fila y evita duplicados.
- No aparece Importar productos CSV: verifica que la cuenta tenga habilitada la función por plan o complemento.
- Error al importar: comprueba extensión, encabezados, delimitador y formato de los valores. Revisa la lista antes de reintentar.
- Error con imágenes: verifica que sean imágenes, no superen 2 MB cada una y que el total principal sea de hasta 6.
- No encuentro una categoría nueva: vuelve a abrir Productos para actualizar las opciones y comprueba la sucursal.
- Error al guardar categorías: revisa la asignación después de que se recarguen los datos y vuelve a intentar solo si no se guardó.

## 19. Ejercicio de práctica

En una sucursal de prueba, crea Filtro de aceite con código FIL001, precio 116.00, IVA 16%, stock inicial 10 y ambas descripciones. Asigna una categoría, agrega una imagen y guarda. Busca el producto, edita su descripción y abre la vista de etiquetas. Registra una entrada de 5 unidades desde Entradas Producto; si no hay otros movimientos, la existencia resultante será 15.

## 20. Capturas y alcance de la guía

Reemplaza cada recuadro CAPTURA por la imagen indicada. Usa la misma sucursal de ejemplo en todo el documento y conserva visibles los nombres de los botones. Puedes agregar imágenes adicionales debajo de cada recuadro.

Guía elaborada a partir de las pantallas, validaciones y plantilla CSV del proyecto. No se realizaron operaciones en una sesión real ni se validaron reglas adicionales del servicio. Los comportamientos no confirmados se señalan en sus apartados.
