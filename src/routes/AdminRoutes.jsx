import React from "react";

import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminRoutes = () => {
  const { user } = useSelector((state) => state.user);

  if (!user) return <Navigate to="/loginmui" />;
  if (user.role !== "superadmin") return <Navigate to="/" />;

  return <Outlet />;
};

export default AdminRoutes;
