// src/components/WhatsAppFloatingButton.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";

import {
  clearWhatsappCart,
  removeFromWhatsappCart,
  incrementItemQty,
  decrementItemQty,
  setItemQty,
} from "../store/slices/whatsappCartSlice";

import CheckoutPayModal from "./checkout/CheckoutPayModal";

const API_BASE = "https://mitiendaenlineamx.com.mx/api";

export default function WhatsAppFloatingButton({
  storePhone,
  storeId,
  storeSlug,
  storefrontTheme = {},
  storefrontColors = {},
}) {
  const items = useSelector((state) => state.whatsappCart.items || []);
  const dispatch = useDispatch();

  const [open, setOpen] = useState(true);

  // ✅ storeId resuelto (prop o lookup)
  const [resolvedStoreId, setResolvedStoreId] = useState(storeId ?? null);
  const [storeName, setStoreName] = useState("Tu tienda");

  // ✅ modal
  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    setResolvedStoreId(storeId ?? null);
  }, [storeId]);

  // ✅ Resuelve storeName (y storeId si falta) por slug
  useEffect(() => {
    let alive = true;
    if (!storeSlug) return;

    (async () => {
      try {
        // 1) bootstrap
        const boot = await axios.get(
          `${API_BASE}/public/tienda/${storeSlug}/bootstrap`,
        );
        if (!alive) return;

        const id = boot?.data?.id_store ?? boot?.data?.store_id ?? null;
        if (!resolvedStoreId && id) setResolvedStoreId(id);

        const nameFromBoot =
          boot?.data?.store_name ||
          boot?.data?.name ||
          boot?.data?.store?.name ||
          null;

        if (nameFromBoot) {
          setStoreName(String(nameFromBoot));
          return;
        }

        // 2) fallback /sitio
        const sitio = await axios.get(
          `${API_BASE}/public/tienda/${storeSlug}/sitio`,
        );
        if (!alive) return;

        const store = sitio?.data?.store || {};
        if (store?.name) setStoreName(String(store.name));
      } catch {
        // se queda "Tu tienda"
      }
    })();

    return () => {
      alive = false;
    };
  }, [storeSlug]); // ✅ NO dependas de resolvedStoreId aquí

  const USA_STORE_IDS = [451];

  const normalizePhone = (phone, currentStoreId) => {
    const clean = String(phone || "").replace(/\D/g, "");

    const isUsStore = USA_STORE_IDS.includes(Number(currentStoreId));

    // 🇺🇸 Estados Unidos / Canadá
    if (isUsStore) {
      if (clean.startsWith("1")) return clean;
      if (clean.length === 10) return `1${clean}`;
      return clean;
    }

    // 🇲🇽 México por defecto
    if (clean.startsWith("52")) return clean;
    if (clean.length === 10) return `52${clean}`;

    return clean;
  };

  const normalizedPhone = useMemo(
    () => normalizePhone(storePhone, resolvedStoreId),
    [storePhone, resolvedStoreId],
  );

  const total = useMemo(() => {
    return items.reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty ?? 1) || 1),
      0,
    );
  }, [items]);

  // ============================
  // Helpers para impresión bonita
  // ============================
  const formatAttrs = (meta) => {
    const attrs = meta?.variant_attributes || meta?.attributes || [];
    if (!Array.isArray(attrs) || !attrs.length) return "";
    const clean = attrs
      .map((a) => {
        const n = String(a?.name ?? "").trim();
        const v = String(a?.value ?? "").trim();
        if (!n && !v) return "";
        if (n && v) return `${n}: ${v}`;
        return n || v;
      })
      .filter(Boolean);

    return clean.length ? clean.join(", ") : "";
  };

  const itemsCount = useMemo(
    () => items.reduce((a, it) => a + (Number(it.qty ?? 1) || 1), 0),
    [items],
  );

  const messageLines = useMemo(() => {
    return items
      .map((it, idx) => {
        const qty = Number(it.qty ?? 1) || 1;
        const price = Number(it.price || 0);
        const lineTotal = price * qty;

        const title = (it.display_name || it.name || "Producto").trim();

        // ✅ almacén (solo si existe)
        const wh = it.warehouse_name ? ` | Almacén: ${it.warehouse_name}` : "";

        // ✅ atributos (solo si existen)
        const attrs = formatAttrs(it.meta);
        const attrsTxt = attrs ? ` | Características: ${attrs}` : "";

        return `${idx + 1}. ${qty} × ${title}${wh}${attrsTxt} — MX$${price.toFixed(
          2,
        )} c/u = MX$${lineTotal.toFixed(2)}`;
      })
      .join("\n");
  }, [items]);

  const whatsappMessage = useMemo(() => {
    return `Hola, me interesa comprar en ${storeName}:\n\n${messageLines}\n\nTotal: MX$${total.toFixed(
      2,
    )}`;
  }, [messageLines, total, storeName]);

  const whatsappUrl = useMemo(() => {
    if (!normalizedPhone || items.length === 0) return null;
    return `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodeURIComponent(
      whatsappMessage,
    )}`;
  }, [normalizedPhone, whatsappMessage, items.length]);

  const handleSend = () => {
    if (!whatsappUrl) return;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    dispatch(clearWhatsappCart());
  };

  // ✅ return condicional DESPUÉS de hooks
  if (!storePhone || items.length === 0) return null;

  return (
    <>
      <CheckoutPayModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        storeSlug={storeSlug}
        storePhone={storePhone}
        storeName={storeName}
        items={items}
        total={Number(total.toFixed(2))}
        onClearCart={() => dispatch(clearWhatsappCart())}
      />

      <div
        className="sf-whatsapp-cart"
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 12,
          "--cart-primary": storefrontColors.primary || "#111827",
          "--cart-secondary": storefrontColors.secondary || "#475569",
          "--cart-accent": storefrontColors.accent || "#25d366",
          "--cart-background": storefrontColors.background || "#ffffff",
          "--cart-text": storefrontColors.text || "#111827",
          "--cart-radius": `${storefrontTheme.radiusValue ?? 16}px`,
          "--cart-shadow": storefrontTheme.shadowValue || "0 12px 30px rgba(0,0,0,.12)",
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
            {/* header */}
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
              <strong style={{ fontSize: 14 }}>Tu pedido ({itemsCount})</strong>

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

            {/* items */}
            <div
              style={{ maxHeight: 260, overflowY: "auto", padding: "8px 14px" }}
            >
              {items.map((item, idx) => {
                const qty = Number(item.qty ?? 1) || 1;
                const price = Number(item.price || 0);
                const lineTotal = qty * price;

                const title = (
                  item.display_name ||
                  item.name ||
                  "Producto"
                ).trim();
                const attrs = formatAttrs(item.meta);

                return (
                  <div
                    key={item.cart_key || `${idx}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 0",
                      borderBottom:
                        idx !== items.length - 1
                          ? "1px dashed rgba(0,0,0,.06)"
                          : "none",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        title={title}
                        style={{
                          fontSize: 13,
                          color: "#222",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginBottom: 6,
                        }}
                      >
                        {idx + 1}. {title}
                      </div>

                      {/* ✅ detalles: almacén + atributos */}
                      {(item.warehouse_name || attrs) && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#6b7280",
                            marginBottom: 6,
                          }}
                        >
                          {item.warehouse_name ? (
                            <span>
                              Almacén: <b>{item.warehouse_name}</b>
                            </span>
                          ) : null}
                          {item.warehouse_name && attrs ? (
                            <span> • </span>
                          ) : null}
                          {attrs ? (
                            <span>
                              Características: <b>{attrs}</b>
                            </span>
                          ) : null}
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <button
                          onClick={() =>
                            dispatch(
                              decrementItemQty({ cart_key: item.cart_key }),
                            )
                          }
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
                                cart_key: item.cart_key,
                                qty: Math.max(0, Number(e.target.value)),
                              }),
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
                          onClick={() =>
                            dispatch(
                              incrementItemQty({ cart_key: item.cart_key }),
                            )
                          }
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
                      <div style={{ fontSize: 12, color: "#666" }}>
                        MX${price.toFixed(2)} c/u
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>
                        MX${lineTotal.toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        dispatch(removeFromWhatsappCart(item.cart_key))
                      }
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

            {/* total */}
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

            {/* acciones */}
            <div
              style={{
                padding: "12px 14px",
                borderTop: "1px solid rgba(0,0,0,.06)",
              }}
            >
              <button
                onClick={() => setPayOpen(true)}
                className="btn btn-dark shadow"
                style={{
                  width: "100%",
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                Pagar ahora
              </button>

              <button
                onClick={handleSend}
                className="btn btn-success shadow-lg"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 18px",
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 700,
                }}
                disabled={!whatsappUrl}
              >
                <i className="pe-7s-paper-plane" />
                Realizar pedido por WhatsApp
              </button>

              <div style={{ marginTop: 8, fontSize: 11, color: "#777" }}>
                Tu pedido se procesa por la tienda. Si pagas aquí, la
                confirmación suele ser más rápida.
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
            {open ? "Ocultar" : `Ver pedido (${itemsCount})`}
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
    </>
  );
}
