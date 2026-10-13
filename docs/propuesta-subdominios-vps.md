# Subdominios por tienda: propuesta de implementación e impacto en el VPS

**Mi Tienda en Línea MX · Documento de planeación · 10 de octubre de 2026**

Este documento propone la implementación futura. No acredita cambios en DNS, Laravel ni en el VPS. Revisión 2: incorpora la captura del panel del proveedor y la confirmación del usuario de que administra el servidor con Virtualmin. Se revisaron el frontend y los archivos de despliegue; no se tuvo acceso directo al VPS ni al backend Laravel completo. Los porcentajes siguientes son una fotografía del momento de la captura, no un historial de rendimiento.

## Inventario confirmado y conclusión actualizada

| Dato | Información proporcionada | Interpretación |
| --- | --- | --- |
| Plan | VPS Ultra-11, 4CPU, 8 GB RAM, 160 GB SSD | Recursos contratados; rendimiento y dedicación de CPU pendientes de medir |
| Sistema operativo | Ubuntu 24.04 x86_64 | Según etiqueta del panel; versiones de servicios pendientes |
| Administración | Virtualmin | Confirmado por el usuario |
| Estado | Activo / En línea | Según la captura |
| Memoria | 92%; 7.3 GB de 8.0 GB | Diferencia aritmética aproximada de 0.7 GB; no equivale a MemAvailable |
| Disco | 78%; 126 GB de 162 GB | Aproximadamente 36 GB restantes según el panel |
| Transferencia mensual | 72.6 GB de 8192 GB; 0.9% | No parece cerca de la cuota mensual en esa captura; no mide velocidad del enlace |

El plan anuncia 160 GB SSD y el indicador de disco muestra 162 GB. Se conservan ambos valores tal como aparecen; hay que comprobar los sistemas de archivos y su espacio disponible desde el sistema operativo, sin atribuir la diferencia a una causa no verificada.

**La arquitectura compartida es compatible con este tipo de VPS, pero no se aprueba todavía una expansión masiva basándose solo en sus 4 CPU y 8 GB.** La prioridad es identificar el uso de RAM, revisar el crecimiento del disco y medir el servicio actual. Puede desarrollarse la funcionalidad en paralelo, fuera del servidor productivo, y activar después un piloto pequeño si las métricas permiten hacerlo.

## 1. Resultado que se busca

Cada negocio tendrá una dirección propia dentro de la plataforma. Por ejemplo, la tienda que hoy se consulta en `https://mitiendaenlineamx.com.mx/tienda/casa-saga` podrá publicarse en `https://casa-saga.mitiendaenlineamx.com.mx`.

El catálogo, los productos, las imágenes y la administración seguirán perteneciendo a la misma plataforma. No se instalará una aplicación por negocio ni se duplicará su catálogo. El dominio principal conservará la presentación comercial de Mi Tienda en Línea MX y las rutas administrativas que correspondan.

La propuesta inicial cubre subdominios de la plataforma. La conexión automática de dominios propios, como `minegocio.mx`, se plantea como una segunda etapa, porque requiere verificar propiedad, DNS y certificados independientes.

## 2. Por qué sirve para la identidad en Google

Google admite nombres de sitio por dominio o subdominio, pero no nombres independientes por subcarpeta. Por eso `/tienda/casa-saga` puede mostrar CASA SAGA como título y conservar MiTiendaEnLineaMX como nombre del sitio. El subdominio permite configurar señales de identidad propias; no obliga a Google a mostrarlas. [Documentación de nombres de sitio](https://developers.google.com/search/docs/appearance/site-names).

Google también define el favicon de búsqueda por hostname. Una carpeta no permite separar ese icono del resto del sitio. La portada del nuevo subdominio podrá declarar el favicon del negocio. El logo de carga, el icono del navegador y el icono de Google son elementos relacionados, pero su actualización no ocurre necesariamente al mismo tiempo. [Documentación de favicons](https://developers.google.com/search/docs/appearance/favicon-in-search).

Los subdominios no garantizan posiciones, ventas ni indexación. El contenido, la accesibilidad, los enlaces y la calidad de cada tienda siguen siendo importantes. Tampoco se debe prometer que toda la autoridad del dominio principal se trasladará automáticamente a cada negocio.

## 3. Estado actual identificado

| Elemento | Lo que existe en el repositorio | Trabajo pendiente |
| --- | --- | --- |
| Tiendas públicas | Rutas `/tienda/:storeSlug` y páginas de producto | Resolver la tienda desde un hostname autorizado |
| Dominios personalizados | Un mapa manual en `src/App.jsx`, con `latehuanita.mx` | Sustituirlo por una resolución administrada |
| Identidad y carga | Logo, nombre y animación según tienda | Conservarlos en la navegación por subdominio |
| SEO en React | Título, descripción, canonical y etiquetas sociales | Generar todas las URLs con el dominio principal de la tienda |
| HTML inicial | `public/storefront-meta.php` incorpora metadatos públicos | Ampliar la resolución a los nuevos hostnames |
| Despliegue | Virtualmin confirmado; Apache, PHP y reescrituras documentados | Confirmar servicios efectivos, configuración, DNS y certificados |
| API | El frontend consume endpoints públicos y administrativos | Revisar Laravel, autorización, CORS y consultas por tienda |

Los archivos de referencia son `src/App.jsx`, `src/utils/storefrontBranding.js`, `src/components/storefront/StorefrontMetadata.jsx`, `public/storefront-meta.php`, `src/hooks/useStoreData.js` y `docs/publicar-metadatos-virtualmin.md`. Lo documentado localmente debe verificarse en producción antes del cambio.

## 4. Arquitectura propuesta

Flujo de una visita:

1. El cliente abre `casa-saga.mitiendaenlineamx.com.mx`.
2. El DNS resuelve esa dirección hacia la infraestructura pública del VPS.
3. Apache o Nginx recibe HTTPS y entrega la solicitud a la aplicación compartida.
4. Un resolvedor busca el hostname exacto en el registro de tiendas activas.
5. Se entrega el HTML con identidad de la tienda y los archivos del mismo frontend.
6. Las consultas públicas devuelven exclusivamente los datos del negocio identificado.

La API puede continuar centralizada en el dominio principal. En ese caso, Laravel no recibirá necesariamente el subdominio de la tienda en el encabezado Host de cada llamada API: el resolvedor deberá entregar al frontend su identificador público y los endpoints deberán validar su alcance. No se debe asumir que una llamada a la API central identifica sola al negocio visitante.

Laravel ofrece rutas por subdominio mediante grupos de dominio. Es una herramienta disponible, no una obligación de trasladar todas las rutas existentes. La implementación debe adaptarse a la versión real del backend. [Rutas por subdominio en Laravel](https://laravel.com/docs/12.x/routing#subdomain-routing).

## 5. Configuración inicial de infraestructura

### DNS

Se propone un registro comodín `*.mitiendaenlineamx.com.mx` hacia el VPS o hacia el proveedor que lo publique. El dominio raíz y los registros existentes se conservan explícitamente. Si se usa IPv6, el registro AAAA solo debe publicarse cuando el servidor atienda correctamente ese tráfico.

El comodín evita crear un registro DNS individual por tienda. No registra automáticamente negocios válidos: cualquier nombre podría resolver al servidor, pero la aplicación debe responder 404 si no corresponde a una tienda publicada.

### Servidor web

En Virtualmin/Apache se evaluará un alias wildcard sobre el sitio compartido, con reglas separadas para plataforma, API, archivos y tiendas. Si realmente se usa Nginx, se configurará el bloque equivalente. Nginx admite coincidencias de nombres wildcard. [Referencia oficial de Nginx](https://nginx.org/en/docs/http/server_names.html).

Virtualmin será el punto de administración de la configuración persistente: se respaldará el virtual server actual, se revisarán sus alias y se comprobará que las modificaciones sobrevivan a cambios desde el panel. No se creará un virtual server completo por cada comercio. La estructura compartida evita multiplicar cuentas, servicios de correo y grupos de procesos por tienda. Virtualmin distingue servidores y alias; los pasos exactos dependen de su versión instalada. [Tipos de servidores en Virtualmin](https://www.virtualmin.com/docs/getting-started/how-to-create-virtual-servers/).

No se propone crear un usuario Linux, directorio completo, base de datos o grupo PHP-FPM por cada negocio. Debe existir un comportamiento por defecto que rechace hostnames desconocidos y una reserva explícita de nombres de infraestructura.

### HTTPS

Se propone un certificado que cubra `*.mitiendaenlineamx.com.mx`; el dominio raíz se cubre expresamente con ese certificado o con otro. El wildcard no cubre dominios externos ni nombres de varios niveles como `www.casa-saga.mitiendaenlineamx.com.mx`.

Con Let's Encrypt, la emisión wildcard requiere validación DNS-01. La renovación debe automatizarse y probarse, usando credenciales DNS de alcance limitado o delegación de la validación. No se dejará una renovación que dependa de pegar registros manualmente cada vez. [Tipos de validación de Let's Encrypt](https://letsencrypt.org/docs/challenge-types/).

Laravel no necesitará acceso root ni permisos para modificar Apache o DNS durante cada alta. Las tareas privilegiadas de infraestructura se separarán del proceso web.

Debe confirmarse quién sirve el DNS autoritativo. La documentación de Virtualmin indica que su flujo integrado de validación DNS requiere que gestione la zona. Si el DNS está fuera, se diseñará una automatización ACME con el proveedor correspondiente, instalación del certificado y renovación verificadas; tener Virtualmin no demuestra que la zona DNS esté alojada allí. [Certificados en Virtualmin](https://www.virtualmin.com/docs/server-components/how-to-add-an-ssl-certificate/).

## 6. Cambios propuestos en Laravel y datos

Se propone un registro de dominios con estos campos mínimos; los nombres finales dependerán del esquema existente:

| Campo | Función |
| --- | --- |
| `store_id` | Relaciona el dominio con una tienda real |
| `hostname` | Nombre completo normalizado, con índice único global |
| `type` | Subdominio de plataforma o dominio propio |
| `is_primary` | Selecciona la dirección canónica de la tienda |
| `status` | Pendiente, activo o suspendido |
| `verified_at` | Fecha de verificación cuando corresponda |
| Fechas y auditoría | Registro de altas, cambios y responsable |

El backend validará identificadores únicos, longitud y caracteres DNS permitidos. Reservará nombres como `www`, `api`, `admin`, `mail`, `smtp`, `ftp`, `autodiscover`, `status` y los que ya use el servidor. Una restricción única en base de datos evitará que dos registros simultáneos ocupen el mismo hostname.

El alta guardará la tienda y su subdominio de forma consistente, sin ejecutar comandos del sistema. El cambio de nombre conservará un alias o una redirección controlada cuando proceda. No se reasignarán automáticamente direcciones antiguas a otros clientes: pueden seguir recibiendo visitas desde enlaces previos.

El resolvedor devolverá solo identidad pública y estado de publicación. Cada consulta de productos, sucursales, imágenes y configuración comprobará su tienda. El identificador enviado por el navegador nunca sustituirá la autorización para leer o modificar información privada.

Si se usa caché, la clave incluirá hostname o identificador de tienda, sucursal y demás variantes relevantes. Un cambio de dominio, suspensión o identidad invalidará las entradas necesarias. Los trabajos en cola también transportarán explícitamente el contexto de tienda.

## 7. Cambios propuestos en el frontend y SEO

El frontend dejará de depender del mapa manual de dominios. Consultará o recibirá desde el HTML inicial la tienda asociada al hostname. La resolución deberá reutilizarse para evitar consultas duplicadas durante el arranque.

Se adaptarán enlaces de portada, productos, categorías, sucursales, compartir, códigos QR y navegación interna. También se revisará el almacenamiento local: cambiar de origen cambia el espacio de `localStorage`; un carrito o preferencia guardados en la URL anterior no se trasladan solos.

Cada portada publicada declarará nombre, descripción, favicon, canonical y datos estructurados `WebSite` coherentes. Los productos tendrán canonical propio y metadatos de su producto. Los datos estructurados comerciales adicionales solo se añadirán con precios, moneda y disponibilidad verificables.

El HTML inicial debe contener la identidad aun antes de ejecutar React. Se ampliará el mecanismo PHP existente o se trasladará esa responsabilidad a Laravel; se elegirá una sola fuente consistente para que ambos no generen identidades contradictorias. No se requiere introducir un servidor Node permanente únicamente para este cambio.

Se generará un sitemap por tienda con URLs públicas activas y un `robots.txt` coherente por hostname. No se publicarán páginas administrativas ni tiendas inexistentes como contenido indexable. El sitemap no sustituye los enlaces navegables hacia los productos.

## 8. Migración de enlaces existentes

Se preparará una correspondencia por tienda antes de activar redirecciones permanentes:

| Dirección anterior | Destino propuesto |
| --- | --- |
| `/tienda/casa-saga` | `https://casa-saga.mitiendaenlineamx.com.mx/` |
| `/tienda/casa-saga/producto/123` | `https://casa-saga.mitiendaenlineamx.com.mx/producto/123` |
| URL con `?branch=sucursal` | Destino equivalente conservando la sucursal válida |

Se conservarán parámetros funcionales y de campaña cuando corresponda. Las redirecciones serán directas al destino final, sin cadenas ni bucles; no se redirigirán indiscriminadamente todos los errores a la portada. Google recomienda redirecciones de servidor y actualizar las referencias durante una migración de URLs. [Guía de migraciones](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).

Para una tienda con dominio propio se escogerá una dirección principal: no se mantendrán múltiples copias indexables con canonicals contradictorios. La migración empezará con tiendas piloto. Se vigilarán Search Console, enlaces rotos, errores HTTP y accesos a las URLs anteriores.

## 9. Impacto esperado en el VPS

**El número de subdominios no equivale al número de servidores ni al número de procesos PHP.** En esta propuesta comparten aplicación y recursos. Agregar tiendas sin tráfico agrega principalmente registros y contenido. El consumo crece con las visitas, las solicitudes dinámicas, el peso de imágenes, las importaciones y los procesos de fondo.

| Recurso | Impacto previsto | Medida propuesta |
| --- | --- | --- |
| CPU | Resolución de tienda, TLS, consultas, render de metadatos y tráfico adicional | Caché, consultas eficientes y límites de trabajo concurrente |
| RAM | PHP-FPM, base de datos, caché y colas; no una reserva fija por tienda | Medir memoria por proceso y limitar trabajadores |
| Disco | Fotos, datos, logs, caché y respaldos | Rotación, retención y miniaturas; separar originales si crecen |
| Red | Principalmente imágenes y catálogo entregado a visitantes | Compresión, paginación, caché y CDN si las mediciones lo justifican |
| Base de datos | Resolución del hostname y consultas filtradas por tienda | Índices y eliminación de consultas repetidas |
| Conexiones | Visitantes, robots y llamadas internas a la API | Timeouts, control de concurrencia y evitar llamadas redundantes |
| Operación | Certificados, monitoreo, despliegues y soporte de dominios | Automatización y alertas con responsables |

Conocer las especificaciones contratadas no basta para afirmar cuántas tiendas soportará el VPS: faltan el perfil de uso y una prueba de carga. Tampoco hay base para prometer un porcentaje fijo de consumo o asegurar que no requerirá ampliación.

### Lectura de los datos de este VPS

Ya conocemos la capacidad contratada, pero faltan las métricas necesarias para estimar tráfico admisible. El 92% de RAM amerita revisión prioritaria: puede incluir caché recuperable o reflejar presión real. En Linux, `available` estima memoria disponible para nuevas aplicaciones sin intercambiar a swap; se revisará junto con procesos, swap y eventos de falta de memoria. No se recomendará vaciar cachés del sistema como solución. [Referencia de free y MemAvailable](https://www.man7.org/linux/man-pages/man1/free.1.html).

El disco deja unos 36 GB nominales según la captura. No todo ese margen se puede dedicar a fotografías: también debe absorber base de datos, temporales, registros, actualizaciones y respaldos. Crear un respaldo completo local podría superar el espacio libre, según su contenido; antes de hacerlo se medirá su tamaño y se preparará un destino externo. No se eliminarán imágenes, bases, correo ni respaldos sin clasificación y política de retención.

La transferencia de 72.6 GB está lejos de la cuota mensual mostrada, pero no informa sobre latencia, concurrencia, velocidad máxima de red ni tráfico futuro de robots. Tampoco la captura incluye uso de CPU, latencia de disco o espera de procesos PHP, por lo que no permite descartar esos cuellos de botella.

### Diagnóstico previo en Virtualmin y Ubuntu

1. Observar al menos 24–72 horas, incluyendo horas de mayor uso e importaciones. Si ese periodo no incluye un pico representativo, ampliar la observación.
2. Revisar en Webmin/Virtualmin memoria, procesos, servicios, particiones y respaldos; identificar si correo, antivirus, antispam u otros sitios comparten el VPS. No asumir que están instalados ni desactivarlos sin confirmar su uso.
3. Consultar `free -h`, `swapon --show`, `vmstat 1 10`, `df -h` y `df -i` mediante acceso autorizado. Revisar eventos OOM y consumo por proceso. Estas comprobaciones no se han ejecutado en el servidor.
4. Medir trabajadores PHP-FPM, cola de solicitudes, consumo de la base de datos, consultas lentas y trabajos en segundo plano. Evitar aumentar trabajadores solo porque haya más tiendas.
5. Clasificar los 126 GB ocupados: archivos de clientes, originales, miniaturas, bases de datos, correo, registros, temporales y respaldos. Las inspecciones intensivas de disco se programarán fuera del pico.
6. Identificar procesos de importación o imágenes que compitan con visitas. Ajustar concurrencia y horarios antes de añadir servicios nuevos como Redis si no se ha presupuestado su RAM.

### Criterios propuestos para habilitar el piloto

Estos umbrales son criterios iniciales de operación, no límites oficiales ni garantías de capacidad:

| Señal | Criterio inicial propuesto | Si no se cumple |
| --- | --- | --- |
| Memoria disponible | Buscar al menos 1.5 GB de MemAvailable en picos representativos, sin OOM ni intercambio sostenido | Corregir consumo y repetir medición; evaluar ampliar RAM si persiste |
| Espacio de disco | Conservar al menos 20% disponible y capacidad para temporales y crecimiento del periodo planificado | Revisar retención o ampliar almacenamiento antes del despliegue |
| CPU y PHP | Sin saturación sostenida ni acumulación de solicitudes durante la prueba | Optimizar consultas y concurrencia; reevaluar capacidad de CPU |
| Calidad del servicio | Sin aumento sostenido de errores 5xx ni degradación de p95 superior al presupuesto acordado; referencia inicial: 20% frente a la línea base | Detener ampliación del piloto e investigar |
| Operación | Respaldo externo restaurable y renovación HTTPS probada | Resolver antes de activar redirecciones permanentes |

Con 162 GB mostrados, una reserva del 20% representa unos 32.4 GB. Los 36 GB restantes dejan apenas unos 3.6 GB de crecimiento antes de alcanzar ese umbral propuesto. El disco merece atención preventiva aunque todavía no esté lleno; los cálculos deben confirmarse con el espacio realmente disponible del sistema de archivos.

Si después de optimizar se confirma escasez real de memoria, se evaluará una ampliación —por ejemplo, a 16 GB si el proveedor la ofrece— según mediciones y presupuesto. Más RAM no arregla automáticamente fugas, consultas lentas, exceso de procesos ni falta de disco. No se propone comprar capacidad ni cambiar el plan en esta etapa documental.

### Dos puntos específicos del proyecto

El hook de catálogo consultado descarga la colección de productos y el frontend pagina localmente. Los catálogos grandes pueden transferir mucho contenido aunque solo se muestren pocos productos. Conviene medir y, si corresponde, paginar y filtrar desde la API.

El PHP de metadatos consulta endpoints públicos y, para un producto, busca dentro de una colección. Esto puede amplificar trabajo por cada visita de robots. Además, si la consulta HTTP vuelve al mismo VPS y comparte un grupo PHP-FPM pequeño, las solicitudes externas pueden ocupar trabajadores mientras esperan solicitudes internas. Deben revisarse caché, concurrencia y un endpoint directo por producto; también puede convenir resolver los metadatos dentro de Laravel sin ese viaje HTTP interno.

### Cómo estimar capacidad sin inventar cifras

Se medirá el VPS actual durante tráfico normal y durante importaciones. Para PHP, una referencia de presupuesto es: memoria disponible para PHP dividida entre memoria observada por trabajador. El resultado aún debe ajustarse por CPU, conexiones de base de datos y latencia.

Ejemplo exclusivamente ilustrativo: si se destinan 1,024 MB a PHP y cada trabajador observado consume aproximadamente 80 MB, cabrían unos 12 dentro de ese presupuesto; no significa 12 tiendas ni determina por sí solo las visitas admitidas. Es necesario reservar memoria para sistema, base de datos, servidor web y colas.

La concurrencia dinámica aproximada se relaciona con solicitudes por segundo multiplicadas por duración media. No se deben confundir usuarios conectados, páginas vistas y solicitudes HTTP: una página puede disparar varias consultas e imágenes.

## 10. Seguridad y continuidad del servicio

Las reglas de Host y proxies confiables se validarán antes de generar enlaces absolutos. La API no aceptará cualquier origen con credenciales: CORS se limitará a los orígenes autorizados según la estrategia elegida. CORS no será el mecanismo de autorización de tiendas.

Las cookies del panel administrativo permanecerán limitadas a su host salvo necesidad comprobada. Compartir una cookie con todos los subdominios puede ampliar exposición. Las llamadas públicas del catálogo no deben transportar innecesariamente tokens administrativos.

Se probará que cambiar hostname, ID de producto, sucursal o parámetros no permita obtener datos privados ajenos. Tampoco se habilitará JavaScript arbitrario de comerciantes en el mismo ámbito de confianza sin un diseño de aislamiento específico.

Un solo VPS comparte el alcance de sus fallos: una caída, falta de disco o saturación puede afectar a todas las tiendas. Se necesitan respaldos fuera del servidor, prueba de restauración, alertas de recursos y límites para que un catálogo o una importación no monopolice la capacidad.

## 11. Beneficios para Mi Tienda en Línea MX

| Beneficio | Efecto esperado | Cómo comprobarlo |
| --- | --- | --- |
| Identidad de cada negocio | Dirección fácil de reconocer y señales SEO propias | Revisión de marca, Search Console y enlaces compartidos |
| Altas más rápidas | La tienda obtiene su dirección al registrarse | Tiempo entre alta y publicación |
| Menos trabajo manual | Se elimina editar un mapa de dominios por cliente | Intervenciones técnicas por alta |
| Mejor oferta comercial | Subdominio incluido y dominio propio como opción futura | Adopción, conversión y retención de planes |
| Un solo mantenimiento | Un despliegue actualiza la plataforma compartida | Tiempo de publicación y errores de despliegue |
| Visibilidad operativa por tienda | Uso, errores y tráfico atribuibles a cada negocio | Panel de métricas por hostname/tienda |

Estos son beneficios esperados, no resultados comerciales garantizados. La nueva estructura también aumenta la responsabilidad operativa: más sitios públicos requieren seguimiento de disponibilidad, contenido y rastreo. El SEO de las tiendas no garantiza una mejora de posición del sitio comercial de la plataforma.

## 12. Etapas y esfuerzo orientativo

Los siguientes rangos son una estimación de planeación para una persona con experiencia, accesos disponibles y un backend sin refactorizaciones mayores. No son una cotización ni un compromiso de entrega. Las tareas pueden solaparse.

| Etapa | Entregable | Esfuerzo orientativo |
| --- | --- | --- |
| Diagnóstico | Inventario confirmado de 4 CPU/8 GB, investigación de RAM al 92%, disco y métricas | 1–2 días hábiles de trabajo, más ventana de observación |
| Infraestructura de prueba | Wildcard, HTTPS, hostnames autorizados y renovación | 1–2 días |
| Backend | Registro de dominios, resolución y aislamiento | 3–5 días |
| Frontend y SEO | Navegación por host, HTML inicial, sitemap y enlaces | 2–4 días |
| Pruebas y piloto | Funcionalidad, carga, seguridad y restauración | 2–3 días |
| Activación gradual | Migración, monitoreo y documentación operativa | 1–2 días |

El rango secuencial orientativo es de 10–18 días hábiles. No incluye la espera por terceros, dominios propios automáticos, una migración de servidor ni la evolución de resultados en Google. El rastreo puede tardar días o semanas y no garantiza indexación. [Plazos de rastreo de Google](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).

Esta revisión mantiene el rango de desarrollo como referencia, pero añade una condición de salida: la activación productiva espera al diagnóstico de recursos. El tiempo de liberar almacenamiento, resolver presión de memoria o ampliar el VPS no puede estimarse con la captura y queda fuera del rango. La observación de 24–72 horas puede solaparse con el desarrollo.

## 13. Validación antes de producción

Se probarán al menos dos tiendas con logos distintos, una sin logo, una suspendida y un hostname inexistente. Cada una debe devolver su identidad correcta o el estado HTTP acordado. Ninguna puede mostrar productos de otra.

Se comprobarán la portada y las páginas de producto mediante HTML inicial, no solo mediante el inspector de React. Las URLs canónicas, favicon, enlaces de navegación y sitemap deben coincidir con el dominio autorizado. El panel principal, la API, los blogs y el dominio personalizado existente deben seguir funcionando.

La prueba de carga tendrá caché fría y caliente, navegación de catálogos grandes, peticiones de robots e importación concurrente. Se registrarán latencia p50/p95, errores, CPU, RAM, disco, conexiones, consultas lentas y espera de trabajadores PHP. El objetivo de aceptación será mantener el servicio dentro de un presupuesto acordado tras obtener la línea base.

Se probará una renovación de certificado y una restauración. Las métricas se separarán por tienda y también se observarán globalmente, porque la infraestructura es compartida.

## 14. Publicación y reversión

Primero se guardarán configuración, base de datos y archivos necesarios. La activación se controlará por tienda mediante una bandera, empezando con un piloto. Solo después de validar la dirección nueva se activarán las redirecciones permanentes.

Ante un fallo se desactivará la asignación nueva y se restaurarán las reglas y enlaces anteriores de forma coordinada. Una redirección permanente puede quedar en caché en navegadores o buscadores: revertir un archivo no revierte instantáneamente todas las visitas. Por eso el piloto debe completarse antes de generalizar redirecciones permanentes.

## 15. Información necesaria para iniciar

Ya se proporcionaron 4 CPU, 8 GB RAM, SSD de 160 GB anunciado, Ubuntu 24.04 x86_64, uso de disco y memoria del panel, y Virtualmin. Quedan pendientes MemAvailable, swap, carga y modelo de CPU, particiones, velocidad de crecimiento, versiones de Virtualmin/PHP/Laravel, servidor web efectivo y configuración de PHP-FPM; también cantidad de tiendas, tamaño de catálogos, peso de imágenes, tráfico máximo y duración de importaciones.

Deben confirmarse el proveedor DNS y su API, quién administra Virtualmin, cómo se renuevan los certificados, dónde están los respaldos, si existe CDN y cuáles dominios externos ya están conectados. También hay que definir si los subdominios estarán incluidos en todos los planes y quién puede cambiar su dirección.

Las credenciales se facilitarán por un medio seguro de acceso al entorno; no deben incorporarse a este documento ni al repositorio.

## 16. Decisión propuesta

Implementar subdominios wildcard con una aplicación compartida, resolución central de tiendas, identidad SEO en el HTML inicial y migración gradual administrada mediante Virtualmin. Mantener el panel administrativo separado de la navegación pública. Antes del piloto en este VPS, diagnosticar el 92% de RAM y asegurar margen de almacenamiento frente al 78% de disco ocupado. El desarrollo puede avanzar en otro entorno; la expansión productiva depende de esas mediciones, no solo del tamaño del plan.

Dejar para una segunda fase la conexión automática de dominios externos y cualquier separación de infraestructura que las métricas justifiquen. El resultado esperado es una plataforma más fácil de comercializar y operar, con identidad propia para cada negocio y costos ligados al uso real.
