const assert = require("node:assert/strict");
const fs = require("node:fs");
const { JSDOM } = require("jsdom");
const babel = require("@babel/core");
const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = React;

const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/tienda/demo?vista=compras#customer_sales" });
global.window = dom.window;
global.document = dom.window.document;
global.IS_REACT_ACT_ENVIRONMENT = true;
window.requestAnimationFrame = (callback) => setTimeout(callback, 0);
window.cancelAnimationFrame = clearTimeout;
window.matchMedia = () => ({ matches: false });
window.HTMLElement.prototype.scrollIntoView = () => {};

let route = { slug: "demo", search: "?vista=compras", hash: "#customer_sales" };
let failSite = false;
let failBranches = false;
let siteCalls = 0;
let deferredSite = null;
const requestConfigs = [];
const payload = { ok: true, store: { id: 1, slug: "demo", name: "Demo" }, branch: { name: "Centro" }, plan: { id: 3 }, sitio: { carousel: ["/photo.jpg"], settings: { customer_sales_enabled: true } } };
const element = (label) => () => React.createElement("div", { "data-test": label }, label);
const material = new Proxy({}, { get: (_, name) => name === "__esModule" ? false : ({ children, component, ...props }) => React.createElement(typeof component === "string" ? component : "div", Object.fromEntries(Object.entries(props).filter(([key]) => key.startsWith("aria-") || key.startsWith("data-") || key === "onClick")), children) });
const source = fs.readFileSync("src/pages/other/PersnalizacionSitio.jsx", "utf8").replaceAll("import.meta.env", "({})");
const code = babel.transformSync(source, { configFile: false, babelrc: false, presets: [["@babel/preset-react", { runtime: "classic" }]], plugins: ["@babel/plugin-transform-modules-commonjs"] }).code;
const moduleUnderTest = { exports: {} };
const resolve = (name) => {
  if (name === "react") return React;
  if (name === "react-router-dom") return {
    useParams: () => ({ storeSlug: route.slug }), useLocation: () => ({ search: route.search, hash: route.hash }),
    useNavigate: () => () => {}, useSearchParams: () => [new URLSearchParams(route.search), () => {}],
  };
  if (name === "@mui/material") return material;
  if (name.startsWith("@mui/icons-material/")) return () => React.createElement("svg");
  if (name.endsWith(".css")) return {};
  if (name.includes("storefrontService")) return {
    getStorefrontBranches: async (_, config) => { requestConfigs.push(config); if (failBranches) throw Error("branches offline"); return { data: { branches: [{ id: 1, slug: "shared-branch", name: "Centro" }] } }; },
    getPublicStorefront: async (_, config) => { siteCalls++; requestConfigs.push(config); if (deferredSite) return deferredSite; if (failSite) throw Error("network offline"); return { data: payload }; },
    getPublicStoreProducts: async () => ({ data: [] }),
  };
  if (name.includes("storefrontBranding")) return { getStorefrontBrand: () => ({ logo: "", name: "Demo" }), rememberStorefrontBrand: () => ({ logo: "", name: "Demo" }) };
  if (name.includes("utils/customerSales")) return { hasCurrentInvoiceComplement: () => true };
  if (name.endsWith("/StorefrontMetadata")) return () => null;
  if (name.endsWith("/StorefrontLoading")) return element("loading");
  if (name.endsWith("/CustomerSales")) return element("purchases");
  if (name.endsWith("/StoreGallery")) return element("gallery");
  if (name.endsWith("/Catalogo")) return element("catalog");
  return element("unavailable");
};
new Function("module", "exports", "require", code)(moduleUnderTest, moduleUnderTest.exports, resolve);
const Page = moduleUnderTest.exports.default;
const root = createRoot(document.getElementById("root"));
const shows = (label) => Boolean(document.querySelector(`[data-test="${label}"]`));
async function render() { await act(async () => { root.render(React.createElement(Page)); await new Promise((resolve) => setTimeout(resolve, 0)); }); }

(async () => {
  await render();
  assert.ok(shows("purchases"), "direct purchases URL should finish loading");
  assert.ok(!shows("catalog"));
  const calls = siteCalls;
  route = { ...route, search: "?vista=galeria", hash: "#carousel" };
  await render();
  assert.ok(shows("gallery"));
  assert.equal(siteCalls, calls, "view changes should not reload storefront data");
  route = { slug: "another-store", search: "?vista=compras", hash: "#customer_sales" };
  await render();
  assert.ok(!shows("loading"), "same resolved branch must not leave loading stuck after store changes");
  assert.ok(shows("purchases"));
  failSite = true;
  route = { ...route, search: "?branch=other&vista=compras" };
  await render();
  assert.ok(!shows("loading"), "network error must end loading");
  const retry = Array.from(document.querySelectorAll("button, [role=button], div")).find((node) => node.textContent === "Reintentar" && node.onclick);
  assert.ok(retry, "network error must offer retry");
  failSite = false;
  await act(async () => { retry.click(); await new Promise((resolve) => setTimeout(resolve, 0)); });
  assert.ok(shows("purchases"), "retry must recover");
  failBranches = true;
  route = { slug: "fallback-store", search: "?vista=galeria", hash: "#carousel" };
  await render();
  assert.ok(shows("gallery"), "branch lookup failure must fall back to storefront lookup");
  assert.ok(requestConfigs.every((config) => config?.signal && config?.timeout > 0), "requests must be cancellable and bounded");
  let finish;
  deferredSite = new Promise((resolve) => { finish = resolve; });
  route = { slug: "slow-store", search: "?vista=compras", hash: "#customer_sales" };
  await render();
  assert.ok(shows("loading"));
  deferredSite = null;
  route = { slug: "final-store", search: "?vista=galeria", hash: "#carousel" };
  await render();
  assert.ok(shows("gallery"));
  await act(async () => { finish({ data: { ok: false } }); });
  assert.ok(shows("gallery"), "stale response must not overwrite a newer store");
  await act(async () => root.unmount());
  console.log("OK: direct URLs, view switches, same-branch reload, network failure/retry, branch fallback and stale requests.");
})().catch(async (error) => { console.error(error); await act(async () => root.unmount()); process.exitCode = 1; });
