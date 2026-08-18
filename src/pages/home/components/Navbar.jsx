import React, { useEffect, useState } from "react";
import "../styles/Navbar.css";

const navigationLinks = [
  {
    path: "/",
    label: "Inicio",
  },
  {
    path: "/platform",
    label: "Plataforma",
  },
  {
    path: "/features",
    label: "Características",
  },
  {
    path: "/services",
    label: "Planes",
  },
  {
    path: "/contact",
    label: "Contacto",
  },
  {
    path: "/Blogs",
    label: "Blog"
  }
];

export default function Navbar({
  scrolled = false,
  transparent = false,
  currentPath = "/",
  onNavigate,
  onLogin,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isTransparent =
    transparent && !scrolled && !isMenuOpen;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [currentPath]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle(
      "landing-menu-open",
      isMenuOpen
    );

    return () => {
      document.body.classList.remove("landing-menu-open");
    };
  }, [isMenuOpen]);

  const handleNavigate = (path) => {
    setIsMenuOpen(false);

    if (typeof onNavigate === "function") {
      onNavigate(path);
    }
  };

  const handleLogin = () => {
    setIsMenuOpen(false);

    if (typeof onLogin === "function") {
      onLogin();
    }
  };

  return (
    <>
      <header
        className={[
          "landing-navbar",
          isTransparent
            ? "landing-navbar--transparent"
            : "landing-navbar--solid",
          scrolled ? "landing-navbar--scrolled" : "",
          isMenuOpen ? "landing-navbar--menu-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="landing-navbar__container">
          <button
            type="button"
            className="landing-navbar__brand"
            onClick={() => handleNavigate("/")}
            aria-label="Ir al inicio"
          >
            <img
              src="/assets/logoc.png"
              alt="Mi Tienda en Línea MX"
              className="landing-navbar__logo"
            />
          </button>

          <nav
            id="landing-mobile-navigation"
            className={[
              "landing-navbar__navigation",
              isMenuOpen
                ? "landing-navbar__navigation--open"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label="Navegación principal"
          >
            <ul className="landing-navbar__links">
              {navigationLinks.map((link) => {
                const isActive =
                  link.path === "/"
                    ? currentPath === "/"
                    : currentPath.startsWith(link.path);

                return (
                  <li
                    key={link.path}
                    className="landing-navbar__item"
                  >
                    <button
                      type="button"
                      className={[
                        "landing-navbar__link",
                        isActive
                          ? "landing-navbar__link--active"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => handleNavigate(link.path)}
                      aria-current={
                        isActive ? "page" : undefined
                      }
                    >
                      {link.label}
                    </button>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              className="landing-navbar__login"
              onClick={handleLogin}
            >
              <span>Iniciar sesión</span>

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="landing-navbar__login-icon"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </nav>

          <button
            type="button"
            className={[
              "landing-navbar__toggle",
              isMenuOpen
                ? "landing-navbar__toggle--open"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() =>
              setIsMenuOpen((current) => !current)
            }
            aria-label={
              isMenuOpen
                ? "Cerrar menú de navegación"
                : "Abrir menú de navegación"
            }
            aria-expanded={isMenuOpen}
            aria-controls="landing-mobile-navigation"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <button
        type="button"
        className={[
          "landing-navbar__overlay",
          isMenuOpen
            ? "landing-navbar__overlay--visible"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => setIsMenuOpen(false)}
        aria-label="Cerrar menú"
        tabIndex={isMenuOpen ? 0 : -1}
      />
    </>
  );
}