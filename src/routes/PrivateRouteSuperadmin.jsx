import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRouteSuperadmin = () => {
  const token = sessionStorage.getItem("SUPERADMIN_TOKEN");
  return token ? <Outlet /> : <Navigate to="/login-register" />;
};

export default PrivateRouteSuperadmin;
