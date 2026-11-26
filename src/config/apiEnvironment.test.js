function loadClients(url) {
  jest.resetModules();
  global.__MTELMX_API_URL__ = url;
  return {
    admin: require("./axiosClient").default,
    pos: require("./axiosClientPOS").default,
    report: require("../utils/supportIncidentReporter").reportSupportIncident,
  };
}

afterEach(() => {
  localStorage.clear();
  delete global.__MTELMX_API_URL__;
});

const fakeAdapter = jest.fn();
beforeEach(() => {
  fakeAdapter.mockImplementation(async (config) => ({ data: {}, status: 200, headers: {}, config }));
});

test("blocks requests without an isolated base and rejects a production origin before transport", async () => {
  const missing = loadClients("");
  await expect(missing.pos.get("/pos/me", { adapter: fakeAdapter })).rejects.toThrow("VITE_API_URL");
  const isolated = loadClients("http://127.0.0.1:7820/api/");
  await expect(isolated.admin.get("https://mitiendaenlineamx.com.mx/api/user", { adapter: fakeAdapter })).rejects.toThrow("fuera de la API aislada");
  expect(fakeAdapter).not.toHaveBeenCalled();
  expect(() => loadClients("https://mitiendaenlineamx.com.mx/api/")).toThrow("API aislada");
});

test("uses separate admin and POS bearer tokens on the same isolated API", async () => {
  const { admin, pos } = loadClients("http://127.0.0.1:7820");
  localStorage.setItem("AUTH_TOKEN", "admin-test");
  localStorage.setItem("POS_TOKEN", "pos-test");
  const config = { adapter: fakeAdapter };
  const adminResponse = await admin.get("/user", config);
  const posResponse = await pos.post("/pos/me", null, config);
  expect(adminResponse.config.baseURL).toBe("http://127.0.0.1:7820/api/");
  expect(adminResponse.config.headers.Authorization).toBe("Bearer admin-test");
  expect(posResponse.config.headers.Authorization).toBe("Bearer pos-test");
});

test("does not report incidents over the network outside a production build", async () => {
  const { report } = loadClients("http://127.0.0.1:7820");
  const originalFetch = global.fetch;
  global.fetch = jest.fn();
  localStorage.setItem("AUTH_TOKEN", "admin-test");
  try {
    await report({ status: 500, data: { message: "Fixture" }, method: "GET", endpoint: "/services", tokenStorageKey: "AUTH_TOKEN" });
    expect(global.fetch).not.toHaveBeenCalled();
  } finally {
    global.fetch = originalFetch;
  }
});
jest.mock("axios", () => jest.requireActual("../../node_modules/axios/dist/browser/axios.cjs"));

