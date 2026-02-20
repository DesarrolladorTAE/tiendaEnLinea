import { patch } from "@mui/material";
import React, { lazy } from "react";
import { Navigate } from "react-router-dom";

const ProductList = lazy(() => import("../pages/admin/ProductList"));
const ProductForm = lazy(() => import("../pages/admin/ProductForm"));
const ProductDetails = lazy(() => import("../pages/admin/ProductDetails"));
const ProductImages = lazy(() => import("../pages/admin/ProductImages"));
const SitioWeb = lazy(() => import("../pages/admin/SitioWeb.jsx"));

const Categorias = lazy(() => import("../pages/admin/ProductCategory"));
const Etiquetas = lazy(() => import("../pages/admin/ProductTags"));
const Inventario = lazy(() => import("../pages/admin/Inventario"));
const POS = lazy(() => import("../pages/admin/POS"));
const Ventas = lazy(() => import("../pages/admin/Ventas"));
const Entradas = lazy(() => import("../pages/admin/Entradas.jsx"));
const Ticket = lazy (()=>  import("../pages/admin/Ticket.jsx"));
const Membresia = lazy (() => import ("../pages/admin/Membresia.jsx"));
const MiCuenta = lazy (() => import ("../pages/admin/MiCuenta.jsx"));
const Reporte = lazy (() => import ("../pages/admin/Reporte.jsx"));
const ReporteVentas = lazy(() => import("../components/ventas/ReporteVentas.jsx"));
const POSHeader  = lazy(() => import("../wrappers/POSWrapper.jsx"));
const ReporteTipoVenta = lazy(() => import("../components/ventas/ReporteTipoVenta.jsx"));
const ReporteInventario = lazy(() => import("../pages/admin/ReporteInventario.jsx"));
const Complementos = lazy(() => import("../pages/admin/Complementos.jsx"));
const Sucursales = lazy(() => import("../pages/admin/Sucursales.jsx"));
const Almacenes = lazy(() => import("../pages/admin/Almacenes.jsx"));
const SolicitudesPago = lazy(() => import("../pages/admin/SolicitudesPago.jsx"));
const InventoryByWarehouse = lazy(() => import("../pages/admin/InventoryByWarehouse.jsx"));



export const adminRouteConfig = [
  // ✅ default cuando entras a /admin
  { path: "", element: <Navigate to="sucursales" replace /> },

  // ✅ rutas reales (era "patch" por error)
  { path: "sucursales", element: <Sucursales /> },
  { path: "almacenes", element: <Almacenes /> },

  { path: "products", element: <ProductList /> },
  { path: "products/new", element: <ProductForm /> },
  { path: "products/edit/:id", element: <ProductForm /> },
  { path: "products/images/:id", element: <ProductImages /> },
  { path: "products/:id", element: <ProductDetails /> },

  { path: "categorias", element: <Categorias /> },
  { path: "mi-sitio", element: <SitioWeb /> },
  { path: "etiquetas", element: <Etiquetas /> },
  { path: "inventario", element: <InventoryByWarehouse /> },
  { path: "pos", element: <POS /> },
  { path: "ventas", element: <Ventas /> },
  { path: "compra", element: <Entradas /> },
  { path: "ticket", element: <Ticket /> },
  { path: "membresia", element: <Membresia /> },
  { path: "micuenta", element: <MiCuenta /> },
  { path: "reportes", element: <Reporte /> },
  { path: "reportes/ventas", element: <ReporteVentas /> },
  { path: "prueba/pos", element: <POSHeader /> },
  { path: "reportes/tipo-venta", element: <ReporteTipoVenta /> },
  { path: "reportes/inventario", element: <ReporteInventario /> },
  { path: "complementos", element: <Complementos /> },
  // { patch: "solicitudes-pago", element: <SolicitudesPago/> },

];


