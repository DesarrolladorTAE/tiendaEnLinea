export const SITE_URL = "https://mitiendaenlineamx.com.mx";
export const SITE_NAME = "Mi Tienda en Línea MX";
export const LANDING_PAGES = {
  "/": { title: "Tienda en línea y POS en la nube | Mi Tienda en Línea MX", description: "Vende por internet y administra ventas, inventarios y sucursales desde una sola plataforma para negocios en México. Conoce Mi Tienda en Línea MX." },
  "/platform": { title: "Plataforma de ventas, inventario y POS | Mi Tienda en Línea MX", description: "Conoce la plataforma de Mi Tienda en Línea MX: punto de venta, tienda en línea, inventarios y sucursales conectados para administrar tu negocio." },
  "/features": { title: "Características de la plataforma | Mi Tienda en Línea MX", description: "Explora las características públicas de Mi Tienda en Línea MX y conoce sus herramientas para vender por internet y administrar tu negocio." },
  "/services": { title: "Planes de tienda en línea y punto de venta | Mi Tienda en Línea MX", description: "Consulta los planes disponibles de Mi Tienda en Línea MX. Compara las opciones publicadas y contacta al equipo para elegir la adecuada para tu negocio." },
  "/contact": { title: "Contacto y asesoría | Mi Tienda en Línea MX", description: "Contacta al equipo de Mi Tienda en Línea MX para recibir asesoría sobre la plataforma, planes e implementación de tu tienda en línea." },
  "/blogs": { title: "Blog para negocios y tiendas en línea | Mi Tienda en Línea MX", description: "Consulta las publicaciones de Mi Tienda en Línea MX sobre negocios, ventas y tiendas en línea. Encuentra información y novedades de la plataforma." },
  "/login-register": { title: "Iniciar sesión y crear cuenta | Mi Tienda en Línea MX", description: "Inicia sesión en Mi Tienda en Línea MX o crea tu cuenta desde la página de registro. Accede con tus credenciales o consulta los planes antes de comenzar." },
};
export function landingMetadata(pathname) {
  const path = pathname.replace(/\/+$/, "").toLowerCase() || "/";
  const page = LANDING_PAGES[path];
  return page ? { ...page, path, url: `${SITE_URL}${path}` } : null;
}
export function landingStructuredData(page) {
  return { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: `${SITE_URL}/`, logo: `${SITE_URL}/assets/logoc.png` },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: `${SITE_URL}/`, inLanguage: "es-MX", publisher: { "@id": `${SITE_URL}/#organization` } },
    { "@type": "WebPage", "@id": `${page.url}#webpage`, url: page.url, name: page.title, description: page.description, inLanguage: "es-MX", isPartOf: { "@id": `${SITE_URL}/#website` } },
  ] };
}
