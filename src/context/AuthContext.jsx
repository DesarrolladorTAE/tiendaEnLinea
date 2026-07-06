// src/context/AuthContext.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import axiosClient from "../config/axiosClient";

const AuthContext = createContext({
  user: null,
  storeId: null,
  permissions: {},
  loadingUser: true,
  reloadUser: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const loadUser = useCallback(async () => {
    setLoadingUser(true);

    try {
      const token = localStorage.getItem("AUTH_TOKEN");

      if (!token) {
        setUser(null);
        return;
      }

      const { data } = await axiosClient.get("/perfil/mi-tienda");
      setUser(data);
    } catch (error) {
      console.error("Error cargando usuario:", error);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const value = useMemo(
    () => ({
      user,
      storeId: user?.id ? Number(user.id) : null,
      permissions: user?.permissions ?? {},
      loadingUser,
      reloadUser: loadUser,
    }),
    [user, loadingUser, loadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);