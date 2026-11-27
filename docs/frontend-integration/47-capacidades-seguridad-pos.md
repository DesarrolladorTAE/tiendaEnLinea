# 47. Capacidades y seguridad POS

## Módulos efectivos

`GET /pos/modules` (`auth:sanctum`) returns `{data:[{key,name,sort_order,available,enabled,visible,source}]}`. `GET /pos/modules/enabled` returns same row shape only where `visible=true`. `PosModuleController::context` accepts Store or PosLocation; terminal receives its effective module state; query `pos_location_id` is accepted for Store and must belong to Store, while a POS actor cannot name a different terminal (`403`). These APIs expose visibility/capability context, not a replacement for authorization on every API request.

`source` is `pos` when terminal override exists, else `general`. `available` uses Store access/plan feature and other module-specific requirements; `enabled` is effective preference, and `visible=available && enabled`. The module mapper defaults `vehicle_catalog`, `vehicle_records`, `service_forms` disabled if no preference. `vehicle_catalog` module does not map a plan feature here; the effective controller-level `VehicleFeature::available` checks the Store module setting or legacy fallback. Use module response to render menus, but interpret 403/404 from endpoint as authoritative.

Relevant keys: `vehicle_catalog`, `vehicle_records`, `service_forms`, `service_sales`, `service_reports`. `service_sales` maps plan feature `ventas-de-servicios`; `vehicle_records` and `service_forms` also map to `ventas-de-servicios`. Catalog has legacy `branches.vehicle_compatibilities_enabled` fallback. Store preferences are in `store_pos_modules`, POS override in `pos_location_modules`.

`PUT /pos/modules` is Store-only, not terminal; body `{pos_location_id?:number|null,modules:[{key:string,enabled:boolean|null}]}`; setting null at terminal removes override; general settings require boolean. It cannot enable unavailable module. Do not use public storefront `capabilities` for admin authorization.

## Private branch settings

`GET /admin/branches/{branch}/catalog-settings` is Store read or POS read only in its own branch; `CheckStoreAccess` accepts the `pos-api` Sanctum guard and checks parent Store access. It returns `data.capabilities.vehicle_catalog`, `.vehicle_records`, `.service_forms`; structure has `available,enabled,visible,source,scope,authorization`. Catalog `authorization.read` effective module and `.write` Store + catalog + branch compat switch. Records `.authorization.read/write` reflect feature and POS false override; `.manage_status` Store only. Forms `.read/.capture` reflect module and POS override; `.configure` Store only. These are action capability hints, not individual RBAC grants. Feature tests should retain middleware for a true POS request; existing vehicle tests disable it.

## Scope by operation

| Operation | Confirmed scope / requirement |
|---|---|
| `my-products-by-pos1` | Same store as requested `pos_location_id`; product branch; warehouse relation of requested POS. Does not enforce requested POS ID equals authenticated POS ID. |

**Cierre:** `GET /api/pos/products/{productId}` deriva el POS del bearer y no acepta ID de terminal por query; filtra stock al allowlist. Ver [72](72-consulta-puntual-producto-pos.md). No corrige el alcance heredado del listado ni la brecha warehouse de POST V2.
| private vehicle catalog | Store or intended POS own branch; `vehicle_catalog`; POS additionally must not have terminal overrides disabled for `vehicle_catalog` or `sales`. `CheckStoreAccess` checks parent Store access through `pos-api` guard. Existing tests verify controller with middleware disabled, not full POS middleware traversal. |
| `vehicle_id` search context | `vehicle_records` effective feature; POS false override blocks; POS vehicle must be present in service order at POS branch. |
| `service_order_id` | Branch must belong exact Store/POS; POS only its branch; `service_sales`/plan. If it derives an attached vehicle, `vehicle_records` must also be enabled. Snapshot preferred. |
| GET order detail/list | ServiceOperationScope; same store+branch; Store/POS; POS terminal override service_sales. No employee identities supported by scope. |
| attach sale | Same branch scope; sale same store, customer matches order, sale POS terminal is branch; sale cannot already link other order. Does not validate payment status. |
| warehouse picker/search | Search results are limited to POS-linked warehouses; transaction V2 checks active same-store/branch and stock but inspected code does not check POS warehouse pivot. |

## Administrative order to POS context

Pass only `branchId` and `orderId` in a route/deep link inside the authenticated POS application. Do not include customer phone/name/VIN in URL. POS authenticates using its own Sanctum token; then reads `/branches/{branchId}/service-orders/{orderId}`. The branch scope rejects foreign branches; order lookup is scoped store+branch. Detail includes `vehicle_snapshot`, `customer_snapshot`, linked sale compact relation, and forms progress. It is appropriate to retrieve the context after terminal login rather than transfer PII from Store application.

There is no documented one-time handoff token that binds Store selection to POS. If business requires secure cross-app launch without exposing order ID to user, propose a short-lived, single-use signed handoff resolved by POS identity; no implementation authorized here.

## Remove hardcoded store ID 566

Do not replace `store.id===566` with a different constant. Derive module/rendering state from the authenticated Store's `GET /pos/modules` or terminal's same endpoint and use `visible` for navigation; use `GET /admin/branches/{id}/catalog-settings` private response for branch scopes where reachable. Use route 403/404 handling for actual access; do not let client capabilities alone grant access. For vehicle_records, require both module visibility and permission to use corresponding records endpoint. Do not show customer vehicle context in an ordinary product search simply because vehicle_catalog is visible.

## Token and payload minimization warnings

- Store auth token and POS terminal token are distinct; do not share tokens or accept URL-supplied token.
- `my-products-by-pos1` currently serializes `purchase_cost` and `profit_factor`, including some inventory subobjects. Hiding values in React is not data minimization. Backend change/authorization review required if POS actors should not receive them.
- Search endpoint response must not expose an unauthorized warehouse. Tests verify one assigned and reject warehouse ID outside assigned POS; the POS test disables `CheckStoreAccess`, so scope/controller behavior is verified, while middleware traversal remains untested.
- Public catalog has no access to vehicle/order IDs, stock warehouse selector, or private POS price context; never use it as a private fallback.

