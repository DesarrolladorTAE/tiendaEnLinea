import client from "../../config/axiosClient";
import { buildServiceFormData, serviceService } from "./serviceService";
import { resourceService } from "./resourceService";
import { bookingDraft, bookingPayload, validateBooking, validateWeekly, weeklyDraft, weeklyPayload } from "../../components/services/serviceSchedule";

jest.mock("../../config/axiosClient", () => ({ __esModule: true, default: {
  get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
} }));

const firstShift = { id: 1, weekday: 1, is_enabled: true, start_time: "09:00:00", end_time: "13:00:00", capacity_override: null };
const secondShift = { id: 2, weekday: 1, is_enabled: true, start_time: "14:00:00", end_time: "18:00:00", capacity_override: 2 };
const fixture = {
  id: 8, branch_id: 12, service_id: 45, booking_type: "appointment", is_active: true,
  duration_minutes: 60, slot_interval_minutes: 30, capacity_per_slot: 2, capacity_per_day: 12,
  min_advance_minutes: 60, max_advance_days: 30, config: { buffer_minutes: 10 },
  requires_confirmation: false, weekly_schedules: [firstShift, secondShift],
  schedule_exceptions: [{ id: 4, date: "2026-12-25", type: "closed", reason: "Festivo", start_time: null, end_time: null }],
};

beforeEach(() => jest.clearAllMocks());

test.each(["none", "optional", "required"])("sends %s as a top-level field without replacing config", (requirement) => {
  const fields = { name: "Inspección", service_type: "workshop", base_price: 350,
    vehicle_requirement: requirement, config: { forms: [{ template_id: 7 }], unrelated: true },
    booking_type: "appointment", images: [new File(["x"], "service.png", { type: "image/png" })] };
  const body = buildServiceFormData(fields);
  expect(body.get("vehicle_requirement")).toBe(requirement);
  expect(body.get("images[]").name).toBe("service.png");
  expect(body.has("config")).toBe(false);
  expect(body.has("booking_type")).toBe(false);
});

test("uses multipart update and leaves the stored vehicle requirement alone when omitted", () => {
  serviceService.update(12, 45, { name: "Inspección", is_active: false, delete_image_ids: [3], primary_image_id: 4 });
  const [route, body] = client.post.mock.calls[0];
  expect(route).toBe("/branches/12/services/45");
  expect(body.get("_method")).toBe("PUT");
  expect(body.get("is_active")).toBe("0");
  expect(body.get("delete_image_ids[]")).toBe("3");
  expect(body.get("primary_image_id")).toBe("4");
  expect(body.has("vehicle_requirement")).toBe(false);
});

test("preserves weekly rows and exceptions while editing one agenda setting", () => {
  const draft = { ...bookingDraft(fixture, null), max_advance_days: "45" };
  expect(validateBooking(draft)).toEqual({});
  serviceService.saveBookingConfig(12, 45, bookingPayload(draft));
  const [route, payload] = client.put.mock.calls[0];
  expect(route).toBe("/branches/12/services/45/booking-config");
  expect(payload.max_advance_days).toBe(45);
  expect(payload.weekly_schedules).toEqual([
    { weekday: 1, is_enabled: true, start_time: "09:00", end_time: "13:00", capacity_override: null },
    { weekday: 1, is_enabled: true, start_time: "14:00", end_time: "18:00", capacity_override: 2 },
  ]);
  expect(payload.exceptions[0]).toMatchObject({ date: "2026-12-25", type: "closed", reason: "Festivo" });
  expect(payload).not.toHaveProperty("config");
  expect(payload).not.toHaveProperty("booking_type");
});

test("rejects invalid agenda limits and windows and accepts adjacent weekly shifts", () => {
  const draft = bookingDraft(fixture);
  draft.weekly_schedules[1].start_time = "13:00";
  expect(validateBooking(draft)).toEqual({});
  draft.weekly_schedules[1].start_time = "12:59";
  draft.capacity_per_slot = 1001;
  draft.exceptions[0].type = "open";
  expect(validateBooking(draft)).toEqual(expect.objectContaining({
    "weekly_schedules.1.start_time": expect.any(String), capacity_per_slot: expect.any(String),
    "exceptions.0.start_time": expect.any(String), "exceptions.0.end_time": expect.any(String),
  }));
});

test("uses distinct resource, availability and form contracts", () => {
  const association = { resource_id: 7, duration_override: 45, price_override: null, is_active: true };
  serviceService.associateResource(12, 45, association);
  serviceService.updateResource(12, 45, 7, { duration_override: null });
  serviceService.removeResource(12, 45, 7);
  serviceService.availability(12, 45, { date: "2026-11-30", resource_id: 7 });
  serviceService.listFormTemplates({ page: 2, per_page: 20 });
  const forms = [{ template_id: 7, required: true, sort_order: 1 }];
  serviceService.saveForms(12, 45, forms);
  const schedule = weeklyPayload(weeklyDraft([firstShift]), false);
  resourceService.saveSchedule(12, 7, schedule);
  expect(client.post).toHaveBeenCalledWith("/branches/12/services/45/resources", { resources: [association] });
  expect(client.put).toHaveBeenCalledWith("/branches/12/services/45/resources/7", { duration_override: null });
  expect(client.delete).toHaveBeenCalledWith("/branches/12/services/45/resources/7");
  expect(client.get).toHaveBeenCalledWith("/branches/12/services/45/availability", expect.objectContaining({ params: { date: "2026-11-30", resource_id: 7 } }));
  expect(client.get).toHaveBeenCalledWith("/service-form-templates", expect.objectContaining({ params: { page: 2, per_page: 20 } }));
  expect(client.put).toHaveBeenCalledWith("/branches/12/services/45/forms", { forms });
  expect(client.put).toHaveBeenCalledWith("/branches/12/resources/7/schedule", { weekly_schedules: schedule });
  expect(schedule[0]).not.toHaveProperty("capacity_override");
  expect(validateWeekly([], false)).toEqual({});
  expect(validateWeekly([], true)).toHaveProperty("weekly_schedules");
  serviceService.saveForms(12, 45, []);
  resourceService.saveSchedule(12, 7, []);
  expect(client.put).toHaveBeenCalledWith("/branches/12/services/45/forms", { forms: [] });
  expect(client.put).toHaveBeenCalledWith("/branches/12/resources/7/schedule", { weekly_schedules: [] });
});
