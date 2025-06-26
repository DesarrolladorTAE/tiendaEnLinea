import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import superadminNavItems from "../../menuConfigSuperadmin";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (subpath) => {
    return location.pathname.startsWith(`/panel/${subpath}`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("SUPERADMIN_TOKEN");
    navigate("/login-register");
    
  };

  return (
    <div
      className="d-flex flex-column justify-content-between h-100"
      style={{ padding: "1rem" }}
    >
      <div>
        <img
          src="/assets/logo.png"
          alt="SuperAdmin"
          style={{ maxWidth: "208px" }}
        />
        <ul className="nav flex-column">
          {superadminNavItems.map((item) => (
            <li className="nav-item mb-2" key={item.path}>
              <Link
                to={`/panel/${item.path}`}
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

      <button
        onClick={handleLogout}
        className="btn btn-outline-light btn-sm w-100 mt-auto"
      >
        🚪 Cerrar Sesión
      </button>
    </div>
  );
};

export default Sidebar;
