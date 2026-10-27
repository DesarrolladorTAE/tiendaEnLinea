import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import jsdom from 'jsdom';
import postcss from 'postcss';
import { MARKETING_PAGES } from '../src/content/marketing.mjs';
import { renderMarketing } from '../src/utils/marketingHtml.mjs';

const { JSDOM } = jsdom;
const publicRoutes = new Set([...Object.keys(MARKETING_PAGES), '/paquetes/', '/iniciar-sesion', '/terminos-condiciones']);
for (const route of Object.keys(MARKETING_PAGES)) {
  const dom = new JSDOM(renderMarketing(route), { url:'https://example.com' + route });
  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('h1').length, 1, route);
  assert(doc.querySelector('main#contenido'));
  assert(doc.querySelector('.m-menu summary[aria-label]'));
  assert.equal(doc.querySelector('.m-nav-actions>.m-btn-nav').textContent,'Inicia sesión');
  assert(doc.querySelector('.m-brand svg[viewBox="15 110 482 295"] image[href="/assets/img/logo3.png"]'));
  assert(doc.querySelector(`[aria-current="page"][href="${route}"]`) || route === '/preguntas-frecuentes');
  for (const anchor of doc.querySelectorAll('a[href]')) {
    const url = new URL(anchor.getAttribute('href'), dom.window.location.href);
    if (url.origin !== 'https://example.com') continue;
    assert(publicRoutes.has(url.pathname), `${route}: enlace inválido ${url.pathname}`);
    if (url.hash && url.pathname === route) assert(doc.getElementById(url.hash.slice(1)), `${route}: fragmento inexistente ${url.hash}`);
  }
  for (const image of doc.querySelectorAll('img')) {
    assert(image.alt);
    assert(image.width && image.height);
    if (image.classList.contains('m-business-photo')) assert(image.getAttribute('srcset'));
    await fs.access('public' + image.getAttribute('src'));
  }
  dom.window.close();
}
for (const route of ['/', '/contacto']) {
  const dom = new JSDOM(renderMarketing(route));
  assert(dom.window.document.querySelector('iframe[title*="Ubicación de TeLoRecargo"]'));
  assert(dom.window.document.querySelector('.m-footer-address'));
  assert(dom.window.document.querySelector('.m-brand svg image[href="/assets/img/logo3.png"]'));
  dom.window.close();
}
const css = postcss.parse(await fs.readFile('public/marketing.css', 'utf8'));
const breakpoints = [];
css.walkAtRules('media', rule => breakpoints.push(rule.params));
assert(breakpoints.includes('(max-width:700px)'));
assert(breakpoints.includes('(max-width:380px)'));
assert(breakpoints.includes('(prefers-reduced-motion:reduce)'));

const dom = new JSDOM(renderMarketing('/contacto'), { url:'https://example.com/contacto' });
const original = Object.fromEntries(['document','location','FormData','fetch'].map(key => [key, globalThis[key]]));
globalThis.document = dom.window.document;
globalThis.location = dom.window.location;
globalThis.FormData = dom.window.FormData;
const root = document.querySelector('[data-marketing]');
const form = root.querySelector('form');
// JSDOM 11 no implementa reportValidity; usa la misma validación de restricciones.
if (!form.reportValidity) form.reportValidity = () => form.checkValidity();
const requests = [];
let resolveRequest;
let statusCode = 200;
globalThis.fetch = async (url, options) => {
  requests.push({url, options});
  await new Promise(resolve => { resolveRequest = resolve; });
  return { ok:statusCode >= 200 && statusCode < 300, status:statusCode, json:async () => statusCode === 422 ? {errors:{email:['<b>Revisa tu correo</b>']}} : {} };
};
try {
  const module = await import('data:text/javascript;base64,' + Buffer.from(await fs.readFile('src/utils/marketingRuntime.mjs','utf8')).toString('base64'));
  assert.equal(module.mountMarketing(root), module.mountMarketing(root));
  const submit = () => form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  const fill = () => { for (const [name,value] of Object.entries({nombre:'Prueba local',email:'prueba@example.invalid',telefono:'0000000000',mensaje:'Prueba simulada; no enviar a un servicio real.'})) form.elements.namedItem(name).value=value; };
  submit(); assert.equal(requests.length,0); // No enviar campos obligatorios vacíos.
  fill(); submit(); assert.equal(requests.length,1);
  assert(form.querySelector('button').disabled);
  submit(); assert.equal(requests.length,1); // No duplicar mientras procesa.
  assert.equal(requests[0].url,'/api/contacto');
  assert.equal(requests[0].options.credentials,'omit');
  assert(!requests[0].options.headers.Authorization);
  assert.deepEqual(Object.keys(JSON.parse(requests[0].options.body)).sort(),['email','mensaje','nombre','telefono']);
  resolveRequest(); await delay(0);
  assert(root.querySelector('[data-form-status]').textContent.includes('Mensaje enviado'));
  assert.equal(form.elements.namedItem('nombre').value,'');
  assert(!form.querySelector('button').disabled);
  fill(); statusCode=422; submit(); resolveRequest(); await delay(0);
  const status = root.querySelector('[data-form-status]');
  assert(status.textContent.includes('<b>Revisa tu correo</b>'));
  assert.equal(status.querySelector('b'),null); // Los errores se muestran como texto.
  assert.equal(form.elements.namedItem('nombre').value,'Prueba local');
  statusCode=429; submit(); resolveRequest(); await delay(0);
  assert(status.textContent.includes('Espera un momento'));
  const menu=root.querySelector('.m-menu'); menu.open=true;
  root.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(menu.open,false);
  module.mountMarketing(root)();
  console.log('PASS: páginas y enlaces, un H1, imágenes responsive, CSS móvil, accesibilidad de navegación y formulario simulado (validación, envío, duplicados, 422 y 429).');
} finally {
  for (const [key,value] of Object.entries(original)) { if (value === undefined) delete globalThis[key]; else globalThis[key]=value; }
  dom.window.close();
}
