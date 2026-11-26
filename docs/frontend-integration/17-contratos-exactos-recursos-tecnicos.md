# 17. Contratos exactos: recursos y técnicos

Fuentes: `routes/api.php`, `ResourceController`, `TourScope`, relaciones `Resource`, `ResourceService`, `ResourceWeeklySchedule`. Paths relativos a `/api`.

## Rutas / autorización

| Método | Ruta | Acceso |
|---|---|---|
| GET, POST | `/branches/{branchId}/resources` | GET Store/POS de la sucursal; POST solo Store |
| GET, PUT, POST, DELETE | `/branches/{branchId}/resources/{resourceId}` | GET Store/POS; mutaciones solo Store |
| GET, PUT | `/branches/{branchId}/resources/{resourceId}/schedule` | GET Store/POS; PUT solo Store |
| GET, POST | `/branches/{branchId}/services/{serviceId}/resources` | GET Store/POS; POST solo Store |
| PUT, DELETE | `/branches/{branchId}/services/{serviceId}/resources/{resourceId}` | solo Store |

Todas llevan `auth:sanctum`; el scope limita la sucursal activa a la tienda autenticada y, para POS, a su sucursal. POST en `/resources/{resourceId}` también actualiza. No se declara permiso RBAC nominal en la ruta.

## Lista y detalle de recursos

`GET /branches/{branchId}/resources?search=texto&type=employee&is_active=1&available=1&page=1`

Filtros opcionales: `search` sobre `name`, `resource_code`, `description`; `type` comparación exacta, sin regla enum del query; `is_active` boolean; `available=true` fuerza activo. Orden definido por controlador, 16 por página. Respuesta `{success,branch,resources:<LengthAwarePaginator>}`.

`GET /branches/{branchId}/resources/{resourceId}` responde `{success:true,branch:{id,name},resource:<Resource>}` con servicios relacionados (pivot `duration_override`, `price_override`, `is_active`) y horarios semanales ordenados.

## Crear / editar

`POST /branches/{branchId}/resources` y `PUT|POST /branches/{branchId}/resources/{resourceId}` consumen JSON:

| Campo | Regla | Crear / omisión |
|---|---|---|
| `resource_code` | nullable string max100, único por sucursal | null |
| `type` | requerido al crear; sometimes|required al editar; enum `employee,vehicle,room,space,equipment,capacity,other` | — |
| `name` | requerido al crear; sometimes|required al editar; string max191 | — |
| `description` | nullable string | null |
| `capacity` | nullable integer min1 | 1 |
| `user_id` | nullable integer | null; se conserva solo para type employee |
| `config` | nullable array JSON | null |
| `is_active` | nullable boolean | true |

`store_id` y `branch_id` proceden del contexto; no enviar para reasignar tenant. `user_id` no tiene comprobación de pertenencia/tabla FK porque los modelos de empleado varían. El backend no proporciona en este contrato un catálogo de técnicos elegibles ni garantiza que un integer corresponda a un empleado activo. El campo `name` es el identificador visible del recurso y `id` su ID. Respuesta creada: HTTP 201 `{success:true,message,resource:<modelo>}`; edición 200 con misma forma.

Desactivar recurso por `PUT is_active:false` lo excluye de disponibilidad. `DELETE /resources/{id}` es soft deactivate (`is_active=false`) y desactiva relaciones servicio-recurso; conserva registro y citas/historial. Reactivarlo no reactiva automáticamente las asociaciones previamente desactivadas.

## Asociación a servicio

`GET /branches/{branchId}/services/{serviceId}/resources?is_active=1&type=employee` retorna `{success:true,branch,service,resources:[Resource con pivot]}`; no pagina.

POST body (asociación/upsert de cada relación):

```json
{"resources":[{"resource_id":7,"duration_override":45,"price_override":null,"is_active":true},{"resource_id":9,"duration_override":null,"price_override":120,"is_active":true}]}
```

`resources` requerido array mínimo 1. Cada `resource_id` requerido integer; el recurso debe pertenecer a misma tienda y sucursal. Overrides son nullable: duración integer ≥1; precio numérico ≥0; `is_active` nullable boolean. Default al asociar: overrides null, activa. No se impone `distinct` por resource_id; evita repetir IDs en cliente. Respuesta 201 `{success:true,message,resources:[...]}`. POST repetido actualiza/upsert la asociación, no duplica el recurso.

`PUT .../resources/{resourceId}` es parcial: `duration_override` nullable integer ≥1, `price_override` nullable numérico ≥0, `is_active` nullable boolean; omitir conserva. Asociación inexistente devuelve 404 JSON.

`DELETE .../resources/{resourceId}` marca la asociación `is_active=false`; no elimina recurso ni cambia citas existentes. La disponibilidad nueva deja de ofrecerlo. Las citas ya creadas no se borran ni se reescriben.

## Horario semanal del recurso

`GET .../resources/{resourceId}/schedule`:

```json
{"data":{"resource_id":7,"weekly_schedules":[{"id":10,"resource_id":7,"weekday":1,"is_enabled":true,"start_time":"09:00:00","end_time":"17:00:00"}]}}
```

`PUT` body:

```json
{"weekly_schedules":[{"weekday":1,"is_enabled":true,"start_time":"09:00","end_time":"13:00"},{"weekday":1,"is_enabled":true,"start_time":"14:00","end_time":"18:00"},{"weekday":0,"is_enabled":false,"start_time":"09:00","end_time":"17:00"}]}
```

`weekly_schedules` debe estar presente y ser array máximo 28; se admite `[]` para borrar las franjas del recurso. Omitir la propiedad sigue dando 422. Fila: `weekday` requerido int 0–6 (domingo=0), `is_enabled` requerido boolean, `start_time/end_time` formato `H:i`, inicio anterior a fin. Varias franjas diarias permitidas; las habilitadas no pueden traslaparse. No se admiten rangos nocturnos cruzando medianoche. No hay excepciones ni zona horaria por recurso. PUT borra y vuelve a insertar la colección completa; no fusiona. Con `[]` se eliminan únicamente las filas `resource_weekly_schedules`; no se eliminan citas, órdenes ni historial. Respuesta `{data:{resource_id,weekly_schedules:[]}}`.

### Efecto de no tener franjas del recurso

`BookingAvailability` aplica el filtro horario del recurso solo cuando su colección semanal no está vacía. Por tanto, sin franjas el recurso no tiene una restricción propia de horas y puede aparecer durante los horarios de la agenda del servicio. Esto no crea disponibilidad ilimitada: siguen aplicando horario/excepciones del servicio, anticipación, duración, ocupación, capacidad, asociación y estado activo. La API no distingue “sin configuración” de “sin disponibilidad” mediante otro estado; ambas se representan según el cálculo de slots. React debe advertir al administrador que limpiar el horario quita la restricción horaria del recurso. No se cambió la política operativa existente.

## Errores y límites

401 no autenticado; 403 POS intenta mutar, actor no Store u operación no permitida; 404 recurso/sucursal/servicio de otra tienda/sucursal; 422 validación de cuerpo. `DELETE` conserva la entidad y desactiva disponibilidad. Una cita ya existente no es reprogramada/cancelada de forma automática al desactivar recurso o asociación.

## Evidencia del contrato

- Rutas: `routes/api.php`, resources y service resources.
- Validación, filtros y respuestas: `app/Http/Controllers/Api/ResourceController.php`.
- Scope: `app/Services/Tours/TourScope.php`.
- Modelos/relaciones: `app/Models/Resource.php`, `ResourceService.php` y `ResourceWeeklySchedule.php`.
- La elegibilidad de `user_id` no se valida como técnico: no hay endpoint de elegibilidad en este contrato.
- Prueba de reemplazo vacío y no eliminación de cita: `tests/Feature/ServiceOperationsTest.php::test_resource_schedule_and_disabled_resource_change_availability`.

