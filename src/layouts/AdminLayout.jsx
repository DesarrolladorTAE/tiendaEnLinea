import React, { useState, useEffect } from "react";
import Sidebar from "../components/admin/Sidebar";
import Topbar from "../components/admin/Topbar";
import { Outlet, useLocation } from "react-router-dom";
import { Box } from "@mui/material";

const AdminLayout = () => {
  const [openSidebar, setOpenSidebar] = useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setOpenSidebar((prev) => !prev);
  };

  useEffect(() => {
    setOpenSidebar(false);
  }, [location]);

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar open={openSidebar} onClose={handleDrawerToggle} />
      <Box sx={{ flexGrow: 1 }}>
        <Topbar onMenuClick={handleDrawerToggle} />
        <Box p={3}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
