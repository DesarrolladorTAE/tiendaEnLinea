// src/hooks/POS/usePOSLogic.js
import { useState, useEffect, useCallback } from "react";
import axiosClient from "../../config/axiosClientPOS";
import { showError, showSuccess } from "../../utils/alerts";

export function usePOSLogic({ setTicketData, setShowTicket, cart, setCart }) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);

  const [meta, setMeta] = useState({ page: 1, per_page: 12, total: 0, last_page: 1 });
  const [page, setPage] = useState(1);

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

  // ✅ paginado + search + category
const refetchProducts = useCallback(
  async ({ nextPage = 1, perPage = 12, categoryId = null } = {}) => {
    try {
      if (!posLocationId) {
        setProducts([]);
        setMeta({ page: 1, per_page: perPage, total: 0, last_page: 1 });
        setPage(1);
        return;
      }

      const { data } = await axiosClient.get("my-products-by-pos1", {
        params: {
          pos_location_id: posLocationId,
          page: nextPage,
          per_page: perPage,
          q: search || "",
          category_id: categoryId || undefined,
        },
      });

      setProducts(Array.isArray(data?.products) ? data.products : []);
      setMeta(data?.meta || { page: nextPage, per_page: perPage, total: 0, last_page: 1 });
      setPage(nextPage);
    } catch (e) {
      console.error("Error cargando productos POS:", e);
      setProducts([]);
      setMeta({ page: 1, per_page: perPage, total: 0, last_page: 1 });
      setPage(1);
    }
  },
  [posLocationId, search]
);
  useEffect(() => {
    refetchProducts({ nextPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posLocationId]);

  const isVariantProduct = (product) => !!product?.has_variants;

  const getProductImage = (product) => {
    if (Array.isArray(product?.image) && product.image.length > 0) {
      return product.image[0];
    }
    return null;
  };

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

      const rows = Array.isArray(product.warehouse_inventories) ? product.warehouse_inventories : [];
      return rows.reduce((acc, r) => acc + (Number(r.qty) || 0), 0);
    },
    [getSelectedVariant]
  );

  const getQuantityInCart = (cartKey) =>
    cart.find((item) => String(item.cart_key ?? item.id) === String(cartKey))?.quantity || 0;

  const getCartKey = useCallback(
    (product) => {
      if (!product) return null;
      if (!product.has_variants) return String(product.id);

      const v = getSelectedVariant(product);
      if (!v) return String(product.id);
      return `${product.id}-v${v.id}`;
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

  const handleAdd = (payload) => {
    const isCartItem =
      payload &&
      (payload.cart_key || typeof payload.id === "string" || payload.variant_id != null || payload.warehouse_id != null) &&
      payload.product_id != null;

    if (isCartItem) {
      const item = payload;
      const key = String(item.cart_key ?? item.id);
      if (!key) return;

      setCart((prev) => {
        const idx = prev.findIndex((x) => String(x.cart_key ?? x.id) === key);
        const currentQty = idx >= 0 ? Number(prev[idx].quantity || 0) : 0;

        const stockDisponible = Number(item.stock_available ?? item.stockDisponible ?? item.available_stock ?? Infinity);
        const nextQty = currentQty + 1;

        if (Number.isFinite(stockDisponible) && nextQty > stockDisponible) {
          showError("⚠️ Stock insuficiente.");
          return prev;
        }

        if (idx === -1) {
          return [
            ...prev,
            {
              ...item,
              id: key,
              cart_key: key,
              quantity: item.quantity ? Number(item.quantity) : 1,
              display_name: item.display_name || item.name,
              original_price: item.original_price ?? item.price_original ?? item.original ?? item.price,
              price: Number(item.price || 0),
            },
          ];
        }

        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          ...item,
          id: key,
          cart_key: key,
          quantity: nextQty,
          display_name: item.display_name || item.name || copy[idx].display_name || copy[idx].name,
          original_price:
            item.original_price ?? item.price_original ?? copy[idx].original_price ?? copy[idx].price_original ?? copy[idx].price,
          price: Number(item.price ?? copy[idx].price ?? 0),
        };
        return copy;
      });

      return;
    }

    const product = payload;

    setCart((prevCart) => {
      const key = getCartKey(product);
      if (!key) return prevCart;

      const stockDisponible = Number(getAvailableStock(product)) || 0;
      const unitPrice = getUnitPrice(product);

      const existing = prevCart.find((i) => String(i.cart_key ?? i.id) === String(key));

      if (existing) {
        const nuevaCantidad = Number((Number(existing.quantity || 0) + 1).toFixed(2));
        if (nuevaCantidad > stockDisponible) {
          showError("⚠️ Stock insuficiente.");
          return prevCart;
        }
        return prevCart.map((i) =>
          String(i.cart_key ?? i.id) === String(key) ? { ...i, quantity: nuevaCantidad } : i
        );
      }

      const v = product.has_variants ? getSelectedVariant(product) : null;

      return [
        ...prevCart,
        {
          id: key,
          cart_key: key,
          product_id: Number(product.id),
          variant_id: v ? Number(v.id) : null,
          name: product.name,
          display_name: v ? `${product.name} - ${v.name ?? v.sku ?? v.id}` : product.name,
          price_original: Number(v?.price ?? product.price ?? unitPrice),
          original_price: Number(v?.price ?? product.price ?? unitPrice),
          discount: Number(product.discount ?? 0),
          price: Number(unitPrice),
          quantity: 1,
          has_variants: !!product.has_variants,
          warehouse_id: null,
          warehouse_name: null,
        },
      ];
    });
  };

  const handleSetQuantity = (payloadOrProduct, nuevaCantidad) => {
    const key =
      payloadOrProduct?.cart_key ||
      (payloadOrProduct?.product_id != null
        ? String(payloadOrProduct.id ?? payloadOrProduct.cart_key)
        : getCartKey(payloadOrProduct));

    if (!key) return;

    const isProduct = payloadOrProduct && payloadOrProduct.id != null && payloadOrProduct.product_id == null;
    const stockDisponible = isProduct ? Number(getAvailableStock(payloadOrProduct)) || 0 : Infinity;

    if (Number(nuevaCantidad) > stockDisponible) {
      showError("⚠️ Stock insuficiente.");
      return;
    }

    if (!nuevaCantidad || Number(nuevaCantidad) <= 0) {
      setCart((prev) => prev.filter((item) => String(item.cart_key ?? item.id) !== String(key)));
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        String(item.cart_key ?? item.id) === String(key)
          ? { ...item, quantity: Number(Number(nuevaCantidad).toFixed(2)) }
          : item
      )
    );
  };

  const handleDecrease = (cartKey) => {
    const key = String(cartKey);
    setCart((prev) => {
      const index = prev.findIndex((item) => String(item.cart_key ?? item.id) === key);
      if (index === -1) return prev;

      const updated = [...prev];
      if (Number(updated[index].quantity) > 1) {
        updated[index].quantity = Number((Number(updated[index].quantity) - 1).toFixed(2));
        return updated;
      }
      return prev.filter((item) => String(item.cart_key ?? item.id) !== key);
    });
  };

  const handleRemove = (cartKey) => {
    const key = String(cartKey);
    setCart((prev) => prev.filter((item) => String(item.cart_key ?? item.id) !== key));
  };

  const handleCheckout = useCallback(
    async (checkoutPayloadFromCart) => {
      if (!cart || cart.length === 0) return;

      const items = cart.map((item) => ({
        product_id: Number(item.product_id ?? String(item.cart_key ?? item.id).split("-v")[0]),
        variant_id: item.variant_id ? Number(item.variant_id) : null,
        quantity: Number(item.quantity),
        unit_price: Number(item.price),
        original_price: Number(item.original_price ?? item.price_original ?? item.price),
        discount_percent: Number(item.discount ?? 0),
        warehouse_id: item.warehouse_id ?? null,
      }));

      const payments = checkoutPayloadFromCart.payments || [];
      const eff = payments.find((p) => p?.method === "efectivo");

      const rawCashReceived =
        eff?.cash_received ?? eff?.efectivo_recibido ?? eff?.recibido ?? null;

      const totalAmount = +checkoutPayloadFromCart.total_amount.toFixed(2);

      const cashReceived =
        rawCashReceived != null && Number.isFinite(Number(rawCashReceived))
          ? +Number(rawCashReceived).toFixed(2)
          : null;

      const normalizedPayments = payments.map((p) => {
        if (p?.method !== "efectivo") return p;
        return cashReceived != null ? { ...p, amount: cashReceived } : p;
      });

      const payload = {
        total_amount: totalAmount,
        items,
        payments: normalizedPayments,
      };

      try {
        const saleResponse = await axiosClient.post("/v2/sales", payload);
        const { sale, message } = saleResponse.data;

        setCart([]);
        await refetchProducts({ nextPage: 1 });

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
    meta,
    page,
    setPage,

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
    getVariantImage,
    isVariantProduct,

    getSelectedVariant,
    getCartKey,
    posLocationId,
  };
}