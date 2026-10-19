# Tours dentro del formulario de servicios

## Alcance comprobado en el repositorio

No hay código Laravel, OpenAPI ni route:list de rutas/paradas en este repositorio.
Las siguientes operaciones están respaldadas por los servicios y consumidores
existentes del frontend; no se verificaron mediante peticiones autenticadas al
servidor. Las rutas son relativas al cliente Axios existente (baseURL con /api/).

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | branches/{branchId}/services/{serviceId} | Datos generales del servicio |
| POST | branches/{branchId}/services | Crear servicio mediante FormData |
| POST con _method=PUT | branches/{branchId}/services/{serviceId} | Actualizar datos generales |
| GET | branches/{branchId}/services/{serviceId}/departures | Salidas, parámetros page y per_page=16 |
| GET | branches/{branchId}/services/{serviceId}/departures/{departureId} | Detalle antes de editar |
| POST | branches/{branchId}/services/{serviceId}/departures | Crear salida |
| PUT | branches/{branchId}/services/{serviceId}/departures/{departureId} | Actualizar salida |
| GET | branches/{branchId}/tour-routes | Catálogo paginado de rutas |
| GET | branches/{branchId}/tour-routes/{routeId} | Detalle de cada ruta utilizada, una vez por ID |
| GET | branches/{branchId}/tour-routes/{routeId}/stops | Paradas de una ruta (sin paginar) |
| GET | branches/{branchId}/resources | Recursos del selector existente de salidas |

Las salidas usan el parser departureCollection/departureRecord existente.
El catálogo de rutas espera routes, data o una lista; las paradas esperan stops,
data o una lista. Rutas y paradas de catálogo se paginan; las paradas de una ruta no. El formulario carga todas las páginas
de salidas y consulta las paradas una sola vez por ruta utilizada. Un fallo de
consulta no se presenta como una lista vacía exitosa.

El diálogo existente envía exclusivamente tour_route_id, resource_id,
departure_date, departure_time, estimated_return_time, capacity, price, status,
notes. Los estados existentes son scheduled, boarding, departed, completed,
cancelled. Cada salida se guarda por separado; después se vuelven a consultar
salidas, rutas y paradas. Los datos de TourDeparture/TourRoute/TourStop nunca se
envían como propiedades de Service. Para tours nuevos se conserva la creación de
Service y, si la respuesta incluye service.id o data.id, se abre su edición para
configurar salidas; si no incluye ID, se vuelve al listado habitual.

## Contratos de escritura confirmados e implementados

El usuario proporcionó los payloads, validaciones y reglas de los controladores
Laravel y de TourRouteStopService. No fue necesario modificar el backend.

| Método | Ruta relativa | Campos permitidos por el frontend |
| --- | --- | --- |
| POST / PUT | branches/{branchId}/tour-routes[/{routeId}] | name, origin, destination, description, is_active |
| GET | branches/{branchId}/tour-stops | Catálogo completo con paginación |
| GET | branches/{branchId}/tour-stops/{stopId} | Detalle antes de editar |
| POST / PUT | branches/{branchId}/tour-stops[/{stopId}] | name, address, lat, lng, reference, is_active |
| POST | branches/{branchId}/tour-routes/{routeId}/stops | tour_stop_id, stop_order, default_departure_time, boarding_minutes, price_adjustment |
| PUT | branches/{branchId}/tour-routes/{routeId}/stops/{stopId} | stop_order, default_departure_time, boarding_minutes, price_adjustment; nunca tour_stop_id |
| DELETE | branches/{branchId}/tour-routes/{routeId}/stops/{stopId} | Sin cuerpo; solo desvincula |

Los servicios API filtran los campos de escritura y requieren contexto store.
No se envían store_id, branch_id ni propiedades de Service en estos payloads.
La sucursal es la seleccionada en el formulario. No se agregan clientes Axios,
credenciales ni prefijos /api adicionales.

## Interfaz y persistencia

ServiceTourSection carga todas las páginas de salidas, deduplica sus rutas por ID
y consulta el detalle y las paradas de cada ruta. También permite seleccionar otra
ruta del catálogo para administrarla sin crear una asociación directa con Service.
La ruta se asocia al servicio mediante el selector de ruta de cada salida.

TourEntityDialog crea y edita rutas y paradas con sus campos reales. La referencia
se guarda exclusivamente en TourStop. Advierte que los cambios a una parada o
ruta compartida afectan a otros tours/salidas que la utilizan.

TourRouteStopDialog permite asociar una parada existente (excluye las ya presentes)
y editar su abordaje. Crear una parada nueva primero ejecuta POST tour-stops y,
una vez obtenido su ID, abre el diálogo para confirmar POST de la asociación.
Cancelar el segundo paso conserva la parada creada en el catálogo. Si falla la
asociación se puede reintentar sin crear otra parada.

Subir/Bajar ejecuta exactamente un PUT con stop_order igual a la posición destino.
El backend reordena las demás paradas en su transacción. El frontend espera el
éxito y vuelve a consultar los datos; no intercambia posiciones mediante varios
PUT ni conserva un orden provisional como resultado definitivo.

Quitar solicita confirmación e invoca solo DELETE de la asociación. Nunca se
invoca DELETE tour-stops ni se elimina/desactiva una parada global desde esta UI.

Cada operación tiene su propio guardado y bloquea envíos duplicados mientras
está pendiente. Los submits de diálogos se aíslan del formulario de Service.
Tras guardar, se recargan salidas, catálogo de rutas, detalles y paradas. Si la
recarga falla, el éxito del guardado se conserva y el error de consulta se muestra.

## Respuestas, errores y límites

Se aceptan los envoltorios ya usados por el frontend: route/stop, data u objeto
directo con ID válido. No se intenta deducir IDs por nombre. Si una creación tiene
éxito HTTP pero no devuelve un ID reconocible, se informa que el registro fue
guardado y se refresca el catálogo para seleccionarlo manualmente; no se repite
la creación ni se inventa una asociación. Se necesita una respuesta real para
confirmar otros envoltorios si el backend usa uno diferente.

200 y 201 se consideran éxitos HTTP; 422 conserva el diálogo con sus valores y
muestra los mensajes/errores por campo. 401/403/404 muestran el mensaje del backend
o un mensaje de sesión, permisos o recurso no disponible. No se hicieron llamadas
autenticadas al servidor de producción durante las verificaciones.

Se validan nombres de hasta 191 caracteres, coordenadas y límites reales de la
asociación, incluida la precisión de dos decimales del ajuste de precio. Los IDs
de relación ausentes bloquean edición/ordenamiento para evitar modificar otro
registro. No hay operaciones pendientes por falta de contrato ni endpoints nuevos
requeridos para este alcance. La importación/exportación Excel no se modifica.

## Verificación local

`node scripts/verify-tour-service-form.cjs` comprueba paginación, rutas compartidas,
lectura de pivots, aislamiento de submits, validación 422, creación/actualización,
listas de campos permitidos, un único PUT para reordenar, refresco y eliminación
exclusiva de relaciones mediante cliente HTTP simulado.

`npx vite build` verifica el empaquetado del frontend.

