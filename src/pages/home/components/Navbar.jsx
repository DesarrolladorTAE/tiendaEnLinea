import React, { useEffect, useState } from "react";

const Navbar = ({ onNavClick, onLogin }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector(".navbar");
      if (!navbar) return;
      navbar.style.background =
        window.scrollY > 50 ? "rgba(255, 255, 255, 0.98)" : "rgba(255, 255, 255, 0.95)";
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { path: "/", label: "Inicio" },
    { path: "/platform", label: "Plataforma" },
    { path: "/features", label: "Características" },
    { path: "/services", label: "Servicios" },
    { path: "/contact-landing", label: "Contacto" },
  ];

  return (
    <nav className="navbar navbar-expand-lg fixed-top">
      <div className="container">
        <button
          className="navbar-brand btn p-0"
          onClick={() => {
            onNavClick("/");
            setIsMenuOpen(false);
          }}
          style={{ background: "none", border: "none" }}
        >
          <img src="/assets/logoc.png" alt="Logo" className="img-fluid" />
        </button>

        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navbarNav"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
          onClick={() => setIsMenuOpen((s) => !s)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${isMenuOpen ? "show" : ""}`} id="navbarNav">
          <ul className="navbar-nav ms-auto me-4">
            {links.map((link) => (
              <li className="nav-item" key={link.path}>
                <button
                  className="nav-link btn"
                  onClick={() => {
                    onNavClick(link.path);
                    setIsMenuOpen(false);
                  }}
                  style={{ background: "none", border: "none" }}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          <button className="btn btn-primary-custom" onClick={onLogin}>
            INICIAR SESIÓN
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
