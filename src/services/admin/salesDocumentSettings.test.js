import client from "../../config/axiosClient";
import { configChanges, defaultConfig, documentSettingsService, readConfig, validateConfig, validateLogo } from "./salesDocumentSettings";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn(), put: jest.fn(), post: jest.fn(), delete: jest.fn() } }));
beforeEach(() => jest.clearAllMocks());

test("reads effective config without turning string false values on", () => {
  expect(readConfig({ config: { show_logo: "0", mostrar_iva: false, paper_size: 58 } }, "ticket")).toMatchObject({ show_logo: false, mostrar_iva: false, paper_size: "58" });
  expect(() => readConfig({ message: "unavailable" }, "ticket")).toThrow();
});

test("saves only edited fields for the selected type/channel without read-only logo or transport leakage", () => {
  const selection = { type: "nota_venta", channel: "pdf", branchId: "123" };
  documentSettingsService.save(selection, { title: "Mi nota", show_sku: false, logo: "private.png", logo_url: "preview", printer_ip: "1.2.3.4" });
  expect(client.put).toHaveBeenCalledWith("/document-settings/nota_venta/pdf", { config: { title: "Mi nota", show_sku: false } }, { params: { branch_id: "123" } });
  expect(configChanges({ printer_port: "9100", chars_per_line: "32", paper_size: "58" }, "ticket", "payload")).toEqual({ printer_port: 9100, chars_per_line: 32, paper_size: "58" });
});

test("keeps logos and store defaults scoped without a branch query for general config", () => {
  const scope = { type: "comprobante", channel: "payload", branchId: "" };
  documentSettingsService.get(scope);
  expect(client.get).toHaveBeenCalledWith("/document-settings/comprobante/payload", { params: {} });
  const file = new File(["logo"], "logo.png", { type: "image/png" });
  documentSettingsService.uploadLogo(scope, file);
  expect(client.post.mock.calls[0][0]).toBe("/document-settings/comprobante/payload/logo");
  expect(client.post.mock.calls[0][1].get("logo")).toBe(file);
  documentSettingsService.deleteLogo(scope);
  expect(client.delete).toHaveBeenCalledWith("/document-settings/comprobante/payload/logo", { params: {} });
});

test("validates paper and printer fields only for their supported combinations", () => {
  expect(validateConfig(defaultConfig("nota_venta"), "nota_venta", "pdf")).toEqual({});
  expect(validateConfig({ ...defaultConfig("ticket"), chars_per_line: "abc" }, "ticket", "payload")).toHaveProperty("chars_per_line");
  expect(validateConfig({ ...defaultConfig("ticket"), printer_ip: "bad" }, "ticket", "pdf")).not.toHaveProperty("printer_ip");
  expect(validateConfig({ ...defaultConfig("nota_venta"), paper_size: "80", accent_color: "red" }, "nota_venta", "pdf")).toMatchObject({ paper_size: expect.any(String), accent_color: expect.any(String) });
});

test("rejects unsupported and oversized logos before uploading", async () => {
  await expect(validateLogo(new File(["svg"], "logo.svg", { type: "image/svg+xml" }))).rejects.toThrow("PNG o JPG");
  await expect(validateLogo(new File([new Uint8Array(2 * 1024 * 1024 + 1)], "logo.jpg", { type: "image/jpeg" }))).rejects.toThrow("2 MB");
});
