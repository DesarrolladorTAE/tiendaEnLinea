import React from "react";
import Sidebar from "../components/admin/Sidebar";
import Topbar from "../components/admin/Topbar";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";

const AdminLayout = () => (
  <Box sx={{ display: "flex" }}>
    <Sidebar />
    <Box sx={{ flexGrow: 1 }}>
      <Topbar />
      <Box p={3}>
        <Outlet />
      </Box>
    </Box>
  </Box>
);

export default AdminLayout;
