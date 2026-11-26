# Configuración de servicios y recursos

## Rutas disponibles

Todas estas rutas están bajo `auth:sanctum`. Operan en el ámbito de `branches/{branchId}` y los controladores deben validar pertenencia de sucursal a tienda/terminal.

| HTTP | Ruta | Acción |
|---|---|---|
| GET, POST | `/branches/{branchId}/services` | listar y crear servicio |
| GET, PUT, POST, DELETE | `/branches/{branchId}/services/{serviceId}` | consultar, modificar o eliminar servicio |
| GET, PUT | `/branches/{branchId}/services/{serviceId}/booking-config` | leer/guardar horarios y reglas de agenda |
| GET | `/branches/{branchId}/services/{serviceId}/availability` | disponibilidad calculada |
| GET, POST | `/branches/{branchId}/services/{serviceId}/resources` | listar/asociar recursos |
| PUT, DELETE | `/branches/{branchId}/services/{serviceId}/resources/{resourceId}` | modificar/desasociar recurso |
| GET, PUT | `/branches/{branchId}/resources/{resourceId}/schedule` | consultar/guardar horario semanal de recurso (solo tienda) |
| GET, PUT | `/branches/{branchId}/services/{serviceId}/forms` | asociación opcional/obligatoria de formularios |

La ruta usa GET/PUT/POST/DELETE según `route:list`; el POST mapea a actualización en `ServiceController`. No confundir disponibilidad calculada con reserva: `GET` no aparta capacidad.

## Parámetros y cuerpos

La disponibilidad usa query `date=YYYY-MM-DD` y admite `resource_id` (cuando aplica). La estructura exacta completa de service y booking config está definida por las reglas de validación de `ServiceController`/`BookingConfigController`; no se debe enviar un objeto config parcial si el endpoint reemplaza el JSON completo.

Las propiedades de `services.config` verificadas en el código son `vehicle_requirement` y `forms`. La API recibe `vehicle_requirement` en nivel superior y lo devuelve en `service.config.vehicle_requirement`; el controlador lo fusiona con el JSON existente. Formularios se gestionan por `/forms`, que fusiona la clave `forms`. La agenda se almacena en `booking_configs`, separada de services.config. Conservar cualquier otra clave preexistente.

Para cambiar `vehicle_requirement`, enviar el campo top-level (no `config`); el backend preserva `forms` y demás claves. Para formularios, usar `/forms`. Ver documentos 15 y 18.

Reglas completas, defaults, imágenes, filtros, paginación y respuestas están en [15-contratos-exactos-configuracion-servicios.md](15-contratos-exactos-configuracion-servicios.md). `service_type` es texto libre; `booking_type` no es campo de servicio.

## Horarios, excepciones y capacidad

`PUT booking-config` reemplaza horarios y excepciones para servicios con `booking_type=appointment`. Ejemplo documentado en la guía de fase 4:

```json
{
  "is_active": true, "duration_minutes": 60, "slot_interval_minutes": 30,
  "capacity_per_slot": 1, "capacity_per_day": 12,
  "min_advance_minutes": 60, "max_advance_days": 30,
  "buffer_minutes": 15, "requires_confirmation": false,
  "weekly_schedules": [{"weekday": 1, "is_enabled": true, "start_time": "09:00", "end_time": "18:00"}],
  "exceptions": [
    {"date": "2026-12-25", "type": "closed", "reason": "Festivo"},
    {"date": "2026-12-26", "type": "open", "start_time": "10:00", "end_time": "14:00"}
  ]
}
```

`weekday`: domingo 0 a sábado 6. Tipos abiertos: `open`, `special`, `override`; cierres/bloqueos: `closed`, `blocked`, `holiday`. `GET availability` devuelve slots y `resource_ids`, no contadores de capacidad. Reglas exactas, colecciones reemplazadas y errores están en [16-contratos-exactos-agenda-disponibilidad.md](16-contratos-exactos-agenda-disponibilidad.md).

## Recursos y técnicos

La asociación del recurso al servicio usa el endpoint anidado anterior; la asignación a una orden es `PATCH /branches/{branchId}/service-orders/{orderId}/resource`. `user_id` no valida elegibilidad contra catálogo de técnicos; el backend no provee aquí una lista de técnicos elegibles. Ver documento 17.

## Ejemplo de lectura

```http
GET /api/branches/BRANCH_ID/services/SERVICE_ID/booking-config
Authorization: Bearer <sesión/token Sanctum>
Accept: application/json
```

Los placeholders no son IDs reales. El body y la respuesta exactos están en el documento 16.

