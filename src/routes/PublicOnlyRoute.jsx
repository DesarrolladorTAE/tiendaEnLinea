import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, sessionLoaded } = useSelector((state) => state.user);
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!sessionLoaded) return null; // 👈 No renderizar nada hasta que cargue la sesión

  if ((isAuthenticated || token) && location.pathname === "/loginmui") {
    return <Navigate to="/home-fashion-three" replace />;
  }

  return children;
};

export default PublicOnlyRoute;
