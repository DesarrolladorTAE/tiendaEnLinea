import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { Link } from "react-router-dom";
import FooterCopyright from "../../components/footer/FooterCopyright";
import FooterNewsletter from "../../components/footer/FooterNewsletter";

const FooterOne = ({
  backgroundColorClass,
  spaceTopClass,
  spaceBottomClass,
  spaceLeftClass,
  spaceRightClass,
  containerClass,
  extraFooterClass,
  sideMenu
}) => {
  return (
    <footer className={clsx("footer-area", backgroundColorClass, spaceTopClass, spaceBottomClass, extraFooterClass, spaceLeftClass, spaceRightClass )}>
      <div className={`${containerClass ? containerClass : "container"}`}>
        <div className="row">
          {/* Logo y derechos */}
          <div className={`${sideMenu ? "col-xl-2 col-sm-4" : "col-lg-2 col-sm-4"}`}>
            <FooterCopyright
              footerLogo="/assets/img/logo/logo.png"
              spaceBottomClass="mb-30"
            />
          </div>

          {/* Sección Nosotros */}
          <div className={`${sideMenu ? "col-xl-2 col-sm-4" : "col-lg-2 col-sm-4"}`}>
            <div className="footer-widget mb-30 ml-30">
              <div className="footer-title">
                <h3>Nosotros</h3>
              </div>
              <div className="footer-list">
                <ul>
                  <li><Link to="/about">Quiénes somos</Link></li>
                  <li><Link to="/contact">Contacto</Link></li>
                  <li><Link to="/my-account">Mi cuenta</Link></li>
                  <li><Link to="/faq">Preguntas frecuentes</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Enlaces útiles */}
          <div className={`${sideMenu ? "col-xl-2 col-sm-4" : "col-lg-2 col-sm-4"}`}>
            <div className={`${sideMenu ? "footer-widget mb-30 ml-95" : "footer-widget mb-30 ml-50"}`}>
              <div className="footer-title">
                <h3>Enlaces útiles</h3>
              </div>
              <div className="footer-list">
                <ul>
                  <li><Link to="/terms">Términos y condiciones</Link></li>
                  <li><Link to="/privacy">Política de privacidad</Link></li>
                  <li><Link to="/contact">Soporte</Link></li>
                  <li><Link to="/wallet">Mi cartera</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Redes sociales */}
          <div className={`${sideMenu ? "col-xl-3 col-sm-4" : "col-lg-2 col-sm-6"}`}>
            <div className={`${sideMenu ? "footer-widget mb-30 ml-145" : "footer-widget mb-30 ml-75"}`}>
              <div className="footer-title">
                <h3>Síguenos</h3>
              </div>
              <div className="footer-list">
                <ul>
                  <li><a href="https://facebook.com/telorecargo" target="_blank" rel="noopener noreferrer">Facebook</a></li>
                  <li><a href="https://twitter.com/telorecargo" target="_blank" rel="noopener noreferrer">Twitter</a></li>
                  <li><a href="https://instagram.com/telorecargo" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                  <li><a href="https://youtube.com/@telorecargo" target="_blank" rel="noopener noreferrer">YouTube</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className={`${sideMenu ? "col-xl-3 col-sm-8" : "col-lg-4 col-sm-6"}`}>
            <FooterNewsletter
              spaceBottomClass="mb-30"
              spaceLeftClass="ml-70"
              sideMenu={sideMenu}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

FooterOne.propTypes = {
  backgroundColorClass: PropTypes.string,
  containerClass: PropTypes.string,
  extraFooterClass: PropTypes.string,
  sideMenu: PropTypes.bool,
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string,
  spaceLeftClass: PropTypes.string,
  spaceRightClass: PropTypes.string
};

export default FooterOne;
