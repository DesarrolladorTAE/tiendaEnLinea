import React from "react";
import { Route } from "react-router-dom";
import PrivateRouteSuperadmin from "./PrivateRouteSuperadmin";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import { superadminRouteConfig } from "./SuperadminRouteConfig";

const SuperAdminRoutes = (
  <Route path="/panel" element={<PrivateRouteSuperadmin />}>
    <Route element={<SuperAdminLayout />}>
      {superadminRouteConfig.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
    </Route>
  </Route>
);

export default SuperAdminRoutes;
