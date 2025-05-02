import { useState, useEffect } from "react";
import axiosClient from "../../config/axiosClientPOS";

export function usePOSLogic() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState({});
  const [selectedSize, setSelectedSize] = useState({});

  useEffect(() => {
    axiosClient.get("my-products")
      .then(({ data }) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  const isVariantProduct = (product) => Array.isArray(product.variation) && product.variation.length > 0;

  const getProductImage = (product) =>
    Array.isArray(product.image) && product.image.length > 0 ? product.image[0] : null;

  const getAvailableStock = (product) => {
    if (typeof product.stock === "number") return product.stock;
    if (product.variation && product.size) {
      const matchSize = product.variation.size.find((s) => s.name === product.size);
      return matchSize?.stock || 0;
    }
    return 0;
  };

  const getQuantityInCart = (id) => {
    return cart.find((item) => item.id === id)?.quantity || 0;
  };

  const handleAdd = (product) => {
    const availableStock = getAvailableStock(product);
    setCart((prev) => {
      const index = prev.findIndex((item) => item.id === product.id);
      if (index !== -1) {
        const updated = [...prev];
        if (updated[index].quantity >= availableStock) return prev;
        updated[index].quantity += 1;
        return updated;
      } else {
        if (availableStock < 1) return prev;
        return [...prev, { ...product, quantity: 1, originalId: product.originalId || product.id }];
      }
    });
  };

  const handleDecrease = (id) => {
    setCart((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;
  
      const updated = [...prev];
      if (updated[index].quantity > 1) {
        updated[index].quantity -= 1;
        return updated;
      } else {
        return prev.filter((item) => item.id !== id);
      }
    });
  };

  const handleRemove = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = async () => {
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
          product_id: parseInt(productId),
          variation_size_id: variationSizeId,
          quantity: item.quantity,
        };
      }),
    };

    try {
      await axiosClient.post("/sales", payload);
      setCart([]);
      alert("Venta registrada correctamente.");
    } catch (error) {
      const response = error.response?.data;
      if (response?.errors?.stock) {
        alert("⚠️ Error de stock:\n" + response.errors.stock.join("\n"));
      } else {
        alert("Error al cobrar. Revisa productos o stock.");
      }
    }
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
    handleCheckout,
    getAvailableStock,
    getQuantityInCart,
    getProductImage,
    isVariantProduct,
  };
}