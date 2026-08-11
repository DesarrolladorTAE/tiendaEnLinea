import React from "react";
import { Link } from "react-router-dom";

import useScrollReveal from "../hooks/useScrollReveal";

import "../styles/HomePlatform.css";

const connectedModules = [
  {
    icon: "bi-cart-check-fill",
    title: "Ventas",
    text: "Registra y consulta tus operaciones.",
  },
  {
    icon: "bi-boxes",
    title: "Inventario",
    text: "Mantén el control de tus existencias.",
  },
  {
    icon: "bi-people-fill",
    title: "Clientes",
    text: "Centraliza información e historial.",
  },
  {
    icon: "bi-shop-window",
    title: "Tienda en línea",
    text: "Vende también desde internet.",
  },
  {
    icon: "bi-receipt-cutoff",
    title: "Facturación",
    text: "Genera comprobantes desde tus ventas.",
  },
  {
    icon: "bi-bar-chart-fill",
    title: "Reportes",
    text: "Consulta información para tomar decisiones.",
  },
];

const HomePlatform = () => {
  useScrollReveal();

  return (
    <section
      className="home-platform"
      aria-labelledby="home-platform-title"
    >
      <div className="home-platform__background" aria-hidden="true">
        <span className="home-platform__grid" />
        <span className="home-platform__glow home-platform__glow--one" />
        <span className="home-platform__glow home-platform__glow--two" />
      </div>

      <div className="home-platform__container">
        <header className="home-platform__header animate-on-scroll">
          <span className="home-platform__eyebrow">
            <i className="bi bi-grid-1x2-fill" aria-hidden="true" />
            Una sola plataforma
          </span>

          <h2 id="home-platform-title">
            Todo tu negocio conectado en un mismo lugar
          </h2>

          <p>
            Mi Tienda en Línea MX integra las herramientas principales de tu
            operación para que ventas, inventario, clientes y administración
            trabajen de forma conectada.
          </p>
        </header>

        <div className="home-platform__layout">
          <div className="home-platform__modules">
            {connectedModules.map((module) => (
              <article
                key={module.title}
                className="home-platform-card animate-on-scroll"
              >
                <div
                  className="home-platform-card__icon"
                  aria-hidden="true"
                >
                  <i className={`bi ${module.icon}`} />
                </div>

                <div className="home-platform-card__content">
                  <h3>{module.title}</h3>
                  <p>{module.text}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="home-platform__visual animate-on-scroll">
            <div className="home-platform__visual-decoration" />

            <span className="home-platform__visual-label">
              Operación centralizada
            </span>

            <div className="home-platform__core">
              <div className="home-platform__core-icon">
                <i className="bi bi-shop" />
              </div>

              <div>
                <small>Mi Tienda en Línea MX</small>
                <strong>Tu negocio conectado</strong>
              </div>
            </div>

            <div className="home-platform__flow">
              <div className="home-platform__flow-item">
                <span>
                  <i className="bi bi-cart-check-fill" />
                </span>

                <div>
                  <small>01</small>
                  <strong>Realizas una venta</strong>
                </div>
              </div>

              <span className="home-platform__flow-line" />

              <div className="home-platform__flow-item">
                <span>
                  <i className="bi bi-box-seam-fill" />
                </span>

                <div>
                  <small>02</small>
                  <strong>Se actualiza inventario</strong>
                </div>
              </div>

              <span className="home-platform__flow-line" />

              <div className="home-platform__flow-item">
                <span>
                  <i className="bi bi-person-check-fill" />
                </span>

                <div>
                  <small>03</small>
                  <strong>Se relaciona con tu cliente</strong>
                </div>
              </div>

              <span className="home-platform__flow-line" />

              <div className="home-platform__flow-item">
                <span>
                  <i className="bi bi-graph-up-arrow" />
                </span>

                <div>
                  <small>04</small>
                  <strong>Obtienes información</strong>
                </div>
              </div>
            </div>

            <div className="home-platform__status">
              <span>
                <i className="bi bi-check-circle-fill" />
              </span>

              <div>
                <strong>Información sincronizada</strong>
                <small>
                  Consulta tu operación desde un mismo entorno.
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="home-platform__footer animate-on-scroll">
          <div>
            <span>Conoce todas las herramientas</span>

            <h3>
              Descubre cómo la plataforma puede adaptarse a tu negocio
            </h3>
          </div>

          <Link
            to="/plataforma"
            className="home-platform__button"
          >
            Ver plataforma completa
            <i className="bi bi-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomePlatform;