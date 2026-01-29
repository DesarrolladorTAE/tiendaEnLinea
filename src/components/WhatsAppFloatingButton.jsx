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
  setItemQty
} from "../store/slices/whatsappCartSlice";

const API_BASE = "https://mitiendaenlineamx.com.mx/api";

const WhatsAppFloatingButton = ({ storePhone, storeId }) => {
  const items = useSelector((state) => state.whatsappCart.items || []);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(true);

  // PayPal state
  const [pp, setPp] = useState({
    loading: true,
    clientId: null,
    currency: "MXN",
    mode: "sandbox",
    brand: "Mi Tienda"
  });

  // ====== PayPal: cargar credenciales públicas ======
  useEffect(() => {
    let alive = true;

    // Debug mínimo
    console.log("🟣 storeId:", storeId);

    if (!storeId) {
      setPp((s) => ({ ...s, loading: false, clientId: null }));
      return;
    }

    setPp((s) => ({ ...s, loading: true }));

    axios
      .get(`${API_BASE}/public/paypal/${storeId}/sdk-credentials`)
      .then(({ data }) => {
        if (!alive) return;
        setPp({
          loading: false,
          clientId: data?.client_id || null,
          currency: data?.currency || "MXN",
          mode: data?.mode || "sandbox",
          brand: data?.brand || "Mi Tienda"
        });
      })
      .catch(() => {
        if (!alive) return;
        setPp((s) => ({ ...s, loading: false, clientId: null }));
      });

    return () => {
      alive = false;
    };
  }, [storeId]);

  // ====== Helpers WhatsApp ======
  const normalizePhone = (phone) => {
    const clean = String(phone || "").replace(/\D/g, "");
    if (clean.startsWith("52")) return clean;
    if (clean.length === 10) return `52${clean}`;
    return clean;
  };

  const total = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty ?? 1) || 1),
        0
      ),
    [items]
  );

  const messageLines = useMemo(
    () =>
      items
        .map((it, idx) => {
          const qty = Number(it.qty ?? 1) || 1;
          const price = Number(it.price || 0);
          const lineTotal = price * qty;
          return `${idx + 1}. ${qty} × ${it.name} — MX$${price.toFixed(
            2
          )} c/u = MX$${lineTotal.toFixed(2)}`;
        })
        .join("\n"),
    [items]
  );

  const whatsappMessage = useMemo(
    () =>
      `Hola, me interesa comprar:\n\n${messageLines}\n\nTotal: MX$${total.toFixed(
        2
      )}`,
    [messageLines, total]
  );

  const normalizedPhone = useMemo(
    () => normalizePhone(storePhone),
    [storePhone]
  );

  const whatsappUrl = useMemo(() => {
    if (!normalizedPhone || items.length === 0) return null;
    return `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodeURIComponent(
      whatsappMessage
    )}`;
  }, [normalizedPhone, whatsappMessage, items.length]);

  const handleSend = () => {
    if (!whatsappUrl) return;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    dispatch(clearWhatsappCart());
  };

  // Return condicional DESPUÉS de hooks
  if (!storePhone || items.length === 0) return null;

  // ====== PayPal handlers (tu backend) ======
  const paypalCreateOrder = async () => {
    if (!storeId) throw new Error("storeId requerido");
    if (total <= 0) throw new Error("Total inválido");

    const payload = {
      amount: Number(total.toFixed(2)),
      currency: pp.currency,
      reference_id: `STORE-${storeId}-${Date.now()}`,
      items: items.map((it) => ({
        name: String(it.name || "Producto").slice(0, 127),
        quantity: String(Number(it.qty ?? 1) || 1), // 👈 string entero
        unit_amount: {
          value: Number(it.price || 0).toFixed(2),
          currency_code: pp.currency
        },
        // extras usados por tu capture para crear Sale
        product_id: it.product_id ?? it.id,
        variation_size_id: it.variation_size_id ?? null,
        unit_price: Number(it.price || 0).toFixed(2)
      }))
    };

    const { data } = await axios.post(
      `${API_BASE}/public/paypal/${storeId}/order`,
      payload
    );

    if (!data?.ok || !data?.order_id) {
      throw new Error("No se pudo crear la orden de PayPal");
    }

    return data.order_id;
  };

  const paypalOnApprove = async (data) => {
    const order_id = data?.orderID;
    if (!order_id) throw new Error("orderID faltante");

    const res = await axios.post(
      `${API_BASE}/public/paypal/${storeId}/capture`,
      { order_id }
    );

    if (!res.data?.ok) {
      throw new Error(res.data?.message || "No se pudo capturar el pago");
    }

    dispatch(clearWhatsappCart());
    alert("✅ Pago realizado correctamente.");
  };

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
        gap: 12
      }}
    >
      {/* Panel con el resumen del pedido */}
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
            overflow: "visible" // ✅ importante para iframes PayPal
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
              gap: 8
            }}
          >
            <strong style={{ fontSize: 14 }}>
              Tu pedido (
              {items.reduce((a, it) => a + (Number(it.qty ?? 1) || 1), 0)})
            </strong>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => dispatch(clearWhatsappCart())}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#b23c17",
                  fontSize: 12,
                  cursor: "pointer"
                }}
                title="Vaciar pedido"
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
                  cursor: "pointer"
                }}
                title="Ocultar"
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
                      idx !== items.length - 1
                        ? "1px dashed rgba(0,0,0,.06)"
                        : "none"
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
                        marginBottom: 6
                      }}
                    >
                      {idx + 1}. {item.name}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={() =>
                          dispatch(decrementItemQty({ id: item.id }))
                        }
                        title="Restar"
                        aria-label="Restar unidad"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          border: "1px solid rgba(0,0,0,.15)",
                          background: "#fff",
                          cursor: "pointer",
                          lineHeight: 1
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
                              qty: Math.max(0, Number(e.target.value))
                            })
                          )
                        }
                        style={{
                          width: 56,
                          height: 28,
                          border: "1px solid rgba(0,0,0,.15)",
                          borderRadius: 8,
                          textAlign: "center"
                        }}
                      />

                      <button
                        onClick={() =>
                          dispatch(incrementItemQty({ id: item.id }))
                        }
                        title="Sumar"
                        aria-label="Sumar unidad"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          border: "1px solid rgba(0,0,0,.15)",
                          background: "#fff",
                          cursor: "pointer",
                          lineHeight: 1
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        MX${price.toFixed(2)} c/u
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>
                        MX${lineTotal.toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => dispatch(removeFromWhatsappCart(item.id))}
                      title="Quitar producto"
                      aria-label={`Quitar ${item.name}`}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#d32f2f",
                        cursor: "pointer",
                        fontSize: 18,
                        lineHeight: 1
                      }}
                    >
                      <i className="pe-7s-close-circle" />
                    </button>
                  </div>
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
              gap: 8,
              borderTop: "1px solid rgba(0,0,0,.06)"
            }}
          >
            <span style={{ fontSize: 13, color: "#333" }}>Total</span>
            <strong style={{ fontSize: 15 }}>MX${total.toFixed(2)}</strong>
          </div>

          {/* ✅ PayPal: solo si hay clientId */}
          {!pp.loading && pp.clientId && (
            <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(0,0,0,.06)" }}>
              <PayPalScriptProvider
                options={{
                  clientId: pp.clientId,
                  currency: pp.currency,
                  intent: "capture"
                }}
              >
                <PayPalButtons
                  style={{ layout: "vertical" }}
                  disabled={total <= 0}
                  createOrder={paypalCreateOrder}
                  onApprove={paypalOnApprove}
                  onError={(err) => {
                    console.error("PayPal error:", err);
                    alert("❌ Error con PayPal. Intenta de nuevo.");
                  }}
                />
              </PayPalScriptProvider>
            </div>
          )}
        </div>
      )}

      {/* Botones flotantes */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => setOpen((s) => !s)}
          className="btn btn-light shadow"
          style={{
            borderRadius: 30,
            padding: "10px 14px",
            fontSize: 13,
            border: "1px solid rgba(0,0,0,.08)"
          }}
          title={open ? "Ocultar resumen" : "Mostrar resumen"}
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
            fontSize: 14
          }}
          title="Realizar pedido por WhatsApp"
          disabled={!whatsappUrl}
        >
          <i className="pe-7s-paper-plane" />
          Realizar pedido
        </button>
      </div>
    </div>
  );
};

export default WhatsAppFloatingButton;
