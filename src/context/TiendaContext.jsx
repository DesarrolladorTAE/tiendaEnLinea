// TiendaContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import axiosClient from "../config/axiosClient";

// ✅ valor por defecto para que useContext NUNCA sea undefined
const TiendaContext = createContext({ tienda: null, loading: false });

export const TiendaProvider = ({ children }) => {
  const [tienda, setTienda] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosClient.get("/perfil/mi-tienda");
        setTienda(data);
      } catch (error) {
        console.error("❌ No se pudo cargar la tienda:", error);
        setTienda(null);            // 401 / error -> sin tienda
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <TiendaContext.Provider value={{ tienda, loading }}>
      {children}
    </TiendaContext.Provider>
  );
};

// ✅ aunque falte el Provider, devuelve un objeto seguro
export const useTienda = () => {
  const ctx = useContext(TiendaContext);
  return ctx ?? { tienda: null, loading: false };
};
