// src/routes/SuperadminRouteConfig.js
import React, { lazy } from "react";
import { Navigate } from "react-router-dom";

const Dashboard = lazy(() => import("../pages/superadmin/Dashboard"));
const Usuarios = lazy(() => import("../pages/superadmin/Usuarios"));
const Tiendas = lazy(() => import("../pages/superadmin/Tiendas"));
const Soporte = lazy(() => import("../pages/superadmin/Soporte"));

export const superadminRouteConfig = [
  { path: "", element: <Navigate to="dashboard" replace /> },
  { path: "dashboard", element: <Dashboard /> },
  { path: "usuarios", element: <Usuarios /> },
  { path: "tiendas", element: <Tiendas /> },
  { path: "soporte", element: <Soporte /> }
];
