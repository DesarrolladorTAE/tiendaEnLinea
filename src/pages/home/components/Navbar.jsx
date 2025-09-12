import React, { useEffect, useState } from "react";

const Navbar = ({ onNavClick, onLogin }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fondo dinámico al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector(".navbar");
      if (!navbar) return;
      navbar.style.background =
        window.scrollY > 50 ? "rgba(255, 255, 255, 0.98)" : "rgba(255, 255, 255, 0.95)";
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="navbar navbar-expand-lg fixed-top">
      <div className="container">
        <button
          className="navbar-brand btn p-0"
          onClick={() => onNavClick("home")}
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
            {[
              { id: "home", label: "Inicio" },
              { id: "platform", label: "Plataforma" },
              { id: "features", label: "Características" },
              { id: "services", label: "Servicios" },
              { id: "contact", label: "Contacto" },
            ].map((link) => (
              <li className="nav-item" key={link.id}>
                <button
                  className="nav-link btn"
                  onClick={() => {
                    onNavClick(link.id);
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
