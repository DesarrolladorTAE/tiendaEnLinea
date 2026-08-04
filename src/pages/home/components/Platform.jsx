import React from "react";
import useScrollReveal from "../hooks/useScrollReveal";
import "../styles/Platform.css";

const platformFeatures = [
  {
    icon: "bi-cash-coin",
    title: "Vende desde cualquier lugar",
    description:
      "Registra ventas en sucursal, consulta movimientos y administra tus operaciones desde una sola plataforma.",
    bullets: [
      "Punto de venta para computadora, tablet o celular",
      "Distintos métodos de pago",
      "Historial detallado de ventas",
      "Tickets digitales e impresión",
    ],
  },
  {
    icon: "bi-box-seam-fill",
    title: "Controla tus inventarios",
    description:
      "Conoce la existencia de tus productos y evita pérdidas por falta de control o productos agotados.",
    bullets: [
      "Entradas, salidas y movimientos de inventario",
      "Existencias por sucursal",
      "Alertas de productos con poco stock",
      "Consulta de movimientos y ajustes",
    ],
  },
  {
    icon: "bi-shop-window",
    title: "Crea tu tienda en línea",
    description:
      "Publica tus productos y permite que tus clientes compren desde cualquier dispositivo.",
    bullets: [
      "Catálogo de productos personalizado",
      "Carrito de compra",
      "Acceso para clientes",
      "Pagos en línea según tu plan",
    ],
  },
  {
    icon: "bi-buildings-fill",
    title: "Administra tus sucursales",
    description:
      "Centraliza la operación de distintas sucursales sin perder el control individual de cada una.",
    bullets: [
      "Ventas separadas por sucursal",
      "Inventario independiente",
      "Usuarios y permisos",
      "Reportes consolidados",
    ],
  },
  {
    icon: "bi-people-fill",
    title: "Conoce mejor a tus clientes",
    description:
      "Organiza la información de tus clientes y consulta su historial para brindar una atención personalizada.",
    bullets: [
      "Registro de clientes",
      "Historial de compras",
      "Datos de contacto",
      "Seguimiento de saldos y crédito",
    ],
  },
  {
    icon: "bi-receipt-cutoff",
    title: "Facturación electrónica",
    description:
      "Genera comprobantes fiscales desde las ventas registradas en tu plataforma.",
    bullets: [
      "Datos fiscales de clientes",
      "Generación de facturas",
      "Descarga de PDF y XML",
      "Seguimiento del estado de facturación",
    ],
  },
  {
    icon: "bi-bar-chart-fill",
    title: "Reportes para tomar decisiones",
    description:
      "Consulta el desempeño de tu negocio mediante información clara y actualizada.",
    bullets: [
      "Ventas por periodo",
      "Ingresos por método de pago",
      "Productos más vendidos",
      "Resultados por sucursal",
    ],
  },
  {
    icon: "bi-calendar-check-fill",
    title: "Agenda y servicios",
    description:
      "Organiza citas, servicios y disponibilidad para negocios que trabajan mediante reservaciones.",
    bullets: [
      "Registro de citas",
      "Control de horarios",
      "Servicios por sucursal",
      "Seguimiento de clientes",
    ],
  },
  {
    icon: "bi-credit-card-fill",
    title: "Opciones de cobro",
    description:
      "Recibe pagos de acuerdo con la forma de operación de tu negocio.",
    bullets: [
      "Efectivo",
      "Tarjetas y transferencias",
      "Pagos combinados",
      "Pasarela de pago en línea",
    ],
  },
];

const businessModules = [
  {
    icon: "bi-cart-check-fill",
    label: "Punto de venta",
  },
  {
    icon: "bi-boxes",
    label: "Inventarios",
  },
  {
    icon: "bi-globe2",
    label: "Tienda en línea",
  },
  {
    icon: "bi-receipt",
    label: "Facturación",
  },
  {
    icon: "bi-graph-up-arrow",
    label: "Reportes",
  },
  {
    icon: "bi-calendar-event",
    label: "Agenda",
  },
];

const Platform = () => {
  useScrollReveal();

  return (
    <section
      id="plataforma"
      className="platform-section"
      aria-labelledby="platform-title"
    >
      <div className="platform-section__background" aria-hidden="true">
        <span className="platform-section__grid" />
        <span className="platform-section__glow platform-section__glow--one" />
        <span className="platform-section__glow platform-section__glow--two" />
      </div>

      <div className="platform-section__container">
        <header className="platform-section__header animate-on-scroll">
          <span className="platform-section__eyebrow">
            <i className="bi bi-grid-1x2-fill" aria-hidden="true" />
            Todo lo que necesita tu negocio
          </span>

          <h1 id="platform-title" className="platform-section__title">
            Una plataforma para vender, administrar y hacer crecer tu negocio
          </h1>

          <p className="platform-section__description">
            <strong>Mi Tienda en Línea MX</strong> reúne tus ventas,
            inventarios, sucursales, clientes, tienda en línea, facturación y
            reportes en un mismo lugar.
          </p>

          <div className="platform-section__modules">
            {businessModules.map((module) => (
              <span key={module.label} className="platform-module">
                <i className={`bi ${module.icon}`} aria-hidden="true" />
                {module.label}
              </span>
            ))}
          </div>
        </header>

        <div className="platform-summary animate-on-scroll">
          <div className="platform-summary__content">
            <span className="platform-summary__label">
              Plataforma integral
            </span>

            <h2>Controla cada parte de tu operación</h2>

            <p>
              Desde una venta en mostrador hasta una compra en línea, la
              plataforma te permite dar seguimiento a tus operaciones y
              consultar el desempeño de tu negocio.
            </p>

            <div className="platform-summary__benefits">
              <div>
                <strong>Un solo sistema</strong>
                <span>Centraliza la información de tu negocio.</span>
              </div>

              <div>
                <strong>Acceso desde cualquier dispositivo</strong>
                <span>Consulta tus operaciones donde te encuentres.</span>
              </div>

              <div>
                <strong>Adaptado a tu crecimiento</strong>
                <span>Activa nuevas herramientas conforme las necesites.</span>
              </div>
            </div>
          </div>

          <div className="platform-summary__visual" aria-hidden="true">
            <div className="platform-summary__visual-icon">
              <i className="bi bi-shop-window" />
            </div>

            <div className="platform-summary__metric">
              <small>Ventas</small>
              <strong>Control total</strong>
            </div>

            <div className="platform-summary__metric">
              <small>Inventario</small>
              <strong>Actualizado</strong>
            </div>

            <div className="platform-summary__metric">
              <small>Sucursales</small>
              <strong>Centralizadas</strong>
            </div>
          </div>
        </div>

        <div className="platform-features">
          {platformFeatures.map((feature) => (
            <article
              key={feature.title}
              className="platform-card animate-on-scroll"
            >
              <div className="platform-card__icon" aria-hidden="true">
                <i className={`bi ${feature.icon}`} />
              </div>

              <div className="platform-card__content">
                <h2>{feature.title}</h2>

                <p>{feature.description}</p>

                <ul>
                  {feature.bullets.map((bullet) => (
                    <li key={bullet}>
                      <i
                        className="bi bi-check-circle-fill"
                        aria-hidden="true"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div className="platform-cta animate-on-scroll">
          <div className="platform-cta__icon" aria-hidden="true">
            <i className="bi bi-rocket-takeoff-fill" />
          </div>

          <div className="platform-cta__content">
            <span>Comienza a vender mejor</span>

            <h2>Transforma la administración de tu negocio</h2>

            <p>
              Elige las herramientas que necesitas y centraliza tus ventas,
              inventarios, clientes y operaciones.
            </p>
          </div>

          <a className="platform-cta__button" href="/contact">
            Solicitar información
            <i className="bi bi-arrow-right" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Platform;