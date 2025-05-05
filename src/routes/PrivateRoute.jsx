import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import axiosClient from "../config/axiosClient";

const PrivateRoute = () => {
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("AUTH_TOKEN");
        if (!token) throw new Error("No token");

        // Verifica el token en tu backend
        await axiosClient.get("user"); // Asegúrate que esta ruta esté protegida por Sanctum

        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (checking) return <div>Cargando...</div>;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login-register" replace />;
};

export default PrivateRoute;
