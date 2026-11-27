# Dictamen actualizado de certificación operativa

| Área | Estado | Resultado |
|---|---|---|
| Backend fases 1–7 | Parcial | Código y pruebas existentes; no equivale a flujo integral. |
| Lookup puntual POS | Aprobado en SQLite | Implementado; Feature 5/23 y regresión catálogo total 55/548. |
| Pruebas automatizadas dirigidas | Parcial | Fase 8: 310 pass/4 fail en ejecuciones; Tours conocido 404/422 y 3 TaeConta por fixture sin `sale_payments`. Conteos pueden solaparse. |
| HTTP real | Pendiente | No hay instancia Laravel aislada autorizada. Bearer probado dentro del kernel Feature. |
| MySQL | Pendiente/bloqueante | Host/base no identificados; sin migraciones, concurrencia ni carga MySQL. |
| Seguridad comercial POS | Bloqueada | V2 no consulta pivote terminal-almacén y acepta `unit_price`/descuento del cliente. Riesgo de `/admin/pos-token` cross-tenant documentado en 51. |
| Reportes | Parcial | Suite SQLite 6/70; tax basis desconocido, cruces extensos MySQL pendientes. |
| React–Laravel | Pendiente | 404/79 suites/Vite reportado por usuario; integración real pendiente. |
| Producción | **No aprobada** | Riesgo crítico de cobro y validaciones HTTP/MySQL/integral pendientes. |

Código V2 valida almacén de misma tienda, activo y sucursal, pero no `pos_location_warehouse`. La creación está en transacción, pero no se ejecutó prueba HTTP que mida filas/saldo antes y después para almacenes manipulados. `unit_price`, `original_price`, `discount_percent` son aceptados; total/impuesto se reconcilian con lo enviado y producto. Esto no acredita precio permitido. No se modificó la lógica comercial por falta de autorización específica.

Mantener buscador/vínculo POS deshabilitados para cobros hasta corregir y validar. V2 no tiene clave de idempotencia confirmada: no recrear una venta ante respuesta perdida.

No se ejecutó recorrido integral único, concurrencia MySQL, ni carga 1k/6k/10k. Caja fija/inversión/gastos reales y `cost_tax_basis` siguen pendientes.

Sin migraciones nuevas; revisar [inventario](70-migraciones-despliegue.md). No hubo venta real, despliegue, commit ni push.

## Actualización del cierre

La consulta puntual también rechaza una tienda marcada inactiva y no serializa variantes inactivas. `PosProductLookupTest` quedó en 5/23; la regresión con `ProductSearchTest` y `VehicleCatalogTest` quedó en 55/548. Sigue sin existir bandera `PosLocation.is_active` en el modelo inspeccionado.

## Autenticación POS verificada estáticamente

`POST /pos/login` busca terminal por `code`, valida `access_code` de seis caracteres y emite Sanctum token; no comprueba un atributo activo de terminal porque `PosLocation` no lo tiene. `POST /admin/pos-token` requiere Store pero el código obtiene `PosLocation` solo por ID sin comparar `pos.store_id` con Store autenticada; conserva riesgo cross-tenant y además emite token dos veces en el bloque existente.

`/pos/me`, `/pos/modules/enabled` y venta V2 usan `auth:sanctum`; V2 no añade `store.access`. La configuración define guards `store-api` y `pos-api` Sanctum; `CheckStoreAccess` busca esos guards. El buscador vehicular está dentro de `api.auth:sanctum` + `store.access`; sus pruebas históricas deshabilitan `CheckStoreAccess`, así que el recorrido real de token a través del middleware no se probó. Las rutas de órdenes usan `auth:sanctum` y `ServiceOperationScope`, que deriva actor/sucursal/tienda y revisa acceso, plan/módulo y overrides POS. Se confirmó el recorrido por código, no con servidor HTTP entre repositorios.
