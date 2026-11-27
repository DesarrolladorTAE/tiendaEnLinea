# Cierre de implementación de fase 5

## Contratos y alcance

| Operación | Ruta bajo `/api` | Parámetros |
|---|---|---|
| Editar cita | `PATCH /branches/{branchId}/bookings/{bookingId}` | `notes` y `vehicle_id` opcionales. Solo se envían cambios. |
| Reprogramar o cambiar recurso | `POST /branches/{branchId}/bookings/{bookingId}/reschedule` | `booking_date`, `start_time` y `resource_id` opcional. Omisión conserva recurso, null solicita sin ID fijo. |
| Cancelar | `POST /branches/{branchId}/bookings/{bookingId}/cancel` | `reason` de 5 a 2000 caracteres. |
| Consultar horarios | `GET /branches/{branchId}/services/{serviceId}/availability` | `date` y `resource_id` opcional. |
| Vincular venta | `POST /branches/{branchId}/service-orders/{orderId}/sale` | `sale_id` de venta existente. |
| Mostrar venta vinculada | `GET /branches/{branchId}/service-orders/{orderId}` | Relación privada con identificador, total y estado cuando están presentes. |

La consulta pública para el cliente administrativo de disponibilidad no admite exclusión de la cita. Para cambiar de técnico en el mismo horario, la interfaz presenta el horario original como candidato sujeto a validación. La exclusión de la propia cita se aplica dentro del guardado en Laravel. El rechazo 422 conserva la cita original y vuelve a consultar cupos. Un conflicto de estado recarga los datos y requiere cerrar el diálogo y revisar antes de intentar de nuevo. Laravel valida las órdenes asociadas al intentar editar, cancelar o reprogramar. El contrato de lectura de la cita no expone un indicador para anticipar esa restricción.

La zona previa a consultar horarios se configura con `VITE_SERVICE_TIMEZONE`, con `America/Mexico_City` como valor documentado. Cuando disponibilidad confirma la zona, la agenda usa esa zona dentro del contexto de la pantalla y conserva las fechas seleccionadas. Los cuerpos envían fecha y hora civil. La respuesta privada previa a disponibilidad aún carece de zona horaria.

El POS conserva su flujo. El detalle de orden entrega el identificador, estado y total de la venta. El folio comercial, la fecha y el estado de pago no figuran en esa relación privada. Las rutas que informan más datos carecen del alcance confirmado necesario para consultarlas en este flujo. El vínculo deja a Laravel validar tienda, sucursal, cliente y vínculo anterior. El anexo 41 confirma que Laravel no impone una regla por estado comercial o de pago en esa mutación.

## Diagnóstico de ProfitFactorControl

La prueba monta `ProductInfoSection.jsx`, que contiene el checkbox OE antes de `ProfitFactorControl.jsx`. El selector genérico `input[type="checkbox"]` interactuaba con el checkbox equivocado.

| Prueba | Comportamiento esperado | Resultado anterior y mensaje exacto |
|---|---|---|
| cost unlocks the modal, applying previews 145 including IVA, and manual mode remains available | Control de factor deshabilitado sin costo y precio 145 tras aplicar el factor | El checkbox OE estaba habilitado. `Expected: true`, `Received: false`. |
| canceling automatic setup for zero preserves manual pricing | Abrir el diálogo vacío para factor cero y conservar precio manual al cancelar | Activar OE no abrió el diálogo. `TypeError: Cannot read properties of null (reading 'value')`. |
| enabling a positive factor keeps the dialog closed | Activar un factor existente sin abrir el diálogo y dejar marcado el control | El selector observaba OE, que seguía desmarcado. `Expected: true`, `Received: false`. |

La suite sin corregir reprodujo los tres fallos al ejecutarse sola. En la copia aislada de `e2663c8` aprobó las tres con las mismas dependencias y sin el nuevo control OE. Se corrigieron los tres selectores para apuntar a `#product-price-by-factor`. Se conservaron todas las expectativas y la lógica comercial. La comparación y la ejecución aislada explican los fallos sin requerir hipótesis sobre mocks, temporizadores, contaminación entre suites ni redondeo.

## Integración reproducible en Laravel aislado

1. Usa una instancia autorizada con los contratos 40–42, una base de datos de prueba y un Store con plan y módulo de servicios. Prepara dos sucursales, un segundo Store, un cliente ficticio, un vehículo autorizado, un servicio con confirmación manual, dos técnicos asociados y una plantilla obligatoria. Prepara una venta ficticia para el cliente en una terminal de la sucursal y una venta de un cliente o sucursal diferente.
2. Inicia el frontend con `VITE_API_URL` apuntando a la API aislada y `VITE_SERVICE_TIMEZONE` igual a `config('app.timezone')`. Inicia sesión únicamente con las credenciales de prueba. Verifica capacidades y que la sucursal ajena sea rechazada. Mantén separadas las sesiones administrativas y POS.
3. Consulta agenda y disponibilidad. Crea y confirma una cita. Intenta reprogramar hacia un cupo ocupado y comprueba mediante GET que se conservó el horario original. Cambia fecha y recurso mediante un cupo libre. Cambia solo recurso manteniendo la hora y comprueba que el servidor excluya la cita original. Crea una cita adicional, cancélala con motivo y verifica que sigue visible y que el cupo vuelve a estar disponible.
4. Convierte la primera cita a orden y repite la conversión para comprobar el mismo ID. Asigna recurso, registra kilometraje cero, completa la inspección obligatoria y finaliza. Comprueba snapshots e historial, vincula la venta válida y verifica rechazo de la ajena en una orden separada. Consulta los PDF privados y el comprobante térmico. Comprueba la denegación con una sesión ajena y registra método, ruta, código HTTP y resultado sin conservar credenciales ni datos sensibles.
5. Registra por separado las respuestas reales y cualquier diferencia con los fixtures. Usa el resultado para autorizar el paso a fase 6.

No se identificó una instancia Laravel aislada autorizada para ejecutar este recorrido. Las pruebas frontend usan respuestas simuladas. La fase 5 queda implementada según los contratos documentados con la validación real pendiente. La fase 6 requiere esa validación y autorización del usuario.


## Archivos de esta entrega

- Interfaz: BookingEditor.jsx, ServiceOperationsPage.jsx, OperationIntake.jsx y OperationOrder.jsx.
- Contratos y zona: serviceOperations.js y vite.config.mjs.
- Pruebas: ServiceOperationsPage.test.jsx, serviceOperations.test.js y ProfitFactorControl.test.jsx.

## Verificación final

- Regresión completa: 373 aprobadas, 0 fallidas y 0 omitidas en 74 suites.
- Vite compiló el código final en modo producción con manifiesto y sin prerender remoto.
- Las pruebas del flujo usaron respuestas simuladas y los anexos 40–42. La comprobación contra Laravel queda pendiente del entorno aislado.
