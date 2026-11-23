import { vehicleRowsForPayload, vehicleRange } from "./vehicleCompatibility";
test("preserves open ranges and emits only writable names and years", () => {
  expect(vehicleRowsForPayload([{ id: 9, brand_id: 1, model_id: 2, vehicle_brand: " Nissan ", vehicle_model: " Versa ", year_from: "2020", year_to: "" }])).toEqual([{ vehicle_brand: "Nissan", vehicle_model: "Versa", year_from: 2020, year_to: null }]);
  expect(vehicleRowsForPayload([])).toEqual([]);
});
test.each([{ vehicle_brand: "", vehicle_model: "Versa" }, { vehicle_brand: "Nissan", vehicle_model: "Versa", year_from: 2025, year_to: 2020 }, { vehicle_brand: "Nissan", vehicle_model: "Versa", year_from: 2020.5 }, { vehicle_brand: "Nissan", vehicle_model: "Versa", year_to: 2201 }])("rejects invalid vehicle rows", row => { expect(() => vehicleRowsForPayload([row])).toThrow(); });
test("labels open ranges without claiming universal compatibility", () => {
  expect(vehicleRange({ year_from: null, year_to: 2020 })).toBe("Hasta 2020");
  expect(vehicleRange({ year_from: 2020, year_to: null })).toBe("Desde 2020");
  expect(vehicleRange({ year_from: null, year_to: null })).toBe("Sin límite de años");
});
