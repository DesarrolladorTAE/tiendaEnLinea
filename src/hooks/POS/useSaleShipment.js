import { useCallback, useEffect, useState } from "react";
import client from "../../config/axiosClientPOS";
import { privateShippingConfig, shippingError } from "../../utils/privateShipping";
import { buildShipment } from "../../utils/shipping.mjs";

export default function useSaleShipment(posLocationId) {
  const [config, setConfig] = useState(null);
  const [values, setValues] = useState({ notification_consent: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setConfig(null); setLoading(true); setError("");
    client.get("/shipping/config", { signal: controller.signal }).then(response => {
      if (!controller.signal.aborted) setConfig(privateShippingConfig(response.data.data));
    }).catch(failure => { if (!controller.signal.aborted) setError(shippingError(failure)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [posLocationId, reload]);
  useEffect(() => { setValues({ notification_consent: false }); }, [posLocationId]);
  const build = useCallback(async () => {
    if (!values.shipping_method_id) return null;
    const response = await client.get("/shipping/config");
    const fresh = privateShippingConfig(response.data.data);
    setConfig(fresh);
    if (!fresh.enabled) throw new Error("La configuración ya no permite nuevos envíos. Revisa la entrega seleccionada.");
    return buildShipment(fresh, values);
  }, [values]);
  return { config, values, setValues, error, loading, build, refresh: () => setReload(value => value + 1), reset: () => setValues({ notification_consent: false }) };
}
