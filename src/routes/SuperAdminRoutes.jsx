// src/routes/SuperAdminRoutes.jsx
import React from "react";
import { Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute"; // Usa el mismo si ya protege por token
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import { superadminRouteConfig } from "./SuperadminRouteConfig";

const SuperAdminRoutes = (
  <Route path="/panel" element={<PrivateRoute superadmin />}>
    <Route element={<SuperAdminLayout />}>
      {superadminRouteConfig.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
    </Route>
  </Route>
);

export default SuperAdminRoutes;
