import React from "react";
import useScrollReveal from "../hooks/useScrollReveal";

const Platform = () => {
  useScrollReveal();

  return (
    <section className="platform-section">
      <div className="container">
        <div className="text-center mb-5 animate-on-scroll">
          <div className="platform-icon">
            <i className="bi bi-shop"></i>
          </div>
          <h2 className="display-5 fw-bold text-gradient mb-4">¿Qué es MITIENDAENLINEAMX?</h2>
          <p className="lead text-muted mx-auto" style={{ maxWidth: "600px" }}>
            <strong>MITIENDAENLINEAMX</strong> es tu aliado estratégico. Centraliza ventas, inventarios y facturación
            en un solo lugar. <strong className="text-gradient">Fácil, rápido y seguro.</strong>
          </p>
        </div>

        <div className="row g-4">
          {[
            {
              icon: "bi-graph-up-arrow",
              title: "Optimiza tus Puntos de Venta",
              bullets: [
                "Accede a reportes inteligentes para maximizar tus ventas",
                "Supervisa tus operaciones en tiempo real",
                "Administra múltiples sucursales de manera centralizada",
              ],
              color: "card-primary",
            },
            {
              icon: "bi-box-seam",
              title: "Control Inteligente de Inventarios",
              bullets: [
                "Gestiona entradas, salidas y movimientos automáticamente",
                "Alertas de reabastecimiento",
                "Optimiza la rotación de productos",
                "Reportes detallados para decisiones estratégicas",
              ],
              color: "card-success",
            },
            {
              icon: "bi-globe",
              title: "Expande tus Ventas en Línea",
              bullets: [
                "Publica y actualiza productos de forma sencilla",
                "Llega a clientes nuevos en todo el mundo",
                "Multiplica tus ingresos con canales digitales",
              ],
              color: "card-info",
            },
          ].map((card, i) => (
            <div key={i} className="col-lg-4 animate-on-scroll">
              <div className={`colored-card ${card.color}`}>
                <div className="d-flex align-items-center mb-3">
                  <div className="icon me-3">
                    <i className={`bi ${card.icon}`}></i>
                  </div>
                  <h5 className="mb-0 fw-bold">{card.title}</h5>
                </div>
                <ul className="list-unstyled">
                  {card.bullets.map((b, j) => (
                    <li key={j} className="d-flex align-items-start mb-2">
                      <i className="bi bi-check-circle-fill me-2 mt-1"></i>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-5 animate-on-scroll">
          <div className="card bg-gradient-primary text-white border-0 p-4 mx-auto" style={{ maxWidth: 600, borderRadius: 20 }}>
            <h3 className="fw-bold mb-3">Transforma tu negocio hoy</h3>
            <p className="mb-0">Únete a miles de empresarios que ya confían en nuestra plataforma</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Platform;
