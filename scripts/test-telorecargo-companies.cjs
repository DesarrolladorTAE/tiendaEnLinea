const assert = require("node:assert/strict");
const fs = require("node:fs");
const babel = require("@babel/core");
const React = require("react");
const { act } = React;
const { createRoot } = require("react-dom/client");
const { JSDOM } = require("jsdom");

function load(file, resolver) {
  const code = babel.transformSync(fs.readFileSync(file, "utf8").replaceAll("import.meta.env", "({})"), { configFile: false, babelrc: false, presets: [["@babel/preset-react", { runtime: "classic" }]], plugins: ["@babel/plugin-transform-modules-commonjs"] }).code;
  const module = { exports: {} }; new Function("module", "exports", "require", code)(module, module.exports, resolver); return module.exports;
}
const companies = load("src/modules/telorecargo/companies.js", require);
const rows = [{ id: 3, Nombre: "AT&T", Logotipo: null }, { id: 24, Nombre: "BAIT", Logotipo: "https://logos.test/bait.png" }, { id: 7, Nombre: "Movistar", Logotipo: "https://logos.test/movistar.png" }, { id: 8, Nombre: "Telcel", Logotipo: "https://logos.test/telcel.png" }];
const sorted = companies.companyList({ data: rows });
assert.deepEqual(sorted.map((row) => row.id), [8, 7, 24, 3]);
assert.equal(companies.companyForProduct(sorted, { CarrierID: "8" }).Logotipo, rows[3].Logotipo);
for (const invalid of [null, "", "/relative.png", "//example.com/a.png", "javascript:alert(1)", "data:image/png;base64,a", "https://user:password@example.com/a.png"]) assert.equal(companies.usableLogo(invalid), null);
assert.equal(companies.usableLogo("http://logos.test/telcel.png"), "http://logos.test/telcel.png");
assert.equal(companies.usableLogo(rows[3].Logotipo), rows[3].Logotipo);
assert.deepEqual(companies.companyList({ data: [] }), []);
assert.equal(companies.retryAfterTime({ response: { status: 429, headers: { "retry-after": "30" } } }, 1000), 31000);

const calls = [];
global.localStorage = { getItem: (name) => name === "POS_TOKEN" ? "pos-session-test" : "store-session-test" };
const axios = { create() { let intercept; return { interceptors: { request: { use(fn) { intercept = fn; } } }, get: async (url, config = {}) => { const request = intercept({ url, ...config, headers: {} }); calls.push(request); return { data: { data: rows } }; } }; } };
const service = load("src/modules/telorecargo/service.js", (name) => name === "axios" ? axios : require(name));
const icons = () => React.createElement("svg");
const presentation = load("src/modules/telorecargo/presentation.jsx", (name) => name === "./companies" ? companies : name.endsWith(".css") ? {} : name.startsWith("@mui/icons-material/") ? icons : name === "@mui/material" ? {} : require(name));

(async () => {
  await service.telorecargoPOS.companies();
  assert.equal(calls[0].url, "/pos/telorecargo/companias");
  assert.equal(calls[0].headers.Authorization, "Bearer pos-session-test");
  assert.equal(calls[0].params, undefined, "the full company list has no pagination or filters");
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost" }); global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.getElementById("root")); let chosen;
  await act(async () => root.render(React.createElement(presentation.CompanySelector, { companies: sorted, value: "", onChange: (value) => { chosen = value; } })));
  const options = Array.from(document.querySelectorAll(".trc-company-option"));
  assert.deepEqual(options.slice(0, 3).map((node) => node.querySelector(".trc-carrier-name").textContent), ["Telcel", "Movistar", "BAIT"]);
  assert.equal(options[0].querySelector("img").src, rows[3].Logotipo);
  assert.equal(options[0].querySelector("img").getAttribute("referrerpolicy"), "no-referrer");
  assert.ok(!options[0].querySelector("img").outerHTML.includes("pos-session-test"));
  await act(async () => options[0].click()); assert.equal(chosen, "8", "send the real company ID, not the sorted index");
  const image = options[0].querySelector("img");
  await act(async () => image.dispatchEvent(new window.Event("error")));
  assert.equal(options[0].querySelector("img"), null, "a failed logo is replaced, not retried indefinitely");
  assert.ok(options[0].querySelector("svg"));
  await act(async () => root.unmount());
  const style = document.createElement("style"); style.textContent = fs.readFileSync("src/modules/telorecargo/telorecargo.css", "utf8"); document.head.append(style);
  document.body.innerHTML = '<div class="trc-module"><div class="trc-balance MuiPaper-root"><h4 class="MuiTypography-root">$900.00</h4><span class="MuiTypography-root">Saldo compartido</span></div><button class="trc-product is-selected"><span class="trc-product-amount">$100.00</span></button></div>';
  for (const node of document.querySelectorAll(".trc-balance .MuiTypography-root, .trc-product-amount")) assert.equal(window.getComputedStyle(node).color, "rgb(255, 255, 255)");
  console.log("OK: complete companies endpoint, POS session, priority order, real IDs, usable logos, no token in images, failed-logo fallback and white-on-green text.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
