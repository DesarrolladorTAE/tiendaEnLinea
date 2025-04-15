import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../config/axiosClient";

export const useStoreData = (storeSlug) => {
  const [isStoreValid, setIsStoreValid] = useState(null);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  // Verificar tienda
  useEffect(() => {
    const validateStore = async () => {
      try {
        const { data } = await axiosClient.get(`/verificar-tienda/${storeSlug}`, {
          skipAuth: true,
        });

        if (data.valid) {
          setIsStoreValid(true);
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error al verificar tienda:", error);
        navigate("/");
      }
    };
    validateStore();
  }, [storeSlug, navigate]);

  // Obtener productos si la tienda es válida
  useEffect(() => {
    if (!isStoreValid) return;

    const fetchProducts = async () => {
      try {
        const { data } = await axiosClient.get(`/tienda/${storeSlug}/products`, {
          skipAuth: true,
        });
        setProducts(data);
      } catch (error) {
        console.error("Error al cargar productos desde la API:", error);
      }
    };

    fetchProducts();
  }, [isStoreValid, storeSlug]);

  return { isStoreValid, products };
};
