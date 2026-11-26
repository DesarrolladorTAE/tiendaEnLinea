# 19. Capacidades privadas, permisos y rutas transversales

Paths relativos a `/api`. Evidencia principal: `routes/api.php`, `VehicleFeature`, `FormFeature`, `ServiceOperationScope`, `PosModuleController`, `BranchCatalogSettingsController`, `StoreController::miTienda`, `POSAuthController::me`, `StorefrontController`.

## Señal privada de módulos

React debe resolver módulos con la API privada autenticada `GET /pos/modules` (Sanctum). Respuesta real con forma `{data:[{key,name,sort_order,available,enabled,visible,source}]}`. `GET /pos/modules/enabled` devuelve el subconjunto visible. Claves relevantes: `vehicle_catalog`, `vehicle_records`, `service_forms`; el módulo de operación de servicios se identifica como `service_sales`. `available` representa acceso por plan/entitlement; `enabled` configuración; `visible` combina disponibilidad y habilitación; `source` indica configuración `general` o `pos`.

```json
{"data":[{"key":"vehicle_catalog","name":"Catálogo vehicular","sort_order":30,"available":true,"enabled":true,"visible":true,"source":"general"},{"key":"vehicle_records","name":"Expedientes vehiculares","sort_order":31,"available":true,"enabled":false,"visible":false,"source":"general"},{"key":"service_forms","name":"Formularios de servicio","sort_order":32,"available":true,"enabled":true,"visible":true,"source":"pos"}]}
```

Las filas anteriores son fixture ilustrativo. La implementación de UI puede mostrar catálogo cuando `visible=true`, pero autorización real siempre la valida cada endpoint. Store puede consultar `GET /pos/modules?pos_location_id={id}` solo para una terminal propia. PosLocation no puede inspeccionar otra terminal; no incluir parámetro o usar la identidad actual. `PUT /pos/modules` configura módulos y es Store-only; `GET /pos/modules/enabled` no es capacidades de sucursal genéricas.

Defaults de `PosModuleService`: `vehicle_catalog`, `vehicle_records`, `service_forms` deshabilitados si no hay configuración; otros módulos pueden tener default habilitado. Plan/permisos pueden hacer `available=false`; no se debe equiparar `enabled=false` a usuario no autenticado.

## Capacidad por sucursal de catálogo vehicular

`GET /admin/branches/{branch}/catalog-settings` (Sanctum; Store o POS de esa sucursal); `PATCH` misma ruta (solo Store). El GET/PATCH conserva las propiedades `data` anteriores y agrega `capabilities`:

```json
{"data":{"branch_id":12,"vehicle_feature_available":true,"catalog_search_mode":"both","vehicle_compatibilities_enabled":true,"capabilities":{"scope":{"branch_id":12,"actor":"store","pos_location_id":null},"vehicle_catalog":{"available":true,"enabled":true,"visible":true,"source":"general","scope":"store_branch","branch_compatibilities_enabled":true,"authorization":{"read":true,"write":true}},"vehicle_records":{"available":true,"enabled":true,"visible":true,"source":"general","scope":"store_branch","authorization":{"read":true,"write":true,"manage_status":true}},"service_forms":{"available":true,"enabled":true,"visible":true,"source":"general","scope":"store_branch","authorization":{"read":true,"capture":true,"configure":true}}}}}
```

Campos PATCH opcionales: `catalog_search_mode` enum `normal|vehicle|both`; `vehicle_compatibilities_enabled` boolean. No enviar `store_id` o `branch_id`. Controlador comprueba la tienda y branch; POS puede leer su branch, pero no modificar. `vehicle_feature_available` es el indicador privado de módulo de catálogo a nivel tienda (incluye fallback legacy por compatibilidad configurada). `vehicle_compatibilities_enabled` es el indicador efectivo de compatibilidad para esa branch (`feature_available && flag_branch`). `catalog_search_mode` es preferencia de experiencia `normal|vehicle|both`, no un permiso; si el módulo no está disponible se fuerza `normal`.

En cada capacidad, `available/enabled/source` provienen de `PosModuleService` (o `source=legacy` si las tablas de módulos no están instaladas); `visible` además aplica los feature gates de backend. `scope` distingue configuración Store/branch de POS acotado a branch. `authorization` expresa acciones concretas existentes, no roles RBAC: catálogo `read/write` (write = administración de compatibilidades, Store-only y branch habilitada); expedientes `read/write` y `manage_status` Store-only; formularios `read/capture` y `configure` Store-only.

Ejemplo POS de la misma tienda: `scope.actor="pos"`, `scope.pos_location_id=31`; `vehicle_catalog.authorization.write=false` y `service_forms.authorization.configure=false`. Si el POS tiene override `vehicle_records=false`, reporta `enabled=false`, `visible=false` y autorización de lectura/escritura falsa. Tienda con módulos apagados conserva el DTO, con `enabled=false` y `visible=false`; las propiedades anteriores siguen presentes.

Ejemplo de módulo disponible pero deshabilitado por configuración: `{"available":true,"enabled":false,"visible":false,"source":"general",...}`. Si el plan no lo habilita, `available=false`; `visible` permanece false. Un error HTTP (401/403/404/5xx) no es un estado de capacidad: debe tratarse como autenticación, scope/autorización o error de consulta.

El bloque privado `capabilities` incluye expedientes vehiculares (`vehicle_records`) y formularios (`service_forms`) con el alcance y las acciones descritas abajo. `/pos/modules` expone señales de módulo para el contexto POS. `GET /perfil/mi-tienda` ofrece identidad básica y `permissions.can_edit_purchase_cost`. Este último contiene una condición histórica por ID de tienda y se refiere al costo de compra.

## Distinguir estados

| Estado | Señal / respuesta verificable |
|---|---|
| Módulo disponible y habilitado | `/pos/modules`: `available=true, enabled=true, visible=true` |
| Disponible pero deshabilitado | `available=true, enabled=false, visible=false` |
| No disponible por plan | `available=false`; no habilitar control aunque `enabled` heredado sea true |
| Sin autenticación | 401 en endpoint privado |
| Actor no autorizado para operación | 403; por ejemplo POS intenta PUT config o módulo requerido apagado |
| Sucursal ajena/no visible | normalmente 404 para ocultar existencia; endpoints que validan ID de terminal inválido pueden dar 422 |
| Configuración de branch desactivada | `vehicle_compatibilities_enabled=false` aunque tienda tenga catálogo |
| Error de consulta | timeout/red/5xx; no equivalen a módulo disabled; conservar/indicar estado desconocido y reintentar |

Para servicios/forms se aplican mecanismos propios: `ServiceOperationScope` verifica `service_sales`, plan `ventas-de-servicios`, acceso a branch y override por POS; `FormFeature` verifica `service_forms`, plan, branch y override POS. Controller puede devolver 403 aunque la UI haya ocultado función.

## Cinco condiciones `store.id === 566`

Sustituir cada condición por datos cargados después de autenticar el contexto, no por endpoint público:

1. Cargar `GET /pos/modules` para el terminal activo (o Store con `pos_location_id` solo en pantalla administrativa).
2. Consultar `GET /admin/branches/{branchId}/catalog-settings` en pantallas con acceso a branch; usar `vehicle_feature_available` para disponibilidad y `vehicle_compatibilities_enabled` para compatibilidades de esa branch.
3. Usar clave `vehicle_records` para expedientes y `service_forms` para formularios.
4. Separar estado `loading/error/disabled/enabled`; no interpretar fallo de red como habilitación/deshabilitación.
5. Respetar 403/404 del backend y refrescar capacidades cuando cambie branch/terminal.

No usar `GET /public/storefront/{storeSlug}/capabilities`: devuelve capacidades públicas del plan de escaparate (templates/carrusel etc.), no autorización administrativa.

### Alcance y límites de autorización

La respuesta combina señales privadas para Store o POS autenticado y no acepta ID de tienda/terminal por query. Store solo consulta branch de su tenant; POS solo la propia branch. `vehicle_catalog` conserva los gates existentes: la preferencia de módulo del POS determina visibilidad pero no se añadió un nuevo gate a los endpoints de catálogo. En expedientes el override POS refleja el gate de `VehicleController`; otros endpoints pueden tener scopes propios. En formularios, `FormFeature` ya aplica override POS. `authorization` es señal auxiliar para UI, no sustituye autorización del endpoint invocado.

Pruebas: `tests/Feature/BranchPrivateCapabilitiesTest.php` cubre módulos habilitados/deshabilitados, respuesta previa preservada, aislamiento de sucursal/tienda, POS de misma sucursal, override de terminal y escritura administrativa prohibida.

## Rutas de identidad y módulos POS

| Método | Ruta | Middleware / actor | Controlador y efecto |
|---|---|---|---|
| POST | `/pos/me` | `ApiAuthenticate:sanctum`, `CheckStoreAccess`; credencial de sesión/token POS | `POSAuthController@me`; retorna user `id,name,code,interface_design,public_invoice_reminder,store_id,abilities` |
| GET | `/pos/modules` | `auth:sanctum`; Store o PosLocation | lista módulos con available/enabled/visible/source; Store puede `?pos_location_id=` propio |
| GET | `/pos/modules/enabled` | `auth:sanctum`; identidad POS | lista `data` filtrada a módulos visibles |
| PUT | `/pos/modules` | `auth:sanctum`; Store solamente | actualiza módulos generales o de POS propio; body requerido `modules[]` con `key`, `enabled`, opcional `pos_location_id` |
| GET | `/perfil/mi-tienda` | `auth:sanctum` | `StoreController@miTienda`; perfil básico, no capacidades |
| GET, PATCH | `/admin/branches/{branch}/catalog-settings` | Sanctum y check de store; PATCH Store-only | settings privados de catálogo vehicular, no terminal/almacenes |
| GET | `/public/storefront/{storeSlug}/capabilities` | Público, sin credencial | `StorefrontController`; plan de escaparate, nunca autorización privada |
| GET | `/public/storefront/{storeSlug}/branches` | Público | sucursales publicadas del storefront |

La ruta efectiva `/pos/me` es POST, no GET. El prefijo storefront es `/public/storefront`, no `/storefront`.

El payload `/pos/me` identifica `store_id` y usuario/terminal autenticado, más `abilities`; la pertenencia de terminal y sus almacenes autorizados se determina por las rutas operativas que cargan POS/branch y sus scopes. `/pos/me` no expone lista de almacenes ni `branch_id`; no usarlo para inferir almacenes accesibles. No se encontró endpoint universal de capacidades por sucursal.

`PUT /pos/modules` body validado: `modules` required array min1, claves únicas/conocidas, cada elemento exige `enabled` nullable boolean; `pos_location_id` opcional nullable y dentro de store. No se permite activar módulo no disponible: 422. Ejemplos completos de consulta y errores están en fixtures del documento 20.

## Rutas públicas vs privadas y errores

Catálogo público de escaparate no concede permisos de tienda. Las rutas de formularios, configuración de servicio y documentos usan Sanctum más scopes internos. 401 significa autenticación ausente/inválida; 403 actor/módulo/plan denegado; 404 recurso fuera de ámbito o inexistente; 422 validación; 5xx falla del servicio. No mapear todos estos casos a “módulo no habilitado”.

