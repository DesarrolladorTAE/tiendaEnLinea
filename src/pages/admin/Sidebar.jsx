import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import adminNavItems, { storeAdminNavItems } from "../../menuConfig";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

const Sidebar = ({ onNavigate, storeOnly = false, showWhiteLabel = false, showWorkers = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => path === "/admin/services"
    ? location.pathname.startsWith(path) || /^\/admin\/branches\/\d+\/tours(?:\/|$)/.test(location.pathname)
    : path === "/admin/reportes" ? location.pathname.startsWith(path)
    : location.pathname.startsWith(path);

  const renderLinks = (items) => (
    <ul className="nav flex-column">
      {items.map((item) => (
        <li className="nav-item mb-2" key={item.path}>
          <Link
            to={item.path}
            onClick={onNavigate}
            aria-current={isActive(item.path) ? "page" : undefined}
            className={`nav-link ${
              isActive(item.path) ? "text-warning" : "text-white"
            }`}
            style={{
              transition: "all 0.2s ease",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              minHeight: "44px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,193,7,0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            {item.icon && React.createElement(item.icon, { fontSize: "small", "aria-hidden": true, sx: { flexShrink: 0 } })}
            <span>{item.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* 🔥 Scrollbar personalizado */}
      <style>
        {`
          .sidebar-scroll {
            overflow-y: auto;
            flex: 1;
            margin-bottom: 1rem;
          }

          .sidebar-scroll::-webkit-scrollbar {
            width: 6px;
          }

          .sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .sidebar-scroll::-webkit-scrollbar-thumb {
            background-color: #ffc107;
            border-radius: 10px;
          }

          .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background-color: #e0a800;
          }
        `}
      </style>

      <div
        className="d-flex flex-column h-100"
        style={{
          padding: "1rem",
          overflow: "hidden",
        }}
      >
        {/* TOP */}
        <div>
          <img
            src="/assets/logo.png"
            alt="MiTiendaEnLineaMX"
            style={{
              maxWidth: storeOnly ? "min(208px, calc(100% - 44px))" : "208px",
              height: "auto",
              marginBottom: "1rem",
            }}
          />

          {!storeOnly && <button
            onClick={() => { onNavigate?.(); navigate("/admin/sucursales"); }}
            className="btn btn-outline-warning btn-sm w-100 mb-3"
          >
            <ArrowBackRoundedIcon fontSize="small" aria-hidden="true" sx={{ mr: .75 }} /> Regresar a sucursales
          </button>}
        </div>

        {/* 🔥 MENU CON SCROLL */}
        <div className="sidebar-scroll">
          {storeOnly ? (
            <section aria-label="Administración" className="border-top border-secondary pt-3 mt-2">
              <h2 className="h6 px-3 mb-2 text-warning">Administración</h2>
              {renderLinks(storeAdminNavItems)}
            </section>
          ) : renderLinks(adminNavItems.filter(item =>
            (item.path !== "/admin/marca-blanca" || showWhiteLabel) &&
            (item.path !== "/admin/trabajadores-areas" || showWorkers),
          ))}
        </div>

      </div>
    </>
  );
};

export default Sidebar;
