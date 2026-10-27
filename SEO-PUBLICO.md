# Paquetes públicos bajo petición

Las fichas se sirven con **PHP**, sin generar una página por paquete durante el build. Al abrir o compartir un enlace, PHP consulta el catálogo público, responde con el HTML completo y sus etiquetas Open Graph, y utiliza una caché de **120 segundos** fuera del directorio público. Cambiar precios, beneficios, agregar o retirar paquetes no requiere recompilar.

## Rutas

- `/paquetes/`: logos de compañías en carruseles separados de Recargas y Paquetes, con buscador y sin iniciar sesión. Seleccionar una compañía abre sus precios en un modal; no descarga todos los precios al entrar.
- `/paquetes/companias/slug/` y `/paquetes/recargas/slug/`: páginas de cada compañía, también accesibles sin JavaScript. Sólo los paquetes tienen fichas individuales y opciones para compartir.
- `/catalogo-companias.json`: directorio público de compañías; `?tipo=paquetes&compania=slug` o `?tipo=recargas&compania=slug` consulta únicamente los precios de la compañía elegida.
- `/paquetes/nombre-del-paquete-ID/`: ficha con beneficios, precio, vigencia y opciones para compartir. Se busca por ID; si cambia el nombre, el enlace anterior redirige a la nueva dirección.
- `/og/paquete-ID.png?v=...`: tarjeta PNG de 1200 × 630 generada bajo petición. La versión cambia cuando cambia el paquete.
- `/catalogo-paquetes.json`: catálogo público actualizado para la navegación de React.
- `/sitemap.xml`: sitemap dinámico, con los paquetes disponibles en ese momento.

Sólo se consulta `https://telorecargo.com/api/carriers` y `/api/producto?carrier=...`, sin token ni cookies. Se publican nombre, compañía, precio, vigencia y descripción; quedan fuera comisiones, saldo, claves y datos de cuenta. El dominio de la API es fijo: ni el encabezado Host ni los parámetros de la URL pueden cambiarlo.

Si falla la API y no hay una caché vigente, PHP responde **503** con `Retry-After`, en lugar de publicar información vacía o marcar como inexistentes todos los paquetes. Un ID que no existe en un catálogo obtenido correctamente devuelve **404** con `noindex`.

## Requisitos del hosting

No existe todavía un directorio público de negocios afiliados. La opción de ubicación abre una búsqueda general en Maps y lo explica expresamente; no identifica puntos verificados de TeLoRecargo.

- Apache 2.4 con `mod_rewrite` y permiso para usar `.htaccess`.
- PHP 7.4 o superior con **cURL**.
- **GD con FreeType** para tarjetas PNG específicas por paquete. Si falta GD, se utiliza la imagen general de TeLoRecargo y se conservan título y descripción del paquete en Open Graph.
- Directorio temporal de PHP escribible para la caché. Si no permite escribirla, la consulta sigue funcionando sin caché. No se necesitan cron, una base de datos adicional ni un proceso Node en producción.

La caché guarda únicamente el catálogo público filtrado, en `sys_get_temp_dir()`, separada por instalación. El navegador debe revalidar el HTML; las imágenes tienen caché HTTP de 120 segundos y ETag. Las redes sociales pueden conservar su propia vista previa más tiempo.

## Compilar y subir

1. Si compilas en otra máquina, instala las dependencias con `npm install --legacy-peer-deps`.
2. Copia `.env.example` a `.env.production.local` y ajusta el dominio si corresponde.
3. Ejecuta `npm run build` (también funciona `vite build`). La compilación **no llama a la API ni necesita que el catálogo esté disponible**.
4. Sube el contenido completo de `dist`, incluidos `.htaccess`, `public-seo.php`, `seo-runtime-config.json`, `spa.html`, `og/te-lo-recargo.png`, `fonts`, los estilos y los scripts.
5. Comprueba una ficha con “Ver código fuente”: título, descripción y `og:image` ya deben estar en el HTML inicial. Abre la imagen de `og:image` y `sitemap.xml`.

La regla dinámica de `.htaccess` está antes de las comprobaciones de archivos y carpetas. Así, incluso si quedan fichas estáticas de un build anterior en el hosting, las rutas de paquetes, JSON y sitemap pasan por PHP. Conserva esta regla al combinarla con la configuración de tu hosting.

El build prepara la aplicación, las páginas informativas del sitio, los recursos de diseño, las imágenes generales de marca, la configuración pública de SEO y las reglas de Apache. Se sigue recompilando para cambios de código, contenido institucional, diseño, dominio o verificación de Google; **no para cambios del catálogo**. Un hosting puramente estático como Netlify no ejecuta este PHP.

La nueva web pública incluye `/servicios`, `/como-funciona`, `/nosotros`, `/preguntas-frecuentes` y `/contacto`, con metadatos propios e inclusión en el sitemap dinámico. Su contenido y sus recursos se describen en `WEB-PUBLICA.md`.

## Compartir desde el panel

En Ventas de paquetes aparece **Ver catálogo público para compartir**. Al seleccionar un paquete, su sección de detalles incluye **Compartir paquete** y **Ver ficha pública**. La ficha permite compartir por WhatsApp y buscar puntos de recarga en Maps; los resultados de Maps no son un directorio de distribuidores verificados.

## Google Search Console: archivo de verificación incluido

Se agregó `public/google7e9bcb6a75203673.html` con este contenido exacto, sin etiquetas ni salto de línea adicional:

```text
google-site-verification: google7e9bcb6a75203673.html
```

El build lo copia a su raíz. `.htaccess` tiene una excepción estática explícita antes de las rutas PHP y del fallback del SPA. Las pruebas comprueban respuesta **200** y cuerpo exacto, incluso si no está disponible el catálogo. Sube este archivo a la raíz del hosting (puede subirse por separado) o sube `dist` completo; después abre `https://telorecargo.com/google7e9bcb6a75203673.html` y verifica que devuelva sólo esa línea. La preparación local no publica el archivo ni verifica la propiedad en Google.

Para este método no hace falta configurar una etiqueta meta. Si se utiliza también el método de etiqueta HTML, sigue disponible esta configuración opcional:

Agrega el valor de `content` entregado por Google a `.env.production.local`:

```dotenv
VITE_SITE_URL=https://telorecargo.com
VITE_GOOGLE_SITE_VERIFICATION=TU_CODIGO
```

Compila y sube el build. La etiqueta queda en el HTML inicial de la página principal y en las fichas que sirve PHP. Déjala configurada para futuras compilaciones; después pulsa **Verificar** y envía `https://telorecargo.com/sitemap.xml` en Search Console.

Si entrega un registro que empieza con `google-site-verification=`, corresponde al método **DNS TXT** y debe agregarse en el proveedor del dominio. La verificación y el SEO técnico no garantizan indexación ni posiciones. No se ha publicado ni modificado el sitio `eladyasociados.com` desde este proyecto.

## Verificar en local

```sh
npm run test:seo
node scripts/test-integraciones.cjs
npm run build
php -S 127.0.0.1:4173 -t dist scripts/preview-seo.php
```

Las pruebas requieren PHP CLI. Prueban las respuestas reales de un servidor PHP con un catálogo de prueba, sus cambios sin recompilar, la expiración de caché, el sitemap, las imágenes, las redirecciones y los errores HTTP. `vite preview` no ejecuta PHP; utiliza el comando anterior para probar el build completo. `npm run dev` mantiene el catálogo de respaldo de React para trabajar en la interfaz.

Las rutas legibles del panel y las redirecciones de las rutas antiguas se conservan. El panel privado usa `spa.html` con `noindex` y permanece fuera del sitemap.
