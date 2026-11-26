import React, { act } from "react";
import { createRoot } from "react-dom/client";
import client from "../config/axiosClient";
import useBranchCatalogSettings from "./useBranchCatalogSettings";
import useServiceSetupModules from "./useServiceSetupModules";
import { vehicleCatalogAccess } from "../utils/branchCatalogAccess";

jest.mock("../config/axiosClient", () => ({ __esModule: true, default: { get: jest.fn() } }));

const enabled = (authorization) => ({ available: true, enabled: true, visible: true, authorization });
const settings = (branch_id, actor = "store") => ({
  branch_id, vehicle_feature_available: true, vehicle_compatibilities_enabled: true,
  capabilities: {
    scope: { branch_id, actor },
    vehicle_catalog: enabled({ read: true, write: true }),
    vehicle_records: enabled({ read: true, write: true }),
    service_forms: enabled({ read: true, configure: true }),
  },
});
const response = (value) => ({ data: { data: value } });
let root;
let latest;

function Catalog({ branchId }) {
  latest = useBranchCatalogSettings(branchId);
  return null;
}

function ServiceModules({ branchId }) {
  latest = useServiceSetupModules(branchId);
  return null;
}

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  root = createRoot(document.createElement("div"));
});
afterEach(() => act(() => root.unmount()));

test("uses branch actions for forms and records and denies configuration for a POS actor", async () => {
  client.get.mockResolvedValueOnce(response(settings(12))).mockResolvedValueOnce(response(settings(18, "pos")));
  await act(async () => root.render(<ServiceModules branchId={12} />));
  expect(latest).toMatchObject({ vehicleRecords: true, serviceForms: true });
  expect(client.get).toHaveBeenCalledWith("/admin/branches/12/catalog-settings", { signal: expect.any(AbortSignal) });
  await act(async () => root.render(<ServiceModules branchId={18} />));
  expect(latest).toMatchObject({ vehicleRecords: false, serviceForms: false });
});

test("rejects a response for another scope and never falls back after a failed request", async () => {
  client.get.mockResolvedValueOnce(response(settings(12))).mockResolvedValueOnce(response(settings(12)));
  await act(async () => root.render(<Catalog branchId={12} />));
  expect(vehicleCatalogAccess(latest.settings, 329)).toEqual({ read: true, write: true });
  await act(async () => root.render(<Catalog branchId={18} />));
  expect(latest.error).toBeTruthy();
  expect(vehicleCatalogAccess(latest.settings, 566)).toEqual({ read: false, write: false });
});

test("allows only the legacy store on an older payload and respects explicit modern denial", () => {
  const legacy = { branch_id: 12, vehicle_feature_available: true, vehicle_compatibilities_enabled: true };
  expect(vehicleCatalogAccess(legacy, 566)).toEqual({ read: true, write: true });
  expect(vehicleCatalogAccess(legacy, 329)).toEqual({ read: false, write: false });
  const current = settings(12);
  current.capabilities.vehicle_catalog.available = false;
  expect(vehicleCatalogAccess(current, 566)).toEqual({ read: false, write: false });
});
