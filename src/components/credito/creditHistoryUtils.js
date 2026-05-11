export const money = (v) => `$${Number(v || 0).toFixed(2)}`;

export const formatDate = (v) => {
  if (!v) return "—";
  return new Date(v).toLocaleString("es-MX");
};

export const normalizePhone = (value = "") =>
  String(value || "").replace(/\D/g, "").slice(0, 10);

export const isCancelledSale = (status = "") => {
  const value = String(status || "").toLowerCase();
  return ["cancelled", "canceled", "cancelada", "cancelado"].includes(value);
};

export const isReversalType = (type = "") =>
  ["cancelacion", "reversal", "devolucion"].includes(
    String(type || "").toLowerCase()
  );

export const getTicketPending = (sale) => {
  const creditAmount = Number(sale?.credit_amount || sale?.total_amount || 0);
  const paidAmount = Number(sale?.credit_paid_amount || 0);

  return Math.max(0, creditAmount - paidAmount);
};

export const canPayTicket = (movement, sale) => {
  if (!sale) return false;

  const type = String(movement?.type || "").toLowerCase();

  return (
    type === "cargo" &&
    !isCancelledSale(sale?.status) &&
    sale?.status !== "paid" &&
    sale?.credit_status !== "paid" &&
    getTicketPending(sale) > 0
  );
};

export const getVisibleMovements = (movementsRaw = []) => {
  const paidTicketSaleIds = new Set(
    movementsRaw
      .filter((m) => {
        const type = String(m?.type || "").toLowerCase();
        return type === "abono" && m?.sale?.id;
      })
      .map((m) => m.sale.id)
  );

  return [...movementsRaw]
    .filter((m) => {
      const type = String(m?.type || "").toLowerCase();
      const cancelled = isCancelledSale(m?.sale?.status);
      const saleId = m?.sale?.id;

      // Oculta cargo original de ventas canceladas
      if (type === "cargo" && cancelled) return false;

      // Oculta cargo original de tickets que ya tienen liquidación registrada
      if (type === "cargo" && saleId && paidTicketSaleIds.has(saleId)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};