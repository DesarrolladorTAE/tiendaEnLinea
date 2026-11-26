# 16. Contratos exactos: agenda y disponibilidad

Fuentes: `routes/api.php`, `BookingConfigController`, `BookingAvailability`, `ServiceOperationScope`, modelos `BookingConfig`, `BookingSchedule`, `BookingScheduleException` y reglas de validación del controlador. Paths relativos a `/api`.

## Booking config

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/branches/{branchId}/services/{serviceId}/booking-config` | Sanctum; Store o POS de esa sucursal |
| PUT | misma ruta | Sanctum; solo Store con permiso de configuración |

El scope valida tenant/sucursal y `service_sales` (incluido plan `ventas-de-servicios`). GET lee únicamente configuración de la sucursal; no cae a la configuración global. PUT crea o actualiza configuración `appointment` de esa sucursal.

### Reglas reales de PUT

| Campo | Tipo y presencia | Rango / semántica | Si se omite |
|---|---|---|---|
| `is_active` | boolean requerido | — | 422 |
| `duration_minutes` | integer requerido | 1–1440 minutos | 422 |
| `slot_interval_minutes` | integer requerido | 1–1440 minutos | 422 |
| `capacity_per_slot` | integer requerido | 1–1000 | 422 |
| `capacity_per_day` | nullable integer opcional | null o 1–10000 | al crear null/DB default; al actualizar conserva |
| `min_advance_minutes` | integer requerido | 0–525600 minutos | 422 |
| `max_advance_days` | integer requerido | 1–730 días | 422 |
| `buffer_minutes` | integer opcional | 0–1440 minutos, guardado en JSON config | conserva valor previo; si nuevo, 0 |
| `requires_confirmation` | boolean opcional | — | conserva; al crear DB default false |
| `weekly_schedules` | array requerido, max 28 | estructura siguiente | 422 |
| `exceptions` | array opcional, max 366 | estructura siguiente | se interpreta como `[]`: borra las existentes |

Cada `weekly_schedules[]`: `weekday` requerido integer 0–6 (domingo=0); `is_enabled` requerido boolean; `start_time` y `end_time` requeridos `HH:mm`; `capacity_override` nullable integer 1–1000. Debe haber una hora inicial menor a la final. Puede repetirse weekday, hasta 28 filas total. Las franjas habilitadas no pueden solaparse en un mismo día; franjas contiguas sí. Horario nocturno cruzando medianoche no está permitido. Franjas deshabilitadas siguen requiriendo tiempos válidos, pero no participan en el cotejo de solapamiento.

Cada `exceptions[]`: `date` requerido `YYYY-MM-DD`; `type` requerido en `closed|blocked|holiday|open|special|override`; `start_time`, `end_time` nullable `HH:mm`; `capacity_override` nullable integer 1–1000; `reason` nullable string max 191. No se validan cruces nocturnos; las ventanas abiertas requieren horas útiles para producir slots. Las excepciones abiertas/especiales/override sustituyen las franjas semanales si hay ventanas; cierres/bloqueos/holiday quitan disponibilidad. No hay validación de solapamiento entre excepciones.

PUT reemplaza por completo las filas de horarios semanales y excepciones: `weekly_schedules` siempre es requerido y vacío falla `required`; `exceptions` omitido o vacío elimina todas las excepciones existentes. No es un PATCH. El servidor fija `booking_type=appointment`, `store_id`, `branch_id`, `service_id`.

No existe `version`, ETag ni precondición de actualización. Hay bloqueo transaccional de configuración para escrituras, pero no detección de edición obsoleta en cliente (última escritura válida prevalece).

### GET sin configuración

```http
GET /api/branches/12/services/45/booking-config
```
```json
{"data":null}
```

### GET configurada (ejemplo ilustrativo)

```json
{"data":{"id":8,"store_id":3,"branch_id":12,"service_id":45,"booking_type":"appointment","is_active":true,"duration_minutes":60,"slot_interval_minutes":30,"capacity_per_slot":2,"capacity_per_day":12,"min_advance_minutes":60,"max_advance_days":30,"requires_confirmation":false,"config":{"buffer_minutes":10},"weekly_schedules":[{"id":1,"booking_config_id":8,"weekday":1,"is_enabled":true,"start_time":"09:00:00","end_time":"13:00:00","capacity_override":null},{"id":2,"booking_config_id":8,"weekday":1,"is_enabled":true,"start_time":"14:00:00","end_time":"18:00:00","capacity_override":2}],"schedule_exceptions":[]}}
```

La representación de tiempos del modelo puede incluir segundos según serialización DB; la petición acepta `HH:mm`.

### PUT para crear o actualizar

```json
{
  "is_active": true,
  "duration_minutes": 60,
  "slot_interval_minutes": 30,
  "capacity_per_slot": 2,
  "capacity_per_day": 12,
  "min_advance_minutes": 60,
  "max_advance_days": 45,
  "buffer_minutes": 10,
  "requires_confirmation": true,
  "weekly_schedules": [
    {"weekday": 1, "is_enabled": true, "start_time": "09:00", "end_time": "13:00", "capacity_override": null},
    {"weekday": 1, "is_enabled": true, "start_time": "14:00", "end_time": "18:00", "capacity_override": 2},
    {"weekday": 2, "is_enabled": false, "start_time": "09:00", "end_time": "17:00"}
  ],
  "exceptions": [
    {"date": "2026-12-25", "type": "closed", "reason": "Festivo"},
    {"date": "2026-12-26", "type": "open", "start_time": "10:00", "end_time": "14:00", "reason": "Horario especial"}
  ]
}
```

Respuesta exitosa sigue `{"data": <BookingConfig con weekly_schedules y schedule_exceptions>}`; modelo recién guardado y relaciones recargadas. Los campos y formato DB pueden serializarse con timestamps.

Respuesta de validación HTTP 422 (shape Laravel):

```json
{"message":"The weekly schedules.0.start time field must match the format H:i.","errors":{"weekly_schedules.0.start_time":["The weekly schedules.0.start time field must match the format H:i."]}}
```

Los textos de validación pueden estar localizados; claves de `errors` siguen los paths de campo.

## Disponibilidad

`GET /branches/{branchId}/services/{serviceId}/availability?date=YYYY-MM-DD&resource_id=ID`

Query `date` requerido con formato exacto `Y-m-d`; `resource_id` opcional integer ≥1. Se usa `config('app.timezone')`, no una zona de la tienda enviada por cliente. El scope verifica servicio activo/branch/tenant y feature de operación. Si `resource_id` no existe, está inactivo o es de otra sucursal: 404. Si existe en la sucursal pero no está asociado activamente al servicio: 422.

Respuesta efectiva:

```json
{"data":{"branch_id":12,"service_id":45,"date":"2026-11-30","timezone":"America/Mexico_City","slots":[{"date":"2026-11-30","start_time":"09:00","end_time":"10:00","resource_ids":[7,9]}]}}
```

La API **no devuelve** `capacity_total`, `capacity_occupied`, `capacity_remaining`, contadores de cupo, `duration_minutes` efectivo ni `requires_confirmation`. Cada slot solo publica fecha, horas y `resource_ids`. `slots: []` representa ausencia de slots candidatos, sin razón discriminada. Un consumidor no debe inferir una causa exacta de una lista vacía.

Precedencia para duración: `resource_services.duration_override` si existe; de otro modo `booking_config.duration_minutes`, con fallback al `service.duration_minutes`, luego 60 minutos. `slot_interval_minutes` define el avance de inicio. Buffer configurado en `booking_config.config.buffer_minutes` (default 0) separa ocupación. `min_advance_minutes` y `max_advance_days` recortan ventana permitida. El recurso debe estar activo y asociado al servicio; si el servicio requiere recurso y no hay asignación elegible no salen slots. Capacidad por slot y día considera reservas activas del mismo servicio, y ocupación del recurso considera órdenes activas. Reservas canceladas/completadas no ocupan cupo según las reglas del servicio.

Si existe booking config específica de sucursal se usa esa, incluso inactiva; si no existe, Availability busca configuración global (`branch_id=null`) de tipo appointment. Sin ninguna configuración lanza 404. Una configuración inactiva produce 409. La regla de confirmación afecta el flujo de reserva posterior y no aparece en respuesta de disponibilidad.

### Respuestas según situación

| Caso | Respuesta efectiva |
|---|---|
| Día disponible | `200 {"data":{"branch_id":12,"service_id":45,"date":"2026-11-30","timezone":"America/Mexico_City","slots":[...]}}` |
| Día sin cupos / cerrado | 200, misma forma y `slots: []` |
| Agenda inactiva | 409 JSON de error con mensaje “Las reservaciones están deshabilitadas para este servicio.” |
| Agenda inexistente | 404 al no encontrar config appointment global ni de sucursal |
| `resource_id` inválido/inactivo/foráneo | 404 |
| Recurso en sucursal pero sin asociación activa al servicio | 422 validation errors |
| Recurso asociado sin disponibilidad | 200 y `slots: []` |

La respuesta vacía no diferencia día cerrado, lleno ni falta de recursos. No hay versión/ETag para reservar con precondición; disponibilidad es informativa y el endpoint de creación de booking vuelve a validar. Códigos 401 autenticación, 403 permiso/feature, 404 scope o configuración ausente, 422 parámetros/relación incorrecta, 409 agenda inactiva.

## Evidencia del contrato

- Rutas: `routes/api.php`, declaraciones booking-config y availability.
- Validación y JSON: `app/Http/Controllers/Api/BookingConfigController.php`.
- Cálculo de slots, fallback y timezone: `app/Services/Bookings/BookingAvailability.php` (la ruta puede inyectar el servicio fachada de disponibilidad).
- Scope: `app/Services/Bookings/ServiceOperationScope.php`.
- Modelos: `app/Models/BookingConfig.php`, `BookingSchedule.php`, `BookingScheduleException.php`.
- La forma descrita se deriva del código. No se ejecutaron pruebas Feature para generar capturas en esta entrega.

