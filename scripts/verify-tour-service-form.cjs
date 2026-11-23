const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { pathToFileURL } = require("node:url");
const { JSDOM } = require("jsdom");

async function main() {
  const rootDir = path.resolve(__dirname, "..");
  const helpers = await import(pathToFileURL(path.join(rootDir, "src/components/tours/tourFormData.mjs")).href);
  const styles = await import(pathToFileURL(path.join(rootDir, "src/components/tours/tourFormStyles.mjs")).href);
  const departures = [{ id: 1, tour_route_id: 10 }, { id: 2, tour_route: { id: 10, name: "Ruta compartida" } }, { id: 3, route: { id: 20 } }, { id: 4 }];
  assert.deepEqual(helpers.usedTourRoutes(departures, []).map((route) => route.departures.length), [2, 1]);
  const stops = helpers.tourStopRows([
    { id: 2, name: "Pilares", reference: "Tollocan", pivot: { stop_order: 2, default_departure_time: "05:15:00" } },
    { tour_stop_id: 1, stop: { id: 1, name: "Rectoría", reference: "Frente a Rectoría" }, stop_order: 1, default_departure_time: "05:00:00" },
  ]);
  assert.equal(stops[0].name, "Rectoría");
  assert.equal(stops[1].time, "05:15:00");
  assert.equal(stops[1].reference, "Tollocan");
  assert.deepEqual(helpers.tourStopRows([{ name: "B" }, { name: "A" }]).map((row) => row.name), ["B", "A"]);

  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: "http://localhost", pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  Object.defineProperty(global, "navigator", { value: dom.window.navigator, configurable: true });
  for (const key of ["HTMLElement", "DocumentFragment", "Event", "MouseEvent"]) global[key] = dom.window[key];
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const React = require("react");
  const { createRoot } = require("react-dom/client");
  const { createPortal } = require("react-dom");
  const babel = require("@babel/core");
  const compile = (file, mocks) => {
    const filename = path.join(rootDir, file);
    const compiled = new Module(filename, module);
    compiled.filename = filename; compiled.paths = Module._nodeModulePaths(path.dirname(filename));
    compiled.require = (id) => id === "./tourFormStyles.mjs" ? styles : Object.hasOwn(mocks, id) ? mocks[id] : Module.prototype.require.call(compiled, id);
    const { code } = babel.transformSync(fs.readFileSync(filename, "utf8"), { filename, presets: ["@babel/preset-react"], plugins: ["@babel/plugin-transform-modules-commonjs"], babelrc: false, configFile: false });
    compiled._compile(code, filename);
    return compiled.exports;
  };
  const calls = [];
  let stopFailure = false;
  let saved = 0;
  let parentSubmits = 0;
  const api = {
    getDepartures: async (context, { page }) => {
      calls.push(["departures", page, context.serviceId]);
      return { data: { rows: page === 1 ? [departures[0]] : [departures[1]], lastPage: 2 } };
    },
    getTourRoute: async (context, id) => {
      calls.push(["route", id]);
      return { data: { route: { id, name: "Ruta compartida", origin: "Toluca", destination: "León" } } };
    },
    getTourRoutes: async () => [{ id: 10, name: "Ruta compartida" }],
    getRouteStops: async (context, id) => {
      calls.push(["stops", id]);
      if (stopFailure) throw new Error("Consulta de paradas fallida");
      return [{ id: 1, name: "Rectoría", pivot: { default_departure_time: "05:00", stop_order: 1 } }];
    },
    getDeparture: async () => ({ data: { departure: { id: 1, tour_route_id: 10 } } }),
  };
  const RouteEditor = compile("src/components/tours/TourRouteEditor.jsx", {
    "../../services/tours/tourService": api,
    "../../utils/alerts": { showConfirm: async () => true },
    "./departureUtils": { departureError: (error) => error.message },
    "./tourFormData.mjs": helpers,
    "./TourEntityDialog": () => null,
    "./TourRouteStopDialog": () => null,
  }).default;
  const filename = path.join(rootDir, "src/components/tours/ServiceTourSection.jsx");
  const compiled = new Module(filename, module);
  compiled.filename = filename; compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  const mocks = {
    "react-router-dom": { useNavigate: () => () => {} },
    "../../services/tours/tourService": api,
    "./tourFormData.mjs": helpers,
    "./departureUtils": { departureCollection: (data) => data, departureRecord: (data) => data.departure, departureError: (error) => error.message },
    "./DepartureCard": ({ departure }) => React.createElement("div", null, `Salida ${departure.id}`),
    "./TourRouteEditor": RouteEditor,
    "./TourEntityDialog": () => null,
    "./DepartureFormDialog": ({ onSaved }) => createPortal(React.createElement("form", { id: "departure-dialog", onSubmit: (event) => { event.preventDefault(); saved++; onSaved(); } }, React.createElement("button", { type: "submit" }, "Guardar salida")), document.body),
  };
  compiled.require = (id) => id === "./tourFormStyles.mjs" ? styles : Object.hasOwn(mocks, id) ? mocks[id] : Module.prototype.require.call(compiled, id);
  const { code } = babel.transformSync(fs.readFileSync(filename, "utf8"), { filename, presets: ["@babel/preset-react"], plugins: ["@babel/plugin-transform-modules-commonjs"], babelrc: false, configFile: false });
  compiled._compile(code, filename);
  const Section = compiled.exports.default;
  const root = createRoot(document.getElementById("root"));
  const render = async (props) => React.act(async () => root.render(React.createElement("form", { onSubmit: (event) => { event.preventDefault(); parentSubmits++; } }, React.createElement(Section, { branchId: 7, serviceId: 5, ...props }))));
  const click = async (label) => {
    const button = [...document.querySelectorAll("button")].find((item) => item.textContent === label);
    assert.ok(button, label);
    await React.act(async () => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  };
  await render();
  assert.deepEqual(calls.filter(([type]) => type === "departures").map(([, page]) => page), [1, 2]);
  assert.equal(calls.filter(([type]) => type === "stops").length, 1, "Shared routes load stops only once");
  assert.equal(calls.filter(([type]) => type === "route").length, 1, "Shared routes load detail only once");
  assert.ok(document.body.textContent.includes("Toluca → León"));
  assert.ok(document.body.textContent.includes("05:00"));
  assert.equal(document.querySelectorAll("li").length, 1, "Shared stops render once");
  await click("Nueva salida");
  await React.act(async () => document.getElementById("departure-dialog").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  assert.equal(saved, 1);
  assert.equal(parentSubmits, 0, "Portal submit must not submit Service");
  assert.equal(calls.filter(([type]) => type === "stops").length, 2, "Saving refreshes route stops");
  stopFailure = true;
  await click("Actualizar rutas y paradas");
  assert.ok(document.body.textContent.includes("Consulta de paradas fallida"));
  assert.ok(!document.body.textContent.includes("Esta ruta no tiene paradas registradas"));
  const beforeNew = calls.length;
  await render({ serviceId: undefined });
  assert.equal(calls.length, beforeNew, "Unsaved services must not request departures");
  assert.ok(document.body.textContent.includes("Guarda el servicio"));
  await React.act(async () => root.unmount());

  // Use the real API wrappers and dialogs against an isolated fake HTTP client.
  // No production calls or credentials are used.
  const httpCalls = [];
  let rejectWrite = false;
  const http = {
    defaults: { baseURL: "https://example.invalid/api/" },
    get: async (url, config) => {
      httpCalls.push({ method: "GET", url, config });
      if (url.endsWith("/tour-routes/10/stops")) return { data: { stops: [{ id: 1, name: "Rectoría", pivot: { stop_order: 1 } }] } };
      if (url.endsWith("/tour-stops/1")) return { data: { stop: { id: 1, name: "Rectoría", reference: "Referencia anterior" } } };
      if (url.endsWith("/tour-stops")) return { data: { stops: { data: [{ id: 1, name: "Rectoría" }, { id: 2, name: "Pilares" }], last_page: 1 } } };
      throw new Error(`Unexpected GET ${url}`);
    },
    post: async (url, data) => {
      httpCalls.push({ method: "POST", url, data });
      if (rejectWrite) throw { response: { status: 422, data: { message: "Revisa los datos", errors: { name: ["Nombre inválido"] } } } };
      return { data: { ...(url.endsWith("/tour-routes") ? { route: { ...data, id: 30 } } : url.endsWith("/tour-stops") ? { stop: { ...data, id: 2 } } : {}), message: "Guardado" } };
    },
    put: async (url, data) => { httpCalls.push({ method: "PUT", url, data }); return { data: { message: "Actualizado" } }; },
    delete: async (url) => { httpCalls.push({ method: "DELETE", url }); return { data: { message: "Retirada" } }; },
  };
  const realApi = compile("src/services/tours/tourService.js", { "../../config/axiosClient": http, "../../config/axiosClientPOS": http });
  const context = { branchId: 7, serviceId: 5, mode: "store" };
  await realApi.createTourRoute(context, { name: "Ruta", origin: "Toluca", store_id: 999, service_id: 888 });
  assert.deepEqual(httpCalls.at(-1).data, { name: "Ruta", origin: "Toluca" });
  await realApi.updateTourStop(context, 2, { reference: "Nueva referencia", tour_route_id: 10, stop_order: 3 });
  assert.deepEqual(httpCalls.at(-1).data, { reference: "Nueva referencia" });
  assert.throws(() => realApi.updateTourRouteStop({ ...context, mode: "pos" }, 10, 1, { stop_order: 2 }), /permiso/);
  const routeStops = await realApi.getRouteStops(context, 10);
  assert.equal(routeStops.length, 1);
  assert.ok(!httpCalls.at(-1).config.params, "Route stops endpoint is not paginated");

  const sharedMocks = { "../../services/tours/tourService": realApi, "./tourFormData.mjs": helpers,
    "./departureUtils": { departureError: (error) => error.response?.data?.message || error.message } };
  const EntityDialog = compile("src/components/tours/TourEntityDialog.jsx", sharedMocks).default;
  const AssociationDialog = compile("src/components/tours/TourRouteStopDialog.jsx", sharedMocks).default;
  const FullRouteEditor = compile("src/components/tours/TourRouteEditor.jsx", { ...sharedMocks,
    "../../utils/alerts": { showConfirm: async () => true },
    "./TourEntityDialog": EntityDialog, "./TourRouteStopDialog": AssociationDialog }).default;
  const writeRoot = createRoot(document.getElementById("root"));
  const renderWrite = async (element) => React.act(async () => writeRoot.render(element));
  const setInput = async (label, value) => {
    const labelNode = [...document.querySelectorAll("label")].find((node) => node.textContent.replace(/\s*\*$/, "") === label);
    assert.ok(labelNode, `Missing label ${label}`);
    const input = document.getElementById(labelNode.htmlFor);
    const proto = input.tagName === "TEXTAREA" ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(proto, "value").set.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };
  const submitDialog = async () => React.act(async () => document.querySelector('[role="dialog"] form, form[role="dialog"]').dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  let entityResult;
  const onEntitySaved = (record) => { entityResult = record; };
  await renderWrite(React.createElement(EntityDialog, { context, entity: "route", onClose: () => {}, onSaved: onEntitySaved }));
  await setInput("Nombre", "Toluca - León");
  rejectWrite = true;
  await submitDialog();
  assert.ok(document.body.textContent.includes("Revisa los datos"));
  assert.equal(entityResult, undefined, "Validation failure must not close the dialog");
  rejectWrite = false;
  await submitDialog();
  assert.equal(entityResult.id, 30);
  assert.equal(httpCalls.at(-1).data.name, "Toluca - León");
  await renderWrite(React.createElement(EntityDialog, { key: "new-stop", context, entity: "stop", onClose: () => {}, onSaved: onEntitySaved }));
  await setInput("Nombre", "Pilares");
  await setInput("Referencia", "Sobre Tollocan");
  await submitDialog();
  assert.equal(entityResult.id, 2);
  assert.equal(httpCalls.at(-1).data.reference, "Sobre Tollocan");
  assert.equal(httpCalls.at(-1).data.lat, null);

  const testRoute = { id: 10, name: "Ruta", departures: [{ id: 1 }], stops: helpers.tourStopRows([
    { id: 1, name: "Rectoría", pivot: { stop_order: 1, default_departure_time: "05:00:00" } },
  ]) };
  let associationSaved = 0;
  await renderWrite(React.createElement(AssociationDialog, { context, route: testRoute, initialStop: entityResult, onClose: () => {}, onSaved: () => { associationSaved++; } }));
  await setInput("Hora de abordaje", "05:15");
  await submitDialog();
  assert.equal(associationSaved, 1);
  assert.equal(httpCalls.at(-1).url, "/branches/7/tour-routes/10/stops");
  assert.deepEqual(httpCalls.at(-1).data, { tour_stop_id: 2, stop_order: 2, default_departure_time: "05:15", boarding_minutes: 0, price_adjustment: 0 });
  await renderWrite(React.createElement(AssociationDialog, { key: "edit-association", context, route: testRoute, stop: testRoute.stops[0], onClose: () => {}, onSaved: () => { associationSaved++; } }));
  await setInput("Minutos de abordaje", "20");
  await submitDialog();
  assert.equal(httpCalls.at(-1).method, "PUT");
  assert.equal(httpCalls.at(-1).data.boarding_minutes, 20);
  assert.ok(!("tour_stop_id" in httpCalls.at(-1).data));

  const routeWithTwoStops = { ...testRoute, stops: [...testRoute.stops, ...helpers.tourStopRows([{ id: 2, name: "Pilares", pivot: { stop_order: 2 } }])] };
  let refreshes = 0;
  await renderWrite(React.createElement(FullRouteEditor, { context, route: routeWithTwoStops, onChanged: () => { refreshes++; } }));
  const beforeMove = httpCalls.length;
  const upButton = document.querySelector('button[aria-label="Subir Pilares"]');
  await React.act(async () => upButton.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  assert.equal(httpCalls.length, beforeMove + 1, "Reordering must send exactly one PUT");
  assert.deepEqual(httpCalls.at(-1), { method: "PUT", url: "/branches/7/tour-routes/10/stops/2", data: { stop_order: 1 } });
  assert.equal(refreshes, 1);
  await click("Quitar de la ruta");
  assert.equal(httpCalls.at(-1).method, "DELETE");
  assert.equal(httpCalls.at(-1).url, "/branches/7/tour-routes/10/stops/1");
  assert.ok(!httpCalls.some((call) => call.method === "DELETE" && /\/tour-stops\//.test(call.url)), "Never delete a global stop");
  assert.equal(refreshes, 2);
  await click("Editar parada");
  assert.ok(document.body.textContent.includes("afecta a todas ellas"));
  await setInput("Referencia", "Referencia actualizada");
  await submitDialog();
  assert.equal(httpCalls.at(-1).url, "/branches/7/tour-stops/1");
  assert.equal(httpCalls.at(-1).data.reference, "Referencia actualizada");
  assert.ok(!("stop_order" in httpCalls.at(-1).data));
  assert.ok(!("default_departure_time" in httpCalls.at(-1).data));
  await click("Editar ruta");
  await setInput("Origen", "Toluca centro");
  await submitDialog();
  assert.equal(httpCalls.at(-1).url, "/branches/7/tour-routes/10");
  assert.equal(httpCalls.at(-1).data.origin, "Toluca centro");
  assert.equal(refreshes, 4);
  await React.act(async () => writeRoot.unmount());
  dom.window.close();
  console.log("Tours: reads, shared routes, dialogs, validation errors, create/update payloads, single-PUT ordering, relationship-only removal and refresh passed.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
