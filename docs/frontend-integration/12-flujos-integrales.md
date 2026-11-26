# Flujos integrales para frontend

## Alta y atención de servicio

1. Consultar módulos/capacidad disponibles y sucursal autorizada.
2. Consultar cliente; crear/seleccionar cliente por API existente.
3. Si expedientes habilitados, crear vehículo; si no, servicio puede operar sin vehículo cuando no sea requerido.
4. Consultar servicio, su configuración de booking y formularios.
5. Consultar disponibilidad para fecha/recurso.
6. Crear cita con clave idempotente; backend revalida capacidad.
7. Confirmar/reprogramar/llegada mediante rutas de acción.
8. Convertir cita a orden; operación idempotente.
9. Asignar técnico/recurso y registrar kilometraje por ruta correspondiente.
10. Iniciar orden y formulario; renderizar `schema_snapshot`, guardar borrador y completar.
11. Buscar refacción con `service_order_id`; mostrar compatible/universal/unknown y stock autorizado.
12. Añadir/cobrar con flujo POS existente; el buscador no vende ni reserva.
13. Vincular `sale_id` a la orden.
14. Completar orden; backend impide finalizar si formularios obligatorios están pendientes.
15. Descargar PDF/thermal autenticado.
16. Consultar historial del vehículo y reportes administrativos autorizados.

La prueba automatizada unificada del proceso completo quedó pendiente en la revisión de fase 8; las pruebas existentes cubren subflujos. No presentar este flujo como E2E ya ejecutado.

## Búsqueda POS

```http
GET /api/products/search-by-vehicle?vehicle_id=VEHICLE_ID&sku=000123&warehouse_id=WAREHOUSE_ID
```

El servidor deriva vehículo y valida tenant/sucursal. Selección de producto conserva ID/SKU/variante; precio y existencia se vuelven a validar al crear la venta. Vincular venta a orden solo después de la operación comercial confirmada.

## Reporte

Solicitar JSON semanal o mensual para periodo y branch autorizados; representar `null` como no disponible/desconocido. Descargar PDF/XLSX con mismos filtros. No convertir asignación 60/40 en egreso real ni emitir movimiento financiero.

