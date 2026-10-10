# Publicar los metadatos en Virtualmin

El build sigue siendo `npm run build`. Vite copia `public/storefront-meta.php`
a `dist/storefront-meta.php`. Sube **el contenido de `dist`** a
`/home/mitiendaenlineamx/public_html`, junto al `index.html` existente.
No subas la carpeta `dist` como una subcarpeta.

Se preparó también una [versión completa del `.htaccess`](../deploy/virtualmin-public_html.htaccess)
basada en el archivo compartido del servidor. Incluye el bloque de metadatos
antes del fallback de React y elimina los escapes de formato del mensaje.
Después de respaldar el original y subir el build con el PHP, puedes copiar
su contenido en `public_html/.htaccess`. Este archivo está en `deploy`, no
se copia automáticamente a `dist`. Si el `.htaccess` del servidor cambió
desde que lo compartiste, incorpora solo el bloque de metadatos.

## Activación inicial (una vez)

1. En Virtualmin, confirma que este dominio ejecuta **PHP 7.4 o superior con
   la extensión cURL**, y que sirve las rutas mediante **Apache 2.4 con
   mod_rewrite**. La presencia de `.htaccess` en el explorador no confirma
   por sí sola que Apache lo esté leyendo. Si Nginx sirve directamente el
   frontend, necesitará reglas equivalentes en su configuración.
2. Descarga una copia del `.htaccess` actual antes de editarlo.
3. Sube el contenido del build, incluido `storefront-meta.php`.
4. Abre `.htaccess` y agrega el bloque de
   [`deploy/virtualmin-storefront.htaccess.txt`](../deploy/virtualmin-storefront.htaccess.txt)
   **después de las redirecciones a HTTPS/dominio principal y antes del
   fallback de React que envía las rutas a `index.html`**. No reemplaces
   el archivo completo: contiene reglas propias del servidor y de la API.
5. Conserva `storage`, la configuración de la API y el resto de archivos
   del servidor al subir el build. El proyecto no genera un `.htaccess`
   que sobrescriba el actual.

El bloque solo intercepta las páginas `/tienda/SLUG`,
`/tienda/SLUG/producto/ID` y las rutas de `latehuanita.mx`, que ya es el
dominio personalizado configurado en React. Conserva `?branch=SUCURSAL`.
Los assets, blogs y endpoints de la API mantienen su enrutamiento actual.
La bandera `END` termina la reescritura para evitar que el fallback de React
capture de nuevo la solicitud: [documentación de Apache](https://httpd.apache.org/docs/2.4/rewrite/flags.html#flag_end).

## Qué cambia al publicar

PHP lee `index.html`, consulta únicamente los endpoints públicos de la API
y añade título, descripción, canonical, Open Graph, Twitter e icono de la
tienda al HTML inicial. Las páginas de tienda usan el logo; los productos
usan su foto, con el logo como respaldo. El logo también llega a la pantalla
de carga desde la primera visita. No se necesita un proceso Node en producción.

La API predeterminada es `https://mitiendaenlineamx.com.mx/api`, igual que el
frontend. Si usas otra `VITE_API_URL`, configura `STOREFRONT_API_URL` en el
entorno de PHP-FPM o cambia el valor predeterminado en
`public/storefront-meta.php` **antes del build**. PHP no lee el `.env` de Vite.
No se usan credenciales de administrador.

Las respuestas públicas se guardan hasta 120 segundos en el directorio
temporal de PHP, fuera de `public_html`. Si la API no responde en seis
segundos, se entrega el HTML de React sin metadatos personalizados para que
la aplicación pueda cargar. En ese caso aparece la cabecera
`X-Storefront-Metadata: fallback`.

## Comprobación después de subir

Usa un enlace **real** de tu tienda y otro de un producto. En el navegador,
selecciona **Ver código fuente de la página**, no el inspector de elementos.
Busca `og:title`, `og:image`, `og:url` y `storefront-brand`: deben estar ya
en ese código, con los datos de la tienda/producto correctos.

Desde una terminal también puedes ejecutar:

```sh
curl -sS -D - 'https://mitiendaenlineamx.com.mx/tienda/SLUG-REAL'
curl -sS -D - 'https://mitiendaenlineamx.com.mx/tienda/SLUG-REAL/producto/ID-REAL'
```

Espera `Content-Type: text/html` y `X-Storefront-Metadata: ready`.
Abre también la URL de `og:image`: debe responder públicamente con la imagen.
Comprueba que el catálogo, una ruta del panel y la API sigan funcionando.
Si aparece código PHP en la respuesta, aún no está activado el ejecutor PHP
para ese dominio; retira el bloque de reglas hasta configurarlo.

Los enlaces previamente compartidos pueden conservar una vista previa en
caché en la red social. Primero comprueba el HTML nuevo; después solicita
una nueva lectura en el [depurador de Facebook](https://developers.facebook.com/tools/debug/).

## Publicaciones siguientes

Vuelve a ejecutar `npm run build` y sube el contenido de `dist` como siempre.
Conserva el `.htaccess` configurado. Los cambios de nombres, imágenes y
descripciones guardados en la API no requieren reconstruir cada página:
el servidor vuelve a consultarlos al vencer la caché.

Para revertir esta integración, retira únicamente el bloque de reglas
añadido al `.htaccess`. El fallback anterior volverá a servir `index.html`.

## Validación local

```sh
php -l public/storefront-meta.php
php scripts/test-storefront-meta.php
```

Estas pruebas usan respuestas simuladas; la activación de PHP y las reglas
del `.htaccess` deben comprobarse en Virtualmin después de publicar.
