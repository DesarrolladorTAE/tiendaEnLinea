# Importación y exportación vehicular

## Rutas

| HTTP | Ruta | Uso |
|---|---|---|
| POST | `/products/import-with-vehicles` | importación combinada producto/compatibilidades |
| GET | `/products/import-with-vehicles/template` | plantilla combinada |
| POST | `/vehicle-compatibilities/import` | importar relaciones |
| GET | `/vehicle-compatibilities/import/template` | plantilla de relaciones |
| GET | `/vehicle-compatibilities/export` | exportar relaciones |

Están dentro del grupo autenticado/comercial de `routes/api.php` (`api.auth:sanctum`, `store.access`). Verificar que el usuario sea Store/admin autorizado; la autenticación del grupo sola no equivale a permiso de importación.

## Formatos y compatibilidad

- El archivo original de seis columnas sigue soportado, sin cambiar orden/significado.
- La exportación v2 usa `?include_classification=1` para agregar columnas opcionales de clasificación universal explícita y marca comercial.
- Importador combinado reconoce `is_vehicle_universal` / `Universal vehicular (1/0)` y `commercial_brand` / `Marca comercial de la refacción`.
- SKU es texto para conservar ceros iniciales.
- Múltiples compatibilidades/rangos por producto se mantienen como relaciones, no productos duplicados.
- Archivo anterior sin columnas de clasificación y celdas vacías conserva clasificación/relaciones existentes al actualizar.
- Campo vacío no significa universal. Solo valor explícito verdadero clasifica universal.
- Marcas comerciales son fabricante de refacción, no marca vehicular.

La respuesta de importación contiene resultado/errores por fila conforme al controller/import service; consultar su JSON real antes de mapear a UI. Las plantillas se descargan como archivo, no JSON. No hacer carga masiva de datos reales desde el frontend sin confirmación del usuario.

## Prueba de ida y vuelta

Fase 8 corrigió el intercambio v2: lectura de columnas adicionales, interpretación booleana y persistencia de universal explícito/marca comercial; el formato tradicional y las compatibilidades se conservan. La verificación es prueba local de backend; no implica datos reales importados.

