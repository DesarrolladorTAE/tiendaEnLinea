const assert = require("node:assert/strict");
const fs = require("node:fs");
const babel = require("@babel/core");
const React = require("react");
const { JSDOM } = require("jsdom");
const { createRoot } = require("react-dom/client");
const { act } = React;
function load(file, resolver = require) {
  const code = babel.transformSync(fs.readFileSync(file, "utf8"), { configFile: false, babelrc: false, presets: ["@babel/preset-react"], plugins: ["@babel/plugin-transform-modules-commonjs"] }).code;
  const module = { exports: {} };
  new Function("module", "exports", "require", code)(module, module.exports, resolver);
  return module.exports;
}
const model = load("src/modules/telorecargo/model.js");
const checkout = load("src/modules/telorecargo/checkout.js");
assert.equal(checkout.customerPhone({ telefono: "+52 (55) 1234-5678" }), "5512345678");
assert.equal(checkout.customerPhone({ telefono: "+52 1 55 1234 5678" }), "5512345678");
assert.equal(checkout.customerPhone({ telefono: "123" }), "");
assert.equal(checkout.customerPhone(null), "");
const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost" });
global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
const h = React.createElement;
const block = ({ children, component, className, onSubmit }) => h(component === "form" ? "form" : "div", { className, onSubmit }, children);
const mui = new Proxy({
  useMediaQuery: () => false,
  Dialog: ({ open, children }) => open ? h("section", { role: "dialog" }, children) : null,
  Button: ({ children, onClick, disabled, type = "button" }) => h("button", { onClick, disabled, type }, children),
  IconButton: ({ onClick, disabled }) => h("button", { onClick, disabled }, "close"),
  Chip: ({ label }) => h("span", null, label),
  TextField: ({ label, value, onChange, select, children, disabled }) => select ? h("select", { "aria-label": label, value, onChange, disabled }, children) : h("input", { "aria-label": label, value, onInput: onChange, onChange: () => {} }),
  MenuItem: ({ value, children, disabled }) => h("option", { value, disabled }, children),
  Autocomplete: ({ options, onChange }) => h("select", { "aria-label": "customer", onChange: (event) => onChange(null, options.find((row) => String(row.id) === event.target.value) || null) }, h("option", { value: "" }, "none"), ...options.map((row) => h("option", { value: row.id, key: row.id }, row.name))),
}, { get: (target, key) => key in target ? target[key] : block });
let quoteCalls = 0, submitted;
const quoted = { cotizacion: "test-quote", producto: "TEL100", nombre: "Telcel 100", importe_recarga: "100.00", comision: "5.00", total_cobrar: "105.00", expires_at: new Date(Date.now() + 300000).toISOString() };
const api = {
  state: async () => ({ configured: true, comision: "5.00" }), balance: async () => ({ saldo: "900.00" }),
  companies: async () => ({ data: [{ id: 8, Nombre: "Telcel" }] }),
  products: async () => ({ data: [{ Codigo: "TEL100", CarrierID: 8, Nombre: "Telcel 100", Monto: "100.00" }] }),
  workers: async () => [], customers: async () => [{ id: 20, name: "Ana", telefono: "+52 5512345678" }, { id: 21, name: "Sin teléfono", telefono: null }],
  quote: async (code) => { quoteCalls++; assert.equal(code, "TEL100"); return quoted; },
};
const hook = () => ({ draft: null, ready: true, error: "", busy: false, submit: async (draft) => { submitted = draft; } });
const presentation = {
  ModuleHeader: () => null, CarrierBadge: () => null,
  CompanySelector: ({ onChange }) => h("button", { onClick: () => onChange("8") }, "Telcel logo"),
  ProductOption: ({ onClick }) => h("button", { onClick }, "Recarga 100"),
};
const Page = load("src/modules/telorecargo/POSTelorecargo.jsx", (name) => {
  if (name === "react") return React;
  if (name === "@mui/material") return mui;
  if (name === "./model") return model;
  if (name === "./checkout") return checkout;
  if (name === "./RechargeFields") return load("src/modules/telorecargo/RechargeFields.jsx", (dependency) => dependency === "@mui/material" ? mui : dependency === "./model" ? model : dependency === "./checkout" ? checkout : dependency.startsWith("@mui/icons-material/") ? () => null : require(dependency));
  if (name === "./service") return { telorecargoPOS: api };
  if (name === "./companies") return load("src/modules/telorecargo/companies.js");
  if (name === "./presentation") return presentation;
  if (name === "./useDurableOrder") return hook;
  if (name === "./HistoryPanel") return { __esModule: true, default: () => null, OperationStatus: () => null };
  return () => null;
}).default;
function click(text) {
  const node = Array.from(document.querySelectorAll("button")).find((button) => button.textContent === text);
  assert.ok(node, text); assert.equal(node.disabled, false, text); node.click();
}
(async () => {
  const root = createRoot(document.getElementById("root"));
  await act(async () => root.render(h(Page, { posLocationId: 10 })));
  assert.equal(document.querySelector('[role="dialog"]'), null, "no modal opens automatically");
  await act(async () => click("Telcel logo"));
  assert.ok(document.querySelector('[role="dialog"]'), "choosing a logo opens checkout");
  await act(async () => { const amounts = document.querySelector('[aria-label="Monto o paquete"]'); amounts.value = "TEL100"; amounts.dispatchEvent(new window.Event("change", { bubbles: true })); });
  assert.equal(quoteCalls, 1);
  assert.ok(document.body.textContent.includes("Comisión"));
  assert.ok(document.body.textContent.includes("105.00"));
  assert.equal(document.querySelector('[aria-label="Importe aplicado"]').value, "105.00", "payment includes the commission once");
  const select = document.querySelector('[aria-label="customer"]');
  await act(async () => { select.value = "20"; select.dispatchEvent(new window.Event("change", { bubbles: true })); });
  assert.equal(document.querySelector('[aria-label="Teléfono de la recarga"]').value, "5512345678");
  await act(async () => { select.value = "21"; select.dispatchEvent(new window.Event("change", { bubbles: true })); });
  assert.equal(document.querySelector('[aria-label="Teléfono de la recarga"]').value, "", "another client never retains the previous phone");
  await act(async () => { select.value = "20"; select.dispatchEvent(new window.Event("change", { bubbles: true })); });
  await act(async () => document.querySelector("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
  assert.equal(document.querySelectorAll('[role="dialog"]').length, 1, "confirmation requires matching phone numbers");
  await act(async () => { const confirm = document.querySelector('[aria-label="Confirmar número"]'); confirm.value = "5512345678"; confirm.dispatchEvent(new window.Event("input", { bubbles: true })); });
  await act(async () => document.querySelector("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
  assert.equal(submitted, undefined, "review does not send a recharge");
  assert.equal(document.querySelectorAll('[role="dialog"]').length, 2);
  await act(async () => click("Confirmar y enviar"));
  assert.equal(submitted.body.client_id, 20);
  assert.equal(submitted.body.referencia, "5512345678");
  assert.equal(submitted.body.pagos[0].amount, "105.00");
  await act(async () => root.unmount());
  console.log("OK: logo opens modal, customer phone normalization, automatic quote, commission included once, explicit confirmation and safe client changes. Mocked requests only.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
