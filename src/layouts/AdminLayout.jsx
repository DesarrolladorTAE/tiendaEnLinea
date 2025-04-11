import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../pages/admin/Sidebar";

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
