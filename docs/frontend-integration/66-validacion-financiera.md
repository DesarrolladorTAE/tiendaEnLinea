# Validación financiera

`AdminFinancialReportsTest` pasó 6 pruebas/70 aserciones en SQLite `:memory:` dentro de la ejecución aislada. Cubre unknown/null frente a costo cero, devoluciones/cancelaciones/collections sin duplicar ventas, semanas parciales y aislamiento, permisos y exportaciones, utilidad negativa y base fiscal no confirmada, y precedencia de snapshot.

`unit_cost_at_sale` es nullable DECIMAL(18,6); no se reconstruyen históricos. POS V2 guarda snapshot por producto/variante/almacén; POS tradicional llama resolver sin esos dos contextos; Telorecargo usa productos técnicos y su semántica no equivale automáticamente a costo de mercancía. `null` significa desconocido; cero explícito es dato conocido. Costos por lote/FIFO no quedan demostrados.

`cost_tax_basis` se conserva `unknown` hasta confirmación. Caja fija, inversión y gastos reales siguen no disponibles si no hay fuente. La suite financiera prueba fragmentos, no la comparación exhaustiva JSON/PDF/Excel con múltiples eventos en semanas/meses cruzados. No se creó movimiento financiero al consultar.

Decisiones del cliente pendientes: costos netos/brutos e IVA acreditable, base de reconocimiento de ingresos, significado de caja fija/inversión y periodicidad de reparto. No presentar un valor desconocido como cero.
