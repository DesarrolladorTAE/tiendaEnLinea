# Web pública de TeLoRecargo

La antigua landing de secciones se divide en páginas con navegación propia:

| Ruta | Contenido |
| --- | --- |
| `/` | Portada, servicios destacados, herramientas y siguientes pasos |
| `/servicios` | Recargas, paquetes, comprobantes, contactos, ventas e integraciones |
| `/como-funciona` | Proceso de acceso, saldo, confirmación y seguimiento |
| `/nosotros` | Presentación de la plataforma, valores y ubicación publicada |
| `/preguntas-frecuentes` | Ayuda agrupada por cuenta, operación e integraciones |
| `/contacto` | WhatsApp, correo, ubicación y formulario existente |
| `/paquetes/` | Logos separados de Recargas y Paquetes; precios por compañía en modal y fichas PHP bajo petición |

Se conserva `/iniciar-sesion` para entrar al panel. Las rutas antiguas y los enlaces viejos de la landing tienen redirecciones o equivalencias a las páginas nuevas.

## Diseño y recursos

Logo original de TeLoRecargo y paleta predominantemente azul; fuente Manrope local; navegación móvil con menú nativo; tarjetas y columnas que se apilan; foco visible, enlace para saltar al contenido y compatibilidad con movimiento reducido. La fotografía de portada tiene versiones WebP para escritorio y móvil. Su origen y prompt están en `design/marketing/ASSETS.md`. La dirección de la empresa está en el pie de todas las páginas; Inicio y Contacto incluyen un mapa con la ubicación ya publicada.

El contenido está centralizado en `src/content/marketing.mjs`; las plantillas están en `src/utils/marketingHtml.mjs`. Se comparten entre la página pública y el respaldo de React, para mantener el mismo contenido y diseño. El catálogo PHP recibe la misma cabecera y pie de página desde la configuración del build. Los términos conservan su texto original y usan el nuevo marco visual.

La lógica de navegación y contacto está en `src/utils/marketingRuntime.mjs`. React importa ese módulo desde `src`; al compilar se copia a `dist/marketing.js` para las páginas HTML/PHP. No se importa JavaScript de `public` desde el código fuente.

## SEO y rendimiento

Cada página tiene título, descripción, canonical, Open Graph, imagen para compartir, un H1 y datos estructurados propios. El sitemap dinámico incluye las nuevas rutas públicas. La portada y las páginas informativas se entregan en HTML completo, sin cargar el JavaScript del panel privado. El menú, los enlaces y las preguntas desplegables funcionan sin depender de React.

El build prepara las páginas informativas del sitio, su configuración y sus recursos. Los paquetes y sus imágenes continúan bajo petición en PHP con caché breve; no se copian los paquetes en el build ni se consulta su API para compilar.

## Contacto

El formulario usa el endpoint existente `POST /api/contacto`, con `nombre`, `email`, `telefono` y `mensaje`. Valida campos en el navegador, bloquea envíos simultáneos, informa errores de validación y límite de solicitudes, y conserva el mensaje si hay un error. No registra los datos en consola ni adjunta un token de cuenta. Las pruebas simulan el envío localmente; no mandan mensajes reales.

## Publicación y verificación

```sh
npm run test:marketing
npm run test:marketing:dev
npm run test:seo
node scripts/test-integraciones.cjs
npm run build
```

Sube `dist` completo, incluidas las nuevas carpetas de páginas, `marketing`, `fonts`, `og`, `marketing.css`, `marketing.js`, `.htaccess` y los archivos PHP. El hosting con PHP sigue siendo necesario para paquetes, JSON y sitemap. Las rutas públicas sin barra final se sirven mediante las reglas incluidas en `.htaccess`.

Para comprobar el build con PHP:

```sh
php -S 127.0.0.1:4173 -t dist scripts/preview-seo.php
```

El archivo de verificación de Search Console está incluido como se explica en `SEO-PUBLICO.md`. Subir el build o el archivo al hosting es necesario antes de pulsar Verificar; no se garantiza una posición en los resultados de búsqueda.
