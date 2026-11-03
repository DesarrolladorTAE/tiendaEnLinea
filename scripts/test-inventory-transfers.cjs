const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const babel = require("@babel/core");
const root = path.resolve(__dirname, "..");
function compile(file, mocks) {
  const filename = path.join(root, file);
  const mod = new Module(filename, module); mod.filename = filename; mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod.require = id => Object.hasOwn(mocks, id) ? mocks[id] : Module.prototype.require.call(mod, id);
  const { code } = babel.transformSync(fs.readFileSync(filename, "utf8"), { filename, presets: ["@babel/preset-react"], plugins: ["@babel/plugin-transform-modules-commonjs"], babelrc: false, configFile: false });
  mod._compile(code, filename); return mod.exports;
}
async function main() {
  const calls = [];
  const client = {
    get: async (url, config) => {
      calls.push({ url, config });
      if (url === "/admin/branches/2/products") return { data: [{ id: 10, use_warehouse_inventory: false }, { id: 11, use_warehouse_inventory: true }, { id: 12, use_warehouse_inventory: "0" }, { id: 13 }] };
      return { data: { success: true, data: { data: [{ id: config?.params?.page || 1 }], last_page: url === "/branches" ? 2 : 1 } } };
    },
    post: async (url, body, config) => { calls.push({ url, body, config }); return { data: { success: true, data: { id: 3 } } }; },
  };
  const helpers = compile("src/services/admin/inventoryTransfers.js", { "../../config/axiosClient": client });
  const { transfersApi: api, validateTransferItems: validate, transferCollection } = helpers;
  const base = { product_id: 1, available: "10.000", quantity: "2.50" };
  const input = helpers.transferQuantityInput;
  const limited = { ...base, available: "2.000" };
  for (const value of ["12.5", "2.01", "abc", "1a", "1e2", "-1", "+1", "1.234", "1.2.3", "Infinity"]) assert.equal(input(limited, value), null, value);
  for (const value of ["", "0", "1", "1.", "1.25", "2.00"]) assert.equal(input(limited, value), value);
  assert.equal(input(limited, "1,5"), "1.5");
  assert.equal(input(limited, ".5"), "0.5");
  assert.equal(input({ ...base, available: "0.250", variant_id: 2 }, "0.251"), null);
  assert.equal(input({ ...base, available: "0.250", variant_id: 2 }, "0.125"), "0.125");
  assert.equal(input({ ...base, source_warehouse_id: 3 }, "0.125", { destinationGeneral: true }), null);
  assert.equal(input({ ...base, available: "0.250" }, "1"), null, "Adding a fractional stock cannot start above availability");
  assert.equal(validate([base])[0].quantity, "2.50");
  for (const extra of [{ variant_id: 2 }, { source_warehouse_id: 3 }, { variant_id: 2, source_warehouse_id: 3 }]) assert.equal(validate([{ ...base, ...extra, quantity: "1.125" }])[0].quantity, "1.125");
  for (const quantity of ["0", "-1", "1e2", "1.001", "1.0000", "10.01", "NaN"]) assert.throws(() => validate([{ ...base, quantity }]));
  assert.throws(() => validate([{ ...base, available: undefined }]));
  assert.throws(() => validate([{ ...base, variant_id: 2, quantity: "0.125", available: "0.124" }]));
  assert.throws(() => validate([base, base]), /No repitas/);
  assert.throws(() => validate([]));
  assert.throws(() => validate(Array.from({ length: 201 }, (_, i) => ({ ...base, product_id: i + 1 }))));
  assert.equal(validate(Array.from({ length: 200 }, (_, i) => ({ ...base, product_id: i + 1 }))).length, 200);
  assert.equal(validate([{ ...base, variant_id: 2, quantity: "999999999999.001", available: "999999999999.001" }])[0].quantity, "999999999999.001");
  assert.throws(() => validate([{ ...base, variant_id: 2, quantity: "999999999999.002", available: "999999999999.001" }]));
  assert.throws(() => validate([{ ...base, source_warehouse_id: 3, quantity: "1.125" }], { destinationGeneral: true }), /dos decimales/);
  assert.equal(validate([{ ...base, source_warehouse_id: 3, quantity: "1.120" }], { destinationGeneral: true })[0].quantity, "1.120", "Do not silently round trailing zeros or significant digits");
  assert.equal(validate([{ ...base, variant_id: 2, quantity: "1.125" }], { destinationGeneral: true })[0].quantity, "1.125");
  assert.equal(validate([{ ...base, destination_product_id: 10 }])[0].destination_product_id, 10);
  assert.equal(validate([{ ...base, variant_id: 2, destination_product_id: 11, destination_variant_id: 20 }])[0].destination_variant_id, 20);
  assert.deepEqual((await api.destinationProducts(2, false)).map(row => row.id), [10, 12]);
  assert.deepEqual((await api.destinationProducts(2, true)).map(row => row.id), [11]);
  assert.equal(helpers.destinationLabel({ destination_inventory_mode: "general", destination_warehouse_id: null }), "Inventario general / Sin almacén");
  for (const body of [{ data: [] }, { transfers: { data: [], last_page: 1 } }, { data: { transfers: [] } }]) assert.equal(transferCollection(body, "transfers").rows.length, 0);
  assert.equal(transferCollection({ data: { items: [base] } }, "availability").rows.length, 1);
  assert.throws(() => transferCollection("<html>", "transfers"));
  const body = { source_branch_id: 1, destination_branch_id: 2, destination_warehouse_id: 5, items: validate([base]) };
  await api.create(body, "same-key"); await api.create(body, "same-key");
  assert.ok(calls.slice(-2).every(call => call.url === "/inventory-transfers" && call.config.headers["Idempotency-Key"] === "same-key" && call.body === body));
  for (const sourceWarehouse of [undefined, 3]) for (const destinationWarehouse of [null, 5]) {
    const payload = { ...body, destination_warehouse_id: destinationWarehouse, items: validate([{ ...base, source_warehouse_id: sourceWarehouse }], { destinationGeneral: destinationWarehouse === null }) };
    await api.create(payload, "combination-key");
    assert.equal(calls.at(-1).body.destination_warehouse_id, destinationWarehouse);
    assert.ok(!Object.hasOwn(payload.items[0], "source_warehouse_id") || sourceWarehouse === 3);
  }
  await api.decide(3, "reject", "Cantidad incorrecta");
  assert.equal(calls.at(-1).url, "/inventory-transfers/3/reject");
  await assert.rejects(api.decide(3, "delete", ""));
  assert.equal((await api.branches(7)).length, 2);
  assert.ok(calls.filter(call => call.url === "/branches").every(call => call.config.params.store_id === 7));

  // A pending request survives closing/reopening. Rendering never sends it automatically.
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM('<div id="root"></div>', { url: "https://example.test" });
  Object.assign(global, { window: dom.window, document: dom.window.document, sessionStorage: dom.window.sessionStorage, IS_REACT_ACT_ENVIRONMENT: true });
  Object.defineProperty(global, "navigator", { configurable: true, value: dom.window.navigator });
  const React = require("react"); const { createRoot } = require("react-dom/client");
  const div = ({ children }) => React.createElement("div", null, children);
  const mui = Object.fromEntries(["Alert", "Box", "Card", "CardContent", "CircularProgress", "Dialog", "DialogActions", "DialogContent", "DialogTitle", "MenuItem", "Pagination", "Stack", "TextField", "Typography"].map(key => [key, div]));
  mui.Button = ({ children, disabled, onClick, startIcon, "aria-busy": ariaBusy }) => React.createElement("button", { disabled, onClick, "aria-busy": ariaBusy }, startIcon, children);
  mui.Alert = ({ children, action }) => React.createElement("div", null, children, action);
  mui.IconButton = mui.Button;
  mui.MenuItem = ({ children, value }) => React.createElement("option", { value }, children);
  mui.TextField = ({ children, select, label, value, onChange, disabled }) => React.createElement(select ? "select" : "input", { "aria-label": label, value, onChange, disabled }, select ? children : undefined);
  mui.useMediaQuery = () => true; mui.useTheme = () => ({ breakpoints: { down: () => "mobile" } });
  const saved = { key: "persisted-key", body }; const storedKey = "inventory-transfer:pending:1";
  sessionStorage.setItem(storedKey, JSON.stringify(saved));
  const retries = []; let fail = true; let savedCount = 0;
  const Dialog = compile("src/components/warehouses/NewInventoryTransferDialog.jsx", {
    "@mui/material": mui,
    "@mui/icons-material/Inventory2Outlined": div,
    "@mui/icons-material/CloseRounded": div,
    "./warehouseStyles": { warehouseDialogStyles: {}, warehouseGrid: {}, warehousePanel: {} },
    "../../services/admin/inventoryTransfers": { ...helpers, transfersApi: { warehouses: async () => [], destinationProducts: async () => [], availability: async () => ({ data: [{ ...base, source_warehouse_id: 3 }] }), create: async (payload, key) => { retries.push({ payload, key }); if (fail) throw new Error("Network failure"); } } },
  }).default;
  const ui = createRoot(document.getElementById("root"));
  const render = key => React.act(async () => ui.render(React.createElement(Dialog, { key, branch: { id: 1 }, branches: [], onClose: () => {}, onSaved: () => savedCount++ })));
  const clickRetry = () => React.act(async () => [...document.querySelectorAll("button")].find(button => button.textContent === "Reintentar mismo envío").click());
  await render("first"); assert.equal(retries.length, 0);
  await clickRetry(); assert.equal(retries.length, 1); assert.ok(sessionStorage.getItem(storedKey));
  await render("reopen"); assert.equal(retries.length, 1); fail = false;
  await clickRetry(); assert.equal(retries.length, 2);
  assert.deepEqual(retries[0], retries[1]); assert.equal(retries[0].key, saved.key);
  assert.equal(sessionStorage.getItem(storedKey), null); assert.equal(savedCount, 1);
  await React.act(async () => ui.render(React.createElement(Dialog, { key: "new-general", branch: { id: 1 }, branches: [{ id: 1 }, { id: 2, name: "Destination" }], onClose: () => {}, onSaved: () => savedCount++ })));
  const destinationSelect = document.querySelector('[aria-label="Sucursal destino"]');
  await React.act(async () => { destinationSelect.value = "2"; destinationSelect.dispatchEvent(new dom.window.Event("change", { bubbles: true })); });
  const target = document.querySelector('[aria-label="Inventario destino"]');
  assert.equal(target.value, ""); assert.ok(target.textContent.includes("Inventario general / Sin almacén"));
  for (const text of ["Agregar", "Revisar envío", "Confirmar y enviar"]) await React.act(async () => {
    const button = [...document.querySelectorAll("button")].find(item => item.textContent === text);
    assert.ok(button && !button.disabled, `General destination without warehouses permits: ${text}`); button.click();
  });
  assert.equal(retries.at(-1).payload.destination_warehouse_id, null);
  assert.equal(retries.at(-1).payload.destination_branch_id, 2);
  assert.equal(retries.at(-1).payload.items[0].source_warehouse_id, 3);
  await React.act(async () => ui.unmount());
  const decisions = []; let pdfReads = 0; let refreshes = 0; let transferStatus = "pending"; let rejectPdf;
  mui.Chip = div;
  const Transfers = compile("src/components/warehouses/InventoryTransfers.jsx", {
    "@mui/material": mui,
    "../../context/TiendaContext": { useTienda: () => ({ tienda: { id: 7 } }) },
    "../../utils/inventoryEvents": { notifyInventoryChanged: () => {} },
    "./NewInventoryTransferDialog": () => null,
    "./warehouseStyles": { warehouseDialogStyles: {}, warehouseGrid: {}, warehousePanel: {} },
    "../../services/admin/inventoryTransfers": { ...helpers, transfersApi: {
      branches: async () => [{ id: 1, name: "Origen" }, { id: 2, name: "Destino" }],
      list: async () => ({ data: [{ id: 3, status: transferStatus, source_branch_id: 1, destination_branch_id: 2 }] }),
      detail: async () => ({ id: 3, status: transferStatus, source_branch_id: 1, destination_branch_id: 2, items: [{ source_product_id: 1, name: "Nombre historico del producto", quantity: "2.50" }], events: [] }),
      decide: async (id, action, notes) => { decisions.push({ id, action, notes }); transferStatus = "accepted"; },
      pdf: async () => { pdfReads++; return new Promise((resolve, reject) => { rejectPdf = reject; }); },
    } },
  }).default;
  const history = createRoot(document.getElementById("root"));
  await React.act(async () => history.render(React.createElement(Transfers, { branch: { id: 1 }, onChanged: () => refreshes++ })));
  const click = text => React.act(async () => {
    const button = [...document.querySelectorAll("button")].find(item => item.textContent === text);
    assert.ok(button, text); button.click();
  });
  assert.equal(decisions.length, 0);
  await click("Ver detalle y comprobante"); assert.equal(decisions.length, 0); assert.equal(pdfReads, 0, "Opening detail must not download or print");
  assert.ok(document.body.textContent.includes("Nombre historico del producto"));
  assert.ok(!document.body.textContent.includes("undefined"));
  assert.ok(![...document.querySelectorAll("button")].some(item => item.textContent === "Revisar y aceptar"), "Origin cannot receive its own shipment");
  assert.ok(document.body.textContent.includes("entra a la sucursal destino"));
  assert.equal(helpers.canReceiveTransfer({ status: "pending", destination_branch_id: 2 }, 1), false);
  assert.equal(helpers.canReceiveTransfer({ status: "pending", destination_branch_id: 2 }, 2), true);
  assert.equal(helpers.canReceiveTransfer({ status: "accepted", destination_branch_id: 2 }, 2), false);
  await React.act(async () => history.render(React.createElement(Transfers, { key: "destination", branch: { id: 2 }, onChanged: () => refreshes++ })));
  await click("Recibidos"); await click("Ver detalle y comprobante");
  await click("Rechazar envío");
  const reject = [...document.querySelectorAll("button")].find(item => item.textContent === "Confirmar rechazo y reintegro");
  assert.ok(reject.disabled, "Rejection requires a reason"); assert.equal(decisions.length, 0);
  await click("Volver"); await click("Revisar y aceptar"); assert.equal(decisions.length, 0);
  await click("Confirmar recepción completa");
  assert.deepEqual(decisions, [{ id: 3, action: "accept", notes: "" }]); assert.equal(refreshes, 1);
  assert.ok(![...document.querySelectorAll("button")].some(item => item.textContent === "Revisar y aceptar"), "Finalized transfers cannot be accepted again from UI");
  for (const [buttonText, busyText] of [["Ver PDF", "Generando PDF..."], ["Descargar PDF", "Descargando..."]]) {
    await click(buttonText);
    const loadingButton = [...document.querySelectorAll("button")].find(item => item.textContent === busyText);
    assert.ok(loadingButton?.disabled); assert.equal(loadingButton.getAttribute("aria-busy"), "true");
    assert.ok(!loadingButton.textContent.includes("?"));
    await React.act(async () => rejectPdf(new Error("Simulated PDF failure")));
    assert.ok(document.body.textContent.includes("Simulated PDF failure"));
    assert.ok(document.body.textContent.includes("Reintentar PDF"));
    assert.ok([...document.querySelectorAll("button")].find(item => item.textContent === buttonText && !item.disabled));
  }
  await React.act(async () => history.unmount()); dom.window.close();
  console.log("OK: four inventory modes, precision, stock limits, 200 items, catalogs, endpoints, persisted retries and explicit receiving decisions.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
