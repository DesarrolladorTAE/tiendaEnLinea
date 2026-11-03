const fs = require("node:fs"), vm = require("node:vm"), assert = require("node:assert/strict"), path = require("node:path");
const root = path.join(__dirname, "..");
const helpers = fs.readFileSync(path.join(root, "src/components/tours/departureUtils.js"), "utf8").replace(/export /g, "");
const service = fs.readFileSync(path.join(root, "src/services/tours/tourService.js"), "utf8").replace(/^import .*;\r?\n/gm, "").replace(/export /g, "");
const calls = [];
const client = { defaults: { baseURL: "https://example.test/api/" }, get: async (url, config) => { calls.push({ url, config }); return { data: { success: true, data: [{ id: 3 }] } }; } };
const context = { axiosClient: client, axiosClientPOS: client };
vm.createContext(context); vm.runInContext(service + helpers + "\nglobalThis.api = { getDepartures, departureCollection };", context);
(async () => {
  for (const payload of [ [{ id: 3 }], { departures: [{ id: 3 }] }, { data: [{ id: 3 }] }, { data: { data: [{ id: 3 }], last_page: 2 } }, { departures: { data: [{ id: 3 }], last_page: 2 } } ]) {
    assert.equal(context.api.departureCollection(payload).rows[0].id, 3);
  }
  assert.equal(context.api.departureCollection({ data: [] }).rows.length, 0);
  assert.throws(() => context.api.departureCollection("<html>"), /listado de salidas/);
  for (const mode of ["pos", "store"]) await context.api.getDepartures({ mode, branchId: 498, serviceId: 25 }, { page: 2, status: "scheduled" });
  assert.ok(calls.every(call => call.url === "/branches/498/services/25/departures" && call.config.params.page === 2));
  console.log("OK: salidas POS/tienda, rutas existentes, listas, paginadores, vacios y errores.");
})().catch(error => { console.error(error); process.exitCode = 1; });
