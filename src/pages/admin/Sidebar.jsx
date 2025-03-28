import React from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div
      className="bg-dark text-white p-3"
      style={{ minHeight: "100vh", width: "250px" }}
    >
      <h5 className="mb-4 text-white text-center">MiTiendaEnLineaMX</h5>
      <ul className="nav flex-column">
        <li className="nav-item mb-2">
          <Link
            to="/admin/products"
            className={`nav-link ${isActive("/admin/products") ? "text-warning" : "text-white"}`}
          >
            🛒 Productos
          </Link>
        </li>
        <li className="nav-item mb-2">
          <Link
            to="/admin/categories"
            className={`nav-link ${isActive("/admin/categories") ? "text-warning" : "text-white"}`}
          >
            📂 Categorías
          </Link>
        </li>
        <li className="nav-item mb-2">
          <Link
            to="/admin/tags"
            className={`nav-link ${isActive("/admin/tags") ? "text-warning" : "text-white"}`}
          >
            🏷️ Tags
          </Link>
        </li>
        <li className="nav-item mb-2">
          <Link
            to="/admin/stores"
            className={`nav-link ${isActive("/admin/stores") ? "text-warning" : "text-white"}`}
          >
            🏬 Tiendas
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
