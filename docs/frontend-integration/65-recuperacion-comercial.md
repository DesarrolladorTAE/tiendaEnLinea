# Recuperación comercial y POS

La creación de venta y su asociación a una orden son operaciones separadas, no una sola transacción. V2 no expone clave de idempotencia/UUID externo verificado; una respuesta perdida puede dejar una venta persistida cuya identificación no sea inequívoca. No repetir automáticamente un cobro. `GET /ventas/mis-ventas` ofrece recuperación acotada a la terminal, pero una coincidencia por importe/fecha/cliente no prueba identidad inequívoca.

El vínculo se puede reintentar con el mismo `sale_id` tras comprobar la orden. Los documentos 51–53 señalan que repetir el mismo vínculo es idempotente según implementación revisada; estados comerciales no están filtrados explícitamente. No se alteró ese contrato.

Riesgos de almacén y precio: ver [62](62-seguridad-http-aislamiento.md) y documentos 52–53. La prueba de pérdida de respuesta, fallos parciales y V2 con terminal aislada no se ejecutó. Propuesta futura (requiere autorización comercial/esquema): UUID idempotente por terminal, guardado junto a venta y huella de petición; nunca reintentar cobro a ciegas.
