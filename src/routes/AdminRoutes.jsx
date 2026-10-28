import AppLoading from '../components/loading/AppLoading';
import React from "react";

import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminRoutes = () => {
  const { user, sessionLoaded } = useSelector((state) => state.user);

  // Evita flicker/redirecciones hasta cargar sesión
  if (!sessionLoaded) return <AppLoading label="Recuperando tu sesión" />; // o un spinner

  if (!user) return <Navigate to="/iniciar-sesion" />;
  if (!["admin", "superadmin"].includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};



export default AdminRoutes;
