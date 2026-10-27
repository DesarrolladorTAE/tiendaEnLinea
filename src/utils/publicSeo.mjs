export const SITE_NAME = 'TeLoRecargo';
export const DEFAULT_ORIGIN = 'https://telorecargo.com';
export const DEFAULT_DESCRIPTION = 'Conoce los paquetes, recargas y servicios de TeLoRecargo. Consulta sus beneficios y pídelos con tu proveedor más cercano.';
export const LEGACY_ROUTES = {
  '/integraciones': '/tokens',
  '/home-fashion-three': '/inicio',
  '/shop-grid-right-sidebar': '/recargas',
  '/shop-grid-paquet': '/ventas/paquetes',
  '/mycontacts': '/contactos',
  '/historial-recargas': '/ventas',
  '/my-account': '/mi-cuenta',
  '/saldo-recarga': '/recargar-saldo',
  '/wallet': '/monedero',
  '/agent-mipages': '/agentes',
  '/loginmui': '/iniciar-sesion',
  '/login': '/iniciar-sesion',
  '/login-register': '/iniciar-sesion',
  '/wishlist': '/favoritos',
  '/compare': '/comparar',
  '/contact': '/contacto',
  '/features': '/servicios',
  '/about': '/nosotros',
  '/faq': '/preguntas-frecuentes',
};
export const ROUTE_TITLES = {
  '/': 'Recargas y paquetes en México', '/paquetes': 'Catálogo de paquetes',
  '/inicio': 'Inicio', '/recargas': 'Venta de recargas', '/ventas/paquetes': 'Venta de paquetes',
  '/ventas': 'Historial de ventas', '/contactos': 'Mis contactos', '/mi-cuenta': 'Mi cuenta',
  '/monedero': 'Monedero', '/recargar-saldo': 'Recargar saldo', '/tokens': 'Tokens',
  '/iniciar-sesion': 'Iniciar sesión', '/agentes': 'Agentes', '/terminos-condiciones': 'Términos y condiciones',
};
export const ROUTE_DESCRIPTIONS = {
  '/inicio': 'Accede al panel de TeLoRecargo para vender recargas, consultar tu saldo y administrar tu negocio.',
  '/recargas': 'Realiza recargas de tiempo aire desde tu cuenta de TeLoRecargo y consulta las compañías disponibles.',
  '/ventas/paquetes': 'Vende paquetes de internet, telefonía y servicios desde tu cuenta de TeLoRecargo.',
  '/ventas': 'Consulta el historial de tus ventas y recargas en TeLoRecargo.',
  '/contactos': 'Administra los contactos de tus recargas desde tu cuenta de TeLoRecargo.',
  '/mi-cuenta': 'Consulta y actualiza la información de tu cuenta de TeLoRecargo.',
  '/monedero': 'Consulta las opciones de tu monedero en TeLoRecargo.',
  '/recargar-saldo': 'Agrega saldo a tu cuenta de TeLoRecargo para continuar realizando recargas.',
  '/tokens': 'Administra por separado los tokens de tus integraciones con ClicMenu, MiTiendaEnLineaMx y TAEConta.',
  '/iniciar-sesion': 'Inicia sesión en TeLoRecargo para administrar tus recargas, paquetes, saldo y ventas.',
  '/terminos-condiciones': 'Consulta los términos y condiciones de uso de la plataforma TeLoRecargo.',
};
export const cleanText = value => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
export const slugify = value => cleanText(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
export const money = value => Number(value).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
export function publicLogo(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(String(value || '').trim(), DEFAULT_ORIGIN);
    return value && url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
export function packagePath(product) {
  const id = String(product.id ?? product.proID ?? '');
  if (!/^[0-9]+$/.test(id)) throw new Error('El paquete no tiene un identificador válido.');
  const name = product.name ?? (cleanText(product.Nombre) && product.Nombre !== 'EMPTY' ? cleanText(product.Nombre) : `Paquete ${money(product.Monto)}`);
  return `/paquetes/${slugify(`${product.carrier ?? product.Carrier} ${name}`) || 'paquete'}-${id}/`;
}
export function publicPackage(product, carrier) {
  const price = Number(product.Monto);
  if (!product.proID || !Number.isFinite(price) || price < 0) throw new Error('Paquete público inválido.');
  // Lista explícita: nunca publicar comisiones, respuestas completas ni datos de usuarios.
  const kind = String(carrier.Categoria || '').toLowerCase() === 'tiempo aire' ? 'recargas' : 'paquetes';
  const value = {
    id: String(product.proID), carrier: cleanText(carrier.Nombre), logo: publicLogo(carrier.Logotipo),
    kind,
    name: cleanText(product.Nombre) && product.Nombre !== 'EMPTY' ? cleanText(product.Nombre) : `${kind === 'recargas' ? 'Recarga' : 'Paquete'} ${money(price)}`,
    price, validity: cleanText(product.Vigencia), description: cleanText(product.Descripcion),
  };
  return { ...value, path: kind === 'paquetes' ? packagePath(value) : '' };
}
export function publicCarrier(raw) {
  const category = cleanText(raw.Categoria).toLowerCase();
  const kind = category === 'paquetes' ? 'paquetes' : category === 'tiempo aire' ? 'recargas' : null;
  if (!kind) return null;
  const name = cleanText(raw.Nombre);
  const slug = slugify(name);
  if (!slug) return null;
  return { name, slug, kind, logo:publicLogo(raw.Logotipo), path:`/paquetes/${kind === 'paquetes' ? 'companias' : 'recargas'}/${slug}/` };
}
async function publicList(url, fetcher) {
  const response = await fetcher(url, { headers:{ Accept:'application/json' }, credentials:'omit', signal:AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('No se pudo consultar el catálogo.');
  const body = await response.json();
  const data = Array.isArray(body) ? body : body.data;
  if (!Array.isArray(data)) throw new Error('Formato de catálogo no válido.');
  return data;
}
export async function fetchPublicCarriers(api = `${DEFAULT_ORIGIN}/api`, fetcher = fetch) {
  return (await publicList(`${api}/carriers`, fetcher)).map(publicCarrier).filter(Boolean);
}
export async function fetchCarrierProducts(carrier, api = `${DEFAULT_ORIGIN}/api`, fetcher = fetch) {
  const raw = await publicList(`${api}/producto?carrier=${encodeURIComponent(carrier.name)}`, fetcher);
  return raw.filter(item => item.Carrier === carrier.name).map(item => publicPackage(item, { Nombre:carrier.name, Logotipo:carrier.logo, Categoria:carrier.kind === 'paquetes' ? 'Paquetes' : 'Tiempo Aire' })).sort((a,b) => a.price-b.price);
}
export function packageDescription(product) {
  return `${product.name} de ${product.carrier}. ${money(product.price)} MXN.${product.validity ? ` Vigencia: ${product.validity}.` : ''} ${product.description} Pídelo con tu proveedor más cercano.`.replace(/\s+/g, ' ').trim();
}
export async function fetchPublicPackages(api = `${DEFAULT_ORIGIN}/api`, fetcher = fetch) {
  const get = async path => {
    const response = await fetcher(`${api}${path}`, { headers: { Accept: 'application/json' }, credentials: 'omit', signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`No se pudo obtener el catálogo público (${response.status}).`);
    const body = await response.json();
    const list = Array.isArray(body) ? body : body.data;
    if (!Array.isArray(list)) throw new Error('El catálogo público tiene un formato no válido.');
    return list;
  };
  const carriers = (await get('/carriers')).filter(item => cleanText(item.Categoria).toLowerCase() === 'paquetes');
  const packages = [];
  // Limitar las peticiones simultáneas al catálogo.
  for (let index = 0; index < carriers.length; index += 3) {
    const results = await Promise.all(carriers.slice(index, index + 3).map(async carrier => {
      const products = await get(`/producto?carrier=${encodeURIComponent(carrier.Nombre)}`);
      return products.filter(item => item.Carrier === carrier.Nombre).map(item => publicPackage(item, carrier));
    }));
    packages.push(...results.flat());
  }
  if (!packages.length) throw new Error('El catálogo público está vacío. No se publicarán fichas vacías.');
  if (new Set(packages.map(item => item.path)).size !== packages.length) throw new Error('Hay rutas de paquetes duplicadas.');
  return packages.sort((a, b) => a.carrier.localeCompare(b.carrier, 'es') || a.price - b.price);
}
