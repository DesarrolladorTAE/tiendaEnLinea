import client from "../../config/axiosClient";
import { dynamicForms } from "./dynamicForms";
import { bookingEditActions, operationDay, operations, bookingActions, orderActions, operationError, readOperationPeriod } from "./serviceOperations";

jest.mock("../../config/axiosClient", () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn() }));
const branch = 12;
const signal = new AbortController().signal;
const response = (data) => ({ data });
const entity = (data) => response({ data });

beforeEach(() => jest.resetAllMocks());

test("agenda carga todas las páginas del intervalo antes de mostrar resultados", async () => {
  client.get.mockResolvedValueOnce(response({ current_page: 1, last_page: 2, total: 2, data: [{ id: 3 }] }));
  client.get.mockResolvedValueOnce(response({ current_page: 2, last_page: 2, total: 2, data: [{ id: 4 }] }));
  const query = { date_from: "2026-12-01", date_to: "2026-12-07", service_id: 8, resource_id: 3, status: "confirmed" };
  await expect(readOperationPeriod(branch, query, signal)).resolves.toEqual([{ id: 3 }, { id: 4 }]);
  expect(client.get).toHaveBeenNthCalledWith(2, "/branches/12/bookings", expect.objectContaining({ signal, params: { ...query, page: 2, per_page: 100 } }));
});

test("agenda rechaza registros duplicados por cambios de paginación", async () => {
  client.get.mockResolvedValueOnce(response({ current_page: 1, last_page: 2, total: 2, data: [{ id: 3 }] }));
  client.get.mockResolvedValueOnce(response({ current_page: 2, last_page: 2, total: 2, data: [{ id: 3 }] }));
  await expect(readOperationPeriod(branch, {}, signal)).rejects.toThrow("periodo cambió");
});

test("una consulta cancelada por cambio de sucursal descarta las páginas restantes", async () => {
  const controller = new AbortController();
  client.get.mockImplementationOnce(async () => { controller.abort(); return response({ current_page: 1, last_page: 2, total: 2, data: [{ id: 3 }] }); });
  await expect(readOperationPeriod(branch, {}, controller.signal)).rejects.toThrow();
  expect(client.get).toHaveBeenCalledTimes(1);
});

test("recorrido simulado de cliente y vehículo hasta inspección, cierre e historial", async () => {
  const context = { service_id: 8, customer_id: 14, vehicle_id: 81 };
  const draft = { ...context, booking_date: "2026-12-02", start_time: "09:00", idempotency_key: "fixture-cita-0001" };
  client.post
    .mockResolvedValueOnce(entity({ ...context, id: 21, status: "pending" }))
    .mockResolvedValueOnce(entity({ id: 21, status: "confirmed" }))
    .mockResolvedValueOnce(entity({ id: 77, booking_id: 21, visit_mileage: null }))
    .mockResolvedValueOnce(entity({ id: 77, booking_id: 21 }))
    .mockResolvedValueOnce(entity({ id: 77, status: { code: "in_progress" } }))
    .mockResolvedValueOnce(entity({ id: 901, status: "draft" }))
    .mockResolvedValueOnce(entity({ id: 901, status: "completed" }))
    .mockResolvedValueOnce(entity({ id: 77, status: { code: "completed" } }));
  client.patch
    .mockResolvedValueOnce(entity({ id: 77, resource_id: 6 }))
    .mockResolvedValueOnce(entity({ order: { id: 77, visit_mileage: 0 } }))
    .mockResolvedValueOnce(entity({ id: 901, answers: { result: "bien" } }));
  const booking = await operations.createBooking(branch, draft, signal);
  expect(bookingActions(booking.status)).toEqual({ confirm: true, arrival: false, convert: false });
  const confirmed = await operations.confirm(branch, booking.id, signal);
  expect(bookingActions(confirmed.status).convert).toBe(true);
  const order = await operations.convert(branch, booking.id, signal);
  expect((await operations.convert(branch, booking.id, signal)).id).toBe(order.id);
  expect(order.visit_mileage).toBeNull();
  await operations.resource(branch, order.id, 6, signal);
  expect((await operations.mileage(81, order.id, 0, signal)).order.visit_mileage).toBe(0);
  const started = await operations.start(branch, order.id, signal);
  expect(orderActions(started.status.code).complete).toBe(true);
  const form = await dynamicForms.start(order.id, 7, signal);
  await dynamicForms.save(order.id, form.id, { result: "bien" }, signal);
  await dynamicForms.complete(order.id, form.id, signal);
  await operations.complete(branch, order.id, signal);
  client.get.mockResolvedValueOnce(response({ data: { id: 77, history: [{ event_type: "completed" }] }, forms_progress: { required_pending: [] } }));
  expect((await operations.order(branch, order.id, signal)).data.history).toEqual([{ event_type: "completed" }]);
  expect(client.post.mock.calls.map(([url]) => url)).toEqual([
    "/branches/12/bookings", "/branches/12/bookings/21/confirm", "/branches/12/bookings/21/service-order",
    "/branches/12/bookings/21/service-order", "/branches/12/service-orders/77/start", "/service-orders/77/forms",
    "/service-orders/77/forms/901/complete", "/branches/12/service-orders/77/complete",
  ]);
  expect(client.patch).toHaveBeenNthCalledWith(2, "/vehicles/81/service-orders/77/mileage", { visit_mileage: 0 }, expect.objectContaining({ signal }));
});

test("atención tradicional, venta, próxima visita, documento térmico y cancelación conservan su alcance", async () => {
  client.post.mockResolvedValue(entity({ id: 77 }));
  client.get.mockResolvedValue(response({ ok: true, payload: { textBeforeQr: "Recibo ficticio" } }));
  await operations.createOrder(branch, { service_id: 4, customer_id: 14, vehicle_id: null, idempotency_key: "fixture-order-01" }, signal);
  await operations.sale(branch, 77, 410, signal);
  await operations.nextBooking(branch, 77, { booking_date: "2026-12-02", start_time: "11:00", idempotency_key: "fixture-next-01" }, signal);
  await operations.cancelOrder(branch, 77, "Solicitud del cliente", signal);
  await expect(operations.thermal(branch, 77, 58, signal)).resolves.toMatchObject({ ok: true });
  expect(client.post.mock.calls.map(([url]) => url)).toEqual([
    "/branches/12/service-orders", "/branches/12/service-orders/77/sale", "/branches/12/service-orders/77/next-booking", "/branches/12/service-orders/77/cancel",
  ]);
  expect(client.get).toHaveBeenCalledWith("/branches/12/service-orders/77/thermal", expect.objectContaining({ params: { paper_size: 58 }, signal }));
});

test("rechazos preservan mensajes de campo y diferencian acceso y contexto", () => {
  expect(operationError({ response: { status: 422, data: { errors: { start_time: ["Horario agotado."] } } } })).toBe("Horario agotado.");
  expect(operationError({ response: { status: 403 } })).toMatch(/acceso/);
  expect(operationError({ response: { status: 404 } })).toMatch(/sucursal/);
  expect(orderActions("completed").edit).toBe(false);
  expect(bookingActions("cancelled").convert).toBe(false);
});


test("la zona del backend determina la fecha inicial cerca de medianoche", () => {
  const instant = new Date("2026-11-27T04:00:00Z");
  expect(operationDay("America/Mexico_City", instant)).toBe("2026-11-26");
  expect(operationDay("UTC", instant)).toBe("2026-11-27");
});

test("edición, cancelación y nuevo horario usan el alcance y cuerpos de la cita", async () => {
  client.post.mockResolvedValue(entity({ id: 21, branch_id: 12 }));
  client.patch.mockResolvedValue(entity({ id: 21, branch_id: 12 }));
  const base = "/branches/12/bookings/21";
  const slot = { booking_date: "2026-12-02", start_time: "10:00" };
  await operations.editBooking(branch, 21, { notes: null, vehicle_id: 82 }, signal);
  await operations.reschedule(branch, 21, slot, signal);
  await operations.reschedule(branch, 21, { ...slot, resource_id: 6 }, signal);
  await operations.reschedule(branch, 21, { ...slot, resource_id: null }, signal);
  await operations.cancelBooking(branch, 21, "Solicitud del cliente", signal);
  expect(client.patch).toHaveBeenCalledWith(base, { notes: null, vehicle_id: 82 }, expect.objectContaining({ signal }));
  expect(client.post.mock.calls.map(([path, body]) => [path, body])).toEqual([
    [base + "/reschedule", slot],
    [base + "/reschedule", { ...slot, resource_id: 6 }],
    [base + "/reschedule", { ...slot, resource_id: null }],
    [base + "/cancel", { reason: "Solicitud del cliente" }],
  ]);
  expect(bookingEditActions("arrived")).toEqual({ reschedule: false, edit: true, cancel: true });
  expect(bookingEditActions("completed")).toEqual({ reschedule: false, edit: false, cancel: false });
});

test("un rechazo de cupo se devuelve al editor sin convertirlo en un éxito", async () => {
  const error = { response: { status: 422, data: { errors: { start_time: ["Horario agotado."] } } } };
  client.post.mockRejectedValue(error);
  await expect(operations.reschedule(branch, 21, { booking_date: "2026-12-02", start_time: "10:00" }, signal)).rejects.toBe(error);
});
