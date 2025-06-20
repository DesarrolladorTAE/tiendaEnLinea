import React, { lazy } from "react";
import { Navigate } from "react-router-dom";

const ProductList = lazy(() => import("../pages/admin/ProductList"));
const ProductForm = lazy(() => import("../pages/admin/ProductForm"));
const ProductDetails = lazy(() => import("../pages/admin/ProductDetails"));
const ProductImages = lazy(() => import("../pages/admin/ProductImages"));

const Categorias = lazy(() => import("../pages/admin/ProductCategory"));
const Etiquetas = lazy(() => import("../pages/admin/ProductTags"));
const Inventario = lazy(() => import("../pages/admin/Inventario"));
const POS = lazy(() => import("../pages/admin/POS"));
const Ventas = lazy(() => import("../pages/admin/Ventas"));
const Entradas = lazy(() => import("../pages/admin/Entradas.jsx"));
const Ticket = lazy (()=>  import("../pages/admin/Ticket.jsx"));
const Membresia = lazy (() => import ("../pages/admin/Membresia.jsx"));
const MiCuenta = lazy (() => import ("../pages/admin/MiCuenta.jsx"));

export const adminRouteConfig = [
  { path: "", element: <Navigate to="products" replace /> },
  { path: "products", element: <ProductList /> },
  { path: "products/new", element: <ProductForm /> },
  { path: "products/edit/:id", element: <ProductForm /> },
  { path: "products/images/:id", element: <ProductImages /> },
  { path: "products/:id", element: <ProductDetails /> },

  { path: "categorias", element: <Categorias /> },
  { path: "etiquetas", element: <Etiquetas /> },
  { path: "inventario", element: <Inventario /> },
  { path: "pos", element: <POS /> },
  { path: "ventas", element: <Ventas /> },
  { path: "compra", element: <Entradas /> },
  { path: "ticket", element: <Ticket/>},
  { path: "membresia", element: <Membresia /> },
  { path: "micuenta", element: <MiCuenta /> }

];
