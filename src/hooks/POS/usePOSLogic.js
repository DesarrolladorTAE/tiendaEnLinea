// src/hooks/POS/usePOSLogic.js
import { useState, useEffect, useCallback, useRef } from "react";
import axiosClient from "../../config/axiosClientPOS";
import { showError, showSuccess } from "../../utils/alerts";
import { productStock, hasProductVariants, usesWarehouses, validateInventoryItems } from "../../utils/productInventory";
import { fetchPOSScope, fetchPOSProductPage, loadCartInventory } from "../../utils/posInventory";
import { notifyInventoryChanged, subscribeInventoryChanges } from "../../utils/inventoryEvents";

export function usePOSLogic({ setTicketData, setShowTicket, cart, setCart }) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const inventoryCache = useRef(new Map());
  const checkoutBusy = useRef(false);
  const requestSequence = useRef(0);
  const latestCart = useRef(cart);
  latestCart.current = cart;
  const currentQuery = useRef({ nextPage: 1, perPage: 12, categoryId: null });

  const [meta, setMeta] = useState({
    page: 1,
    per_page: 12,
    total: 0,
    last_page: 1,
  });
  const [page, setPage] = useState(1);

  const [selectedVariation, setSelectedVariation] = useState({});
  const [selectedSize, setSelectedSize] = useState({});

  const [posLocationId, setPosLocationId] = useState(
    Number(localStorage.getItem("POS_LOCATION_ID")) || null,
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

  // ✅ paginado + search + category
  const refetchProducts = useCallback(
    async ({ nextPage = 1, perPage = 12, categoryId = null, refreshCart = false } = {}) => {
      const request = ++requestSequence.current;
      currentQuery.current = { nextPage, perPage, categoryId };
      try {
        if (!posLocationId) {
          setProducts([]);
          setMeta({ page: 1, per_page: perPage, total: 0, last_page: 1 });
          setPage(1);
          return;
        }

        const allowedIds = await fetchPOSScope(axiosClient);
        const data = await fetchPOSProductPage(axiosClient, posLocationId, {
            page: Number(nextPage) || 1,
            per_page: Number(perPage) || 12,
            q: search || "",
            category_id: categoryId != null ? Number(categoryId) : undefined,
        }, allowedIds);
        if (request !== requestSequence.current) return;

        const cartProducts = refreshCart && latestCart.current.length
          ? await loadCartInventory(axiosClient, posLocationId, latestCart.current)
          : [];
        if (request !== requestSequence.current) return;
        const inventoryProducts = [...new Map([...data.products, ...cartProducts].map(product => [String(product.id), product])).values()];
        inventoryProducts.forEach(product => inventoryCache.current.set(String(product.id), product));
        setCart(previous => previous.map(item => {
          const product = inventoryProducts.find(p => String(p.id) === String(item.product_id));
          return product || refreshCart ? { ...item, stock_available: productStock(product, { variantId: item.variant_id, warehouseId: item.warehouse_id, activeOnly: true }) ?? 0 } : item;
        }));

        setProducts(data.products.map(product => inventoryCache.current.get(String(product.id)) || product));
        setMeta(
          data?.meta || {
            page: nextPage,
            per_page: perPage,
            total: 0,
            last_page: 1,
          },
        );
        setPage(nextPage);
      } catch (e) {
        if (request !== requestSequence.current) return;
        console.error("Error cargando productos POS:", e);
        setProducts([]);
        setMeta({ page: 1, per_page: perPage, total: 0, last_page: 1 });
        setPage(1);
      }
    },
    [posLocationId, search, setCart],
  );

  useEffect(() => {
    inventoryCache.current.clear();
    setCart([]);
    refetchProducts({ nextPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posLocationId]);

  useEffect(() => subscribeInventoryChanges(() => {
    inventoryCache.current.clear();
    refetchProducts({ ...currentQuery.current, refreshCart: true });
  }), [refetchProducts]);

  const isVariantProduct = hasProductVariants;

  const getProductImage = (product) => {
    // soporta: image: [url] o images: [{url}] (si tu backend manda relación images)
    if (Array.isArray(product?.image) && product.image.length > 0) {
      return product.image[0];
    }
    if (Array.isArray(product?.images) && product.images.length > 0) {
      const first = product.images[0];
      return first?.url || first?.image_url || first?.path || null;
    }
    return null;
  };

  const getAvailableStock = useCallback(product => productStock(product, { activeOnly: true }) ?? 0, []);

  const getQuantityInCart = (cartKey) =>
    cart.find((item) => String(item.cart_key ?? item.id) === String(cartKey))
      ?.quantity || 0;

  const handleAdd = (payload) => {
    const isCartItem =
      payload &&
      (payload.cart_key ||
        typeof payload.id === "string" ||
        payload.variant_id != null ||
        payload.warehouse_id != null) &&
      payload.product_id != null;

    // ✅ cuando viene un “cart item” armado desde ProductCard (con warehouse_id)
    if (isCartItem) {
      const item = payload;
      const key = String(item.cart_key ?? item.id);
      if (!key) return;
      const product = inventoryCache.current.get(String(item.product_id));
      const selectionError = validateInventoryItems([{ ...item, quantity: 1 }], product ? [product] : []);
      if (selectionError) { showError(selectionError); return; }

      setCart((prev) => {
        const idx = prev.findIndex((x) => String(x.cart_key ?? x.id) === key);
        const currentQty = idx >= 0 ? Number(prev[idx].quantity || 0) : 0;

        const stockDisponible = productStock(product, { variantId: item.variant_id, warehouseId: item.warehouse_id, activeOnly: true }) ?? 0;
        const nextQty = idx >= 0 ? currentQty + 1 : Number(item.quantity || 1);
        const inventoryError = validateInventoryItems([
          ...prev.filter((_, index) => index !== idx), { ...item, quantity: nextQty },
        ].filter(line => String(line.product_id) === String(product.id)), [product]);
        if (inventoryError) { showError(inventoryError); return prev; }

        if (Number.isFinite(stockDisponible) && nextQty > stockDisponible) {
          showError("⚠️ Stock insuficiente.");
          return prev;
        }

        if (idx === -1) {
          return [
            ...prev,
            {
              ...item,
              use_warehouse_inventory: usesWarehouses(product),
              stock_available: stockDisponible,
              id: key,
              cart_key: key,
              quantity: nextQty,
              display_name: item.display_name || item.name,
              original_price:
                item.original_price ??
                item.price_original ??
                item.original ??
                item.price,
              price: Number(item.price || 0),
            },
          ];
        }

        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          ...item,
          stock_available: stockDisponible,
          use_warehouse_inventory: usesWarehouses(product),
          id: key,
          cart_key: key,
          quantity: nextQty,
          display_name:
            item.display_name ||
            item.name ||
            copy[idx].display_name ||
            copy[idx].name,
          original_price:
            item.original_price ??
            item.price_original ??
            copy[idx].original_price ??
            copy[idx].price_original ??
            copy[idx].price,
          price: Number(item.price ?? copy[idx].price ?? 0),
        };
        return copy;
      });

      return;
    }

    // ❗️si llega “product” directo (por escáner o click antiguo), mantenemos compatibilidad mínima
    // pero RECOMENDACIÓN: en multi-almacén siempre armar el item desde ProductCard.
    const product = payload;
    if (hasProductVariants(product) || usesWarehouses(product)) {
      showError("Selecciona la variante y el almacén desde el detalle del producto.");
      return;
    }
    if (getAvailableStock(product) < 1) { showError("Stock insuficiente."); return; }

    setCart((prevCart) => {
      const key = String(product?.id);
      if (!key) return prevCart;

      const stockDisponible = Number(getAvailableStock(product)) || 0;
      const unitPrice = Number(product?.price ?? 0);

      const existing = prevCart.find(
        (i) => String(i.cart_key ?? i.id) === String(key),
      );
      if (existing) {
        const nuevaCantidad = Number(
          (Number(existing.quantity || 0) + 1).toFixed(2),
        );
        if (nuevaCantidad > stockDisponible) {
          showError("⚠️ Stock insuficiente.");
          return prevCart;
        }
        return prevCart.map((i) =>
          String(i.cart_key ?? i.id) === String(key)
            ? { ...i, quantity: nuevaCantidad }
            : i,
        );
      }

      return [
        ...prevCart,
        {
          id: key,
          cart_key: key,
          product_id: Number(product.id),
          variant_id: null,
          name: product.name,
          display_name: product.name,
          price_original: Number(product.price ?? unitPrice),
          original_price: Number(product.price ?? unitPrice),
          discount: Number(product.discount ?? 0),
          price: Number(unitPrice),
          quantity: 1,
          has_variants: !!product.has_variants,
          warehouse_id: null,
          warehouse_name: null,
          stock_available: Number(stockDisponible) || 0,
        },
      ];
    });
  };

  const handleDecrease = (cartKey) => {
    const key = String(cartKey);
    setCart((prev) => {
      const index = prev.findIndex(
        (item) => String(item.cart_key ?? item.id) === key,
      );
      if (index === -1) return prev;

      const updated = [...prev];
      if (Number(updated[index].quantity) > 1) {
        updated[index].quantity = Number(
          (Number(updated[index].quantity) - 1).toFixed(2),
        );
        return updated;
      }
      return prev.filter((item) => String(item.cart_key ?? item.id) !== key);
    });
  };

  const handleRemove = (cartKey) => {
    const key = String(cartKey);
    setCart((prev) =>
      prev.filter((item) => String(item.cart_key ?? item.id) !== key),
    );
  };

  const handleCheckout = useCallback(
    async (checkoutPayloadFromCart) => {
      if (!cart || cart.length === 0 || checkoutBusy.current) return;

      const sourceItems = Array.isArray(checkoutPayloadFromCart?.items)
        ? checkoutPayloadFromCart.items
        : cart;

      const items = sourceItems.map((item) => ({
        product_id: Number(
          item.product_id ?? String(item.cart_key ?? item.id).split("-v")[0],
        ),

        variant_id: item.variant_id != null ? Number(item.variant_id) : null,

        quantity: Number(item.quantity).toFixed(3),

        unit_price: Number(item.unit_price ?? item.price).toFixed(6),

        original_price: Number(
          item.original_price ?? item.price_original ?? item.price,
        ).toFixed(6),

        discount_percent: Number(
          item.discount_percent ?? item.discount ?? 0,
        ).toFixed(2),

        warehouse_id: item.warehouse_id ?? null,

        worker_id: item.worker_id ?? null,
      }));

      const payments = Array.isArray(checkoutPayloadFromCart?.payments)
        ? checkoutPayloadFromCart.payments
        : [];

      const eff = payments.find((p) => p?.method === "efectivo");

      const rawCashReceived =
        eff?.cash_received ?? eff?.efectivo_recibido ?? eff?.recibido ?? null;

      const totalAmount = Number(
        checkoutPayloadFromCart?.total_amount ?? 0,
      ).toFixed(6);

      const normalizedPayments = payments.map((payment) => ({
        ...payment,

        amount: Number(payment?.amount ?? 0).toFixed(6),
      }));

      const payload = {
        total_amount: totalAmount,
        client_id: checkoutPayloadFromCart?.client_id ?? null,

        items,
        payments: normalizedPayments,

        is_pending_sale: checkoutPayloadFromCart?.is_pending_sale ?? false,

        pending_has_advance:
          checkoutPayloadFromCart?.pending_has_advance ?? false,

        pending_due_at: checkoutPayloadFromCart?.pending_due_at ?? null,

        pending_note: checkoutPayloadFromCart?.pending_note ?? "",

        is_credit_sale: checkoutPayloadFromCart?.is_credit_sale ?? false,

        credit_due_at: checkoutPayloadFromCart?.credit_due_at ?? null,
      };

      try {
        checkoutBusy.current = true;
        const freshProducts = await loadCartInventory(axiosClient, posLocationId, items);
        freshProducts.forEach(product => inventoryCache.current.set(String(product.id), product));
        setCart(previous => previous.map(item => {
          const product = freshProducts.find(p => String(p.id) === String(item.product_id));
          return { ...item, stock_available: productStock(product, { variantId: item.variant_id, warehouseId: item.warehouse_id, activeOnly: true }) ?? 0 };
        }));
        const inventoryError = validateInventoryItems(items, freshProducts);
        if (inventoryError) { showError(inventoryError); return; }
        const saleResponse = await axiosClient.post("/v2/sales", payload);
        const { sale, message } = saleResponse.data;

        setCart([]);
        notifyInventoryChanged();
        await refetchProducts({ nextPage: 1 });

        setTicketData(sale);
        showSuccess(`✅ ${message}`);
        setShowTicket(true);

        return sale;
      } catch (err) {
        const resp = err?.response?.data;
        await refetchProducts(currentQuery.current);
        if (resp?.errors) {
          const mensajes = Object.values(resp.errors).flat().join("\n");
          showError("⚠️ " + mensajes);
          return;
        }
        showError("❌ Error al cobrar. Revisa productos o stock.");
      } finally {
        checkoutBusy.current = false;
      }
    },
    [cart, posLocationId, refetchProducts, setCart, setTicketData, setShowTicket],
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
    handleCheckout,
    refetchProducts,

    getAvailableStock,
    getQuantityInCart,
    getProductImage,
    isVariantProduct,
    posLocationId,
  };
}
