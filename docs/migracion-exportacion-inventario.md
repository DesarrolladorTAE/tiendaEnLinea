# Migración de exportación de productos

Contrato del backend confirmado por el usuario. Esta entrega actualiza únicamente
el frontend; no incluye cambios PHP, rutas ni migraciones de base de datos.

## Formato generado por ProductosExcelController.php

| Característica | Consulta (`display`) | Importación (`import`) |
| --- | --- | --- |
| Fila informativa | Fila 1 | No existe |
| Encabezados | Descriptivos, fila 2 | Técnicos, fila 1 |
| Primera fila de productos | 3 | 2 |
| ID | Si se selecciona | Excluido siempre |
| Imágenes | Opcionales, cantidad 1–10 | Excluidas siempre |
| Costo de compra | Disponible como `purchase_cost` | Disponible como `purchase_cost` |
| Visible | Sí/No | 1/0 |

El backend filtra `id` e `images` de `fields` en modo import, aunque otro cliente los
envíe seleccionados. Este frontend también los excluye de la lista, del contador,
de «Seleccionar todo» y de la petición en ese modo. Las opciones muestran nombres
técnicos al importar y descriptivos al consultar; las selecciones se conservan
por separado para cada modalidad. No corresponde al frontend generar, renombrar o mover las
columnas, ni transformar Visible. Seleccionar ambos campos en import no obliga al
servidor a incluirlos. La cantidad de imágenes se muestra solo en consulta y se
conserva al cambiar de modalidad, al igual que la selección de campos.

Se conserva GET `/reportes/productos-excel`, el cliente Axios autenticado,
`responseType: blob` y los parámetros `fields`, `mode`, `_t` e `images` cuando
está seleccionado. El servidor es la autoridad sobre los campos efectivos.

## Detalles de la implementación Laravel comunicados

- `headerRow = import ? 1 : 2`; `dataStartRow = import ? 2 : 3`.
- La nota y la combinación de celdas de la fila 1 se aplican únicamente a display.
- Los encabezados y sus estilos usan `headerRow`, sin referencias fijas a fila 2.
- Los productos comienzan en `dataStartRow`.
- `lastRow = max(headerRow, row - 1)` permite exportaciones sin productos.
- Los bordes comienzan en `headerRow`; la alineación numérica solo se aplica
  cuando `lastRow >= dataStartRow`, evitando rangos invertidos o vacíos.

## Comprobaciones al desplegar

1. Display con ID, costo, Visible e imágenes: nota en fila 1, encabezados fila 2,
   productos fila 3, Visible como Sí/No e imágenes según la cantidad elegida.
2. Import con los mismos campos solicitados: sin ID ni imágenes, encabezados fila
   1, productos fila 2, Visible como 1/0 y costo de compra conservado.
3. Ambas modalidades sin productos: encabezados presentes y estilos válidos,
   sin rangos numéricos invertidos ni combinaciones sobre encabezados de import.
4. Volver a display: se recuperan sus campos seleccionados y la cantidad de imágenes,
   independientemente de la selección realizada en import.

Los nombres de descarga conservan la descripción por modalidad y la fecha/hora
de Ciudad de México. Esta documentación no afirma haber inspeccionado el PHP ni
los archivos XLSX de producción; las comprobaciones del contenido corresponden
al despliegue conjunto con el backend actualizado.
