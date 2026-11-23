const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { JSDOM } = require("jsdom");

async function main() {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: "http://localhost", pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  Object.defineProperty(global, "navigator", { configurable: true, value: dom.window.navigator });
  for (const key of ["HTMLElement", "DocumentFragment", "Event", "MouseEvent", "File", "Blob", "FormData"]) global[key] = dom.window[key];
  global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  const React = require("react");
  const { createRoot } = require("react-dom/client");
  const babel = require("@babel/core");
  const compile = (relative, mocks = {}) => {
    const filename = path.resolve(__dirname, "..", relative);
    const compiled = new Module(filename, module);
    compiled.filename = filename; compiled.paths = Module._nodeModulePaths(path.dirname(filename));
    compiled.require = (id) => id === "file-saver" ? { saveAs() {} } : Object.hasOwn(mocks, id) ? mocks[id] : Module.prototype.require.call(compiled, id);
    const { code } = babel.transformSync(fs.readFileSync(filename, "utf8"), { filename, presets: ["@babel/preset-react"], plugins: ["@babel/plugin-transform-modules-commonjs"], babelrc: false, configFile: false });
    compiled._compile(code, filename);
    return compiled.exports.default;
  };
  const Zone = compile("src/components/common/ImportFileDropZone.jsx");
  const root = createRoot(document.getElementById("root"));
  const render = async (element) => React.act(async () => root.render(element));
  const transfer = async (files, type = "drop", itemsOnly = false) => {
    const zone = document.querySelector('[role="region"]');
    assert.ok(zone);
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, type === "paste" ? "clipboardData" : "dataTransfer", { value: {
      files: itemsOnly ? [] : files, types: ["Files"], items: files.map((file) => ({ kind: "file", getAsFile: () => file })),
    } });
    await React.act(async () => zone.dispatchEvent(event));
    return event;
  };
  const click = async (text) => {
    const button = [...document.querySelectorAll("button")].find((item) => item.textContent.trim() === text);
    assert.ok(button, `Missing ${text}`); assert.ok(!button.disabled, `Disabled ${text}`);
    await React.act(async () => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  };
  const csv = new File(["name\nPrueba"], "datos.csv", { type: "text/csv" });
  const image = new File(["image"], "foto.png", { type: "image/png" });
  const excel = new File(["excel"], "tours.xlsx");
  let received = 0;
  await render(React.createElement(Zone, { onFiles: () => received++ }, "Prueba"));
  const textPaste = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(textPaste, "clipboardData", { value: { files: [], items: [{ kind: "string" }] } });
  document.querySelector('[role="region"]').dispatchEvent(textPaste);
  assert.equal(textPaste.defaultPrevented, false);
  assert.equal((await transfer([csv])).defaultPrevented, true);
  assert.equal(received, 1);
  await render(React.createElement(Zone, { disabled: true, onFiles: () => received++ }));
  await transfer([image], "paste", true);
  assert.equal(received, 1, "Disabled zones must not accept files");

  const calls = [];
  const axios = { post: async (url, data) => { calls.push({ url, data }); return { data: {} }; } };
  const mocks = {
    "../common/ImportFileDropZone": Zone,
    "../../config/axiosClient": axios, "../../config/axiosClientPOS": axios,
    "./importPreview.mjs": { summarizeProductCsv: () => null },
    "../products-list/importPreview.mjs": { summarizeProductCsv: () => null },
    "./importResult.mjs": { normalizeImportResult: () => ({}) },
    "../products-list/importResult.mjs": { normalizeImportResult: () => ({}) },
    "./ImportResultSummary": () => null, "../products-list/ImportResultSummary": () => null,
  };
  for (const [file, label, expectedNormal, expectedSicar] of [
    ["src/components/products-list/ImportProductsModal.jsx", "productos", "/cargar/importarDesdeCSV", "/productos/importar-sicar"],
    ["src/components/clientes/ImportClientesModal.jsx", "clientes", "/clientes/import/system", "/clientes/import/sicar"],
    ["src/components/restocks/ImportSuppliersModal.jsx", "proveedores", "/suppliers/import/system", "/suppliers/import/sicar"],
  ]) {
    const Component = compile(file, mocks);
    await render(React.createElement(Component, { key: label, open: true, branch: { id: 7 }, branchId: 7, onClose() {}, onImported() {} }));
    await transfer([csv, excel]);
    assert.ok(document.body.textContent.includes("un solo archivo"));
    await transfer([image], "paste", true);
    assert.ok(!document.body.textContent.includes("foto.png"), "Normal data imports must reject image files");
    await transfer([csv]);
    await click(`Importar ${label}`);
    assert.equal(calls.at(-1).url, expectedNormal);
    assert.equal(calls.at(-1).data.get("archivo").name, csv.name);
    await click("Desde SICARSube el archivo de " + label + " que exportaste de SICAR.");
    await transfer([csv], "paste", true);
    await click("Importar desde SICAR");
    assert.equal(calls.at(-1).url, expectedSicar);
    assert.equal(calls.at(-1).data.get("archivo").name, csv.name);
  }

  const tourCalls = [];
  const Tours = compile("src/components/tours/TourExcelActions.jsx", {
    "../common/ImportFileDropZone": Zone,
    "../../services/tours/tourService": { importToursExcel: async (branch, file, images) => { tourCalls.push({ branch, file, images }); return { status: 201, data: { summary: { created: 1 } } }; } },
    "../../utils/alerts": { alertFromAxiosError() {}, showToastSuccess() {} },
  });
  await render(React.createElement(Tours, { branchId: 7, onImported() {} }));
  await click("Importar Excel");
  await transfer([excel, image]);
  assert.ok(document.body.textContent.includes("1 imágenes seleccionadas"));
  const pastedImage = new File(["clipboard"], "pegada.png", { type: "image/png" });
  await transfer([pastedImage], "paste", true);
  assert.ok(document.body.textContent.includes("2 imágenes seleccionadas"));
  await transfer([pastedImage]);
  assert.ok(document.body.textContent.includes("2 imágenes seleccionadas"), "Identical files must not be added twice");
  await transfer(Array.from({ length: 51 }, (_, i) => new File(["x"], `${i}.png`, { type: "image/png" })));
  assert.ok(document.body.textContent.includes("como máximo 50"));
  await click("Importar");
  assert.equal(tourCalls[0].file, excel);
  assert.equal(tourCalls[0].branch, 7);
  assert.deepEqual(tourCalls[0].images, [image, pastedImage]);
  await React.act(async () => root.unmount());
  dom.window.close();
  console.log("Import files: drop, paste, clipboard images, disabled state, text paste, formats, Normal/SICAR, mixed tour files and image limits passed.");
}
main().catch((error) => { console.error(error); process.exit(1); });
