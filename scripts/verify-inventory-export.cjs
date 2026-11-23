const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { JSDOM } = require("jsdom");

async function main() {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: "http://localhost", pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  Object.defineProperty(global, "navigator", { value: dom.window.navigator, configurable: true });
  for (const key of ["HTMLElement", "DocumentFragment", "Event", "MouseEvent", "KeyboardEvent", "Blob"]) global[key] = dom.window[key];
  global.getComputedStyle = dom.window.getComputedStyle;
  global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const React = require("react");
  const { createRoot } = require("react-dom/client");
  const babel = require("@babel/core");
  const calls = [], errors = [], downloads = [], revoked = [];
  let complete, fail;
  const axios = { get: (url, config) => {
    calls.push({ url, config });
    return new Promise((resolve, reject) => { complete = resolve; fail = reject; });
  } };
  URL.createObjectURL = () => "blob:inventory-export-test";
  URL.revokeObjectURL = (url) => revoked.push(url);
  dom.window.HTMLAnchorElement.prototype.click = function () { downloads.push(this.download); };
  const filename = path.resolve(__dirname, "../src/pages/admin/ReporteInventario.jsx");
  const compiled = new Module(filename, module);
  compiled.filename = filename; compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  const mocks = { "../../config/axiosClient": axios, "react-router-dom": { useNavigate: () => () => {} },
    "../../utils/alerts": { showError: (message) => errors.push(message), showSuccess() {} } };
  compiled.require = (id) => Object.hasOwn(mocks, id) ? mocks[id] : Module.prototype.require.call(compiled, id);
  compiled._compile(babel.transformSync(fs.readFileSync(filename, "utf8"), { filename, presets: ["@babel/preset-react"], plugins: ["@babel/plugin-transform-modules-commonjs"], babelrc: false, configFile: false }).code, filename);
  const root = createRoot(document.getElementById("root"));
  await React.act(async () => root.render(React.createElement(compiled.exports.default)));
  const button = (text) => [...document.querySelectorAll("button")].find((node) => node.textContent === text);
  const click = async (node) => { assert.ok(node); await React.act(async () => node.dispatchEvent(new MouseEvent("click", { bubbles: true }))); };
  const finish = async () => React.act(async () => complete({ data: new Blob(["xlsx"]), headers: {
    "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "content-disposition": 'attachment; filename="inventario.xlsx"',
  } }));
  assert.equal(document.querySelector('input[value="display"]').checked, true);
  assert.ok(document.body.textContent.includes("Costo unitario al que se adquirió"));
  await click(document.querySelector('input[value="visible"]'));
  assert.equal(document.querySelector('input[value="visible"]').checked, false);
  const download = button("DESCARGAR REPORTE EXCEL");
  await React.act(async () => {
    download.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    download.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  assert.equal(calls.length, 1, "Repeated clicks must not start duplicate downloads");
  assert.equal(calls[0].url, "/reportes/productos-excel");
  assert.equal(calls[0].config.responseType, "blob");
  assert.equal(calls[0].config.params.mode, "display");
  assert.ok(!calls[0].config.params.fields.split(",").includes("visible"), "Unchecked Visible must not be sent in display mode");
  assert.equal(calls[0].config.params.images, 5);
  assert.ok(calls[0].config.params.fields.includes("name,purchase_cost,base_price"));
  assert.ok(button("Generando Excel…").disabled);
  await finish();
  await click(document.querySelector('input[value="import"]'));
  await click(document.querySelector('input[value="visible"]'));
  assert.equal(document.querySelector('input[value="visible"]').checked, false);
  assert.ok(document.body.textContent.includes("Encabezados técnicos en la fila 1"));
  assert.ok(document.body.textContent.includes("Visible se exporta como 1/0"));
  assert.equal(document.querySelector('[role="slider"]'), null, "Import mode must hide the image-count control");
  await click(button("DESCARGAR EXCEL PARA IMPORTAR"));
  assert.equal(calls[1].config.params.mode, "import");
  assert.ok(!calls[1].config.params.fields.split(",").includes("visible"), "Unchecked Visible must not be sent in import mode");
  assert.equal(calls[1].config.params.fields, calls[0].config.params.fields.split(",").filter((field) => field !== "id" && field !== "images").join(","));
  assert.equal(document.querySelector('[data-export-field="id"]'), null);
  assert.equal(document.querySelector('[data-export-field="images"]'), null);
  assert.ok(document.querySelector('[data-export-field="purchase_cost"]').textContent.includes("purchase_cost"));
  assert.equal(calls[1].config.params.images, undefined);
  await finish();
  await click(button("Seleccionar todo"));
  await click(button("Limpiar"));
  await click(button("DESCARGAR EXCEL PARA IMPORTAR"));
  assert.equal(calls.length, 2);
  assert.ok(errors.at(-1).includes("al menos un campo"));
  await click(button("Seleccionar todo"));
  const options = [...document.querySelectorAll('[data-export-field]')];
  const costIndex = options.findIndex((node) => node.dataset.exportField === "purchase_cost");
  assert.equal(options[costIndex - 1].dataset.exportField, "name");
  assert.equal(options[costIndex + 1].dataset.exportField, "base_price");
  const search = document.querySelector('input[type="search"]');
  await React.act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(search, "visible");
    search.dispatchEvent(new Event("input", { bubbles: true }));
  });
  assert.equal(document.querySelectorAll('[data-export-field]').length, 1);
  assert.equal(document.querySelector('[data-export-field]').dataset.exportField, "visible");
  await React.act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(search, "");
    search.dispatchEvent(new Event("input", { bubbles: true }));
  });
  assert.ok(document.querySelector('input[value="purchase_cost"]').checked, "Filtering must preserve selections");
  await click(document.querySelector('input[value="display"]'));
  assert.ok(document.querySelector('input[value="images"]').checked, "Display selection must survive import changes");
  assert.ok(document.querySelector('input[value="id"]').checked);
  await click(document.querySelector('input[value="import"]'));
  assert.equal(document.querySelector('input[value="images"]'), null);
  await click(button("DESCARGAR EXCEL PARA IMPORTAR"));
  assert.equal(calls[2].config.params.images, undefined);
  assert.ok(calls[2].config.params.fields.includes("purchase_cost"));
  await React.act(async () => fail({ response: { data: { text: async () => JSON.stringify({ message: "No se pudo generar el reporte de prueba" }) } } }));
  assert.equal(errors.at(-1), "No se pudo generar el reporte de prueba");
  assert.equal(button("DESCARGAR EXCEL PARA IMPORTAR").disabled, false);
  assert.match(downloads[0], /^Inventario_Consulta_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.xlsx$/);
  assert.match(downloads[1], /^Productos_Importar_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.xlsx$/);
  assert.notEqual(downloads[0], downloads[1]);
  await React.act(async () => new Promise((resolve) => setTimeout(resolve, 5)));
  assert.equal(revoked.length, 2);
  await React.act(async () => root.unmount());
  dom.window.close();
  console.log("Inventory export: display/import modes, purchase cost/order, select all, images, blob download, duplicate guard and error recovery passed.");
}
main().catch((error) => { console.error(error); process.exit(1); });
