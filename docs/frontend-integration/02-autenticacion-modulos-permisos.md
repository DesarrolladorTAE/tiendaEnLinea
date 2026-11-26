# Autenticación, módulos y permisos

## Autenticación

Las rutas operativas enumeradas en esta entrega están protegidas por `auth:sanctum`, `api.auth:sanctum` u otro middleware indicado en el inventario. Usar la sesión Sanctum SPA o bearer token que ya configure el cliente. Incluir `Accept: application/json`. El login POS real está en `POST /pos/login`; no enviar secretos en URLs ni guardar tokens en archivos del frontend.

## Resolver capacidades sin IDs codificados

El backend dispone de:

- `GET /public/storefront/{storeSlug}/capabilities`: capacidades visibles del storefront/sucursal pública. Confirmar la forma exacta en `StorefrontController::capabilities` antes de definir el tipo TS; no es un sustituto de autorización en endpoints privados.
- `GET /public/storefront/{storeSlug}/branches`: sucursales publicadas.
- `GET /pos/modules` y `PUT /pos/modules`: configuración de módulos visibles del POS, protegida por Sanctum; `GET /pos/modules/enabled` también existe en el grupo POS.
- `GET /perfil/mi-tienda`: contexto de tienda autenticado.
- `POST /pos/me`: método efectivo en `routes/api.php`; protegido con `ApiAuthenticate:sanctum` y `CheckStoreAccess`. Devuelve identidad POS y `abilities`, no lista de almacenes ni capacidades por sucursal.

No se identificó una ruta universal autenticada de “capacidades por sucursal” que cubra todos los módulos. El catálogo vehicular y expedientes se validan en servidor por `VehicleFeature`; formularios por `FormFeature`; operación de servicios por `ServiceOperationScope`. El frontend puede ocultar controles según configuración visible, pero el servidor sigue siendo la autoridad.

## Módulos

| Capacidad | Mecanismo identificado | Consecuencia |
|---|---|---|
| Catálogo vehicular | `vehicle_catalog` / `VehicleFeature` y ajuste de catálogo de sucursal | habilita búsqueda/compatibilidades; no implica expedientes |
| Expedientes | `vehicle_records` / `VehicleFeature::recordsEnabled()` | necesario para gestionar/consultar expedientes y contexto vehicle_id |
| Formularios | `service_forms` / `FormFeature` | plantillas y captura de formularios |
| Agenda/órdenes | ámbito operativo de servicios (`ServiceOperationScope`) | operaciones de sucursal, sujeto a configuración/permisos |
| Reportes | autenticación de tienda (`Store`); no se identificó módulo separado | POS no debe recibir costos/utilidades |
| POS visibles | `/pos/modules` | configuración del terminal POS; no concede permisos de administración de tienda |

No hay endpoint verificado que devuelva todos esos campos en una respuesta unificada. Para contratos y sustitución de condiciones codificadas, ver [19-capacidades-privadas-permisos-rutas.md](19-capacidades-privadas-permisos-rutas.md). No usar capacidades públicas como autorización. Tratar 403 del servidor como autoridad.

## Credenciales y acciones

- **Store admin:** configuración de servicios, plantillas, compatibilidades, importación/exportación, reportes y configuración financiera, según control de tipo de usuario en controlador.
- **POS:** operaciones de su sucursal; no asumir acceso a administración de catálogos o reportes.
- **Usuario autenticado con permiso de sucursal:** vehículos/documentos donde la política permita acceso.

La declaración de rutas establece middleware de autenticación, pero no todas las rutas tienen `can:*` explícito en `routes/api.php`; controladores y scopes aplican validación adicional. Por ello, “permiso requerido” debe interpretarse según la acción y el actor probado en tests. No inventar nombres de permiso RBAC que no aparezcan en el código.

## Contratos de módulos POS

`GET /pos/modules` y `GET /pos/modules/enabled`: requieren Sanctum. `PUT /pos/modules`: escritura Store-only; ver documento 19 para validación. Estas rutas no representan una API genérica de capacidades por sucursal.

