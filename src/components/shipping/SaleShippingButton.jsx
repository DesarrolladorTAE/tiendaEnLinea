import React, { useCallback, useState } from "react";
import { Button, Chip, Stack } from "@mui/material";
import ShipmentManager from "./ShipmentManager";
import { cancelledShippingSale, saleOnline, shippingError } from "../../utils/privateShipping";

export default function SaleShippingButton({ client, sale, orderId, orderStatus }) {
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [updatedTracking, setUpdatedTracking] = useState(null);
  const tracking = updatedTracking || sale?.shipping_tracking;
  const validateSale = useCallback(async () => {
    if (!orderId) return !cancelledShippingSale(sale, orderStatus);
    const response = await client.get(`/admin/offline-payments/${orderId}`);
    const order = response.data.data;
    if (!order?.sale?.id) throw new Error("La venta del pedido ya no está disponible.");
    const cancelled = cancelledShippingSale(order.sale, order.status ?? order.form?.status);
    if (cancelled) { setBlocked(true); setOpen(false); }
    return !cancelled;
  }, [client, orderId, sale, orderStatus]);
  if (blocked || cancelledShippingSale(sale, orderStatus)) return null;
  return <Stack spacing={0.5} alignItems="flex-start">
    {saleOnline(sale) && <Chip size="small" color="info" label="Venta en línea" />}
    <Button size="small" disabled={checking} onClick={async () => {
      setChecking(true); setError("");
      try { if (await validateSale()) setOpen(true); } catch (failure) { setError(shippingError(failure)); }
      finally { setChecking(false); }
    }}>{tracking?.status_label || "Entrega / envío"}</Button>
    {error && <span role="alert">{error}</span>}
    {open && <ShipmentManager open validateSale={validateSale} onClose={() => setOpen(false)} onUpdated={setUpdatedTracking} client={client} saleId={sale?.sale_id || sale?.venta_id || sale?.id} branchId={sale?.branch_id || sale?.pos_location?.branch_id} />}
  </Stack>;
}
