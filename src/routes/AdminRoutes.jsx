import React from "react";

import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminRoutes = () => {
  const { user, sessionLoaded } = useSelector((state) => state.user);

  // Evita flicker/redirecciones hasta cargar sesión
  if (!sessionLoaded) return null; // o un spinner

  if (!user) return <Navigate to="/loginmui" />;
  if (!["admin", "superadmin"].includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};



export default AdminRoutes;
