import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import adminNavItems from "../../menuConfig";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname.startsWith(path);
  const storeSlug = localStorage.getItem("STORE_SLUG");

  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    navigate("/login-register");
  };

  return (
    <div
      className="d-flex flex-column justify-content-between h-100"
      style={{ padding: "1rem" }}
    >
      <div>
        <img
          src="/assets/logo.png" // o usa import si lo prefieres
          alt="MiTiendaEnLineaMX"
          style={{ maxWidth: "208px", height: "auto" }}
        />
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

      {/* <div className="text-center mt-auto">
        {storeSlug && (
          <a
            href={`https://mitiendaenlineamx.com.mx/tienda/${storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-warning btn-sm w-100 mb-2"
          >
            Ir a mi página en línea
          </a>
        )}
        <button onClick={handleLogout} className="btn btn-outline-light btn-sm w-100">
          🚪 Cerrar Sesión
        </button>
      </div> */}

      
{/* Entorno de Desarolllo, solo desarrollo, antes de subir a produccion comentar lo debajo y activar lo de arriba */}

      <div className="text-center mt-auto">
        {storeSlug && (
          <a
            href={`${window.location.origin}/tienda/${storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-warning btn-sm w-100 mb-2"
          >
            Ir a mi página en línea
          </a>
        )}
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
