import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";

const pages = [
  ["/", "Inicio"],
  ["/platform", "Plataforma"],
  ["/features", "Características"],
  ["/services", "Planes"],
  ["/blogs", "Blog"],
  ["/contact", "Contacto"],
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="landing-footer">
      <div className="landing-footer__container">
        <div className="landing-footer__intro">
          <div>
            <span className="landing-footer__eyebrow">TU NEGOCIO, CONECTADO</span>
            <h2>Tu tienda en línea y tu operación, en un solo lugar.</h2>
          </div>
          <Link to="/services" className="landing-footer__cta">
            Conocer los planes <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="landing-footer__grid">
          <div className="landing-footer__brand">
            <Link to="/" aria-label="Mi Tienda en Línea MX, ir al inicio">
              <img src="/assets/logoc.png" alt="Mi Tienda en Línea MX" width="280" height="60" />
            </Link>
            <p>
              Crea tu tienda en línea y administra productos, inventarios,
              ventas y sucursales desde una misma plataforma. Herramientas
              para acompañar el crecimiento de tu negocio en México.
            </p>
            <span className="landing-footer__signature">Una plataforma de Tecnologías Administrativas.</span>
          </div>

          <nav aria-label="Páginas del sitio">
            <h3>Explora</h3>
            <ul>
              {pages.map(([to, label]) => (
                <li key={to}><Link to={to}>{label}</Link></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Acceso y términos del servicio">
            <h3>Tu cuenta</h3>
            <ul>
              <li><Link to="/login-register">Iniciar sesión</Link></li>
              <li><Link to="/login-register?mode=register">Crear cuenta</Link></li>
              <li><Link to="/contact">Ayuda y contacto</Link></li>
              <li><Link to="/terminos-y-condiciones">Términos y condiciones</Link></li>
            </ul>
          </nav>

          <div className="landing-footer__contact">
            <h3>Hablemos de tu negocio</h3>
            <address>
              <a href="mailto:contacto@tecnologiasadministrativas.com">contacto@tecnologiasadministrativas.com</a>
              <a href="tel:+527442188925">+52 (744) 218 8925</a>
              <a href="https://wa.me/527442188925" target="_blank" rel="noopener noreferrer">Escríbenos por WhatsApp <span aria-hidden="true">↗</span></a>
              <a
                href="https://www.google.com/maps/search/?api=1&query=C.+24+202,+Las+Cruces,+39770+Acapulco+de+Juárez,+Gro."
                target="_blank"
                rel="noopener noreferrer"
              >
                C. 24 202, Las Cruces, 39770<br />
                Acapulco de Juárez, Guerrero.
                <span className="landing-footer__map">Ver en Google Maps <span aria-hidden="true">↗</span></span>
              </a>
            </address>
          </div>
        </div>

        <div className="landing-footer__bottom">
          <p>© {year} Mi Tienda en Línea MX. Todos los derechos reservados.</p>
          <Link to="/terminos-y-condiciones">Términos y condiciones</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
