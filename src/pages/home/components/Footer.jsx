import React from "react";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-3">
            <img src="/assets/logo3.png" alt="Logo" className="img-fluid mb-3" />
            <p className="text-white">
              Transformamos negocios con soluciones innovadoras y tecnología de vanguardia.
            </p>
          </div>
        </div>

        <hr className="my-4" style={{ borderColor: "#1f2937" }} />
        <div className="text-center">
          <p className="text-white mb-0">© 2026 TAE. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
