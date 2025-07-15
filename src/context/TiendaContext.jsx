import { createContext, useContext, useEffect, useState } from "react";
import axiosClient from "../config/axiosClient";

const TiendaContext = createContext();

export const TiendaProvider = ({ children }) => {
  const [tienda, setTienda] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarTienda = async () => {
      try {
        const { data } = await axiosClient.get("/perfil/mi-tienda");
        setTienda(data);
      } catch (error) {
        console.error("❌ No se pudo cargar la tienda:", error);
        setTienda(null);
      } finally {
        setLoading(false);
      }
    };

    cargarTienda();
  }, []);

  return (
    <TiendaContext.Provider value={{ tienda, loading }}>
      {children}
    </TiendaContext.Provider>
  );
};

export const useTienda = () => useContext(TiendaContext);
