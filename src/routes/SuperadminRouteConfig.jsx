// src/routes/SuperadminRouteConfig.js
import React, { lazy } from "react";
import { Navigate } from "react-router-dom";

const Dashboard = lazy(() => import("../pages/superadmin/Dashboard"));
const Vista = lazy(() => import("../pages/superadmin/VistaSuscripcionesSuperAdmin"));
const Notificaciones = lazy(() => import("../pages/superadmin/Notificaciones"));
const Banners = lazy(() => import("../pages/superadmin/Banners"));
const Tiendas = lazy(() => import("../pages/superadmin/Tiendas"));
const VentasSA = lazy(() => import("../pages/superadmin/VentasSA"));

const AppVersionsPage = lazy(() => import("../pages/superadmin/AppVersionsPage"));
const PlanesPage = lazy(() => import("../pages/superadmin/PlanesPage"));
const PlanEditorPage = lazy(() => import("../pages/superadmin/PlanEditorPage"));

export const superadminRouteConfig = [
  { path: "", element: <Navigate to="dashboard" replace /> },
  { path: "dashboard", element: <Dashboard /> },
  { path: "suscripciones", element: <Vista /> },
  { path: "notificaciones", element: <Notificaciones /> },
  { path: "tiendas", element: <Tiendas /> },
  { path: "ventas", element: <VentasSA /> },
  { path: "banners", element: <Banners /> },
  { path: "app-versiones", element: <AppVersionsPage /> },
  { path: "planes", element: <PlanesPage />,},
  { path: "planes/:id", element: <PlanEditorPage />,},
  { path: "planes/nuevo", element: <PlanEditorPage />,},
];