# 🛒 **TiendaTAE** - Un Marketplace Flexible para Todos

## 🚀 **¡Bienvenido a TiendaTAE!**

Transforma la experiencia de compra y gestión con nuestro innovador sistema de **TiendaTAE**, una solución versátil y escalable diseñada para ofrecer una experiencia de compra fluida y adaptada a múltiples tiendas y clientes. 

Ya sea que estés lanzando una nueva tienda en línea o buscando una solución para múltiples tiendas, nuestra plataforma ofrece la flexibilidad y potencia que necesitas. 

## 🎨 **Características Principales**

- **💡 Flexibilidad para Múltiples Tiendas**: Administra varias tiendas con una sola plataforma.
- **📦 Gestión Avanzada de Productos**: Desde categorías y etiquetas hasta imágenes, todo en un solo lugar.
- **🔐 Seguridad de Cliente**: Gestión segura de cuentas de cliente con autenticación robusta.
- **📈 Reportes y Estadísticas**: Analiza el rendimiento de tus productos y tiendas con facilidad.
- **🛠️ Personalización**: Adapta la plataforma a tus necesidades específicas con facilidad.

## 🏗️ **Arquitectura de la Base de Datos**

Nuestra base de datos está diseñada para ofrecer una gestión eficiente y relaciones claras entre entidades. Aquí te mostramos cómo está estructurada:

### **Tablas Principales**

- **Tiendas**: Información básica sobre cada tienda.
- **Clientes**: Datos de los clientes asociados a las tiendas.
- **Productos**: Detalles de los productos disponibles.
- **Categorías de Productos**: Clasificación de productos por categoría.
- **Etiquetas de Productos**: Etiquetas para facilitar la búsqueda.
- **Imágenes de Productos**: URLs de las imágenes asociadas a los productos.
- **Productos en Tiendas**: Relación entre productos y tiendas, incluyendo precio y stock.

### **Relaciones entre Tablas**

- **Clientes** tienen una relación uno-a-muchos con **Tiendas**.
- **Productos** tienen relaciones con **Categorías de Productos**, **Etiquetas de Productos**, e **Imágenes de Productos**.
- **Productos en Tiendas** vincula **Productos** y **Tiendas** con datos específicos de cada tienda.

## API de desarrollo y pruebas de servicios

Configura `VITE_API_URL=http://127.0.0.1:8000/api` en `.env.development.local`
y ejecuta `npm run dev`. Sustituye la URL por la de tu instancia aislada y
reinicia Vite después de cambiarla. Los clientes administrativo y POS bloquean
peticiones sin una API aislada configurada y conservan sus tokens separados.
Las variables `VITE_*` son públicas en el navegador. Guarda las credenciales
solo en el entorno de Laravel y usa cuentas y datos ficticios. El envío remoto
de incidencias solo se ejecuta en compilaciones de producción.

Para compilar y verificar el frontend sin consultar el blog público, ejecuta
`npx --no-install vite build --manifest`. El comando habitual `npm run build`
incluye el prerender del blog, que consulta el API público de publicaciones.

En la edición del servicio, Agenda, Recursos y Formularios guardan de forma
independiente. La agenda y los horarios de recursos reemplazan sus colecciones.
El editor vuelve a consultar antes de guardar y avisa si detecta cambios.
Esta comparación deja una ventana de carrera y no sustituye una precondición
atómica del servidor. Guardar un horario de recurso vacío elimina sus franjas
propias. Guardar una lista de formularios vacía elimina las asociaciones y
conserva el historial. La agenda del servicio requiere al menos una franja.

## Expedientes vehiculares

El acceso dentro de Servicios requiere `vehicle_records.authorization.read`
en la configuración privada de la sucursal y una sesión administrativa. La
sucursal sirve para resolver permisos y documentos. Las consultas de expedientes
mantienen el alcance de tienda que valida Laravel.

Los contratos 22 a 26 documentan el listado, altas, cambios, historial, QR
y etiquetas. El selector de clientes usa el directorio reducido de la tienda
y filtra localmente. Marcas y modelos conservan su permiso de catálogo.
Si solo está habilitado Expedientes, se pueden editar otros campos conservando
la marca y el modelo registrados. El backend todavía no ofrece un catálogo
de marcas y modelos propio de expedientes.

El historial muestra dos paginadores y usa los snapshots de las órdenes.
El QR se resuelve dentro del panel autenticado. Sus operaciones de documento
también quedan sujetas al alcance de servicios que valida Laravel. La etiqueta
PDF acepta dimensiones personalizadas en milímetros.

## Formularios e inspecciones

La administración de plantillas usa la capacidad privada `service_forms` de la
sucursal. Los borradores se abren desde una orden existente y el historial
vehicular enlaza al snapshot de cada captura. Laravel conserva versiones
anteriores en órdenes y capturas y publica la versión vigente en el catálogo.
La instalación de la inspección estándar obtiene su esquema de Laravel.
La descarga PDF usa el contexto de la sucursal de la orden. Las pruebas de
React funcionan con fixtures y el contrato de referencia está en los
documentos 27 a 32.
