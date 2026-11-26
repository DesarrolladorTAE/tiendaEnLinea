# 32. Fixtures de formularios dinámicos para React

Fixtures ficticios, listos para adaptar a MSW/Vitest. Las formas de salida reflejan los controladores; IDs, fechas y folios se ilustran. Donde se indica Feature, la condición/status tiene prueba automatizada existente. No son respuestas capturadas en esta entrega.

## Plantilla genérica

```json
{"name":"Recepción general","description":"Revisión inicial","key":"recepcion-general","schema":{"kind":"generic","title":"Recepción de servicio","description":"Datos previos a la atención","metadata":{"disclaimers":["La revisión es visual."]},"sections":[{"id":"general","title":"General","description":"Información base","sort_order":1,"fields":[{"id":"result","label":"Resultado","type":"single_select","required":true,"sort_order":1,"options":[{"value":"ok","label":"Correcto"},{"value":"repair","label":"Requiere atención"}]},{"id":"notes","label":"Notas","type":"long_text","required":false,"sort_order":2,"rules":{"max_length":1000}}]}]}}
```

Crear con POST `/service-form-templates`; éxito 201 con `data` igual al modelo de plantilla creado, incluyendo `id`, `store_id`, metadatos, `version:1`, `schema` recibido y `is_active` (ver contrato 27). No se fija un recurso transformado distinto.

## Plantilla de 25 puntos

El fixture canónico completo con las 25 etiquetas, IDs, secciones, options y rules está en [30-plantilla-inspeccion-25-puntos.md](30-plantilla-inspeccion-25-puntos.md) y lo genera el endpoint idempotente `POST /service-form-templates/install/vehicle-inspection-25`; consumir la respuesta para evitar mantener una copia hardcodeada desincronizada. Raíz de schema: `kind=inspection25`, title `Revisión vehicular de 25 puntos`, 6 secciones, puntos `point_01`…`point_25`, más `general_observations`. Prueba Feature confirma el schema y reglas.

## Nueva versión y captura borrador

Al editar distinto schema, la respuesta contiene `version:2`; capturas previas mantienen `template_version:1` y schema snapshot anterior. Iniciar: `POST /service-orders/501/forms` body `{"template_id":7}`.

```json
{"data":{"id":901,"store_id":3,"service_order_id":501,"service_form_template_id":7,"template_version":2,"folio":"SF-01JEXAMPLE","schema_snapshot":{"kind":"generic","title":"Recepción v2","sections":[{"id":"general","title":"General","sort_order":1,"fields":[{"id":"result","label":"Resultado actualizado","type":"single_select","required":true,"sort_order":1,"options":[{"value":"ok","label":"Correcto"},{"value":"repair","label":"Requiere atención"}]}]}]},"answers":{},"context_snapshot":{"order_code":"OS-501","service":"Inspección","branch":"Sucursal Centro","customer":{"name":"Cliente ficticio","phone":"5550000000"},"vehicle":{"brand":"Nissan","model":"Versa","year":2022,"plates":"ABC-123"},"visit_mileage":null},"status":"draft","summary":{"total_points":0,"answered_points":0,"pending_points":0,"bien":0,"atender":0,"urgente":0,"nr":0,"progress_percent":0,"required_complete":false}}}
```

## Estados históricos

```json
{"data":{"id":901,"status":"completed","template_version":1,"answers":{"result":"ok"},"completed_at":"2026-11-26T12:00:00Z","summary":{"required_complete":true}}}
```

```json
{"data":{"id":902,"status":"cancelled","answers":{"result":"repair"},"cancellation_reason":"Captura duplicada por error","cancelled_at":"2026-11-26T12:05:00Z"}}
```

Ambos son subobjetos ilustrativos de la serialización Eloquent; los campos restantes del modelo permanecen presentes según schema de BD. Cancelar completed es permitido solo a Store; la prueba Feature cubre que POS recibe 403.

## Captura 25 puntos

Fixture compacto de answers (los otros 23 puntos deben estar presentes al completar):

```json
{"point_01":{"status":"bien"},"point_02":{"status":"bien"},"point_03":{"status":"bien"},"point_04":{"status":"bien"},"point_05":{"status":"nr","explanation":"No aplica","observation":"No existe el componente","recommendation":"Sin acción"},"point_06":{"status":"bien"},"point_07":{"status":"bien"},"point_08":{"status":"bien"},"point_09":{"status":"bien"},"point_10":{"status":"bien"},"point_11":{"status":"bien"},"point_12":{"status":"bien"},"point_13":{"status":"bien"},"point_14":{"status":"bien"},"point_15":{"status":"bien"},"point_16":{"status":"bien"},"point_17":{"status":"bien"},"point_18":{"status":"bien"},"point_19":{"status":"bien"},"point_20":{"status":"bien"},"point_21":{"status":"bien"},"point_22":{"status":"bien"},"point_23":{"status":"bien"},"point_24":{"status":"bien"},"point_25":{"status":"bien"},"general_observations":"Inspección ficticia."}
```

## Errores y acceso

```json
{"message":"The given data was invalid.","errors":{"answers.point_05.explanation":["Explique el motivo de este estado."]}}
```

Fixture de una causa 403: `{"message":"Los formularios de servicios no están habilitados."}`. La redacción puede variar por identidad/branch/permisos; no convertir cualquier 403 en módulo deshabilitado. Acceso ajeno/inexistente es HTTP 404; su cuerpo depende del handler Laravel y no se fija aquí. Duplicar captura o mutar estado cerrado: HTTP 409 con `message`. La prueba existente verifica 422 de respuestas, 403 POS, 404 cross-tenant y 409 duplicada/terminada.

## PDF histórico y navegación desde historial

`GET /vehicles/{vehicleId}/history` expone IDs/metadatos de formulario dentro de `orders[].form_submissions[]` (`id,service_order_id,template_id,status,folio,completed_at` según select/eager-load). Para respuestas completas: GET `/service-orders/{orderId}/forms/{submissionId}`. Para PDF: GET `/branches/{branchId}/service-orders/{orderId}/forms/{submissionId}/document.pdf` con Sanctum y scope.

## Evidencia automática relevante

`tests/Feature/ServiceFormsTest.php`: schema y versionado; asociación; `forms:[]`; snapshots; cierre; inspección 25 puntos/NR; validaciones de tipos; aislamientos Store/POS; template inactiva; permiso de cancelación. `tests/Feature/ServiceDocumentsTest.php`: PDF privado y scope. Los JSON salvo los status y errores explicitados como aserciones son fixtures ilustrativos.

## Fixture JSON completo del schema de inspección

Respuesta `data` devuelta al instalar la plantilla; se serializó directamente desde `VehicleInspectionTemplate::schema()` sin BD.

```json
{
    "kind": "inspection25",
    "title": "Revisión vehicular de 25 puntos",
    "description": "Inspección visual y funcional de los puntos indicados.",
    "metadata": {
        "disclaimers": [
            "Urgente: atención inmediata.",
            "NR: detallar motivo o componente no aplicable.",
            "Revisión según especificaciones del fabricante y alcance efectuado; no es certificación de seguridad."
        ]
    },
    "sections": [
        {
            "id": "brakes",
            "title": "Frenos",
            "sort_order": 1,
            "fields": [
                {
                    "id": "point_01",
                    "number": 1,
                    "label": "Frenos: pedal y funcionamiento.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 1,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_02",
                    "number": 2,
                    "label": "Frenos delanteros: balatas y discos / tambores.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 2,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_03",
                    "number": 3,
                    "label": "Frenos traseros: balatas y discos / tambores.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 3,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_04",
                    "number": 4,
                    "label": "Freno de estacionamiento: funcionamiento.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 4,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_05",
                    "number": 5,
                    "label": "Líquido de frenos, líneas y mangueras: nivel / fugas.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 5,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                }
            ]
        },
        {
            "id": "wheels",
            "title": "Llantas y rines",
            "sort_order": 2,
            "fields": [
                {
                    "id": "point_06",
                    "number": 6,
                    "label": "Llantas: presión en frío según fabricante.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 6,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_07",
                    "number": 7,
                    "label": "Llantas: dibujo, desgaste y daños visibles.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 7,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_08",
                    "number": 8,
                    "label": "Rines y birlos / tuercas: estado y fijación.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 8,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_09",
                    "number": 9,
                    "label": "Llanta de refacción, gato y llave: estado / presencia.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 9,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                }
            ]
        },
        {
            "id": "steering",
            "title": "Dirección y suspensión",
            "sort_order": 3,
            "fields": [
                {
                    "id": "point_10",
                    "number": 10,
                    "label": "Dirección: juego, terminales y rótulas.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 10,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_11",
                    "number": 11,
                    "label": "Suspensión: amortiguadores, bujes y soportes.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 11,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                }
            ]
        },
        {
            "id": "safety",
            "title": "Luces y seguridad",
            "sort_order": 4,
            "fields": [
                {
                    "id": "point_12",
                    "number": 12,
                    "label": "Luces delanteras: altas y bajas.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 12,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_13",
                    "number": 13,
                    "label": "Luces de freno, posición y reversa.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 13,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_14",
                    "number": 14,
                    "label": "Direccionales e intermitentes de emergencia.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 14,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_15",
                    "number": 15,
                    "label": "Claxon: funcionamiento.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 15,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_16",
                    "number": 16,
                    "label": "Parabrisas, cristales y espejos: estado / visibilidad.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 16,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_17",
                    "number": 17,
                    "label": "Limpiaparabrisas y lavaparabrisas: funcionamiento.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 17,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_18",
                    "number": 18,
                    "label": "Cinturones y hebillas: estado / funcionamiento.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 18,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_19",
                    "number": 19,
                    "label": "Testigos del tablero: frenos, ABS, airbag y otros.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 19,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                }
            ]
        },
        {
            "id": "engine",
            "title": "Motor y fluidos",
            "sort_order": 5,
            "fields": [
                {
                    "id": "point_20",
                    "number": 20,
                    "label": "Batería: sujeción, terminales y estado visible.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 20,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_21",
                    "number": 21,
                    "label": "Aceite de motor: nivel y fugas visibles.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 21,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_22",
                    "number": 22,
                    "label": "Refrigerante: nivel en frío y fugas visibles.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 22,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_23",
                    "number": 23,
                    "label": "Correas y mangueras: estado visible.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 23,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_24",
                    "number": 24,
                    "label": "Escape: sujeción, daños y fugas visibles.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 24,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                },
                {
                    "id": "point_25",
                    "number": 25,
                    "label": "Fugas de combustible y otros fluidos: inspección visual.",
                    "type": "inspection",
                    "required": true,
                    "sort_order": 25,
                    "help": "Registre el resultado y las observaciones del punto.",
                    "options": [
                        {
                            "value": "bien",
                            "label": "Bien"
                        },
                        {
                            "value": "atender",
                            "label": "Atender"
                        },
                        {
                            "value": "urgente",
                            "label": "Urgente"
                        },
                        {
                            "value": "nr",
                            "label": "NR"
                        }
                    ],
                    "rules": {
                        "require_explanation_when": [
                            "nr"
                        ]
                    }
                }
            ]
        },
        {
            "id": "general",
            "title": "Observaciones generales",
            "sort_order": 6,
            "fields": [
                {
                    "id": "general_observations",
                    "label": "Observaciones generales",
                    "type": "long_text",
                    "required": false,
                    "sort_order": 1,
                    "rules": {
                        "max_length": 5000
                    }
                }
            ]
        }
    ]
}
```
