import client from "../../config/axiosClientPOS";
import { useVehicleRequest } from "../../components/vehicles/VehicleRecordFields";
import { positivePOSId } from "../../utils/posVehicle";

export default function usePOSTerminal(enabled, posId, branch, session) {
  return useVehicleRequest(async (signal) => {
    const { data } = await client.post("/pos/me", undefined, { signal });
    if (!data.abilities?.includes("sell-only") || !positivePOSId(data.store_id) || Number(data.id ?? data.pos_id) !== Number(posId)) {
      throw new Error("La terminal no confirmó su tienda y sucursal.");
    }
    if (session && positivePOSId(data.branch_id)) {
      return { ...data, id: Number(posId), branch_id: Number(data.branch_id), store_id: Number(data.store_id) };
    }
    const { data: scope } = await client.get("/my-products-by-pos1", { params: { pos_location_id: Number(posId), page: 1, per_page: 1 }, signal });
    if (Number(scope.pos?.id) !== Number(posId) || Number(scope.store_id) !== Number(data.store_id) ||
        !positivePOSId(scope.branch_id) || (data.branch_id && Number(data.branch_id) !== Number(scope.branch_id))) {
      throw new Error("El catálogo no confirmó la sucursal de la terminal.");
    }
    return { ...data, id: Number(posId), branch_id: Number(scope.branch_id), store_id: Number(data.store_id) };
  }, enabled && posId ? JSON.stringify([posId, branch, session]) : null);
}
