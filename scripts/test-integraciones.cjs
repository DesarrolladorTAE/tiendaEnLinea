// Prueba de flujos del panel sin credenciales ni llamadas al backend real.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');

const systems = ['clicmenu', 'mtelmx', 'taeconta'].map((slug, id) => ({ id: id + 20, slug, name: slug }));
const fixture = slug => ({ id: slug, sistema: slug, token: `test-only-${slug}`, created_at: '2026-10-26T00:00:00Z', last_used_at: null, expires_at: null });
let backend = { clicmenu: fixture('clicmenu'), mtelmx: fixture('mtelmx') };
let states = [], refs = [], cursor = 0, refCursor = 0, effect;
let calls = [], alerts = [], copied = [], failure = null, confirm = true;
const http = {};
for (const method of ['get', 'post', 'patch', 'delete']) http[method] = async (url, body) => {
  calls.push({ method, url, body });
  if (failure) { const value = failure; failure = null; throw value; }
  if (url.endsWith('/sistemas')) return { data: { data: systems } };
  if (url === '/integraciones/tokens' && method === 'get') return { data: { data: Object.values(backend).map(({ token, ...metadata }) => metadata) } };
  const slug = method === 'post' ? body.sistema : url.split('/').pop();
  if (method === 'post') {
    assert.deepEqual(JSON.parse(JSON.stringify(body)), { sistema: slug });
    if (backend[slug]) throw { response: { status: 409 } };
    backend[slug] = fixture(slug);
  } else if (!backend[slug]) throw { response: { status: 404 } };
  if (method === 'delete') { delete backend[slug]; return { status: 204 }; }
  if (method === 'patch') { assert.equal(JSON.stringify(body), '{}'); backend[slug] = { ...backend[slug], token: `regenerated-${slug}` }; }
  return { data: { data: backend[slug] } };
};
const React = {
  createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) }),
  useState: initial => { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; },
  useRef: initial => { const index = refCursor++; return refs[index] || (refs[index] = { current: initial }); },
  useEffect: callback => { effect = callback; },
};
const source = fs.readFileSync('src/pages/other/Integraciones.jsx', 'utf8');
const code = babel.transformSync(source, { babelrc: false, configFile: false, presets: ['@babel/preset-react'], plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
const exported = {};
vm.runInNewContext(code, {
  exports: exported, AbortController,
  navigator: { clipboard: { writeText: async value => copied.push(value) } },
  require: name => {
    if (name === 'react') return { ...React, default: React, __esModule: true };
    if (name === '../../axiosConfig') return { default: http, __esModule: true };
    if (name === 'sweetalert2') return { default: { fire: async options => { alerts.push(options); return { isConfirmed: confirm }; } }, __esModule: true };
    if (name === '@mui/material' || name === 'react-icons/fi') return new Proxy({}, { get: (_, key) => key });
    if (name === 'react-router-dom') return { Link: 'Link', Navigate: 'Navigate' };
    if (name === 'react-redux') return {};
    return { default: name, __esModule: true };
  },
});
const render = () => { cursor = 0; refCursor = 0; return exported.PanelIntegraciones(); };
const nodes = node => !node || typeof node !== 'object' ? [] : [node, ...node.children.flatMap(nodes)];
const text = node => node == null ? '' : typeof node !== 'object' ? String(node) : node.children.map(text).join('');
const dialog = () => nodes(render()).find(node => node.type === 'Dialog');
const button = label => nodes(dialog()).find(node => node.type === 'Button' && text(node) === label);
const open = slug => {
  const row = nodes(render()).find(node => node.type === 'TableRow' && node.props.key === slug);
  nodes(row).find(node => node.type === 'Button').props.onClick();
};
const settle = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  render(); const cleanup = effect(); await settle();
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, '/integraciones/tokens');
  assert.equal(nodes(render()).filter(node => node.type === 'TableRow').length, 4);
  assert(!JSON.stringify(states).includes('test-only-'));
  const helpButton = nodes(render()).find(node => node.type === 'Button' && text(node) === '¿Cómo funciona?');
  assert(helpButton);
  const beforeHelp = calls.length;
  helpButton.props.onClick();
  let helpDialog = nodes(render()).find(node => node.type === 'Dialog' && node.props['aria-labelledby'] === 'token-help-title');
  assert(helpDialog.props.open);
  assert(text(helpDialog).includes('Crear token'));
  const helpTabs = nodes(helpDialog).find(node => node.type === 'Tabs');
  helpTabs.props.onChange(null, 1);
  helpDialog = nodes(render()).find(node => node.type === 'Dialog' && node.props['aria-labelledby'] === 'token-help-title');
  assert(text(helpDialog).includes('Copia la clave'));
  assert.equal(calls.length,beforeHelp);
  nodes(helpDialog).find(node => node.type === 'Button' && text(node) === 'Entendido').props.onClick();

  open('clicmenu'); await button('Mostrar').props.onClick();
  assert.equal(nodes(dialog()).find(node => node.type === 'TextField').props.value, 'test-only-clicmenu');
  button('Ocultar').props.onClick();
  assert(!JSON.stringify(dialog()).includes('test-only-clicmenu'));
  await button('Copiar').props.onClick();
  assert(Object.values(states[1]).every(value => !('token' in value)));
  assert.equal(copied[0], 'test-only-clicmenu');
  assert.equal(calls.at(-1).url, '/integraciones/tokens/clicmenu');

  confirm = false; const before = calls.length;
  await button('Eliminar token').props.onClick(); assert.equal(calls.length, before);
  confirm = true;
  await button('Regenerar token').props.onClick();
  assert(alerts.at(-1).text.includes('ClicMenu'));
  assert.equal(backend.mtelmx.token, 'test-only-mtelmx');
  assert.equal(backend.clicmenu.token, 'regenerated-clicmenu');
  await button('Eliminar token').props.onClick();
  assert(button('Crear token')); assert(backend.mtelmx);
  await button('Crear token').props.onClick(); assert(button('Mostrar'));

  open('taeconta'); backend.taeconta = fixture('taeconta');
  await button('Crear token').props.onClick();
  assert.equal(calls.at(-1).url, '/integraciones/tokens'); // 409 recarga listado.
  assert(button('Mostrar')); assert.equal(Object.keys(backend).length, 3);

  delete backend.taeconta;
  await button('Mostrar').props.onClick(); assert(button('Crear token')); // 404 sólo afecta esa tarjeta.
  open('mtelmx'); assert(button('Mostrar'));
  failure = { response: { status: 422, data: { errors: { sistema: ['Validación del backend'] } } } };
  await button('Regenerar token').props.onClick(); assert(text(dialog()).includes('Validación del backend'));
  failure = { response: { status: 429 } };
  await button('Mostrar').props.onClick(); assert(text(dialog()).includes('Espera un momento'));
  failure = { response: { status: 401 } };
  await button('Mostrar').props.onClick(); assert(!text(dialog()).includes('No se pudo completar'));

  const pending = button('Mostrar').props.onClick();
  assert(button('Copiar').props.disabled); const requestCount = calls.length;
  await button('Copiar').props.onClick(); assert.equal(calls.length, requestCount); await pending;
  assert(calls.every(call => !/\/token(?:\/|$)/.test(call.url)));
  assert(!/localStorage|sessionStorage|console\./.test(source));
  cleanup();
  console.log('PASS: listado sin claves, detalle al mostrar/copiar, tokens independientes, confirmación/cancelación, creación, regeneración, eliminación, 404/409/401/422/429 y bloqueo de peticiones duplicadas.');
})().catch(error => { console.error(error); process.exitCode = 1; });
