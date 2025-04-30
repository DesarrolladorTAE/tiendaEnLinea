import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import adminNavItems from "../../menuConfig";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    navigate("/login-register"); // ajusta según tu ruta de login
  };

  return (
    <div
      className="bg-dark text-white p-3 d-flex flex-column justify-content-between"
      style={{ minHeight: "100vh", width: "250px" }}
    >
      <div>
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

      <div className="text-center mt-auto">
        <button
          onClick={handleLogout}
          className="btn btn-outline-light btn-sm w-100"
        >
          🚪 Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
