# Arquitectura general

## Dominios y relaciones

```text
Store ─ Branch ─ Service ─ booking config / resources
Customer ─ Vehicle ─ Booking ─ ServiceOrder ─ FormSubmission
                                  ├─ vehicle/mileage snapshots
                                  ├─ sale_id ─ Sale ─ SaleItems
                                  └─ PDFs / thermal payload / history
VehicleBrand/Model ─ ProductVehicleCompatibility ─ Product ─ POS inventory
Sales + sale items + payment/refund/cancel events ─ administrative reports
```

Se reutilizan vehículos, catálogo de marcas/modelos, compatibilidades, productos, almacenes, ventas, pagos, devoluciones, citas, servicios, recursos, formularios y órdenes existentes. No hay un carrito automotriz ni un sistema contable paralelo. No se añaden tablas en el paquete de transferencia.

## Contextos

- **Administración de tienda:** identidad Sanctum de tipo `Store` para configuración y reportes; el alcance de tienda proviene de la sesión.
- **POS:** token/usuario POS y sucursal asociada; las rutas pueden requerir middleware propio además de Sanctum. No asumir que un token de tienda equivale a permiso de administración.
- **Sucursal:** rutas operativas usan `branchId`, que el servidor verifica contra la tienda autenticada o sucursal POS.
- **Público:** rutas de storefront pueden mostrar capacidades y catálogo publicado. No usar esas rutas para expedientes, órdenes o documentos privados.

## Convenciones API

Los paths en esta carpeta son relativos a `/api`. Las rutas pueden devolver JSON, PDF, SVG, XLSX o payload de impresión según el endpoint. Las respuestas de paginación deben consumirse respetando `current_page`, `per_page`, `total` y `data` si la ruta usa paginator; no todas las rutas están paginadas. Errores típicos: 401 sin autenticación, 403 módulo/permisos, 404 fuera del ámbito o inexistente, 422 validación/regla de negocio, 409 conflicto de estado cuando el controlador lo define. Confirmar el cuerpo de error en el controlador concreto.

## Evidencia del código

Rutas en `routes/api.php`; controladores en `app/Http/Controllers/Api` y namespaces de `Services`, `POS`, `Reportes`; contratos ejecutables en `tests/Feature/*Service*`, `Vehicle*`, `AdminFinancialReportsTest.php`. El repositorio inspeccionado es backend Laravel. No se inspeccionó React, por lo que la propuesta de pantallas es conceptual y no afirma reutilización de componentes existentes.

