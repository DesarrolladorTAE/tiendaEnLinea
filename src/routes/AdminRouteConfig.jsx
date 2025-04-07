import React from "react";
import ProductList from "../pages/admin/ProductList";
import ProductCategory from "../pages/admin/ProductCategory";
import ProductTags from "../pages/admin/ProductTags";
import Stores from "../pages/admin/Stores";
import ProductForm from "../pages/admin/ProductForm";
import ProductImages from "../pages/admin/ProductImages";
import ProductDetails from "../pages/admin/ProductDetails";

export const adminRouteConfig = [
  { path: "products", element: <ProductList /> },
  { path: "products/new", element: <ProductForm /> },
  { path: "products/edit/:id", element: <ProductForm /> },
  { path: "products/images/:id", element: <ProductImages /> },
  { path: "products/:id", element: <ProductDetails /> },
  { path: "categories", element: <ProductCategory /> },
  { path: "tags", element: <ProductTags /> },
  { path: "stores", element: <Stores /> },
];
