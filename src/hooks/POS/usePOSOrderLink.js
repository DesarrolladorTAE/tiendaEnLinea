import usePOSTerminal from "./usePOSTerminal";
import { useEffect, useRef, useState } from "react";
import client from "../../config/axiosClientPOS";
import { useVehicleRequest } from "../../components/vehicles/VehicleRecordFields";
import { positivePOSId, resolveSaleLink } from "../../utils/posVehicle";

function readReference(key) {
  try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
}

export default function usePOSOrderLink(enabled, posId, branch, modules, orderId, { specialistEnabled = enabled, orderEnabled = enabled } = {}) {
  const hasFeature = enabled && (modules?.includes("vehicle_catalog") || modules?.includes("service_sales"));
  const identity = usePOSTerminal(hasFeature, posId, branch);
  const terminal = identity.data;
  const catalog = useVehicleRequest(async (signal) => {
    const { data } = await client.get(`/admin/branches/${terminal.branch_id}/catalog-settings`, { signal });
    const caps = data?.data?.capabilities;
    if (Number(data?.data?.branch_id) !== terminal.branch_id || caps?.vehicle_catalog?.authorization?.read !== true) return null;
    return { records: modules.includes("vehicle_records") && caps.vehicle_records?.authorization?.read === true };
  }, terminal && specialistEnabled && modules?.includes("vehicle_catalog") ? JSON.stringify([terminal.id, terminal.branch_id, modules]) : null);
  const order = useVehicleRequest(async (signal) => {
    const { data } = await client.get(`/branches/${terminal.branch_id}/service-orders/${orderId}`, { signal });
    if (Number(data.data?.branch_id) !== terminal.branch_id || Number(data.data?.store_id) !== terminal.store_id ||
        Number(data.data?.id) !== Number(orderId)) throw new Error("La orden no pertenece a esta terminal.");
    return data.data;
  }, terminal && orderEnabled && modules?.includes("service_sales") && positivePOSId(orderId) ? JSON.stringify([terminal.id, terminal.branch_id, orderId]) : null);
  const storage = terminal ? `pos-order-link:${terminal.store_id}:${terminal.branch_id}:${terminal.id}` : null;
  const [result, setResult] = useState(null);
  const pending = useRef(null);
  const activeStorage = useRef(storage);
  activeStorage.current = storage;
  useEffect(() => {
    activeStorage.current = storage;
    const restore = () => {
      const stored = storage && readReference(storage);
      if (stored && positivePOSId(stored.sale) && positivePOSId(stored.order) &&
        stored.store === terminal.store_id && stored.branch === terminal.branch_id && stored.terminal === terminal.id) {
        setResult({ key: storage, state: "pending", reference: stored });
      }
    };
    restore();
    window.addEventListener("pos:order-link-pending", restore);
    return () => {
      activeStorage.current = null;
      pending.current?.abort();
      pending.current = null;
      window.removeEventListener("pos:order-link-pending", restore);
    };
  }, [storage]);
  const process = async (reference, key, checkOnly) => {
    if (key !== activeStorage.current || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setResult({ key, state: "checking", reference });
    let state;
    try { state = await resolveSaleLink(client, reference, controller.signal, checkOnly); }
    catch (error) { state = [401, 403, 404].includes(error.response?.status) ? "denied" : "pending"; }
    finally {
      if (pending.current === controller) pending.current = null;
    }
    if (controller.signal.aborted || key !== activeStorage.current) return;
    if (state === "linked") {
      try { sessionStorage.removeItem(key); } catch { /* The order remains authoritative. */ }
      order.retry();
    }
    setResult({ key, state, reference });
  };
  const confirmed = (sale) => {
    if (!terminal || !storage || !order.data || !positivePOSId(sale?.id)) return;
    const reference = { store: terminal.store_id, branch: terminal.branch_id, terminal: terminal.id,
      order: Number(order.data.id), sale: Number(sale.id) };
    try { sessionStorage.setItem(storage, JSON.stringify(reference)); } catch { /* Keep the in-memory reference. */ }
    if (activeStorage.current !== storage) {
      window.dispatchEvent(new Event("pos:order-link-pending"));
      return;
    }
    setResult({ key: storage, state: "pending", reference });
    if (Number(sale.pos_location_id) !== terminal.id || Number(sale.store_id) !== terminal.store_id ||
        Number(sale.client_id) !== Number(order.data.customer_id)) {
      setResult({ key: storage, state: "conflict", reference });
      return;
    }
    void process(reference, storage);
  };
  return { terminal, identity, catalog, order, confirmed, link: result?.key === storage ? result : null,
    retry: (checkOnly = false) => { if (orderEnabled && result?.key === storage && modules?.includes("service_sales")) void process(result.reference, storage, checkOnly); } };
}

