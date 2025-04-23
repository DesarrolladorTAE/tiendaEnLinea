import React from "react";
import ProductList from "../pages/admin/ProductList";
import ProductCategory from "../pages/admin/ProductCategory";
import ProductTags from "../pages/admin/ProductTags";
import Stores from "../pages/admin/Stores";
import POS from "../pages/admin/POS";
import ProductForm from "../pages/admin/ProductForm";
import ProductImages from "../pages/admin/ProductImages";
import ProductDetails from "../pages/admin/ProductDetails";
import { Navigate } from "react-router-dom";

export const adminRouteConfig = [
  { path: "", element: <Navigate to="products" replace /> },
  { path: "products", element: <ProductList /> },
  { path: "products/new", element: <ProductForm /> },
  { path: "products/edit/:id", element: <ProductForm /> },
  { path: "products/images/:id", element: <ProductImages /> },
  { path: "products/:id", element: <ProductDetails /> },
  { path: "categories", element: <ProductCategory /> },
  { path: "tags", element: <ProductTags /> },
  { path: "stores", element: <Stores /> },
  { path: "pos", element: <POS /> },

];
