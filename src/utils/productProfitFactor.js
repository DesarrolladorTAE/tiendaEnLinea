export const validPurchaseCost = value => value !== null && value !== undefined && String(value).trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;

export const hasProfitFactor = product => {
  const value = product?.profit_factor;
  return value != null && String(value).trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 999999.9999;
};

// Zero remains a valid calculation input, but does not count toward the
// catalog visibility threshold for products using a positive profit factor.
export const hasConfiguredProfitFactor = product => hasProfitFactor(product) && Number(product.profit_factor) > 0;

export function calculateProfitPrice(cost, factor, iva) {
  if (!validPurchaseCost(cost)) throw new Error("Captura un costo de compra válido, mayor o igual a cero.");
  const text = String(factor ?? "").trim();
  if (!/^\d+(?:\.\d{1,4})?$/.test(text) || Number(text) > 999999.9999) {
    throw new Error("El factor debe estar entre 0 y 999999.9999, con hasta cuatro decimales.");
  }
  const tax = iva == null || iva === "null" ? 0 : Number(iva);
  if (iva === "" || !Number.isFinite(tax) || tax < 0 || tax > 1) throw new Error("Selecciona una tasa de IVA válida.");
  const rawPrice = Number(cost) * (1 + Number(text) / 100);
  const price = Math.round((rawPrice + Number.EPSILON) * 100) / 100;
  if (!Number.isFinite(price) || price > 99999999.99) throw new Error("El precio calculado no puede superar $99,999,999.99.");
  return { profit_factor: Number(text), price, base_price: Number((price / (1 + tax)).toFixed(6)) };
}

export async function saveProductProfitFactor(client, productId, factor) {
  const { data } = await client.patch(`/admin/products/${productId}/profit-factor`, { profit_factor: Number(factor) });
  const product = data?.data;
  if (!product || ["profit_factor", "price", "base_price"].some(key => product[key] == null || !Number.isFinite(Number(product[key])))) {
    throw new Error("No se pudo leer el precio confirmado por el servidor. Recarga el producto antes de volver a guardar.");
  }
  return product;
}
