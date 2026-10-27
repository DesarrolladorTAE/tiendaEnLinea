import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { loadEnv } from 'vite';
import { DEFAULT_ORIGIN, DEFAULT_DESCRIPTION, LEGACY_ROUTES } from '../src/utils/publicSeo.mjs';
import { CONTACT, FAQS, MARKETING_PAGES } from '../src/content/marketing.mjs';
import { marketingHeader, marketingFooter, renderMarketing } from '../src/utils/marketingHtml.mjs';

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export const jsonForHtml = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
export function verificationCode(value = '') {
  if (!value.trim()) return '';
  const code = value.includes('<') ? value.match(/content\s*=\s*["']([^"']+)["']/i)?.[1] : value.trim();
  if (!code || !/^[A-Za-z0-9_-]+$/.test(code)) throw new Error('Usa el valor content de la etiqueta google-site-verification; el registro DNS se configura en el dominio.');
  return code;
}
export function metaHead({ title, description, pathname, image, origin, verification = '', schema, noindex = false }) {
  const url = origin + pathname;
  return `<title data-rh="true">${escapeHtml(title)}</title>
<meta data-rh="true" name="description" content="${escapeHtml(description)}">
<meta data-rh="true" name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}">
<link data-rh="true" rel="canonical" href="${escapeHtml(url)}">
<meta data-rh="true" property="og:title" content="${escapeHtml(title)}">
<meta data-rh="true" property="og:description" content="${escapeHtml(description)}">
<meta data-rh="true" property="og:type" content="website">
<meta data-rh="true" property="og:site_name" content="TeLoRecargo">
<meta data-rh="true" property="og:locale" content="es_MX">
<meta data-rh="true" property="og:url" content="${escapeHtml(url)}">
<meta data-rh="true" property="og:image" content="${escapeHtml(origin + image)}">
<meta data-rh="true" property="og:image:width" content="1200"><meta data-rh="true" property="og:image:height" content="630">
<meta data-rh="true" property="og:image:type" content="image/png">
<meta data-rh="true" property="og:image:alt" content="${escapeHtml(title)}">
<meta data-rh="true" name="twitter:card" content="summary_large_image">
<meta data-rh="true" name="twitter:title" content="${escapeHtml(title)}">
<meta data-rh="true" name="twitter:description" content="${escapeHtml(description)}">
<meta data-rh="true" name="twitter:image" content="${escapeHtml(origin + image)}">
${verification ? `<meta name="google-site-verification" content="${escapeHtml(verification)}">` : ''}
${schema ? `<script data-rh="true" type="application/ld+json">${jsonForHtml(schema)}</script>` : ''}`;
}
function wrap(value, limit, maxLines) {
  const words = String(value).split(/\s+/);
  const lines = [''];
  for (const word of words) {
    const index = lines.length - 1;
    if (lines[index] && (lines[index] + ' ' + word).length > limit) lines.push(word);
    else lines[index] += (lines[index] ? ' ' : '') + word;
  }
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].slice(0, limit - 1) + '…'; }
  return lines.map(line => line.length > limit ? line.slice(0, limit - 1) + '…' : line);
}
export function ogSvg(page = MARKETING_PAGES['/'], logo = '') {
  const name = page.heading;
  const description = page.description;
  const brand = logo ? `<image href="data:image/png;base64,${logo}" x="64" y="-15" width="160" height="160"/>` : '<text x="64" y="82" font-size="36" fill="#f3faff">TeLoRecargo</text>';
  const lines = (text, x, y, size, color, limit, count, spacing) => wrap(text, limit, count).map((line, index) => `<text x="${x}" y="${y + index * spacing}" font-size="${size}" fill="${color}">${escapeHtml(line)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#063c70"/><circle cx="1140" cy="50" r="280" fill="#38b6ff" opacity=".08"/><g font-family="Lato">${brand}<rect x="64" y="112" width="1072" height="1" fill="#2f6792"/>${lines(page.eyebrow, 64, 163, 18, '#80d1ff', 90, 1, 28)}${lines(name, 64, 245, 53, '#f3faff', 38, 2, 64)}${lines(description, 64, 387, 24, '#c5e1f6', 84, 3, 35)}<rect x="0" y="545" width="1200" height="85" fill="#0077b6"/><text x="64" y="599" font-size="28" fill="#fff">Más conexión. Más posibilidades.</text></g></svg>`;
}
function pageSchema(route, page, origin) {
  const website = { '@type':'WebSite', name:'TeLoRecargo', url:origin + '/' };
  const organization = { '@type':'Organization', name:'TeLoRecargo', url:origin, contactPoint:{ '@type':'ContactPoint', telephone:CONTACT.phone, email:CONTACT.email, contactType:'customer support', availableLanguage:'Spanish' } };
  const content = route === '/preguntas-frecuentes'
    ? { '@type':'FAQPage', mainEntity:FAQS.map(item => ({ '@type':'Question', name:item.question, acceptedAnswer:{ '@type':'Answer', text:item.answer } })) }
    : { '@type':route === '/contacto' ? 'ContactPage' : route === '/nosotros' ? 'AboutPage' : 'WebPage', name:page.title, description:page.description, url:origin + route };
  return { '@context':'https://schema.org', '@graph':route === '/' ? [website,organization,content] : [content, { '@type':'BreadcrumbList', itemListElement:[{ '@type':'ListItem', position:1, name:'Inicio', item:origin + '/' }, { '@type':'ListItem', position:2, name:page.label, item:origin + route }] }] };
}
function replaceHead(html, head) {
  return html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*(?:name|property)\s*=\s*["'](?:description|robots|google-site-verification|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi, '')
    .replace(/<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*>/gi, '')
    .replace('</head>', head + '\n</head>');
}
export async function generatePublicSeo({ outDir = 'dist', env = { ...loadEnv('production', process.cwd(), ''), ...process.env } } = {}) {
  const output = path.resolve(outDir);
  const origin = new URL(env.VITE_SITE_URL || DEFAULT_ORIGIN).origin;
  if (!origin.startsWith('https://')) throw new Error('VITE_SITE_URL debe usar HTTPS.');
  const verification = verificationCode(env.VITE_GOOGLE_SITE_VERIFICATION || '');
  // El build no consulta el catálogo y no genera páginas ni imágenes por paquete.
  const template = await fs.readFile(path.join(output, 'index.html'), 'utf8');
  const logo = (await fs.readFile('public/assets/img/logo3.png')).toString('base64');
  const imageOptions = { font: { fontFiles: [path.resolve('public/fonts/Lato-Regular.ttf')], loadSystemFonts: false, defaultFontFamily: 'Lato' } };
  await fs.mkdir(path.join(output, 'og'), { recursive: true });
  await fs.mkdir(path.join(output, 'fonts'), { recursive: true });
  await fs.writeFile(path.join(output, 'og/te-lo-recargo.png'), new Resvg(ogSvg(MARKETING_PAGES['/'], logo), imageOptions).render().asPng());
  for (const file of ['public-seo.php', 'google7e9bcb6a75203673.html', 'seo-catalog.css', 'marketing.css', 'assets/img/logo3.png', 'fonts/Lato-Regular.ttf', 'fonts/OFL.txt', 'fonts/Manrope-Variable.ttf', 'fonts/Manrope-OFL.txt']) {
    await fs.mkdir(path.dirname(path.join(output, file)), { recursive:true });
    await fs.copyFile(path.join('public', file), path.join(output, file));
  }
  await fs.copyFile('src/utils/marketingRuntime.mjs', path.join(output, 'marketing.js'));
  await fs.copyFile('src/utils/catalogRuntime.mjs', path.join(output, 'seo-catalog.js'));
  await fs.cp('public/marketing', path.join(output, 'marketing'), { recursive:true });
  const config = { origin, verification, redirects: LEGACY_ROUTES, publicPages:Object.keys(MARKETING_PAGES), publicHeader:marketingHeader('/paquetes/'), publicFooter:marketingFooter() };
  await fs.writeFile(path.join(output, 'seo-runtime-config.json'), JSON.stringify(config));
  for (const [route, page] of Object.entries(MARKETING_PAGES)) {
    const directory = route === '/' ? output : path.join(output, route);
    await fs.mkdir(directory, { recursive:true });
    const head = metaHead({ ...config, title:page.title, description:page.description, pathname:route, image:page.image, schema:pageSchema(route, page, origin) });
    const html = `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}<meta name="theme-color" content="#0077b6"><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/marketing.css"><script type="module" src="/marketing.js"></script></head><body>${renderMarketing(route)}</body></html>`;
    await fs.writeFile(path.join(directory, 'index.html'), html);
    await fs.writeFile(path.join(output, page.image), new Resvg(ogSvg(page, logo), imageOptions).render().asPng());
  }
  await fs.writeFile(path.join(output, 'spa.html'), replaceHead(template, metaHead({ ...config, title: 'Panel de usuarios | TeLoRecargo', description: 'Accede a tu cuenta de TeLoRecargo para gestionar recargas, ventas e integraciones.', pathname: '/', image: '/og/te-lo-recargo.png', noindex: true })));
  await fs.writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\nDisallow: /spa.html\nSitemap: ${origin}/sitemap.xml\n`);
  const redirects = Object.entries(LEGACY_ROUTES).map(([from, to]) => `RewriteRule ^${from.slice(1)}/?$ ${to} [R=301,L]`).join('\n');
  const publicRoutes = Object.keys(MARKETING_PAGES).filter(route => route !== '/').map(route => `RewriteRule ^${route.slice(1)}/$ ${route} [R=301,L]\nRewriteRule ^${route.slice(1)}$ ${route.slice(1)}/index.html [L]`).join('\n');
  await fs.writeFile(path.join(output, '.htaccess'), `Options -MultiViews\nDirectoryIndex index.html\nRewriteEngine On\nRewriteRule ^google7e9bcb6a75203673\\.html$ - [L]\n${redirects}\nRewriteRule ^landing/?$ / [R=301,L]\nRewriteRule ^api(?:/|$) - [L]\n${publicRoutes}\n# Procesar antes de -f/-d para reemplazar también fichas de builds anteriores.\nRewriteRule ^(?:paquetes(?:/.*)?|catalogo-(?:paquetes|companias)\\.json|sitemap\\.xml|og/paquete-[0-9]+\\.png)$ public-seo.php [L]\nRewriteCond %{REQUEST_FILENAME} -f [OR]\nRewriteCond %{REQUEST_FILENAME} -d\nRewriteRule ^ - [L]\nRewriteRule ^(?:assets|og|fonts|marketing)(?:/|$) - [R=404,L]\nRewriteRule ^ spa.html [L]\n`);
  // Netlify no ejecuta PHP. Este despliegue necesita Apache + PHP como el hosting actual.
  await fs.writeFile(path.join(output, '_redirects'), '# Las rutas públicas se resuelven con PHP y .htaccess en el hosting Apache.\n');
  console.log(`SEO listo bajo petición: PHP, caché de 120 segundos, imágenes y sitemap dinámicos. Search Console: archivo google7e9bcb6a75203673.html incluido${verification ? ' y etiqueta configurada' : ''}.`);
  return config;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generatePublicSeo({ outDir: process.argv[2] || 'dist' }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
