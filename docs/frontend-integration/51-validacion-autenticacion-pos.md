# Validación de autenticación POS y aislamiento

## Estado actualizado tras corrección (2026-11-27)

`POST /admin/pos-token` ahora exige Store activo y con acceso vigente, acota POS a `store_id` del actor, comprueba sucursal activa de esa tienda y genera un solo token con la ability previa `sell-only`. Pruebas Feature SQLite: 4 aprobadas/15 aserciones. El contenido histórico de abajo documenta el hallazgo que motivó el fix; la brecha cross-tenant ya no describe el código actual.

La autorización se resuelve por módulos/scopes, no por middleware `abilities:`. No se ejecutó recorrido HTTP externo con token de login POS. Ver detalle, limitaciones y riesgos abiertos en [anexo 75](75-integracion-operativa-pos-seguridad.md).

## Dictamen histórico (antes del fix)

## Dictamen

**No habilitar terminales para el nuevo flujo de cobro especializado todavía.** El código confirma autenticación Sanctum de terminal para varias rutas, pero también demuestra una ruta administrativa que puede emitir token de otra tienda y una brecha en el endpoint de venta V2 descrita en [52](52-validacion-almacenes-precios-cobro.md). No se cambió código en esta revisión.

## Recorrido real de identidad POS

1. `POST /pos/login` (`POSAuthController::login`) valida `code` y `access_code` de seis caracteres, compara el código de acceso en texto y emite un token personal Sanctum con habilidad `sell-only`. La ruta de login no requiere token.
2. El guard `pos-api` usa Sanctum con el proveedor `PosLocation`. `auth:sanctum` puede resolver el token de terminal sin sesión administrativa.
3. `CheckStoreAccess` busca primero identidad `store-api` y después `pos-api`. Para POS exige tienda asociada y `Store::hasAccess()`, pero no comprueba `Store::is_active`, estado de terminal (no hay columna `is_active` en `pos_locations`) ni módulos.
4. `POST /pos/me` está bajo el grupo de rutas de productos con `api.auth:sanctum` y `store.access`; el método devuelve id, nombre, código, diseño, aviso de factura, `store_id` y abilities.
5. `GET /pos/modules/enabled` usa `auth:sanctum`, sin `store.access`; `PosModuleController` admite Store o POS y calcula módulos según plan/configuración y overrides. No demuestra autorización para operaciones de negocio.

## Operaciones solicitadas y control de acceso

| Operación | Ruta y método | Middleware/scope efectivo | Resultado de revisión |
|---|---|---|---|
| identidad | `POST /pos/me` | `api.auth:sanctum`, `store.access` | Compatible con token POS; no valida módulo. El controller también serializa Store si se invoca con esa identidad. |
| módulos POS | `GET /pos/modules/enabled` | `auth:sanctum` | Permite token POS; visibilidad/configuración no equivale a autorización del cobro. |
| búsqueda especializada | `GET /products/search-by-vehicle` | Ruta de catálogo bajo `api.auth:sanctum`, `store.access` | `VehicleCatalogController::search` acepta Store/POS por contexto; POS queda acotado a su sucursal y almacenes del pivote. El test existente desactiva `CheckStoreAccess`, por lo que no prueba el recorrido entero del middleware. |
| detalle orden | `GET /branches/{branchId}/service-orders/{orderId}` | `auth:sanctum`, `ServiceOperationScope::branch/order` | POS admitido si tienda activa/con acceso, módulo/plan de servicios disponible y sucursal coincide. No depende de sesión administrativa. |
| vínculo venta | `POST /branches/{branchId}/service-orders/{orderId}/sale` | igual anterior | POS admitido por scope; body `sale_id`. Reglas y estados en [53](53-reconciliacion-ventas-vinculacion.md). |

No se ejecutó una prueba de integración con token bearer generado por `POST /pos/login` para las cinco rutas: las suites existentes usan `Sanctum::actingAs` o eliminan middleware en algunos casos. No presentar eso como verificación HTTP completa.

## Riesgos verificados en código

### Emisión de token de otra tienda

`POST /admin/pos-token` exige una identidad `Store`, pero valida `pos_id` solo con `exists:pos_locations,id`; después busca el POS globalmente y emite un token sin comparar `pos.store_id` con `user.id`. Un usuario de tienda A que conozca un id de tienda B puede solicitar un token de B. El endpoint crea dos tokens consecutivos y devuelve el segundo. Corrección mínima recomendada: limitar la búsqueda de POS por `store_id = usuario.id`, emitir un solo token y probar el intento cruzado; no se aplicó porque la actividad autoriza revisión, no modificación de autenticación.

### Estado de tienda/terminal

`Store::hasAccess()` solo evalúa pago/vigencia de plan o trial, no `is_active`. El login y `CheckStoreAccess` no exigen tienda activa. El esquema/modelo `PosLocation` tampoco tiene estado activo verificable. Por tanto, el backend no permite concluir que una terminal haya sido deshabilitada individualmente; el acceso puede revocarse invalidando tokens o mediante los mecanismos de configuración existentes, que no equivalen a un flag de terminal.

### Alcances distintos

La búsqueda vehicular deriva store/branch del actor y limita almacenes a `pos_location_warehouse`. El módulo de servicios verifica además estado activo de Store, acceso y feature `ventas-de-servicios`. El cobro V2, en cambio, no tiene `store.access`, verificación de módulo ni chequeo de `is_active` en la ruta/controlador/servicio revisados. La UI no debe tratar `modules/enabled` como garantía de autorización.

## Evidencia de pruebas

Ejecución actual: `php artisan test tests/Feature/VehicleCatalogTest.php tests/Feature/ProductSearchTest.php tests/Feature/ServiceOperationsTest.php tests/Feature/PosModulesTest.php` — **70 passed, 680 assertions**, duración 7.85 s. Son pruebas Laravel con SQLite en memoria por configuración de los tests; no son MySQL ni terminal HTTP externa. `VehicleCatalogTest` cubre almacén asignado en el contexto POS pero desactiva `CheckStoreAccess`; `ServiceOperationsTest` cubre scopes/aislamiento con identidad Store; `PosModulesTest` cubre configuración/overrides.

## Conclusión operativa

El token POS es identidad Sanctum real y los scopes de búsqueda vehicular/servicios no requieren AUTH_TOKEN administrativo. Sin embargo, antes de habilitar venta especializada se deben corregir y probar el endpoint de emisión cross-tenant, las validaciones de almacén y precio de V2. Este reporte no autoriza ni ejecuta esos cambios.
