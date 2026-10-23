# SEO de la landing pública

## Alcance

Se usa únicamente el contenido de las páginas públicas existentes. No se extraen
datos, pantallas ni funcionalidades del panel después del login. No se crearon
landing pages de prestaciones o precios que no estén publicados.

| Ruta | Página |
| --- | --- |
| / | Inicio |
| /platform | Plataforma |
| /features | Características |
| /services | Planes |
| /contact | Contacto |
| /blogs | Listado del blog |
| /blogs/{slug} | Artículos publicados del blog público |
| /login-register | Inicio de sesión y registro, con canonical sin parámetros |

`/login-register?mode=register` abre el formulario existente en modo registro;
no es una segunda página indexable ni un nuevo sistema de autenticación. Los
enlaces de registro y acceso están disponibles en la landing.

## Cambios

- La etiqueta de verificación en index.html conserva exactamente el token
  `S7aICfAiQhecOlomyxXyFPByHxWpiA_tn_2l5U5iynA` del correo.
- publicSeoConfig.mjs define títulos, descripciones, canonical, Open Graph,
  Twitter y datos estructurados Organization/WebSite/WebPage por página.
- LandingSeo reutiliza el componente SEO existente durante navegación React.
  Los artículos conservan sus metadatos específicos del API público.
- El build genera HTML inicial de la landing con los mismos componentes públicos.
  La portada tiene un H1; los apartados incrustados usan H2. Contacto tiene H1 en
  su página propia. Los enlaces principales son anchors rastreables.
- El HTML de acceso/registro contiene un resumen público, no formularios ni
  credenciales prerenderizadas. Los formularios reales se montan con JavaScript.
- Los formularios estáticos de contacto/búsqueda permanecen deshabilitados hasta
  que React monte sus manejadores, evitando envíos GET accidentales sin JavaScript.
- Precios y otros datos obtenidos por los componentes en el navegador siguen
  cargándose desde sus APIs públicas. No se inventan precios ni se utilizan los
  planes estáticos antiguos como si fueran los actuales.
- Los artículos generan una versión inicial de texto escapado de su contenido
  público; React conserva el artículo interactivo habitual al cargar. El listado
  del blog incluye enlaces a los artículos generados.
- El sitemap se construye con las siete páginas y se amplía con artículos
  publicados indexables. robots.txt declara su URL.
- No se agregan estrellas, reseñas, métricas, precios ni testimonios inventados.

## Compilación

Ejecutar `npm run build`: Vite con manifest, prerender de landing y prerender del
blog. Este último consulta el API público de publicaciones y falla si no puede
obtener los datos; revisar la salida antes de publicar. No publicar un build
parcial. Ejecutar `node scripts/verify-landing-seo.mjs` sobre la salida completa.

## Publicación en Virtualmin/Apache

Publicar todo dist, incluidas las carpetas con index.html por página, sitemap.xml,
robots.txt, spa.html, assets y storefront-meta.php. El documento raíz index.html
contiene ahora la portada pública, no la plantilla vacía de todas las rutas.

**Aplicar también el cambio de fallback del archivo
deploy/virtualmin-public_html.htaccess**: las rutas que no son archivos o carpetas
existentes deben ir a spa.html. Conservar las reglas existentes de HTTPS, API y
tiendas. No reemplazar configuración personalizada sin incorporarla al ajuste.
Esto evita servir HTML y canonical de la portada en rutas privadas o inexistentes.
Las páginas prerenderizadas se sirven desde sus propias carpetas.

storefront-meta.php usa spa.html cuando está disponible y conserva compatibilidad
con builds anteriores. No se modificó ningún controlador Laravel ni la lógica de
las tiendas; únicamente se conserva su plantilla HTML vacía de marketing.

Tras publicar, vaciar caché de HTML si existe y comprobar la raíz con «Ver código
fuente»: token exacto dentro de head, texto visible y un H1, un canonical y un
título. Comprobar también robots.txt, sitemap.xml y las rutas públicas, además de
que una ruta interna siga cargando la app con spa.html. La instalación del token
no equivale a verificar Search Console: el responsable debe pulsar «Verificar»
y enviar el sitemap desde la cuenta que creó la propiedad.

No se envían correos ni se publica al servidor desde esta tarea. Los cambios
preparan indexación y lectura; no garantizan posiciones ni menciones en IA.
