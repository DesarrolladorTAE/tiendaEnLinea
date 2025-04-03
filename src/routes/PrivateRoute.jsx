import { Navigate } from "react-router-dom";
import React from "react";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("store_token");
  const store = JSON.parse(localStorage.getItem("store_data") || "{}");

  if (!token || !store.verified) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
