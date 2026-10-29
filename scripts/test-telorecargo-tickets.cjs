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

let calls = 0, bridgePayload, conflict = false;
let release;
const payload = { logo: 'logo', cut: true, text: 'original' };
const Actions = load('src/modules/telorecargo/RechargeTicketActions.jsx', (name) => {
 if (name === 'react') return React;
 if (name.startsWith('@mui/icons-material/')) return () => null;
 if (name === '@mui/material') return mui;
 if (name === './model') return model;
 if (name.includes('printPayloadBridge')) return { sendToBridge: async (value) => { bridgePayload = value; return true; } };
 if (name === './service') return { downloadRechargeTicket: async () => {}, telorecargoPOS: { printPayload: async (op) => { calls++; if (conflict) throw { response: { status: 409 } }; assert.equal(op.id, 7); await new Promise(resolve => { release = resolve; }); return { ok: true, payload }; } } };
 throw new Error(name);
}).default;
const root = createRoot(document.getElementById('root'));
(async () => {
 await act(async () => root.render(h(Actions, { operation: { id: 7, status: 'procesando', sale_id: 99 } })));
 assert.equal(document.querySelectorAll('button').length, 0);
 await act(async () => root.render(h(Actions, { operation: { id: 7, status: 'confirmada', sale_id: 99 } })));
 const button = Array.from(document.querySelectorAll('button')).find(node => node.textContent === 'Imprimir ticket');
 await act(async () => { button.click(); button.click(); });
 assert.equal(calls, 1, 'duplicate clicks never request twice');
 await act(async () => release());
 assert.equal(bridgePayload, payload, 'bridge receives original payload without reconstruction');
 assert.equal(button.disabled, false, 'printing can be retried independently');
 conflict = true;
 await act(async () => button.click());
 assert.ok(document.body.textContent.includes('409') || document.body.textContent.includes('venta confirmada disponible para imprimir'));
 assert.equal(button.disabled, false);
 await act(async () => root.unmount());
 console.log('OK: confirmed-sale gating, duplicate click lock, original payload and independent print retry.');
})().catch(error => { console.error(error); process.exitCode = 1; });
