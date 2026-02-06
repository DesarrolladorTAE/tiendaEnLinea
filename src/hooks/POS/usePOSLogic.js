// src/hooks/POS/usePOSLogic.js
import { useState, useEffect, useCallback } from "react";
import axiosClient from "../../config/axiosClientPOS";
import { showError, showSuccess } from "../../utils/alerts";

export function usePOSLogic({ setTicketData, setShowTicket, cart, setCart }) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState(null);

  const [selectedVariation, setSelectedVariation] = useState({});
  const [selectedSize, setSelectedSize] = useState({});

  const [posLocationId, setPosLocationId] = useState(
    Number(localStorage.getItem("POS_LOCATION_ID")) || null
  );

  useEffect(() => {
    const sync = () => {
      setPosLocationId(Number(localStorage.getItem("POS_LOCATION_ID")) || null);
    };
    window.addEventListener("storage", sync);
    window.addEventListener("pos:changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("pos:changed", sync);
    };
  }, []);

  const getSelectedVariant = useCallback(
    (product) => {
      if (!product?.has_variants) return null;

      const pid = String(product.id);
      const vid = selectedVariation?.[pid];
      const list = Array.isArray(product.variants) ? product.variants : [];

      if (vid) return list.find((v) => String(v.id) === String(vid)) || null;

      const active = list.find((v) => v.is_active !== false);
      return active || list[0] || null;
    },
    [selectedVariation]
  );

  const refetchProducts = useCallback(async () => {
    try {
      if (!posLocationId) {
        setProducts([]);
        return;
      }

      const { data } = await axiosClient.get("my-products-by-pos", {
        params: { pos_location_id: posLocationId },
      });

      const list = Array.isArray(data?.products) ? data.products : [];
      setProducts(list);
    } catch (e) {
      console.error("Error cargando productos POS:", e);
      setProducts([]);
    }
  }, [posLocationId]);

  useEffect(() => {
    refetchProducts();
  }, [refetchProducts]);

  const isVariantProduct = (product) => !!product?.has_variants;

  // ✅ SOLO imagen del PRODUCTO (card)
  const getProductImage = (product) => {
    if (Array.isArray(product?.image) && product.image.length > 0) {
      return product.image[0];
    }
    return null;
  };

  // ✅ Imagen para MODAL (variante)
  const getVariantImage = (product, variant) => {
    if (variant?.image_url) return variant.image_url;
    if (variant?.image) return variant.image;
    return getProductImage(product);
  };

  const getAvailableStock = useCallback(
    (product) => {
      if (!product) return 0;

      const useWh = !!product.use_warehouse_inventory;

      if (product.has_variants) {
        const v = getSelectedVariant(product);
        if (!v) return 0;

        if (!useWh) return Number(v.stock) || 0;

        const rows = Array.isArray(v.warehouse_stocks) ? v.warehouse_stocks : [];
        return rows.reduce((acc, r) => acc + (Number(r.stock) || 0), 0);
      }

      if (!useWh) return Number(product.stock) || 0;

      const rows = Array.isArray(product.warehouse_inventories)
        ? product.warehouse_inventories
        : [];
      return rows.reduce((acc, r) => acc + (Number(r.qty) || 0), 0);
    },
    [getSelectedVariant]
  );

  const getQuantityInCart = (id) =>
    cart.find((item) => item.id === id)?.quantity || 0;

  const getCartKey = useCallback(
    (product) => {
      if (!product) return null;
      if (!product.has_variants) return String(product.id);

      const v = getSelectedVariant(product);
      if (!v) return String(product.id);
      return `${product.id}:${v.id}`;
    },
    [getSelectedVariant]
  );

  const getUnitPrice = useCallback(
    (product) => {
      if (!product) return 0;

      const descuento = Number(product.discount ?? 0);
      let base = Number(product.price) || 0;

      if (product.has_variants) {
        const v = getSelectedVariant(product);
        base = Number(v?.price) || base;
      }

      const final = base * (1 - descuento / 100);
      return Number(final.toFixed(2));
    },
    [getSelectedVariant]
  );

  const handleAdd = (product) => {
    setCart((prevCart) => {
      const key = getCartKey(product);
      if (!key) return prevCart;

      const stockDisponible = Number(getAvailableStock(product)) || 0;
      const unitPrice = getUnitPrice(product);

      const existing = prevCart.find((i) => i.id === key);

      if (existing) {
        const nuevaCantidad = Number((Number(existing.quantity || 0) + 1).toFixed(2));
        if (nuevaCantidad > stockDisponible) {
          showError("⚠️ Stock insuficiente.");
          return prevCart;
        }
        return prevCart.map((i) => (i.id === key ? { ...i, quantity: nuevaCantidad } : i));
      }

      const v = product.has_variants ? getSelectedVariant(product) : null;

      return [
        ...prevCart,
        {
          id: key,
          product_id: Number(product.id),
          variant_id: v ? Number(v.id) : null,
          name: v ? `${product.name} - ${v.name ?? v.sku ?? v.id}` : product.name,
          price_original: Number(v?.price ?? product.price ?? unitPrice),
          discount: Number(product.discount ?? 0),
          price: Number(unitPrice),
          quantity: 1,
          has_variants: !!product.has_variants,
        },
      ];
    });
  };

  const handleSetQuantity = (product, nuevaCantidad) => {
    const key = getCartKey(product);
    if (!key) return;

    const stockDisponible = Number(getAvailableStock(product)) || 0;

    if (Number(nuevaCantidad) > stockDisponible) {
      showError("⚠️ Stock insuficiente.");
      return;
    }

    if (!nuevaCantidad || Number(nuevaCantidad) <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== key));
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === key
          ? { ...item, quantity: Number(Number(nuevaCantidad).toFixed(2)) }
          : item
      )
    );
  };

  const handleDecrease = (cartKey) => {
    setCart((prev) => {
      const index = prev.findIndex((item) => item.id === cartKey);
      if (index === -1) return prev;

      const updated = [...prev];
      if (Number(updated[index].quantity) > 1) {
        updated[index].quantity = Number((Number(updated[index].quantity) - 1).toFixed(2));
        return updated;
      }
      return prev.filter((item) => item.id !== cartKey);
    });
  };

  const handleRemove = (cartKey) => {
    setCart((prev) => prev.filter((item) => item.id !== cartKey));
  };

  const handleCheckout = useCallback(
    async (checkoutPayloadFromCart) => {
      if (!cart || cart.length === 0) return;

      const items = cart.map((item) => ({
        product_id: Number(item.product_id ?? String(item.id).split(":")[0]),
        variant_id: item.variant_id ? Number(item.variant_id) : null,
        quantity: Number(item.quantity),
        unit_price: Number(item.price),
        original_price: Number(item.price_original ?? item.price),
        discount_percent: Number(item.discount ?? 0),
      }));

      const payments = checkoutPayloadFromCart.payments || [];
      const eff = payments.find((p) => p?.method === "efectivo");
      const rawCashReceived =
        eff?.cash_received ?? eff?.efectivo_recibido ?? eff?.recibido ?? eff?.amount ?? null;

      const totalAmount = +checkoutPayloadFromCart.total_amount.toFixed(2);

      const cashReceived =
        rawCashReceived != null && Number.isFinite(Number(rawCashReceived))
          ? +Number(rawCashReceived).toFixed(2)
          : null;

      const change =
        cashReceived != null ? Math.max(0, +(cashReceived - totalAmount).toFixed(2)) : 0;

      const payload = {
        total_amount: totalAmount,
        items,
        payments,
        ...(cashReceived != null
          ? { cash_received: cashReceived, efectivo_recibido: cashReceived }
          : {}),
        change,
      };

      try {
        const saleResponse = await axiosClient.post("/sales", payload);
        const { sale, message } = saleResponse.data;

        setCart([]);
        await refetchProducts();

        setTicketData(sale);
        showSuccess(`✅ ${message}`);
        setShowTicket(true);

        return sale;
      } catch (err) {
        const resp = err?.response?.data;
        if (resp?.errors) {
          const mensajes = Object.values(resp.errors).flat().join("\n");
          showError("⚠️ " + mensajes);
          return;
        }
        showError("❌ Error al cobrar. Revisa productos o stock.");
      }
    },
    [cart, refetchProducts, setCart, setTicketData, setShowTicket]
  );

  return {
    search,
    setSearch,
    products,
    cart,
    selectedVariation,
    selectedSize,

    setSelectedVariation,
    setSelectedSize,

    handleAdd,
    handleRemove,
    handleDecrease,
    handleSetQuantity,
    handleCheckout,
    refetchProducts,

    getAvailableStock,
    getQuantityInCart,
    getProductImage,
    getVariantImage, // ✅ nuevo para modal
    isVariantProduct,

    getSelectedVariant,
    getCartKey,
    posLocationId,
  };
}
