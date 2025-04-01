import React from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import adminNavItems from "../../menuConfig"; // asegúrate que la ruta sea correcta

const Sidebar = () => {
  const location = useLocation();

  // Devuelve true si la ruta actual comienza con el path (para que se active en subrutas también)
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div
      className="bg-dark text-white p-3"
      style={{ minHeight: "100vh", width: "250px" }}
    >
      <h5 className="mb-4 text-white text-center">MiTiendaEnLineaMX</h5>
      <ul className="nav flex-column">
        {adminNavItems.map((item) => (
          <li className="nav-item mb-2" key={item.path}>
            <Link
              to={item.path}
              className={`nav-link ${
                isActive(item.path) ? "text-warning" : "text-white"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
