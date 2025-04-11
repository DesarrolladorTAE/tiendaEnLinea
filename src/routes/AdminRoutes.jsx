import React from "react";
import { Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import AdminLayout from "../layouts/AdminLayout";
import { adminRouteConfig } from "./AdminRouteConfig";

const AdminRoutes = (
  <Route path="/admin" element={<PrivateRoute />}>
    <Route element={<AdminLayout />}>
      {adminRouteConfig.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
    </Route>
  </Route>
);

export default AdminRoutes;
