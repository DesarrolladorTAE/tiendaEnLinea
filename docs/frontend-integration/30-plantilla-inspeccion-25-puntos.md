# 30. Plantilla implementada: inspección vehicular de 25 puntos

Fuente exacta: `app/Services/Forms/VehicleInspectionTemplate.php`; validador `FormSchema`; prueba `ServiceFormsTest::test_inspection_25_points_nr_and_summary`. Se instala mediante `POST /service-form-templates/install/vehicle-inspection-25` (Store, Sanctum, módulo `service_forms`). Es provisional: no se cotejó con el PDF original de Autopartes Guerrero.

## Estructura y respuestas

Schema: `kind=inspection25`, título `Revisión vehicular de 25 puntos`, descripción `Inspección visual y funcional de los puntos indicados.`. Tiene seis secciones: cinco categorías con 25 puntos y `Observaciones generales` no contada como punto. Cada punto `point_NN` usa número/orden NN, tipo `inspection`, `required:true`, ayuda `Registre el resultado y las observaciones del punto.`. Opciones exactas: `bien` → Bien; `atender` → Atender; `urgente` → Urgente; `nr` → NR. No hay valor predeterminado.

Respuesta de un punto: `{"status":"bien|atender|urgente|nr","explanation?":"...","observation?":"...","recommendation?":"..."}`. Status requerido y opción válida. Textos opcionales max2000. Cuando status=`nr`, explanation es obligatoria y no puede quedar vacía tras trim. Observation y recommendation no son obligatorias. Todos los 25 estados deben estar contestados para completar.

## Preguntas exactas

### Frenos (`brakes`)

1. `point_01` — Frenos: pedal y funcionamiento.
2. `point_02` — Frenos delanteros: balatas y discos / tambores.
3. `point_03` — Frenos traseros: balatas y discos / tambores.
4. `point_04` — Freno de estacionamiento: funcionamiento.
5. `point_05` — Líquido de frenos, líneas y mangueras: nivel / fugas.

### Llantas y rines (`wheels`)

6. `point_06` — Llantas: presión en frío según fabricante.
7. `point_07` — Llantas: dibujo, desgaste y daños visibles.
8. `point_08` — Rines y birlos / tuercas: estado y fijación.
9. `point_09` — Llanta de refacción, gato y llave: estado / presencia.

### Dirección y suspensión (`steering`)

10. `point_10` — Dirección: juego, terminales y rótulas.
11. `point_11` — Suspensión: amortiguadores, bujes y soportes.

### Luces y seguridad (`safety`)

12. `point_12` — Luces delanteras: altas y bajas.
13. `point_13` — Luces de freno, posición y reversa.
14. `point_14` — Direccionales e intermitentes de emergencia.
15. `point_15` — Claxon: funcionamiento.
16. `point_16` — Parabrisas, cristales y espejos: estado / visibilidad.
17. `point_17` — Limpiaparabrisas y lavaparabrisas: funcionamiento.
18. `point_18` — Cinturones y hebillas: estado / funcionamiento.
19. `point_19` — Testigos del tablero: frenos, ABS, airbag y otros.

### Motor y fluidos (`engine`)

20. `point_20` — Batería: sujeción, terminales y estado visible.
21. `point_21` — Aceite de motor: nivel y fugas visibles.
22. `point_22` — Refrigerante: nivel en frío y fugas visibles.
23. `point_23` — Correas y mangueras: estado visible.
24. `point_24` — Escape: sujeción, daños y fugas visibles.
25. `point_25` — Fugas de combustible y otros fluidos: inspección visual.

### Observaciones generales (`general`)

`general_observations`: `Observaciones generales`, tipo `long_text`, `required:false`, orden 1, max_length de campo 5000.

## Aclaraciones incluidas

- `Urgente: atención inmediata.`
- `NR: detallar motivo o componente no aplicable.`
- `Revisión según especificaciones del fabricante y alcance efectuado; no es certificación de seguridad.`

## Condiciones de uso

La orden debe tener vehículo para iniciar esta plantilla. Para finalizarla debe registrarse `visit_mileage` en la orden; el componente no debe simularlo dentro de answers. La instalación es idempotente: si key `vehicle-inspection-25` existe, devuelve el registro actual sin sobreescribir cambios del negocio. No se añadieron preguntas distintas de las definidas arriba.

Ejemplo ilustrativo: `{"point_01":{"status":"bien"},"point_05":{"status":"nr","explanation":"No aplica al vehículo","observation":"Sin componente","recommendation":"Sin acción"},"general_observations":"Revisión visual realizada."}`. Evidencia Feature comprueba 25 puntos, prohibición de default, status inválido, NR con explicación, resumen y kilometraje previo a completar.
