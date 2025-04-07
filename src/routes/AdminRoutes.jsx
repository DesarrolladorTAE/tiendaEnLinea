import React from "react";
import { Route } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import PrivateRoute from "./PrivateRoute";
import { adminRouteConfig } from "./AdminRouteConfig";

const AdminRoutes = (
  <Route
    path="/admin"
    element={
      <PrivateRoute>
        <AdminLayout />
      </PrivateRoute>
    }
  >
    {adminRouteConfig.map(({ path, element }) => (
      <Route key={path} path={path} element={element} />
    ))}
  </Route>
);

export default AdminRoutes;
