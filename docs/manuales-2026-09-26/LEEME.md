# Manuales de usuario — 26 de septiembre de 2026

Los archivos Word son editables e incluyen índice, encabezados, números de página y recuadros para insertar capturas. Los archivos Markdown contienen el mismo texto para facilitar futuras actualizaciones.

- [Productos](01-productos.docx): catálogo, creación, edición, eliminación, categorías, variantes, almacenes, imágenes, etiquetas e importación CSV. 23 espacios para capturas.
- [Entradas](02-entradas.docx): entradas y salidas de inventario, proveedores, adjuntos, consulta, historiales y reportes. 19 espacios para capturas.
- [Personalización del ticket](03-personalizacion-ticket.docx): mensajes, dirección, logo, QR, medidas de papel, guardado, vista previa y relación con la impresión del POS. 12 espacios para capturas.
- [Administración de puntos de venta](04-administracion-puntos-venta.docx): creación, edición, credenciales, almacenes, acceso y eliminación. 10 espacios para capturas.
- [Inicio de sesión y operación del POS](05-inicio-sesion-operacion-pos.docx): acceso, ventas, formas de pago, tickets, pendientes, crédito, clientes, historial, cancelaciones, devoluciones, facturas, notas, conexión de impresora, servicios y reportes. 46 espacios para capturas.

Para colocar una imagen en Word, selecciona el texto dentro del recuadro y usa Insertar > Imágenes. El recuadro puede crecer según el tamaño de la captura. Conserva el título que explica qué debe mostrarse. Puedes agregar varias imágenes cuando una ventana sea larga.

Las guías se basan en las vistas del proyecto disponibles en esta fecha. Las funciones dependen de permisos, plan, complementos y respuesta del servicio. No se hicieron operaciones reales durante la documentación. Se verificó la estructura de los archivos Word, la presencia de todo el texto y los 110 recuadros; no se verificó su paginación mediante una aplicación de escritorio.

Los manuales anteriores permanecen en la carpeta docs. Esta edición está separada para conservar las versiones existentes y sus capturas.

El script generar-word.ps1 permite regenerar los cinco Word desde sus Markdown. Al ejecutarlo se reemplazan los Word de esta carpeta: si ya agregaste imágenes o modificaste un Word, conserva una copia antes de regenerar.
