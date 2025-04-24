import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../pages/admin/Sidebar";

const AdminLayout = () => {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div style={{ width: 240, minWidth: 240, height: "100vh", backgroundColor: "#1a1a1a" }}>
        <Sidebar />
      </div>

      <div
        style={{
          flexGrow: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          padding: "16px",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
