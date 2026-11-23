const assert = require("node:assert/strict");
const fs = require("node:fs");
const babel = require("@babel/core");
const React = require("react");
const { act } = React;
const { JSDOM } = require("jsdom");
const { createRoot } = require("react-dom/client");

function load(name, resolver = require) {
  const source = fs.readFileSync(`src/modules/telorecargo/${name}.js`, "utf8").replaceAll("import.meta.env", "({})");
  const code = babel.transformSync(source, { configFile: false, babelrc: false, plugins: ["@babel/plugin-transform-modules-commonjs"] }).code;
  const module = { exports: {} }; new Function("module", "exports", "require", code)(module, module.exports, resolver); return module.exports;
}
const model = load("model");
const quote = { cotizacion: "opaque-quote", producto: "TEL100", importe_recarga: "100.00", comision: "5.00", total_cobrar: "105.00", expires_at: "2026-10-28T12:10:00Z" };
const payments = [{ method: "efectivo", amount: "60.00" }, { method: "transferencia", amount: "45.00", referencia: "BANK1", ultimos_4: "1234" }];
const body = model.rechargeBody(quote, "5512345678", payments, 1, 20, Date.parse("2026-10-28T12:00:00Z"));
assert.deepEqual(Object.keys(body).sort(), ["client_id", "cotizacion", "pagos", "referencia", "worker_id"]);
assert.equal(body.pagos.reduce((sum, row) => sum + model.cents(row.amount), 0), 10500);
assert.equal(model.cents("0.10") + model.cents("0.20"), model.cents("0.30"));
assert.throws(() => model.paymentPayload([{ method: "efectivo", amount: "110" }], "105"));
assert.throws(() => model.paymentPayload([{ method: "tc", amount: "105", referencia: "x" }], "105"));
assert.throws(() => model.cents("1.001"));
assert.throws(() => model.rechargeBody(quote, "551234567", payments, null, null, Date.parse("2026-10-28T12:00:00Z")));
assert.throws(() => model.rechargeBody(quote, "5512345678", payments, null, null, Date.parse("2026-10-28T12:11:00Z")));
assert.equal(model.complete({ status: "confirmada", sale_id: null }), false);
assert.equal(model.complete({ status: "confirmada", sale_id: 920 }), true);
assert.equal(model.terminal({ id: 1, status: "en_revision" }), false);
assert.equal(model.terminal({ id: 1, status: "reintentable" }), false);
assert.equal(model.terminal({ id: 2, status: "pendiente" }, true), true);
assert.equal(model.terminal({ status: "pendiente" }, true), false);
assert.equal(model.quoteRejectedBeforeSend({ response: { status: 422, data: { errors: { cotizacion: ["expired"] } } } }), true);
assert.equal(model.quoteRejectedBeforeSend({ response: { status: 422, data: { errors: { cotizacion: ["expired"] }, data: { id: 15 } } } }), false);
model.filtersValid({ desde: "2026-01-01", hasta: "2026-12-31" });
assert.throws(() => model.filtersValid({ desde: "2026-02-30", hasta: "2026-03-02" }));
assert.throws(() => model.filtersValid({ desde: "2025-01-01", hasta: "2026-01-02" }));
const receipt = new File(["receipt bytes"], "receipt.pdf", { type: "application/pdf" });
assert.deepEqual(model.fundingBody("500", "BANK123", receipt), { monto: "500.00", referencia: "BANK123" });
assert.throws(() => model.fundingBody("500", " ", receipt));
assert.throws(() => model.fundingBody("500", "x".repeat(101), receipt));
assert.throws(() => model.fundingBody("0.99", "BANK123", receipt));
assert.throws(() => model.fundingBody("500", "BANK123", new File(["x"], "x.txt", { type: "text/plain" })));
assert.throws(() => model.fundingBody("500", "BANK123", new File([new Uint8Array(2 * 1024 * 1024 + 1)], "x.pdf", { type: "application/pdf" })));
assert.equal(model.catalogPage({ data: { productos: [{ Codigo: "TEL100" }] } }).rows[0].Codigo, "TEL100");
assert.equal(model.catalogPage({ data: [{ Codigo: "TEL100" }], current_page: 1, last_page: 2 }).hasMore, true);

const storage = new Map([["AUTH_TOKEN", "store-session"], ["POS_TOKEN", "pos-session"]]);
global.localStorage = { getItem: (key) => storage.get(key) || null };
const requests = [];
const fakeAxios = { create(options) {
  let intercept;
  const execute = async (method, url, data, config = {}) => {
    const req = intercept({ method, url, data, ...config, headers: { ...(config.headers || {}) } });
    requests.push({ ...req, options }); return { data: { data: { id: 1 } } };
  };
  return { interceptors: { request: { use(fn) { intercept = fn; } } }, get: (url, config) => execute("GET", url, undefined, config), delete: (url) => execute("DELETE", url), put: (url, data) => execute("PUT", url, data), post: (url, data, config) => execute("POST", url, data, config) };
} };

async function serviceTests() {
  const { telorecargoPOS: pos, telorecargoStore: store } = load("service", (name) => name === "axios" ? fakeAxios : require(name));
  await store.credential("external-credential"); await store.commission("5.00"); await pos.state(); await pos.quote("TEL100");
  const draft = { key: "mtelmx:recarga:fixed-order", body };
  await pos.recharge(draft); await pos.recharge(draft);
  const recharges = requests.filter((req) => req.url.endsWith("/recargas"));
  assert.equal(recharges.length, 2); assert.deepEqual(recharges[0].data, recharges[1].data);
  assert.equal(recharges[0].headers["Idempotency-Key"], draft.key);
  assert.equal(recharges[0].headers.Authorization, "Bearer pos-session");
  assert.equal(requests[0].headers.Authorization, "Bearer store-session");
  assert.deepEqual(requests[1].data, { comision: "5.00" });
  await pos.funding({ key: "mtelmx:deposito:fixed-order", body: { monto: "500.00", referencia: "BANK123" }, file: receipt, fileName: receipt.name });
  const funding = requests.at(-1); assert.equal(funding.data.get("monto"), "500.00"); assert.equal(await funding.data.get("comprobante").text(), "receipt bytes");
  assert.equal(funding.data.get("referencia"), "BANK123");
  assert.deepEqual(Array.from(funding.data.keys()).sort(), ["comprobante", "monto", "referencia"]);
  assert.ok(!funding.headers["Content-Type"]);
  await pos.ticket(15); assert.equal(requests.at(-1).url, "/pos/telorecargo/recargas/15/ticket.pdf"); assert.equal(requests.at(-1).responseType, "blob");
  assert.ok(requests.every((request) => request.url.startsWith("/") && request.options.baseURL.includes("mitiendaenlineamx")));
  assert.ok(!Array.from(storage.values()).includes("external-credential"));
}

async function durableTests() {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost" }); global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  const records = new Map(); const trace = []; const sent = []; let failSave = false; let reply = "timeout"; let instance;
  const repository = {
    readDraft: async (id, kind) => records.get(`${id}:${kind}`),
    saveDraft: async (id, kind, draft) => { if (failSave) throw Error("storage failed"); records.set(`${id}:${kind}`, structuredClone(draft)); trace.push("committed"); },
    clearDraft: async (id, kind) => records.delete(`${id}:${kind}`),
  };
  const api = {
    recharge: async (draft) => { trace.push("POST"); sent.push(structuredClone(draft)); if (reply === "limited") { const err = Error("rate limit"); err.response = { status: 429, headers: { "retry-after": "60" }, data: { data: { id: 15, status: "reintentable", sale_id: null } } }; throw err; } if (reply === "timeout") throw Error("network timeout"); if (reply === "stale-quote") { const err = Error("quote expired"); err.response = { status: 422, data: { errors: { cotizacion: ["expired"] } } }; throw err; } if (reply === "pending-sale") { const err = Error("pending sale"); err.response = { status: 503, data: { code: "VENTA_PENDIENTE_REGISTRO", data: { id: 15, status: "confirmada", sale_id: null } } }; throw err; } return { data: { id: 15, status: "confirmada", sale_id: 920 } }; },
    detail: async () => ({ data: { id: 15, status: "confirmada", sale_id: 920 } }),
    funding: async (draft) => { sent.push(structuredClone(draft)); return { data: { id: 16, status: "pendiente" } }; },
  };
  const useOrder = load("useDurableOrder", (name) => name === "./drafts" ? repository : name === "./model" ? model : name === "./service" ? { telorecargoPOS: api } : require(name)).default;
  function Harness({ funding }) { instance = useOrder(10, funding); return null; }
  let root = createRoot(document.getElementById("root"));
  async function mount(funding = false) { await act(async () => root.render(React.createElement(Harness, { funding }))); }
  await mount();
  const draft = { key: "mtelmx:recarga:persisted", body, summary: quote };
  await act(async () => instance.submit(draft));
  assert.deepEqual(trace.slice(0, 2), ["committed", "POST"]); assert.equal(instance.draft.key, draft.key);
  await act(async () => root.unmount()); root = createRoot(document.getElementById("root")); await mount();
  assert.equal(instance.draft.key, draft.key, "reload must restore original order");
  reply = "pending-sale"; await act(async () => instance.submit());
  assert.equal(instance.draft.operation.sale_id, null); assert.equal(model.terminal(instance.draft.operation), false);
  assert.equal(sent[0].key, sent[1].key); assert.deepEqual(sent[0].body, sent[1].body);
  await act(async () => instance.startNew()); assert.ok(instance.draft, "pending local sale cannot be discarded");
  await act(async () => instance.refresh()); assert.equal(instance.draft.operation.sale_id, 920);
  await act(async () => instance.startNew()); assert.equal(instance.draft, null);
  failSave = true; const count = sent.length; await act(async () => instance.submit({ ...draft, key: "mtelmx:recarga:not-saved" })); assert.equal(sent.length, count, "do not POST when persistence fails");
  failSave = false; reply = "stale-quote";
  await act(async () => instance.submit({ ...draft, key: "mtelmx:recarga:stale-quote" }));
  assert.equal(instance.draft, null); assert.equal(instance.requiresQuote, true, "a definitive preflight quote rejection requires a new quote and confirmation");
  reply = "limited";
  await act(async () => instance.submit({ ...draft, key: "mtelmx:recarga:rate-limited" }));
  assert.ok(instance.retryUntil > Date.now());
  const limitedCount = sent.length; await act(async () => instance.submit()); assert.equal(sent.length, limitedCount, "respect Retry-After without another POST");
  await act(async () => root.unmount()); root = createRoot(document.getElementById("root")); await mount();
  assert.ok(instance.retryUntil > Date.now(), "preserve retry cooldown after reload");
  await act(async () => instance.refresh()); await act(async () => instance.startNew());
  await act(async () => root.unmount()); failSave = false; root = createRoot(document.getElementById("root")); await mount(true);
  const deposit = { key: "mtelmx:deposito:persisted", body: { monto: "500.00", referencia: "BANK123" }, file: receipt, fileName: receipt.name };
  await act(async () => instance.submit(deposit)); assert.equal(await sent.at(-1).file.text(), "receipt bytes"); assert.ok(model.terminal(instance.draft.operation, true));
  await act(async () => root.unmount());
}
async function credentialFormTests() {
  const { Simulate } = require("react-dom/test-utils");
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost" }); global.window = dom.window; global.document = dom.window.document;
  let release; const sent = []; let commission;
  const api = { config: async () => ({ data: { configured: false, comision: "0.00" } }), credential: async (value) => { sent.push(value); return new Promise((resolve) => { release = resolve; }); }, commission: async (value) => { commission = value; return { data: { comision: value } }; } };
  const components = new Proxy({}, { get(cache, name) {
    if (name === "__esModule") return false;
    if (cache[name]) return cache[name];
    if (name === "TextField") return cache[name] = ({ label, value, onChange, type, disabled }) => React.createElement("input", { "aria-label": label, value, onChange, type, disabled });
    if (name === "Button") return cache[name] = ({ children, onClick, type, disabled }) => React.createElement("button", { onClick, type: type || "button", disabled }, children);
    if (name === "Dialog") return cache[name] = ({ open, children }) => open ? React.createElement("div", null, children) : null;
    return cache[name] = ({ children, component, onSubmit }) => React.createElement(component === "form" ? "form" : "div", { onSubmit }, children);
  } });
  const source = babel.transformSync(fs.readFileSync("src/modules/telorecargo/AdminTelorecargo.jsx", "utf8"), { configFile: false, babelrc: false, presets: [["@babel/preset-react", { runtime: "classic" }]], plugins: ["@babel/plugin-transform-modules-commonjs"] }).code;
  const module = { exports: {} };
  new Function("module", "exports", "require", source)(module, module.exports, (name) => name === "react" ? React : name === "@mui/material" ? components : name.startsWith("@mui/icons-material/") ? () => null : name === "./service" ? { telorecargoStore: api } : name === "./model" ? model : name === "./presentation" ? { ModuleHeader: () => null } : () => null);
  const root = createRoot(document.getElementById("root"));
  await act(async () => root.render(React.createElement(module.exports.default)));
  const input = document.querySelector('input[type="password"]'); assert.equal(input.value, "");
  await act(async () => Simulate.change(input, { target: { value: "test-only-credential" } }));
  await act(async () => Simulate.submit(input.closest("form")));
  assert.equal(input.value, "", "clear credential immediately, while request is pending"); assert.deepEqual(sent, ["test-only-credential"]);
  assert.ok(!document.body.textContent.includes("test-only-credential"));
  await act(async () => release({ data: { configured: true, comision: "0.00" } }));
  const amount = Array.from(document.querySelectorAll("input")).find((node) => node.getAttribute("aria-label")?.includes("MXN"));
  await act(async () => Simulate.change(amount, { target: { value: "5" } }));
  await act(async () => Simulate.submit(amount.closest("form")));
  assert.equal(commission, "5.00", "commission must use the separate endpoint");
  await act(async () => root.unmount());
}
(async () => { await serviceTests(); await durableTests(); await credentialFormTests(); console.log("OK: payment cents, quotes, validation, session separation, immutable retries, durable-before-send, recovery, receipt bytes, authenticated PDF and credential form clearing."); })().catch((error) => { console.error(error); process.exitCode = 1; });
