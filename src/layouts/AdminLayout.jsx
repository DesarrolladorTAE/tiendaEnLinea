import React from "react";
import Sidebar from "../pages/admin/Sidebar";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-4 text-white">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
