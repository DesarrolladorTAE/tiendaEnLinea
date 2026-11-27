# Rendimiento

No se midieron cargas de 1k/6k/10k productos ni tiempos/consultas/memoria en MySQL. No utilizar la latencia SQLite como estimación MySQL. Tampoco se ejecutó perfilador de consultas en este cierre.

`VehicleCatalogTest`, `ProductSearchTest` y `ProductExcelExportTest` ejercitan filtros/paginación/importación con bases de prueba pequeñas, pero no certifican catálogo amplio, N+1 ni exportaciones voluminosas. No se agregaron índices sin medición y justificación.

Para validación posterior: sembrar catálogos sintéticos de 1,000, 6,000 y 10,000 productos con compatibilidades múltiples; usar EXPLAIN/slow query log del MySQL de pruebas; medir p50/p95, número de queries y peak memory para búsqueda, historial, agenda y reportes/exportaciones. Comparar paginación por ID puntual contra endpoint actual antes de proponer nueva ruta.
