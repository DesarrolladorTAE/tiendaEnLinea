import React from "react";
import { Navigate } from "react-router-dom";

import ProductList from "../pages/admin/ProductList";
import ProductForm from "../pages/admin/ProductForm";
import ProductDetails from "../pages/admin/ProductDetails";
import ProductImages from "../pages/admin/ProductImages";

import Categorias from "../pages/admin/ProductCategory";
import Etiquetas from "../pages/admin/ProductTags";
import Inventario from "../pages/admin/Inventario";
import POS from "../pages/admin/POS";
import Ventas from "../pages/admin/Ventas";

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
];
