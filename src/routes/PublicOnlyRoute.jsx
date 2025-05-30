import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, sessionLoaded } = useSelector((state) => state.user);
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!sessionLoaded) return null;

  if ((isAuthenticated || token) && location.pathname === "/loginmui") {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const role = storedUser?.role;

    if (role === "admin" || role === "superadmin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    return <Navigate to="/home-fashion-three" replace />;
  }

  return children;
};

export default PublicOnlyRoute;
