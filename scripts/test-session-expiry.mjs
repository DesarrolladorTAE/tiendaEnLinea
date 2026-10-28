import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source = (await fs.readFile('src/axiosConfig.js', 'utf8'))
  .replace(/^import .*;\r?\n/gm, '')
  .replace('export default axiosInstance;', '');

function setup({ brokenAlert = false } = {}) {
  let request, rejectResponse, resolveAlert, alerts = 0, finished = 0;
  const storage = new Map([['token', 'expired'], ['user', '{}']]);
  const container = { style: {} };
  const redirects = [];
  const context = {
    axios: { create: () => ({ interceptors: {
      request: { use: fn => { request = fn; } },
      response: { use: (_, fn) => { rejectResponse = fn; } },
    } }) },
    beginViewRequest: () => () => { finished++; },
    localStorage: { getItem: key => storage.get(key), removeItem: key => storage.delete(key) },
    window: { location: { replace: url => redirects.push(url) } },
    Swal: {
      getContainer: () => container,
      fire: options => {
        alerts++;
        if (brokenAlert) throw new Error('dialog unavailable');
        options.didOpen();
        return new Promise(resolve => { resolveAlert = resolve; });
      },
    },
  };
  vm.runInNewContext(source, context);
  const fail = async (url, status = 401) => {
    const config = request({ url, method: 'get', headers: {} });
    const error = { config, response: { status } };
    await assert.rejects(rejectResponse(error), value => value === error);
  };
  return { fail, storage, container, redirects, confirm: () => resolveAlert(),
    get alerts() { return alerts; }, get finished() { return finished; } };
}

const session = setup();
await session.fail('/admin/dashboard');
assert.equal(session.storage.size, 0, 'credentials clear before confirmation');
assert.equal(session.container.style.zIndex, '20000');
assert.equal(session.finished, 1, 'request settles while dialog is open');
assert.equal(session.redirects.length, 0);
await session.fail('/dashboard/mini');
assert.equal(session.alerts, 1, 'concurrent 401 responses share one dialog');
session.confirm();
await new Promise(resolve => setImmediate(resolve));
assert.deepEqual(session.redirects, ['/iniciar-sesion']);

for (const [url, status] of [['/login', 401], ['/admin/dashboard', 500]]) {
  const untouched = setup();
  await untouched.fail(url, status);
  assert.equal(untouched.alerts, 0);
  assert.equal(untouched.storage.size, 2);
}
const broken = setup({ brokenAlert: true });
await broken.fail('/admin/dashboard');
assert.deepEqual(broken.redirects, ['/iniciar-sesion']);
console.log('PASS: immediate session cleanup, visible dialog, settled requests, concurrent 401, login exceptions and dialog failure.');
