const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { pathToFileURL } = require("node:url");
const { JSDOM } = require("jsdom");

async function main() {
  const rootPath = path.resolve(__dirname, "..");
  const load = (file) => import(pathToFileURL(path.join(rootPath, file)).href);
  const forms = await load("src/components/restocks/supplierForm.mjs");
  const results = await load("src/components/products-list/importResult.mjs");
  const preview = await load("src/components/products-list/importPreview.mjs");
  const record = {
    ...forms.EMPTY_SUPPLIER, name: "Proveedor", alias: "Alias", rfc: "abc", curp: "def",
    colonia: "Centro", celular: "5555555555", limite_credito: "123456789012.123456",
    dias_credito: 30, origen_sicar: true, is_active: false, store_id: 4, id: 9,
  };
  const payload = forms.supplierPayload(forms.supplierToForm(record), 7);
  assert.deepEqual(forms.validateSupplier(record), {});
  assert.equal(payload.limite_credito, "123456789012.123456");
  assert.equal(payload.dias_credito, 30);
  assert.equal(payload.branch_id, 7);
  assert.equal(payload.origen_sicar, true);
  assert.equal(payload.is_active, false);
  assert.equal(payload.rfc, "ABC");
  assert.ok(!("store_id" in payload) && !("id" in payload));
  for (const key of Object.keys(forms.EMPTY_SUPPLIER)) assert.ok(key in payload);
  assert.equal(forms.supplierToForm({ is_active: "0" }).is_active, false);
  for (const [key, value] of [["limite_credito", "-1"], ["limite_credito", "0.1234567"], ["dias_credito", "1.5"], ["codigo_postal", "1234"]]) {
    assert.ok(forms.validateSupplier({ ...record, [key]: value })[key]);
  }
  assert.deepEqual(preview.summarizeProductCsv('name,rfc\n"Proveedor, SA",ABC', /^(name|nombre)$/i), { total: 1, names: ["Proveedor, SA"] });

  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: "http://localhost", pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  Object.defineProperty(global, "navigator", { value: dom.window.navigator, configurable: true });
  for (const key of ["HTMLElement", "DocumentFragment", "Event", "MouseEvent", "File", "Blob", "FormData"]) global[key] = dom.window[key];
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const React = require("react");
  const { createRoot } = require("react-dom/client");
  const babel = require("@babel/core");
  const calls = [];
  const downloads = [];
  let completeUpload;
  const axios = {
    get: async (url, config) => { calls.push({ url, config }); return { data: new Blob(["name\nProveedor"]), headers: { "content-disposition": 'attachment; filename="proveedores.xlsx"' } }; },
    post: (url, data, config) => {
      calls.push({ url, data, config });
      config.onUploadProgress({ loaded: 1, total: 1 });
      return new Promise((resolve) => { completeUpload = resolve; });
    },
  };
  const compile = (file, mocks) => {
    const filename = path.join(rootPath, file);
    const compiled = new Module(filename, module);
    compiled.filename = filename;
    compiled.paths = Module._nodeModulePaths(path.dirname(filename));
    compiled.require = (id) => Object.hasOwn(mocks, id) ? mocks[id] : Module.prototype.require.call(compiled, id);
    const { code } = babel.transformSync(fs.readFileSync(filename, "utf8"), { filename, presets: ["@babel/preset-react"], plugins: ["@babel/plugin-transform-modules-commonjs"], babelrc: false, configFile: false });
    compiled._compile(code, filename);
    return compiled.exports.default;
  };
  const ImportModal = compile("src/components/restocks/ImportSuppliersModal.jsx", {
    "../../config/axiosClient": axios,
    "../products-list/importPreview.mjs": preview,
    "../products-list/importResult.mjs": results,
    "../products-list/ImportResultSummary": ({ result }) => React.createElement("div", { "data-testid": "result" }, result.title),
    "file-saver": { saveAs: (blob, filename) => downloads.push({ blob, filename }) },
  });
  const root = createRoot(document.getElementById("root"));
  const act = React.act;
  const click = async (label) => {
    const button = [...document.querySelectorAll("button")].find((item) => item.textContent.trim() === label);
    assert.ok(button, `Missing button: ${label}`);
    assert.equal(button.disabled, false);
    await act(async () => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  };
  let refreshed = 0;
  await act(async () => root.render(React.createElement(ImportModal, { open: true, branchId: 7, onClose: () => {}, onImported: async () => { refreshed++; } })));
  await click("Descargar plantilla");
  await click("Exportar proveedores actuales");
  assert.deepEqual(calls.map((call) => call.url), ["/suppliers/import/template", "/suppliers/import/export"]);
  assert.ok(calls.every((call) => call.config.params.branch_id === 7));
  assert.ok(downloads.every((item) => item.filename === "proveedores.xlsx"));
  for (const mode of ["normal", "sicar"]) {
    if (mode === "sicar") {
      const option = [...document.querySelectorAll("button")].find((button) => button.textContent.includes("Desde SICAR"));
      await act(async () => option.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    }
    const input = document.querySelector('input[type="file"]');
    Object.defineProperty(input, "files", { configurable: true, value: [new File(["contenido"], "proveedores.xlsx")] });
    await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
    await click(mode === "normal" ? "Importar proveedores" : "Importar desde SICAR");
    const call = calls.at(-1);
    assert.equal(call.url, `/suppliers/import/${mode === "sicar" ? "sicar" : "system"}`);
    assert.equal(call.config.params.branch_id, 7);
    assert.equal(call.data.get("archivo").name, "proveedores.xlsx");
    assert.ok(document.querySelector('[aria-busy="true"]'));
    await act(async () => completeUpload({ data: { resumen: { total: 1, creados: 1 } } }));
    assert.equal(document.querySelector('[data-testid="result"]').textContent, "Importación finalizada");
  }
  assert.equal(refreshed, 2);
  const writes = [];
  axios.put = async (url, data) => writes.push({ url, data });
  const SupplierDetailModal = compile("src/components/restocks/SupplierDetailModal.jsx", {
    "../../config/axiosClient": axios,
    "./supplierForm.mjs": forms,
  });
  const SupplierModal = compile("src/components/restocks/SupplierModal.jsx", {
    "../../config/axiosClient": axios,
    "../../utils/alerts": { showToastSuccess: () => {}, showConfirm: async () => true, alertFromAxiosError: (error) => { throw error; } },
    "./supplierForm.mjs": forms,
    "./ImportSuppliersModal": () => null,
    "./SupplierDetailModal": SupplierDetailModal,
  });
  const beforeOpening = calls.length;
  let reloads = 0;
  const suppliers = Array.from({ length: 1000 }, (_, index) => ({ ...record, id: index + 1, name: `Proveedor ${index + 1}` }));
  await act(async () => root.render(React.createElement(SupplierModal, { open: true, branchId: 7, suppliers, onClose: () => {}, onReload: async () => { reloads++; } })));
  assert.equal(calls.length, beforeOpening, "Opening suppliers must reuse parent data without a duplicate GET.");
  const editButtons = [...document.querySelectorAll("button")].filter((button) => button.textContent.trim() === "Editar");
  assert.equal(editButtons.length, 12, "Only the current supplier page should render.");
  await act(async () => editButtons[0].dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await act(async () => document.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  assert.equal(writes[0].url, "/restocks/suppliers/1");
  assert.equal(writes[0].data.limite_credito, record.limite_credito);
  assert.equal(writes[0].data.origen_sicar, true);
  assert.equal(writes[0].data.is_active, false);
  assert.equal(writes[0].data.curp, "DEF");
  assert.equal(reloads, 1, "Saving must refresh suppliers once.");
  let failDetail = true;
  axios.get = async (url, config) => {
    calls.push({ url, config });
    if (failDetail) throw { response: { data: { message: "No se pudo consultar el proveedor." } } };
    return { data: { data: { ...record, id: 1, alias: "Alias actualizado" } } };
  };
  await click("Ver datos");
  assert.equal(calls.at(-1).url, "/suppliers/1");
  assert.equal(calls.at(-1).config.params.branch_id, 7);
  assert.ok(document.body.textContent.includes("No se pudo consultar el proveedor."));
  failDetail = false;
  await click("Reintentar");
  assert.ok(document.body.textContent.includes("Alias actualizado"));
  assert.ok(document.body.textContent.includes("MX$ 123456789012.123456"));
  const signal = calls.at(-1).config.signal;
  await click("Editar proveedor");
  assert.ok(signal.aborted, "Closing the detail should cancel its request lifecycle.");
  assert.ok([...document.querySelectorAll("input")].some((input) => input.value === "Alias actualizado"));
  await act(async () => root.unmount());
  dom.window.close();
  console.log("Proveedores: campos, crédito, Sistema/SICAR, progreso, descargas, edición y apertura sin GET duplicado verificados con 1000 registros, sin solicitudes reales.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
