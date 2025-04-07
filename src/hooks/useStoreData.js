import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const useStoreData = (storeSlug) => {
  const [isStoreValid, setIsStoreValid] = useState(null);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  // Verificar tienda
  useEffect(() => {
    const validateStore = async () => {
      try {
        const res = await fetch(`https://mitiendaenlineamx.com.mx/api/verify-store/${storeSlug}`);
        const data = await res.json();
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
  }, [storeSlug]);

  // Obtener productos si la tienda es válida
  useEffect(() => {
    if (!isStoreValid) return;

    const fetchProducts = async () => {
      try {
        const response = await fetch("https://mitiendaenlineamx.com.mx/api/products", {
          headers: {
            "X-Store-Name": "Tienda Zapatos MX",
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok) {
          setProducts(data);
        } else {
          console.error("Error del servidor:", data.error || data);
        }
      } catch (error) {
        console.error("Error al cargar productos desde la API:", error);
      }
    };

    fetchProducts();
  }, [isStoreValid, storeSlug]);

  return { isStoreValid, products };
};
