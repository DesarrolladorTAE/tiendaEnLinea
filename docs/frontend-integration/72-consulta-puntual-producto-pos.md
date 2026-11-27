# Consulta puntual de producto POS

## Contrato

- **GET** `/api/pos/products/{productId}`
- Ruta `routes/api.php`, grupo `auth:sanctum`; controlador `ProductController::productForAuthenticatedPos`.
- Requiere bearer POS_TOKEN de `PosLocation`. Sin credencial: 401. Store/empleado u otra identidad: 403.
- No requiere catálogo vehicular; es catálogo POS tradicional. Contexto derivado del POS autenticado; no acepta `pos_location_id`, `store_id`, `branch_id` ni warehouse por query/body.
- `productId`: entero en path. Sin query/body.
- `200`: `ok`, `store_id`, `branch_id`, `pos`, `product`. `404`: producto fuera del catálogo/almacenes accesibles. `403`: tienda sin `Store::hasAccess()` o sucursal no ligada/activa.

El producto debe corresponder a tienda/sucursal del POS. Sucursal nula solo se admite con `show_unassigned_products=true` y sin inventario por almacén. Producto con inventario requiere stock en warehouse activo, misma tienda/sucursal y asignado a terminal por `pos_location_warehouse`. Variantes inactivas no se incluyen. Se reutiliza `Product::toBranchArray()` y se eliminan `purchase_cost` y `profit_factor` en todos los niveles; además, se filtran filas de almacén al allowlist. Para inventario por almacén, el `stock` raíz se devuelve como 0 y las cantidades autorizadas están bajo warehouse/variante.

No existe campo `PosLocation.is_active` en el modelo revisado, ni `Product.is_active`; `visible` existe pero el catálogo POS paginado no lo filtra. El endpoint conserva esa política. Valida token Sanctum, acceso de tienda, sucursal activa y alcance del catálogo.

### Petición

```http
GET /api/pos/products/101
Accept: application/json
Authorization: Bearer <POS_TOKEN>
```

### Respuesta ilustrativa derivada del serializador

```json
{
  "ok": true,
  "store_id": 31,
  "branch_id": 41,
  "pos": {"id": 61, "name": "Caja ficticia", "show_unassigned_products": false, "allowed_warehouses_count": 1},
  "product": {
    "id": "101", "sku": "000101", "name": "Balata", "oe_number": "OE-TEST-01",
    "price": 125, "base_price": "125.000000", "iva": 0.16, "discount": 0,
    "has_variants": false, "use_warehouse_inventory": true, "stock": 0,
    "warehouse_inventories": [{"warehouse_id": 71, "warehouse_name": "Almacén autorizado", "qty": 3, "price": 125}],
    "variants": [], "category_ids": [], "categories": [],
    "pos_inventory": {"use_warehouse_inventory": true, "show_unassigned_products": false, "allowed_warehouse_ids": [71], "allowed_warehouses_count": 1}
  }
}
```

`product` conserva las propiedades de `toBranchArray()` salvo costos/margen; añade `category_ids`, `categories`, `pos_inventory`. Warehouse simple: `warehouse_id,warehouse_name,qty,price`; variantes conservan atributos/precio/stock y warehouse rows filtrados.

Precio es referencia del catálogo, no certifica precio final. V2 mantiene la brecha en [52](52-validacion-almacenes-precios-cobro.md).

## Evidencia

`PosProductLookupTest`: bearer Sanctum POS ficticio, producto simple/variante, filtrado de warehouses, omisión de costos, almacenes no asignados/inactivos/ajenos, producto de otra sucursal/tienda, variante inactiva, Store, anónimo y tienda inactiva. **5 pruebas/23 aserciones aprobadas**. SQLite Feature, no HTTP externo ni MySQL.
