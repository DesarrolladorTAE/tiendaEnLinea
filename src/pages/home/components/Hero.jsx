import React from "react";
import useScrollReveal from "../hooks/useScrollReveal";

const Hero = ({ onStart }) => {
  useScrollReveal();

  return (
    <div className="hero">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6 hero-content">
            <h1 className="animate-on-scroll">
              Impulsa tu negocio con
              <br />
              <span className="highlight">MITIENDAENLINEAMX</span>
            </h1>
            <p className="animate-on-scroll">
              Una plataforma pensada para llevar la gestión de tu negocio o comercio al siguiente nivel.
              Centraliza ventas, inventarios y facturación en un solo lugar.
            </p>
            <div className="d-flex gap-3 animate-on-scroll">
              <button className="btn btn-primary-custom btn-lg" onClick={onStart}>
                <i className="bi bi-rocket-takeoff me-2"></i>
                Empezar Ahora
              </button>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="hero-image animate-on-scroll">
              <img
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Dashboard Preview"
                className="img-fluid"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
