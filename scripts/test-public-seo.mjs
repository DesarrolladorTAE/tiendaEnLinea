import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { publicPackage, packagePath, publicLogo, LEGACY_ROUTES } from '../src/utils/publicSeo.mjs';
import { MARKETING_PAGES } from '../src/content/marketing.mjs';
import { generatePublicSeo, verificationCode, jsonForHtml } from './generate-public-seo.mjs';

const carrier = { Nombre: 'Paquetes de prueba', Categoria: 'Paquetes', Logotipo:'https://cdn.example.invalid/carrier.png' };
const raw = { proID: 55, Carrier: carrier.Nombre, Nombre: 'Conexión móvil', Monto: '150.00', Vigencia: '30 días', Descripcion: 'Incluye 5 GB & llamadas <b>ilimitadas</b>.', suscrip: 99, token: 'never-public', saldo: 500 };
const product = publicPackage(raw, carrier);
assert.equal(product.path, '/paquetes/paquetes-de-prueba-conexion-movil-55/');
assert.equal(packagePath(raw), product.path);
assert.equal(product.logo, carrier.Logotipo);
assert.equal(publicLogo('javascript:alert(1)'), '');
assert.equal(publicLogo('data:image/svg+xml,test'), '');
assert.equal(packagePath({ ...raw, Nombre: 'EMPTY' }), publicPackage({ ...raw, Nombre: 'EMPTY' }, carrier).path);
assert.throws(() => packagePath({ ...raw, proID: '../bad' }));
assert.equal(verificationCode('<meta name="google-site-verification" content="valid_token-123">'), 'valid_token-123');
assert.throws(() => verificationCode('google-site-verification=DNS-value'));
assert(!jsonForHtml({ value: '</script><script>alert(1)</script>' }).includes('<'));

const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'tlr-seo-'));
let server;
try {
  await fs.writeFile(path.join(directory, 'index.html'), '<!doctype html><html><head><title>Old</title></head><body><div id="root"></div><script src="/assets/app.js"></script></body></html>');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('El build no debe consultar el catálogo'); };
  try { await generatePublicSeo({ outDir: directory, env: { VITE_SITE_URL: 'https://example.com', VITE_GOOGLE_SITE_VERIFICATION: 'verify-test' } }); }
  finally { globalThis.fetch = originalFetch; }
  for (const absent of ['paquetes', 'catalogo-paquetes.json', 'sitemap.xml']) await assert.rejects(fs.access(path.join(directory, absent)));
  assert((await fs.readdir(path.join(directory, 'og'))).includes('te-lo-recargo.png'));
  assert(!(await fs.readdir(path.join(directory, 'og'))).some(file => file.startsWith('paquete-')));
  const home = await fs.readFile(path.join(directory, 'index.html'), 'utf8');
  assert(home.includes('name="google-site-verification" content="verify-test"'));
  assert.equal(await fs.readFile(path.join(directory, 'marketing.js'), 'utf8'), await fs.readFile('src/utils/marketingRuntime.mjs', 'utf8'));
  assert(!home.includes('/assets/app.js')); // La landing pública no carga el panel privado.
  assert((await fs.readFile(path.join(directory, 'spa.html'), 'utf8')).includes('/assets/app.js'));
  for (const [route, page] of Object.entries(MARKETING_PAGES)) {
    const html = await fs.readFile(path.join(directory, route, 'index.html'), 'utf8');
    assert(html.includes(page.title));
    assert(html.includes(page.description));
    assert(html.includes('content="https://example.com' + page.image + '"'));
    assert(html.includes('rel="canonical" href="https://example.com' + route + '"'));
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert(!html.includes('noindex'));
  }
  assert((await fs.readFile(path.join(directory, 'spa.html'), 'utf8')).includes('noindex, nofollow'));
  const rules = await fs.readFile(path.join(directory, '.htaccess'), 'utf8');
  assert(rules.indexOf('public-seo.php [L]') < rules.indexOf('RewriteCond %{REQUEST_FILENAME} -f'));
  assert(rules.includes('sitemap\\.xml'));
  assert(rules.indexOf('RewriteRule ^google7e9bcb6a75203673\\.html$ - [L]') < rules.indexOf('RewriteRule ^ spa.html'));
  const googleText = 'google-site-verification: google7e9bcb6a75203673.html';
  assert.equal(await fs.readFile(path.join(directory,'google7e9bcb6a75203673.html'),'utf8'),googleText);
  for (const [from, to] of Object.entries(LEGACY_ROUTES)) assert(rules.includes(`^${from.slice(1)}/?$ ${to} [R=301,L]`));

  const fixtureFile = path.join(directory, 'test-fixture.json');
  const fixture = { carriers: [carrier, { Nombre: 'Airtime', Categoria: 'Tiempo Aire', Logotipo:'https://cdn.example.invalid/airtime.png' }], products: { [carrier.Nombre]: [raw], Airtime:[{...raw,proID:95,Carrier:'Airtime',Nombre:'EMPTY',Monto:'20.00',Categoria:'Tiempo Aire'}] } };
  const save = () => fs.writeFile(fixtureFile, JSON.stringify(fixture));
  await save();
  let phpArgs = [];
  const phpModules = spawnSync('php', ['-m'], { encoding: 'utf8' });
  if (phpModules.error) throw new Error('Instala PHP CLI para probar el flujo bajo petición.');
  if (!/^gd$/im.test(phpModules.stdout) && process.platform === 'win32') {
    const phpPath = spawnSync('php', ['-r', 'echo PHP_BINARY;'], { encoding: 'utf8' }).stdout;
    const extension = path.join(path.dirname(phpPath), 'ext', 'php_gd.dll');
    try { await fs.access(extension); phpArgs = ['-d', `extension=${extension}`]; } catch { /* Comprobar fallback si GD no está disponible. */ }
  }
  for (const file of ['public/public-seo.php', 'scripts/preview-seo.php']) {
    const lint = spawnSync('php', ['-l', file], { encoding: 'utf8' });
    assert.equal(lint.status, 0, lint.stdout + lint.stderr);
  }
  const unit = spawnSync('php', [...phpArgs, 'scripts/test-public-seo.php', directory, fixtureFile, path.join(directory, 'unit-cache')], { encoding: 'utf8' });
  assert.equal(unit.status, 0, unit.stdout + unit.stderr);
  process.stdout.write(unit.stdout);
  const router = path.join(directory, 'test-router.php');
  await fs.writeFile(router, `<?php
require getenv('TLR_TEST_ROOT') . '/public-seo.php';
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$preview = json_decode(file_get_contents(getenv('TLR_TEST_ROOT') . '/seo-runtime-config.json'), true);
if ($path === '/google7e9bcb6a75203673.html' || in_array(rtrim($path, '/') ?: '/', $preview['publicPages'], true)) { return require getenv('TLR_TEST_PREVIEW'); }
$loader = static function () {
  $fixture = json_decode(file_get_contents(getenv('TLR_TEST_FIXTURE')), true);
  if (!empty($fixture['unavailable'])) throw new RuntimeException('offline');
  return tlr_catalog(static function ($url) use ($fixture) {
    if (substr($url, -9) === '/carriers') return $fixture['carriers'];
    parse_str(parse_url($url, PHP_URL_QUERY), $query);
    return $fixture['products'][$query['carrier']] ?? null;
  });
};
$carrierLoader = static function () {
  $fixture = json_decode(file_get_contents(getenv('TLR_TEST_FIXTURE')), true);
  if (!empty($fixture['unavailable'])) throw new RuntimeException('offline');
  return array_values(array_filter(array_map('tlr_public_carrier',$fixture['carriers'])));
};
$companyLoader = static function ($carrier) {
  $fixture = json_decode(file_get_contents(getenv('TLR_TEST_FIXTURE')), true);
  if (!empty($fixture['unavailable'])) throw new RuntimeException('offline');
  return tlr_company_products($carrier, static function () use ($fixture, $carrier) { return $fixture['products'][$carrier['name']] ?? []; });
};
tlr_serve(null, $loader, getenv('TLR_TEST_CACHE'), $carrierLoader, $companyLoader);
`);
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const cacheDirectory = path.join(directory, 'http-cache');
  server = spawn('php', [...phpArgs, '-S', `127.0.0.1:${port}`, '-t', directory, router], { env: { ...process.env, TLR_TEST_ROOT: directory, TLR_TEST_FIXTURE: fixtureFile, TLR_TEST_CACHE: cacheDirectory, TLR_TEST_PREVIEW:path.resolve('scripts/preview-seo.php') }, stdio: ['ignore', 'ignore', 'pipe'] });
  let serverError = '';
  server.stderr.on('data', chunk => { serverError += chunk; });
  const request = (route, options = {}) => fetch(`http://127.0.0.1:${port}${route}`, { redirect: 'manual', ...options });
  let response;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { response = await request('/paquetes/'); break; } catch { await delay(50); }
  }
  assert(response, serverError);
  assert.equal(response.status, 200);
  const directoryHtml = await response.text();
  const companyPath = '/paquetes/companias/paquetes-de-prueba/';
  const airtimePath = '/paquetes/recargas/airtime/';
  assert(directoryHtml.includes(companyPath));
  assert(directoryHtml.includes(airtimePath));
  assert(directoryHtml.includes('data-carrier-open'));
  assert(!directoryHtml.includes(product.path)); // Sólo logos en el primer nivel.
  assert(!directoryHtml.includes('$150.00'));
  const verificationResponse = await request('/google7e9bcb6a75203673.html');
  assert.equal(verificationResponse.status,200);
  assert.equal(await verificationResponse.text(),googleText);
  const catalogHtml = await (await request('/paquetes/')).text();
  assert(catalogHtml.includes('class="carrier-tile"'));
  assert(catalogHtml.includes(carrier.Logotipo));
  const directoryJson = await (await request('/catalogo-companias.json')).json();
  assert.equal(directoryJson.data.length,2);
  assert(!('price' in directoryJson.data[0]));
  const companyResponse = await request(companyPath);
  assert.equal(companyResponse.status,200);
  const companyHtml = await companyResponse.text();
  assert(companyHtml.includes('$150.00'));
  assert(companyHtml.includes(product.path));
  assert(companyHtml.includes('property="og:title"'));
  assert(companyHtml.includes('href="https://example.com'+companyPath+'"'));
  const companyJson = await (await request('/catalogo-companias.json?tipo=paquetes&compania=paquetes-de-prueba')).json();
  assert.equal(companyJson.data.length,1);
  assert.equal(companyJson.carrier.kind,'paquetes');
  const airtimeHtml = await (await request(airtimePath)).text();
  assert(airtimeHtml.includes('$20.00'));
  assert(!airtimeHtml.includes('data-share='));
  const airtimeJson = await (await request('/catalogo-companias.json?tipo=recargas&compania=airtime')).json();
  assert.equal(airtimeJson.data[0].path,'');
  assert.equal(airtimeJson.data[0].image,'');
  assert.equal((await request('/catalogo-companias.json?tipo=paquetes&compania=unknown')).status,404);
  for (const [route, page] of Object.entries(MARKETING_PAGES)) {
    const pageResponse = await request(route);
    assert.equal(pageResponse.status,200,route);
    const html = await pageResponse.text();
    assert(html.includes(page.title));
    assert(!html.includes('noindex'));
    if (route !== '/') {
      const redirect = await request(route + '/');
      assert.equal(redirect.status,301);
      assert.equal(redirect.headers.get('location'),route);
    }
  }
  const siteMapResponse = await request('/sitemap.xml');
  const siteMapContent = await siteMapResponse.text();
  assert(siteMapContent.includes(companyPath));
  assert(siteMapContent.includes(airtimePath));
  for (const route of Object.keys(MARKETING_PAGES)) assert(siteMapContent.includes('<loc>https://example.com' + route + '</loc>'));
  response = await request(product.path, { headers: { Host: 'attacker.example', Authorization: 'Bearer not-forwarded' } });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert(html.includes('<h1>Conexión móvil</h1>'));
  assert(html.includes('Incluye 5 GB &amp; llamadas ilimitadas.'));
  assert(html.includes('property="og:image"'));
  assert(html.includes('https://example.com' + product.path));
  assert(!html.includes('attacker.example'));
  assert(!html.includes('never-public'));
  assert(html.includes(carrier.Logotipo));
  assert(html.includes('data-location-dialog'));
  assert(html.includes('no contamos con un directorio público'));
  assert(html.includes('data-share='));
  const json = await (await request('/catalogo-paquetes.json')).json();
  assert.equal(json.data.length, 1);
  assert(!('suscrip' in json.data[0]));
  const imageUrl = json.data[0].image;
  response = await request(imageUrl);
  assert.equal(response.headers.get('content-type'), 'image/png');
  const etag = response.headers.get('etag');
  const png = Buffer.from(await response.arrayBuffer());
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.equal((await request(imageUrl, { headers: { 'If-None-Match': etag } })).status, 304);
  const fontFile = path.join(directory, 'fonts/Lato-Regular.ttf');
  await fs.rename(fontFile, fontFile + '.disabled');
  try {
    response = await request(imageUrl);
    assert.equal(response.headers.get('x-tlr-image'), 'fallback');
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), await fs.readFile(path.join(directory, 'og/te-lo-recargo.png')));
  } finally { await fs.rename(fontFile + '.disabled', fontFile); }
  assert.equal((await request(product.path, { method: 'HEAD' })).status, 200);
  response = await request('/paquetes/nombre-anterior-55/');
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://example.com' + product.path);

  const expire = async () => {
    const visit = async directory => {
      for (const entry of await fs.readdir(directory,{withFileTypes:true})) {
        const file = path.join(directory,entry.name);
        if (entry.isDirectory()) await visit(file);
        else if (entry.name === 'catalog-v3.json') {
          const cached = JSON.parse(await fs.readFile(file,'utf8'));
          cached.fetched_at = Math.floor(Date.now()/1000)-121;
          await fs.writeFile(file,JSON.stringify(cached));
        }
      }
    };
    await visit(cacheDirectory);
  };
  fixture.products[carrier.Nombre][0].Monto = '171.00';
  fixture.products[carrier.Nombre].push({ ...raw, proID: 77, Nombre: 'Otro paquete' });
  await save();
  assert.equal((await (await request('/catalogo-paquetes.json')).json()).data[0].price, 150); // Caché vigente.
  await expire();
  const updated = await (await request('/catalogo-paquetes.json')).json();
  assert.equal(updated.data.length, 2);
  assert.equal(updated.data.find(item => item.id === '55').price, 171);
  assert.notEqual(updated.data.find(item => item.id === '55').image, imageUrl);
  assert((await (await request(product.path)).text()).includes('$171.00'));
  assert((await (await request('/sitemap.xml')).text()).includes(updated.data.find(item => item.id === '77').path));
  fixture.products[carrier.Nombre] = [];
  fixture.products[carrier.Nombre].push({ ...raw, proID: 77 });
  await save(); await expire();
  response = await request(product.path);
  assert.equal(response.status, 404);
  assert((await response.text()).includes('noindex, nofollow'));
  fixture.unavailable = true;
  await save(); await expire();
  response = await request('/paquetes/');
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('retry-after'), '60');
  assert((await response.text()).includes('noindex, nofollow'));
  assert.equal(await (await request('/google7e9bcb6a75203673.html')).text(),googleText);
  assert.equal((await request('/paquetes/', { method: 'POST' })).status, 405);
  assert.equal((await request('/paquetes/invalid')).status, 404);
  console.log('PASS HTTP: fichas/PNG/JSON/sitemap bajo petición, cambios sin recompilar, caché, 301/304/404/405/503, ETag, HEAD y exclusión de datos privados.');
} finally {
  if (server && server.exitCode === null) {
    const ended = new Promise(resolve => server.once('exit', resolve));
    server.kill();
    await ended;
  }
  assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
  assert(path.basename(directory).startsWith('tlr-seo-'));
  await fs.rm(directory, { recursive: true, force: true });
}
