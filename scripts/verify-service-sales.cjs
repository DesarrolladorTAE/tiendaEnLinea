const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const calls = [];
let response = { data: { success: true, data: { id: 10 } } };
const client = {
  defaults: { baseURL: 'https://example.test/api/' },
  get: async (...args) => { calls.push(['get', ...args]); return response; },
  post: async (...args) => { calls.push(['post', ...args]); return response; },
};
function load(file, names, globals = {}) {
  const source = fs.readFileSync(file, 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
  const sandbox = { ...globals };
  vm.runInNewContext(source + '\nthis.api = {' + names.join(',') + '};', sandbox);
  return sandbox.api;
}
(async () => {
  const api = load('src/services/tours/tourService.js', ['createAssistedSale', 'getManifest', 'getTourServices', 'getRouteStops'], { axiosClient: client, axiosClientPOS: client });
  const context = { mode: 'pos', branchId: 3, departureId: 45 };
  const sale = { buyer_name: 'Ana', passengers: [{ first_name: 'Ana' }] };
  await api.createAssistedSale(context, sale);
  assert.equal(calls.at(-1)[1], '/branches/3/tours/departures/45/sales');
  assert.equal(calls.at(-1)[2], sale);
  assert.equal(calls.at(-1)[2].total, undefined);
  await api.getManifest(context);
  assert.equal(Object.keys(calls.at(-1)[2].params).length, 0, 'Default scope includes public bookings');
  await api.getManifest(context, 4);
  assert.equal(calls.at(-1)[2].params.pos_location_id, 4);
  await assert.rejects(api.getManifest({ ...context, departureId: 0 }));
  response = { data: { success: false, message: 'Sin cupo' } };
  await assert.rejects(api.createAssistedSale(context, sale), /Sin cupo/);
  response = { data: { services: { data: [{ id: 1, service_type: 'tour' }, { id: 2, service_type: 'general' }], last_page: 1 } } };
  assert.equal((await api.getTourServices(context)).length, 1);
  assert.equal(calls.at(-1)[2].baseURL, 'https://example.test/', 'Legacy service catalog uses root, without /api');
  response = { data: { success: true, data: [{ id: 12 }] } };
  assert.equal((await api.getRouteStops(context, 5))[0].id, 12);
  for (const [file, fn] of [['bookingUtils', 'bookingCollection'], ['departureUtils', 'departureCollection']]) {
    const parse = load(`src/components/tours/${file}.js`, [fn])[fn];
    assert.equal(parse({ success: true, data: { data: [{ id: 1 }], last_page: 3 } }).lastPage, 3);
    assert.equal(parse({ data: [{ id: 1 }], last_page: 2 }).rows.length, 1);
  }
  console.log('OK: sale endpoint, payload, business errors, manifest scopes, legacy catalog and paginated envelopes.');
})().catch(error => { console.error(error); process.exitCode = 1; });
