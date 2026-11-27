import admin from "../../config/axiosClient";
import pos from "../../config/axiosClientPOS";
import { operations, orderPdf } from "./serviceOperations";
import { dynamicForms, formPdfPath } from "./dynamicForms";
import { vehicleDocumentPath, vehicleRecords } from "./vehicleRecords";
import { fetchFinancialReport, financialExportPath } from "./financialReports";
import { resolveSaleLink, vehicleSearchParams } from "../../utils/posVehicle";
import { hasBranchAction, vehicleCatalogAccess } from "../../utils/branchCatalogAccess";

jest.mock("../../config/axiosClient", () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn() }));
jest.mock("../../config/axiosClientPOS", () => ({ get: jest.fn(), post: jest.fn() }));

const branch = 12, store = 3, vehicle = 81, customer = 14, booking = 21, orderId = 77, sale = 901;
const orderPath = `/branches/${branch}/service-orders/${orderId}`;
const bookingPath = `/branches/${branch}/bookings/${booking}`;
const formsPath = `/service-orders/${orderId}/forms`;
const signal = new AbortController().signal;
const entity = (record) => ({ data: { data: record } });

beforeEach(() => jest.resetAllMocks());

test("recorrido simulado de expediente, cita, orden e inspección hasta enlace y reporte con clientes separados", async () => {
  const order = { id: orderId, branch_id: branch, store_id: store, customer_id: customer, vehicle_id: vehicle, sale_id: null };
  const draft = { id: 7, status: "draft", answers: { result: "bien" } };
  const fixtures = {
    "POST /clientes/quick-store": { data: { cliente: { id: customer } } },
    "POST /vehicles": entity({ id: vehicle }),
    "POST /branches/12/bookings": entity({ id: booking, status: "pending" }),
    [`POST ${bookingPath}/confirm`]: entity({ id: booking, status: "confirmed" }),
    [`POST ${bookingPath}/reschedule`]: entity({ id: booking, status: "confirmed", start_time: "10:00" }),
    [`POST ${bookingPath}/arrival`]: entity({ id: booking, status: "arrived" }),
    [`POST ${bookingPath}/service-order`]: entity(order),
    [`PATCH ${orderPath}/resource`]: entity({ ...order, resource_id: 6 }),
    [`PATCH /vehicles/${vehicle}/service-orders/${orderId}/mileage`]: entity({ order_id: orderId, visit_mileage: 0 }),
    [`POST ${orderPath}/start`]: entity({ ...order, status: { code: "in_progress" } }),
    [`POST ${formsPath}`]: entity(draft),
    [`PATCH ${formsPath}/7`]: entity(draft),
    [`GET ${formsPath}/7`]: entity(draft),
    [`POST ${formsPath}/7/complete`]: entity({ ...draft, status: "completed" }),
    [`POST ${orderPath}/complete`]: entity({ ...order, sale_id: sale, status: { code: "completed" } }),
    [`POST ${orderPath}/next-booking`]: entity({ id: 22 }),
    "GET /reports/admin/weekly": { data: { kind: "week", report: { summary: { gross_profit: null } } } },
    "GET /reports/admin/monthly": { data: { kind: "month", report: { totals: { gross_profit: null } } } },
  };
  let bookingResponseLost = false;
  for (const method of ["get", "post", "patch"]) admin[method].mockImplementation(async (path) => {
    if (method === "post" && path === "/branches/12/bookings" && !bookingResponseLost) {
      bookingResponseLost = true;
      throw new Error("Respuesta de cita perdida");
    }
    const fixture = fixtures[`${method.toUpperCase()} ${path}`];
    if (!fixture) throw Error(`Sin respuesta simulada para ${method} ${path}`);
    return fixture;
  });
  pos.get.mockImplementation(async (path) => {
    if (path === "/products/search-by-vehicle") return { data: { data: [{ id: 23, compatibility_status: "compatible" }] } };
    if (path === orderPath) return entity(order);
    throw Error("Ruta POS simulada no reconocida.");
  });
  pos.post.mockRejectedValueOnce(new Error("Respuesta de asociación perdida")).mockResolvedValueOnce(entity({ ...order, sale_id: sale }));

  const createdCustomer = (await vehicleRecords.createCustomer({ nombre_alias: "Fixture", telefono: "0000000000" }, signal)).data.cliente.id;
  const createdVehicle = (await vehicleRecords.create({ customer_id: createdCustomer, vehicle_brand_id: 4, vehicle_model_id: 9 }, signal)).data.data.id;
  const bookingDraft = { service_id: 8, customer_id: createdCustomer, vehicle_id: createdVehicle,
    booking_date: "2026-12-02", start_time: "09:00", idempotency_key: "fixture-phase8" };
  await expect(operations.createBooking(branch, bookingDraft, signal)).rejects.toThrow("cita perdida");
  const first = await operations.createBooking(branch, bookingDraft, signal);
  expect(admin.post.mock.calls.filter(([path]) => path === "/branches/12/bookings").map(([,body]) => body))
    .toEqual([bookingDraft, bookingDraft]);
  await operations.confirm(branch, first.id, signal);
  await operations.reschedule(branch, first.id, { booking_date: "2026-12-02", start_time: "10:00" }, signal);
  await operations.arrival(branch, first.id, signal);
  const createdOrder = await operations.convert(branch, first.id, signal);
  expect((await operations.convert(branch, first.id, signal)).id).toBe(createdOrder.id);
  await operations.resource(branch, createdOrder.id, 6, signal);
  await operations.mileage(createdVehicle, createdOrder.id, 0, signal);
  await operations.start(branch, createdOrder.id, signal);
  const form = await dynamicForms.start(createdOrder.id, 5, signal);
  await dynamicForms.save(createdOrder.id, form.id, draft.answers, signal);
  expect((await dynamicForms.submission(createdOrder.id, form.id, signal)).answers).toEqual(draft.answers);
  await dynamicForms.complete(createdOrder.id, form.id, signal);

  const params = vehicleSearchParams({ brand_id: "4", sku: "00023" }, { service_order_id: createdOrder.id }, 1);
  await pos.get("/products/search-by-vehicle", { params, signal });
  expect(params).toMatchObject({ service_order_id: 77, sku: "00023" });
  expect(params).not.toHaveProperty("brand_id");
  const reference = { store, branch, order: createdOrder.id, sale };
  await expect(resolveSaleLink(pos, reference, signal)).rejects.toThrow("perdida");
  await expect(resolveSaleLink(pos, reference, signal)).resolves.toBe("linked");
  expect(pos.post.mock.calls.map(([path, body]) => [path, body])).toEqual([
    [orderPath + "/sale", { sale_id: sale }], [orderPath + "/sale", { sale_id: sale }],
  ]);
  expect((await operations.complete(branch, createdOrder.id, signal)).status.code).toBe("completed");
  await operations.nextBooking(branch, createdOrder.id, { booking_date: "2026-12-09", start_time: "10:00", idempotency_key: "fixture-next" }, signal);
  expect(orderPdf(branch, createdOrder.id)).toBe(orderPath + "/document.pdf");
  expect(formPdfPath(branch, createdOrder.id, form.id)).toContain("/forms/7/document.pdf");
  expect(vehicleDocumentPath(branch, createdVehicle, "label.pdf")).toContain("/vehicles/81/label.pdf");
  const week = { from: "2026-11-02", to: "2026-11-08", branch_id: branch };
  expect((await fetchFinancialReport("weekly", week, signal)).report.summary.gross_profit).toBeNull();
  expect((await fetchFinancialReport("monthly", { year: 2026, month: 11, branch_id: branch }, signal)).report.totals.gross_profit).toBeNull();
  expect(financialExportPath("weekly", "excel", { ...week, page: 2 })).not.toContain("page");
  expect(admin.get).not.toHaveBeenCalledWith("/products/search-by-vehicle", expect.anything());
});

test("matriz de capacidades independientes y fallback solo con respuesta legada", () => {
  const grant = { available: true, enabled: true, visible: true, authorization: { read: true, write: true, capture: true } };
  const legacy = { vehicle_feature_available: true, vehicle_compatibilities_enabled: true };
  expect(vehicleCatalogAccess(legacy, 566)).toEqual({ read: true, write: true });
  const partial = { ...legacy, capabilities: {} };
  expect(vehicleCatalogAccess(partial, 566)).toEqual({ read: false, write: false });
  const records = { capabilities: { scope: { actor: "store" }, vehicle_records: grant } };
  expect(hasBranchAction(records, "vehicle_records", "read")).toBe(true);
  expect(hasBranchAction(records, "service_forms", "capture")).toBe(false);
  expect(vehicleCatalogAccess(records, 566)).toEqual({ read: false, write: false });
  const forms = { capabilities: { scope: { actor: "store" }, service_forms: grant } };
  expect(hasBranchAction(forms, "service_forms", "capture")).toBe(true);
  expect(hasBranchAction(forms, "vehicle_records", "read")).toBe(false);
  const terminal = { capabilities: { scope: { actor: "pos" }, vehicle_catalog: grant } };
  expect(vehicleCatalogAccess(terminal, 566)).toEqual({ read: false, write: false });
});

