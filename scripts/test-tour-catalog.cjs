const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../src/services/tours/tourService.js"), "utf8")
  .replace(/^import .*;\r?\n/gm, "").replace(/export /g, "");
const tour = { id: 7, service_type: "tour" };
async function run(payloads, mode = "pos") {
  const calls = [];
  const client = { defaults: { baseURL: "https://example.test/api/" }, get: async (url, config) => {
    calls.push({ url, config });
    assert.equal(config.baseURL, undefined, "El cat?logo debe conservar /api del cliente existente");
    return { data: payloads[config.params.page - 1] };
  } };
  const context = { axiosClient: mode === "store" ? client : null, axiosClientPOS: mode === "pos" ? client : null };
  vm.createContext(context);
  vm.runInContext(source + "\nglobalThis.getCatalog = getTourServices;", context);
  const rows = await context.getCatalog({ mode, branchId: 498 });
  assert.ok(calls.every(call => call.url === "/branches/498/services"));
  return { rows: JSON.parse(JSON.stringify(rows)), calls };
}
(async () => {
  for (const payload of [
    { services: { data: [tour], last_page: 1 } },
    { success: true, data: { data: [tour], last_page: 1 } },
    { success: true, data: [tour] },
    { services: [tour] },
    { data: { services: { data: [tour], last_page: 1 } } },
    [tour],
  ]) assert.deepEqual((await run([payload])).rows, [tour]);
  const result = await run([
    { services: { data: [{ id: 1, service_type: "general" }], last_page: 2 } },
    { services: { data: [tour], last_page: 2 } },
  ], "store");
  assert.equal(result.calls.length, 2);
  assert.deepEqual(result.rows, [tour]);
  assert.deepEqual((await run([{ services: { data: [], last_page: 1 } }])).rows, []);
  await assert.rejects(run(["<html>" ]), /listado de servicios/);
  await assert.rejects(run([{ success: false, message: "Sin permiso" }]), /Sin permiso/);
  console.log("OK: cat?logo POS/tienda, seis formatos, paginaci?n, filtro tours, vac?o y errores.");
})().catch(error => { console.error(error); process.exitCode = 1; });
