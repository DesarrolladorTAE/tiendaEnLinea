// src/components/WhatsAppFloatingButton.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

import {
  clearWhatsappCart,
  removeFromWhatsappCart,
  incrementItemQty,
  decrementItemQty,
  setItemQty,
} from "../store/slices/whatsappCartSlice";

const API_BASE = "https://mitiendaenlineamx.com.mx/api";

export default function WhatsAppFloatingButton({ storePhone, storeId, storeSlug }) {
  const items = useSelector((state) => state.whatsappCart.items || []);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(true);

  // ✅ storeId resuelto (prop o lookup)
  const [resolvedStoreId, setResolvedStoreId] = useState(storeId ?? null);

  // PayPal creds
  const [pp, setPp] = useState({
    loading: true,
    clientId: null,
    currency: "MXN",
    mode: "sandbox", // live|sandbox (viene del backend)
    brand: "Mi Tienda",
  });

  // ---------------- HOOKS (siempre se ejecutan) ----------------

  useEffect(() => {
    setResolvedStoreId(storeId ?? null);
  }, [storeId]);

  // resolve storeId por slug (bootstrap)
  useEffect(() => {
    let alive = true;

    if (resolvedStoreId) return;
    if (!storeSlug) return;

    console.log("🟣 Resolviendo storeId por slug:", storeSlug);

    axios
      .get(`${API_BASE}/public/tienda/${storeSlug}/bootstrap`)
      .then(({ data }) => {
        if (!alive) return;
        const id = data?.id_store ?? null;
        console.log("✅ storeId resuelto:", id);
        setResolvedStoreId(id);
      })
      .catch((err) => {
        if (!alive) return;
        console.error("❌ Error resolviendo storeId:", err);
        setResolvedStoreId(null);
      });

    return () => {
      alive = false;
    };
  }, [resolvedStoreId, storeSlug]);

  // cargar sdk-credentials
  useEffect(() => {
    let alive = true;

    console.log("🟣 resolvedStoreId:", resolvedStoreId);

    if (!resolvedStoreId) {
      setPp((s) => ({ ...s, loading: false, clientId: null }));
      return;
    }

    setPp((s) => ({ ...s, loading: true }));

    axios
      .get(`${API_BASE}/public/paypal/${resolvedStoreId}/sdk-credentials`)
      .then(({ data }) => {
        if (!alive) return;

        const clientId = data?.client_id || null;
        const currency = String(data?.currency || "MXN").toUpperCase();
        const mode = data?.mode || "sandbox";
        const brand = data?.brand || "Mi Tienda";

        setPp({ loading: false, clientId, currency, mode, brand });

        console.log("🟦 PayPal creds:", {
          mode,
          currency,
          hasClientId: !!clientId,
          clientIdPreview: clientId ? clientId.slice(0, 12) + "..." : null,
        });

        // ⚠️ Advertencia útil
        if (mode === "live") {
          console.warn(
            "⚠️ Estás en LIVE. En localhost el SDK puede fallar con 400. " +
              "Si pasa, prueba con sandbox o usa un dominio https real."
          );
        }
      })
      .catch((err) => {
        console.error("❌ No se pudo cargar sdk-credentials:", err);
        if (!alive) return;
        setPp((s) => ({ ...s, loading: false, clientId: null }));
      });

    return () => {
      alive = false;
    };
  }, [resolvedStoreId]);

  const normalizePhone = (phone) => {
    const clean = String(phone || "").replace(/\D/g, "");
    if (clean.startsWith("52")) return clean;
    if (clean.length === 10) return `52${clean}`;
    return clean;
  };

  const total = useMemo(() => {
    return items.reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty ?? 1) || 1),
      0
    );
  }, [items]);

  const messageLines = useMemo(() => {
    return items
      .map((it, idx) => {
        const qty = Number(it.qty ?? 1) || 1;
        const price = Number(it.price || 0);
        const lineTotal = price * qty;
        return `${idx + 1}. ${qty} × ${it.name} — MX$${price.toFixed(
          2
        )} c/u = MX$${lineTotal.toFixed(2)}`;
      })
      .join("\n");
  }, [items]);

  const whatsappMessage = useMemo(() => {
    return `Hola, me interesa comprar:\n\n${messageLines}\n\nTotal: MX$${total.toFixed(2)}`;
  }, [messageLines, total]);

  const normalizedPhone = useMemo(() => normalizePhone(storePhone), [storePhone]);

  const whatsappUrl = useMemo(() => {
    if (!normalizedPhone || items.length === 0) return null;
    return `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodeURIComponent(
      whatsappMessage
    )}`;
  }, [normalizedPhone, whatsappMessage, items.length]);

  // PayPal Provider options (MINIMAS)
  const paypalProviderOptions = useMemo(() => {
    if (!pp.clientId) return null;

    const opts = {
      clientId: pp.clientId,
      currency: (pp.currency || "MXN").toUpperCase(),
      intent: "capture",
      locale: "es_MX",
      // 👇 NO mandamos buyer-country ni extras
    };

    return opts;
  }, [pp.clientId, pp.currency]);

  useEffect(() => {
    if (!paypalProviderOptions) return;
    console.log("🟨 PayPalScriptProvider options:", {
      ...paypalProviderOptions,
      clientId: String(paypalProviderOptions.clientId).slice(0, 12) + "...",
      mode: pp.mode,
    });
  }, [paypalProviderOptions, pp.mode]);

  const handleSend = () => {
    if (!whatsappUrl) return;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    dispatch(clearWhatsappCart());
  };

  // Handlers backend
  const paypalCreateOrder = async () => {
    if (!resolvedStoreId) throw new Error("storeId requerido");
    if (total <= 0) throw new Error("Total inválido");

    const currency = (pp.currency || "MXN").toUpperCase();

    console.log("🧾 createOrder ->", {
      storeId: resolvedStoreId,
      amount: Number(total.toFixed(2)),
      currency,
    });

    const { data } = await axios.post(
      `${API_BASE}/public/paypal/${resolvedStoreId}/order`,
      {
        amount: Number(total.toFixed(2)),
        currency,
        reference_id: `STORE-${resolvedStoreId}-${Date.now()}`,
        items: items.map((it) => ({
          name: String(it.name || "Producto").slice(0, 127),
          quantity: String(Number(it.qty ?? 1) || 1),
          unit_amount: {
            value: Number(it.price || 0).toFixed(2),
            currency_code: currency,
          },
          product_id: it.product_id ?? it.id,
          variation_size_id: it.variation_size_id ?? null,
          unit_price: Number(it.price || 0).toFixed(2),
        })),
      }
    );

    console.log("✅ backend order response:", data);

    if (!data?.ok || !data?.order_id) {
      throw new Error(data?.message || "No se pudo crear la orden de PayPal");
    }

    return data.order_id;
  };

  const paypalOnApprove = async (data) => {
    const order_id = data?.orderID;
    if (!order_id) throw new Error("orderID faltante");

    console.log("✅ onApprove orderID:", order_id);

    const res = await axios.post(
      `${API_BASE}/public/paypal/${resolvedStoreId}/capture`,
      { order_id }
    );

    console.log("✅ capture response:", res.data);

    if (!res.data?.ok) {
      throw new Error(res.data?.message || "No se pudo capturar el pago");
    }

    dispatch(clearWhatsappCart());
    alert("✅ Pago realizado correctamente.");
  };

  // ✅ return condicional DESPUÉS de hooks
  if (!storePhone || items.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 12,
      }}
    >
      {open && (
        <div
          className="shadow-lg"
          style={{
            width: 340,
            maxWidth: "85vw",
            background: "#fff",
            borderRadius: 16,
            border: "1px solid rgba(0,0,0,.08)",
            boxShadow: "0 12px 30px rgba(0,0,0,.12)",
            overflow: "visible",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              background:
                "linear-gradient(90deg, rgba(37,211,102,0.15) 0%, rgba(37,211,102,0.08) 100%)",
              borderBottom: "1px solid rgba(0,0,0,.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <strong style={{ fontSize: 14 }}>
              Tu pedido ({items.reduce((a, it) => a + (Number(it.qty ?? 1) || 1), 0)})
            </strong>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => dispatch(clearWhatsappCart())}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#b23c17",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Vaciar
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#0b8066",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Ocultar
              </button>
            </div>
          </div>

          <div style={{ maxHeight: 260, overflowY: "auto", padding: "8px 14px" }}>
            {items.map((item, idx) => {
              const qty = Number(item.qty ?? 1) || 1;
              const price = Number(item.price || 0);
              const lineTotal = qty * price;

              return (
                <div
                  key={`${item.id ?? idx}-${idx}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 0",
                    borderBottom:
                      idx !== items.length - 1 ? "1px dashed rgba(0,0,0,.06)" : "none",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      title={item.name}
                      style={{
                        fontSize: 13,
                        color: "#222",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginBottom: 6,
                      }}
                    >
                      {idx + 1}. {item.name}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={() => dispatch(decrementItemQty({ id: item.id }))}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          border: "1px solid rgba(0,0,0,.15)",
                          background: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        −
                      </button>

                      <input
                        type="number"
                        min={0}
                        value={qty}
                        onChange={(e) =>
                          dispatch(
                            setItemQty({
                              id: item.id,
                              qty: Math.max(0, Number(e.target.value)),
                            })
                          )
                        }
                        style={{
                          width: 56,
                          height: 28,
                          border: "1px solid rgba(0,0,0,.15)",
                          borderRadius: 8,
                          textAlign: "center",
                        }}
                      />

                      <button
                        onClick={() => dispatch(incrementItemQty({ id: item.id }))}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          border: "1px solid rgba(0,0,0,.15)",
                          background: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#666" }}>MX${price.toFixed(2)} c/u</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>MX${lineTotal.toFixed(2)}</div>
                  </div>

                  <button
                    onClick={() => dispatch(removeFromWhatsappCart(item.id))}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#d32f2f",
                      cursor: "pointer",
                      fontSize: 18,
                    }}
                    title="Quitar producto"
                  >
                    <i className="pe-7s-close-circle" />
                  </button>
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(0,0,0,.06)",
            }}
          >
            <span style={{ fontSize: 13, color: "#333" }}>Total</span>
            <strong style={{ fontSize: 15 }}>MX${total.toFixed(2)}</strong>
          </div>

          <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(0,0,0,.06)" }}>
            {pp.loading && <div style={{ fontSize: 12, color: "#666" }}>Cargando PayPal…</div>}

            {!pp.loading && !paypalProviderOptions && (
              <div style={{ fontSize: 12, color: "#b23c17" }}>
                PayPal no disponible (sin clientId).
              </div>
            )}

            {!pp.loading && paypalProviderOptions && (
              <PayPalScriptProvider options={paypalProviderOptions}>
                <PayPalButtons
                  style={{ layout: "vertical" }}
                  disabled={total <= 0}
                  createOrder={paypalCreateOrder}
                  onApprove={paypalOnApprove}
                  onError={(err) => {
                    console.error("❌ PayPal error:", err);
                    alert("Error con PayPal. Intenta de nuevo.");
                  }}
                />
              </PayPalScriptProvider>
            )}

            <div style={{ marginTop: 8, fontSize: 11, color: "#777" }}>
              PayPal: {pp.mode} — {pp.currency} — es_MX
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => setOpen((s) => !s)}
          className="btn btn-light shadow"
          style={{
            borderRadius: 30,
            padding: "10px 14px",
            fontSize: 13,
            border: "1px solid rgba(0,0,0,.08)",
          }}
        >
          {open ? "Ocultar" : `Ver pedido (${items.length})`}
        </button>

        <button
          onClick={handleSend}
          className="btn btn-success shadow-lg"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 18px",
            borderRadius: 30,
            fontSize: 14,
          }}
          disabled={!whatsappUrl}
        >
          <i className="pe-7s-paper-plane" />
          Realizar pedido
        </button>
      </div>
    </div>
  );
}
