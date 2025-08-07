import { useState, useEffect } from "react";
import axiosClient from "../../config/axiosClientPOS";
import { showError, showSuccess } from "../../utils/alerts"; // Adjust the path if necessary

export function usePOSLogic({ setTicketData, setShowTicket, cart, setCart }) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState(null);
  const [selectedVariation, setSelectedVariation] = useState({});
  const [selectedSize, setSelectedSize] = useState({});

  useEffect(() => {
    axiosClient
      .get("my-products")
      .then(({ data }) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  const isVariantProduct = (product) =>
    Array.isArray(product.variation) && product.variation.length > 0;

  const getProductImage = (product) =>
    Array.isArray(product.image) && product.image.length > 0
      ? product.image[0]
      : null;

  const getAvailableStock = (product) => {
    if (typeof product.stock === "number") return product.stock;
    if (product.variation && product.size) {
      const matchSize = product.variation.size.find((s) => s.name === product.size);
      return matchSize?.stock || 0;
    }
    return 0;
  };

  const getQuantityInCart = (id) =>
    cart.find((item) => item.id === id)?.quantity || 0;

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
          item.id === product.id
            ? { ...item, quantity: nuevaCantidad }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            price_original: product.price,
            discount: descuento,
            price: precioConDescuento,
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
        updated[index].quantity = parseFloat((updated[index].quantity - 1).toFixed(2));
        return updated;
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleRemove = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = async (paymentInfo) => {
    if (cart.length === 0) return;

    const payload = {
      items: cart.map((item) => {
        const [productId] = item.id.split("-");
        let variationSizeId = null;
        if (item.variation?.size && item.size) {
          const match = item.variation.size.find((s) => s.name === item.size);
          variationSizeId = match?.id ?? null;
        }
        return {
          product_id: parseInt(productId, 10),
          variation_size_id: variationSizeId,
          quantity: item.quantity,
          unit_price: item.price,
        };
      }),
      payment_method: paymentInfo.payment_method,
      total_amount: paymentInfo.total_amount,
      paid_amount: paymentInfo.paid_amount,
      // ✅ Solo si es tarjeta
      ...(["td", "tc", "transferencia"].includes(paymentInfo.payment_method)
        ? {
          referencia: paymentInfo.referencia?.toString().trim(),
          ultimos_4: paymentInfo.ultimos_4?.toString().trim(),
        }
        : {}),

    };


    let saleResponse;
    try {
      saleResponse = await axiosClient.post("/sales", payload);
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.errors) {
        const mensajes = Object.values(resp.errors).flat().join("\n");
        return showError("⚠️ " + mensajes);
      }

      return showError("❌ Error al cobrar. Revisa productos o stock.");
    }

    const { sale, message } = saleResponse.data;
    setCart([]);
    setTicketData(sale);

    await showSuccess(`✅ ${message}`); // ✅ se espera el click del usuario
    setShowTicket(true); // 👉 solo después de dar "Aceptar"
  };


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
    getAvailableStock,
    getQuantityInCart,
    getProductImage,
    isVariantProduct,
  };
}
