# Referencia de depósito de Telorecargo

La referencia es `TLR` + el ID de la cuenta del usuario **en Telorecargo**. No corresponde al usuario local, tienda, sucursal, POS ni al ID de una operación.

## Dato pendiente en el backend

La guía recibida documenta `saldo` y `moneda` en `GET /pos/telorecargo/saldo`, pero no incluye la identidad externa. Para completar la referencia, el frontend queda preparado para recibir el campo explícito `telorecargo_user_id` en los datos de ese endpoint (o de `/pos/telorecargo/estado`). Esta ampliación del contrato está pendiente de implementar/confirmar en el backend.

Ejemplo propuesto:

```json
{"data":{"saldo":"900.00","moneda":"MXN","telorecargo_user_id":27}}
```

El servidor debe obtener ese ID de la cuenta Telorecargo asociada a la clave configurada, sin exponer la clave. El ejemplo produciría `TLR27` en pantalla y al copiar los datos bancarios. Si la clave cambia, debe actualizarse también su identidad externa.

Si no hay ID externo disponible, la interfaz muestra la referencia pendiente y deshabilita copiar los datos con referencia. Nunca sustituye el ID externo por uno local ni lo deduce de la clave.

El formulario y el POST de solicitud de saldo contienen `monto`, `referencia` y `comprobante`. La referencia bancaria es obligatoria, se captura desde el comprobante y admite hasta 100 caracteres. Se muestra también antes de confirmar y en el pedido guardado. Es independiente del concepto `TLR` + ID externo mostrado para depositar.
