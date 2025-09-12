import React, { useMemo, useState } from "react";
import useScrollReveal from "../hooks/useScrollReveal";

const DURACIONES = {
  mensual:   { paga: 1,  recibe: 1,  label: "Plan mensual" },
  semestral: { paga: 5,  recibe: 6,  label: "¡Pagas 5 y obtienes 6 meses!" },
  anual:     { paga: 10, recibe: 12, label: "¡Pagas 10 y obtienes 12 meses!" },
};

const Plans = ({ planes }) => {
  const [activeTab, setActiveTab] = useState("mensual");
  useScrollReveal();

  const planesFiltrados = useMemo(() => planes.filter((p) => !p.demo), [planes]);

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="text-center mb-5 animate-on-scroll">
          <h2 className="display-6 fw-bold mb-3">Nuestros Planes</h2>
          <p className="lead text-muted">Planes flexibles que se adaptan al tamaño y necesidades de tu negocio.</p>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs justify-content-center mb-4" role="tablist">
          {Object.keys(DURACIONES).map((tab) => (
            <li className="nav-item" role="presentation" key={tab}>
              <button
                type="button"
                className={`nav-link ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            </li>
          ))}
        </ul>

        {/* Content */}
        <div className="tab-content">
          {Object.entries(DURACIONES).map(([clave, duracion]) => (
            <div
              key={clave}
              className={`tab-pane fade ${activeTab === clave ? "show active" : ""}`}
              id={clave}
              role="tabpanel"
              style={{ display: activeTab === clave ? "block" : "none" }}
            >
              <div className="row g-4 mt-3">
                {planesFiltrados.map((plan, idx) => {
                  const total = plan.precio_mensual * duracion.paga;
                  const formatted = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(total);

                  return (
                    <div key={idx} className="col-lg-4 animate-on-scroll">
                      <div className="service-card p-4 h-100">
                        <h5 className="fw-bold mb-2">{plan.nombre}</h5>
                        <h6 className="text-primary mb-2">{formatted}</h6>
                        <p className="small text-muted">{duracion.label}</p>

                        <ul className="list-unstyled small mb-3">
                          {plan.beneficios?.map((b, i) => (
                            <li key={`b-${i}`} className="d-flex align-items-center mb-1">
                              <i className="bi bi-check-circle text-success me-2"></i> {b}
                            </li>
                          ))}
                          {plan.restricciones?.map((r, i) => (
                            <li key={`r-${i}`} className="d-flex align-items-center mb-1">
                              <i className="bi bi-x-circle text-danger me-2"></i> {r}
                            </li>
                          ))}
                          {plan.complementosDisponibles?.map((c, i) => (
                            <li key={`c-${i}`} className="d-flex align-items-center mb-1">
                              <i className="bi bi-plus-circle text-info me-2"></i> Complemento: {c}
                            </li>
                          ))}
                        </ul>

                        <a
                          href={`https://wa.me/527442188925?text=Hola, estoy interesado en el plan: *${plan.nombre} - ${formatted}*`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-success btn-sm w-100 mt-auto d-flex align-items-center justify-content-center gap-2"
                        >
                          <i className="bi bi-whatsapp"></i> Más información
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Plans;
