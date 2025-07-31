// src/routes/SuperadminRouteConfig.js
import React, { lazy } from "react";
import { Navigate } from "react-router-dom";

const Dashboard = lazy(() => import("../pages/superadmin/Dashboard"));
const Vista = lazy(() => import("../pages/superadmin/VistaSuscripcionesSuperAdmin"));
const Notificaciones = lazy(() => import("../pages/superadmin/Notificaciones"));
// const Usuarios = lazy(() => import("../pages/superadmin/Usuarios"));
const Tiendas = lazy(() => import("../pages/superadmin/Tiendas"));
// const Soporte = lazy(() => import("../pages/superadmin/Soporte"));
const VentasSA = lazy(() => import("../pages/superadmin/VentasSA"));

export const superadminRouteConfig = [
  { path: "", element: <Navigate to="dashboard" replace /> },
  { path: "dashboard", element: <Dashboard /> },
  { path: "suscripciones", element: <Vista /> },
  { path: "notificaciones", element: <Notificaciones /> },
  // { path: "usuarios", element: <Usuarios /> },
  { path: "tiendas", element: <Tiendas /> },
  { path: "ventas", element: <VentasSA /> },
  // { path: "soporte", element: <Soporte /> }
];
