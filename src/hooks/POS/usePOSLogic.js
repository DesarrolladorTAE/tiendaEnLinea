// src/hooks/POS/usePOSLogic.js
import { useState, useEffect, useCallback } from "react";
import axiosClient from "../../config/axiosClientPOS";
import { showError, showSuccess } from "../../utils/alerts";

export function usePOSLogic({ setTicketData, setShowTicket, cart, setCart }) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState(null);
  const [selectedVariation, setSelectedVariation] = useState({});
  const [selectedSize, setSelectedSize] = useState({});

  // --- Cargar/recargar productos ---
  const refetchProducts = useCallback(async () => {
    try {
      const { data } = await axiosClient.get("my-products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    refetchProducts();
  }, [refetchProducts]);

  // --- Utilidades de producto/stock ---
  const isVariantProduct = (product) =>
    Array.isArray(product?.variation) && product.variation.length > 0;

  const getProductImage = (product) =>
    Array.isArray(product?.image) && product.image.length > 0
      ? product.image[0]
      : null;

  const getAvailableStock = (product) => {
    if (typeof product?.stock === "number") return product.stock;
    if (product?.variation && product?.size) {
      const matchSize = product.variation.size?.find(
        (s) => s.name === product.size
      );
      return matchSize?.stock || 0;
    }
    return 0;
  };

  const getQuantityInCart = (id) =>
    cart.find((item) => item.id === id)?.quantity || 0;

  // --- Manipulación del carrito ---
  const handleAdd = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      const descuento = product.discount ?? 0;
      const precioConDescuento = parseFloat(
        (product.price * (1 - descuento / 100)).toFixed(2)
      );

      const stockDisponible = parseFloat(getAvailableStock(product));

      if (existingItem) {
        const cantidadActual = parseFloat(existingItem.quantity);
        const nuevaCantidad = parseFloat((cantidadActual + 1).toFixed(2));
        if (nuevaCantidad > stockDisponible) {
          showError("⚠️ Stock insuficiente.");
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: nuevaCantidad } : item
        );
      } else {
        return [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            price_original: product.price, // guardamos original
            discount: descuento,
            price: precioConDescuento, // unit_price ya con descuento
            quantity: 1,
            variation: product.variation,
            size: product.size,
          },
        ];
      }
    });
  };

  const handleSetQuantity = (product, nuevaCantidad) => {
    const stockDisponible = parseFloat(getAvailableStock(product));
    if (nuevaCantidad > stockDisponible) {
      showError("⚠️ Stock insuficiente.");
      return;
    }
    if (!nuevaCantidad || nuevaCantidad <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== product.id));
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: parseFloat(nuevaCantidad.toFixed(2)) }
          : item
      )
    );
  };

  const handleDecrease = (id) => {
    setCart((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;
      const updated = [...prev];
      if (updated[index].quantity > 1) {
        updated[index].quantity = parseFloat(
          (updated[index].quantity - 1).toFixed(2)
        );
        return updated;
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleRemove = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // --- Checkout: crea la venta, refresca productos y retorna 'sale' ---
  // Recibe { total_amount, payments } calculado en el Cart
  const handleCheckout = useCallback(
    async (checkoutPayloadFromCart) => {
      if (!cart || cart.length === 0) return;

      // Re-map de items para IDs correctos y campos esperados por el backend
      const items = cart.map((item) => {
        // a veces id viene como "123-xyz"
        const [productId] = String(item.id).split("-");
        let variationSizeId = null;
        if (item.variation?.size && item.size) {
          const match = item.variation.size.find((s) => s.name === item.size);
          variationSizeId = match ? match.id ?? null : null;
        }
        return {
          product_id: parseInt(productId, 10),
          variation_size_id: variationSizeId,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.price), // precio ya con descuento
          original_price:
            parseFloat(
              item.price_original ??
                item.original_price ??
                item.base_price ??
                item.original ??
                item.originalPrice
            ) || parseFloat(item.price),
          discount_percent: parseFloat(item.discount ?? 0),
        };
      });

      // Normalizar efectivo recibido a partir de payments
      const payments = checkoutPayloadFromCart.payments || [];
      const eff = payments.find((p) => p?.method === "efectivo");
      const rawCashReceived =
        eff?.cash_received ??
        eff?.efectivo_recibido ??
        eff?.recibido ??
        eff?.amount ??  
        null;

      const totalAmount = +checkoutPayloadFromCart.total_amount.toFixed(2);

      const cashReceived =
        rawCashReceived != null && Number.isFinite(Number(rawCashReceived))
          ? +Number(rawCashReceived).toFixed(2)
          : null;

      const change =
        cashReceived != null
          ? Math.max(0, +(cashReceived - totalAmount).toFixed(2))
          : 0;

      const payload = {
        total_amount: totalAmount,
        items,
        payments,
        ...(cashReceived != null
          ? {
              cash_received: cashReceived,        // alias a nivel raíz
              efectivo_recibido: cashReceived,    // alias a nivel raíz
            }
          : {}),
        change, // si backend lo usa, lo mostrará; de lo contrario lo ignora
      };

      try {
        const saleResponse = await axiosClient.post("/sales", payload);
        const { sale, message } = saleResponse.data;

        // Limpiar carrito y refrescar catálogo/stock sin recargar la página
        setCart([]);
        await refetchProducts();

        // Ticket
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
    // state
    search,
    setSearch,
    products,
    cart,
    selectedVariation,
    selectedSize,

    // setters
    setSelectedVariation,
    setSelectedSize,

    // actions
    handleAdd,
    handleRemove,
    handleDecrease,
    handleSetQuantity,
    handleCheckout, // ← retorna 'sale'
    refetchProducts, // ← por si quieres refrescar desde el componente

    // utils
    getAvailableStock,
    getQuantityInCart,
    getProductImage,
    isVariantProduct,
  };
}
