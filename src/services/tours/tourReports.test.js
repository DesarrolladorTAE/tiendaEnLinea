import axiosClient from "../../config/axiosClient";
import axiosClientPOS from "../../config/axiosClientPOS";
import { getTourHistoryReport, getManifestReport, downloadManifest } from "./tourService";

jest.mock("../../config/axiosClient", () => ({ defaults: { baseURL: "https://example.test/api/" }, get: jest.fn() }));
jest.mock("../../config/axiosClientPOS", () => ({ defaults: { baseURL: "https://example.test/api/" }, get: jest.fn() }));
beforeEach(() => { jest.clearAllMocks(); });

test.each(["store", "pos"])("history HTML uses authenticated %s client and all filtered results", async mode => {
  const client = mode === "store" ? axiosClient : axiosClientPOS;
  client.get.mockResolvedValue({ data: "<html><table><tr><td>Ana</td></tr></table></html>" });
  const html = await getTourHistoryReport({ mode, branchId: 2, serviceId: 9 }, { payment_status: "partial", departure_id: 45, search: "Ana", page: 3, per_page: 16 });
  expect(html).toContain("<table>");
  expect(client.get).toHaveBeenCalledWith("/branches/2/tours/services/9/history", {
    params: { payment_status: "partial", departure_id: 45, search: "Ana", format: "html" }, responseType: "text", signal: undefined,
  });
});

test("manifest HTML includes public reservations unless an origin filter is selected", async () => {
  axiosClientPOS.get.mockResolvedValue({ data: "<table></table>" });
  await getManifestReport({ mode: "pos", branchId: 2, departureId: 45 });
  expect(axiosClientPOS.get).toHaveBeenCalledWith("/branches/2/tours/departures/45/manifest", expect.objectContaining({ params: { format: "html" } }));
});

test.each(["pdf", "xlsx"])("history %s download keeps applied filters and the correct filename", async format => {
  jest.useFakeTimers();
  URL.createObjectURL = jest.fn(() => "blob:report"); URL.revokeObjectURL = jest.fn();
  const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
    expect(this.download).toBe(`tour-9-historial.${format}`);
    expect(this.href).toBe("blob:report");
  });
  axiosClient.get.mockResolvedValue({ data: new Blob(["report"], { type: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }) });
  try {
    await getTourHistoryReport({ mode: "store", branchId: 2, serviceId: 9 }, { payment_status: "partial", date_from: "2026-11-01", pos_location_id: 8, page: 2 }, format);
    expect(axiosClient.get).toHaveBeenCalledWith("/branches/2/tours/services/9/history", expect.objectContaining({ responseType: "blob", params: { payment_status: "partial", date_from: "2026-11-01", pos_location_id: 8, format } }));
    expect(click).toHaveBeenCalledTimes(1);
    jest.runAllTimers(); expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:report");
  } finally { click.mockRestore(); jest.useRealTimers(); }
});

test("HTML login pages and failed downloads are reported rather than displayed as reports", async () => {
  axiosClient.get.mockResolvedValue({ data: "<html><form>Login</form></html>" });
  await expect(getTourHistoryReport({ mode: "store", branchId: 2, serviceId: 9 })).rejects.toThrow("No se pudo cargar");
  axiosClient.get.mockResolvedValue({ data: new Blob(["<html>Login</html>"], { type: "text/html" }) });
  await expect(downloadManifest({ mode: "store", branchId: 2, departureId: 45 }, undefined, "pdf")).rejects.toThrow("no generó");
});
