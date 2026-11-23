import axiosClient from "../../config/axiosClient";
import axiosClientPOS from "../../config/axiosClientPOS";
import { getBookingTickets } from "./tourService";

jest.mock("../../config/axiosClient", () => ({ defaults: { baseURL: "https://example.test/api/" }, get: jest.fn() }));
jest.mock("../../config/axiosClientPOS", () => ({ defaults: { baseURL: "https://example.test/api/" }, get: jest.fn() }));
beforeEach(() => jest.clearAllMocks());

test.each(["store", "pos"])("tickets use the authenticated %s branch endpoint, not the public token URL", async mode => {
  const client = mode === "store" ? axiosClient : axiosClientPOS;
  const pdf = new Blob(["pdf"], { type: "application/pdf" }); client.get.mockResolvedValue({ data: pdf });
  expect(await getBookingTickets({ mode, branchId: 2 }, 10)).toBe(pdf);
  expect(client.get).toHaveBeenCalledWith("/branches/2/bookings/10/tickets.pdf", { responseType: "blob", signal: undefined });
});

test("a login page is not treated as PDF", async () => {
  axiosClientPOS.get.mockResolvedValue({ data: new Blob(["<html>login</html>"], { type: "text/html" }) });
  await expect(getBookingTickets({ mode: "pos", branchId: 2 }, 10)).rejects.toThrow("No se pudieron generar");
});

test("expired tickets retain their HTTP 409 response", async () => {
  const error = { response: { status: 409, data: { message: "No vigente" } } };
  axiosClientPOS.get.mockRejectedValue(error);
  await expect(getBookingTickets({ mode: "pos", branchId: 2 }, 10)).rejects.toBe(error);
});
