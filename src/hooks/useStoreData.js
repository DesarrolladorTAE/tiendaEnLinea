import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../config/axiosClient";

export const useStoreData = (storeSlug) => {
  const [isStoreValid, setIsStoreValid] = useState(null);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const [storePhone, setStorePhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [validatedSlug, setValidatedSlug] = useState(null);

  // Verificar tienda
  useEffect(() => {
    let alive = true;
    setIsStoreValid(null);
    setValidatedSlug(null);
    setLoadingProducts(true);
    setProductsError(null);
    setProducts([]);
    const validateStore = async () => {
      try {
        const { data } = await axiosClient.get(`/verificar-tienda/${storeSlug}`, {
          skipAuth: true,
        });

        if (!alive) return;
        if (data.valid) {
          setValidatedSlug(storeSlug);
          setIsStoreValid(true);
          setStorePhone(data.telefono_whatsapp || "");
          setStoreName(data.nombre || "");
        } else {
          navigate("/");
        }
      } catch (error) {
        if (!alive) return;
        console.error("Error al verificar tienda:", error);
        navigate("/");
      }
    };
    validateStore();
    return () => { alive = false; };
  }, [storeSlug, navigate]);

  // Obtener productos si la tienda es válida
  useEffect(() => {
    if (!isStoreValid || validatedSlug !== storeSlug) return;
    let alive = true;
    setLoadingProducts(true);

    const fetchProducts = async () => {
      try {
        const { data } = await axiosClient.get(`/tienda/${storeSlug}/products`, {
          skipAuth: true,
        });
        if (alive) setProducts(Array.isArray(data) ? data : data?.data || []);
      } catch (error) {
        if (!alive) return;
        console.error("Error al cargar productos desde la API:", error);
        setProductsError("No se pudieron cargar los productos. Intenta recargar la página.");
      } finally {
        if (alive) setLoadingProducts(false);
      }
    };

    fetchProducts();
    return () => { alive = false; };
  }, [isStoreValid, storeSlug, validatedSlug]);

  return { isStoreValid, products, storePhone, storeName, loadingProducts: loadingProducts || validatedSlug !== storeSlug, productsError };
};
