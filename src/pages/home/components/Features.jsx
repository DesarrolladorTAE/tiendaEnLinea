import React from "react";
import useScrollReveal from "../hooks/useScrollReveal";

const features = [
  { icon: "bi-rocket-takeoff", title: "Innovación Constante", text: "Tecnología de punta para destacar en el mercado." },
  { icon: "bi-shield-check",  title: "Seguridad Garantizada", text: "Protegemos tus datos con los mejores estándares." },
  { icon: "bi-lightning",     title: "Resultados Rápidos",    text: "Soluciones eficientes en tiempo récord." },
  { icon: "bi-headset",       title: "Soporte 24/7",          text: "Siempre disponibles para ayudarte." },
];

const Features = () => {
  useScrollReveal();

  return (
    <section className="py-5">
      <div className="container">
        <div className="text-center mb-5 animate-on-scroll">
          <h2 className="display-6 fw-bold mb-3">¿Por qué elegirnos?</h2>
          <p className="lead text-muted">Descubre las ventajas que nos hacen únicos en el mercado</p>
        </div>

        <div className="row g-4">
          {features.map((f, idx) => (
            <div key={idx} className="col-lg-3 col-md-6 animate-on-scroll">
              <div className="feature-card text-center">
                <div className="icon">
                  <i className={`bi ${f.icon}`}></i>
                </div>
                <h5 className="fw-bold mb-3">{f.title}</h5>
                <p className="text-muted">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
