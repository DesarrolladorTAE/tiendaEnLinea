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

Las compilaciones de producción leen `VITE_API_URL` desde `.env.production`.
Los clientes administrativo, POS y superadministrativo comparten esa URL y
conservan sesiones separadas.

Para usar una cuenta real desde Vite, configura la URL de producción y
`VITE_ALLOW_PRODUCTION_API=true` en `.env.development.local`. Ese modo mantiene
deshabilitado el POS especializado. Reinicia Vite después de cambiar el archivo.

Para certificación, configura la URL aislada en `.env.certificacion.local` y
ejecuta `npm run dev -- --mode certificacion`. Este modo bloquea la API de
producción. Los clientes administrativo y POS conservan sus tokens separados.
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

## Fase 6 del POS en desarrollo

Para probar el buscador y la vinculación con órdenes, establece
`VITE_POS_VEHICLE=true` en `.env.development.local` junto a la URL de una API
aislada. Reinicia Vite. La opción se habilita solo en el servidor de desarrollo.
Usa un POS ficticio y capacidades autorizadas de catálogo. El contexto de orden
requiere además el módulo de servicios y la autorización de la sucursal.

El POS confirma `sale.id` antes de actualizar comprobante e inventario visual.
Si el vínculo queda pendiente, el botón de recuperación consulta primero la orden
y puede reenviar únicamente el vínculo con el mismo ID. La referencia mínima
se mantiene por tienda, sucursal y terminal en la sesión del navegador.

La habilitación operativa requiere verificar con Laravel aislado el token POS
a través del middleware real, el alcance del almacén durante el cobro V2, el
vínculo de venta y el recorrido de fase 5. Consulta los anexos 50–53 de
[integración frontend](docs/frontend-integration/README.md) para la evidencia
y el procedimiento. Un cobro sin respuesta queda incierto hasta la revisión del
historial de la terminal.

## Validación aislada de reportes financieros

Abre Reportes → Reportes financieros con una identidad Store ficticia y una
API Laravel aislada en `VITE_API_URL`. Prepara dos tiendas, dos sucursales,
un SKU textual con ceros iniciales y partidas de prueba con costo conocido,
cero y desconocido. Incluye pagos de crédito, devoluciones, cancelaciones
y al menos un bloque semanal parcial dentro del mes.

1. Verifica la zona de `GET /reports/admin/settings`. Consulta la semana y el
   mes con sucursal, producto y categoría. Compara los totales JSON en dos
   páginas semanales y verifica los límites de las semanas parciales.
2. Descarga PDF y Excel con los mismos filtros. Compara cobertura, totales
   y filas del periodo, incluidos SKU con ceros iniciales. El XLSX mensual
   documentado deja vacías las celdas de utilidad y asignación del total.
3. Comprueba que la base fiscal desconocida mantenga la utilidad en null y
   que una pérdida con base neta conserve su signo y asigne cero. Cambia
   los porcentajes solo en la tienda de prueba y verifica su persistencia.
4. Prueba una sesión vencida, un token POS y una sucursal ajena. Verifica que
   no aparezcan resultados previos ni se descarguen archivos.

Los casos simulados del frontend no certifican cifras financieras ni la
paridad de exportaciones contra Laravel. Los contratos y sus límites están
en los [anexos 54–59](docs/frontend-integration/README.md).

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

## Operación y aceptación de las fases 1 a 8

Consulta los manuales, la matriz de accesos y los procedimientos de validación y reversión en la [guía de operación frontend](docs/frontend-integration/README.md#operación-frontend).
