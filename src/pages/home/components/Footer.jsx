import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row justify-content-between align-items-start g-4">
          <div className="col-lg-5 col-md-6">
            <img
              src="/assets/logo3.png"
              alt="Logo"
              className="img-fluid mb-3"
              style={{ maxWidth: "240px" }}
            />
            <p
              className="mb-0"
              style={{
                color: "#d1d5db",
                lineHeight: "1.8",
                maxWidth: "420px",
              }}
            >
              Transformamos negocios con soluciones innovadoras y tecnología de
              vanguardia.
            </p>
          </div>

          <div className="col-lg-3 col-md-4">
            <h5 className="text-white mb-3 fw-bold">Legal</h5>
            <ul className="list-unstyled mb-0">
              <li className="mb-2">
                <Link to="/terminos-y-condiciones" className="footer-link">
                  Términos y Condiciones
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/" className="footer-link">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/login-register" className="footer-link">
                  Iniciar sesión
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <hr
          className="my-4"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <p className="text-white mb-0">
            © 2026 TAE. Todos los derechos reservados.
          </p>

          <div className="d-flex gap-3">
            <Link to="/terminos-y-condiciones" className="footer-link">
              Términos
            </Link>
            <Link to="/login-register" className="footer-link">
              Acceder
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;