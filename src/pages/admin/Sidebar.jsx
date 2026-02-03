import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import adminNavItems from "../../menuConfig";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const isActive = (path) => location.pathname.startsWith(path);
  const storeSlug = localStorage.getItem("STORE_SLUG");

  const storeUrl = storeSlug
    ? `https://mitiendaenlineamx.com.mx/tienda/${storeSlug}`
    : "";

  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    navigate("/login-register");
  };

  const handleCopyLink = async () => {
    if (!storeUrl) return;

    await navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="d-flex flex-column justify-content-between h-100"
      style={{ padding: "1rem" }}
    >
      {/* TOP */}
      <div>
        <img
          src="/assets/logo.png"
          alt="MiTiendaEnLineaMX"
          style={{ maxWidth: "208px", height: "auto", marginBottom: "1rem" }}
        />

        {/* 🔙 Regresar a sucursales */}
        <button
          onClick={() => navigate("/admin/sucursales")}
          className="btn btn-outline-warning btn-sm w-100 mb-3"
        >
          ⬅ Regresar a sucursales
        </button>

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

      {/* BOTTOM */}
      <div className="text-center mt-auto">
        {storeSlug && (
          <>
            {/* Abrir tienda */}
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-warning btn-sm w-100 mb-2"
            >
              🌐 Ir a mi página en línea
            </a>

            {/* Copiar link */}
            <button
              onClick={handleCopyLink}
              className={`btn btn-sm w-100 mb-2 ${
                copied ? "btn-success" : "btn-outline-warning"
              }`}
            >
              {copied ? "✅ Link copiado" : "📋 Copiar link de la tienda"}
            </button>
          </>
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
