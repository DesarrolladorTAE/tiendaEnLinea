import React from "react";
import "../styles/Hero.css";

const Hero = ({ onStart, onDemo }) => {
  return (
    <section
      className="landing-hero"
      aria-labelledby="landing-hero-title"
    >
      <div className="landing-hero__background" aria-hidden="true">
        <div className="landing-hero__grid" />
        <div className="landing-hero__glow landing-hero__glow--one" />
        <div className="landing-hero__glow landing-hero__glow--two" />
        <div className="landing-hero__orb landing-hero__orb--one" />
        <div className="landing-hero__orb landing-hero__orb--two" />
      </div>

      <div className="landing-container landing-hero__container">
        <div className="landing-hero__content">
          <p className="landing-hero__eyebrow">
            <span className="landing-hero__eyebrow-dot" />
            Plataforma integral para negocios en México
          </p>

          <h1
            id="landing-hero-title"
            className="landing-hero__title"
          >
            Tu tienda en línea y todo tu negocio
            <span> en una sola plataforma</span>
          </h1>

          <p className="landing-hero__description">
            Vende por internet, administra inventarios, controla tus
            sucursales, cobra, factura y conoce el desempeño de tu negocio
            desde cualquier dispositivo.
          </p>

          <div
            className="landing-hero__actions"
            aria-label="Acciones principales"
          >
            <button
              type="button"
              className="landing-hero__button landing-hero__button--primary"
              onClick={onStart}
            >
              <span>Crear mi tienda</span>

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="landing-hero__button-icon"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              type="button"
              className="landing-hero__button landing-hero__button--secondary"
              onClick={onDemo}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="landing-hero__play-icon"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />

                <path
                  d="m10 8.8 5 3.2-5 3.2V8.8Z"
                  fill="currentColor"
                />
              </svg>

              <span>Solicitar demostración</span>
            </button>
          </div>

          <ul className="landing-hero__benefits">
            <li>
              <span aria-hidden="true">✓</span>
              Sin instalaciones complicadas
            </li>

            <li>
              <span aria-hidden="true">✓</span>
              Soporte personalizado
            </li>

            <li>
              <span aria-hidden="true">✓</span>
              Acceso desde cualquier dispositivo
            </li>
          </ul>

          <div className="landing-hero__modules">
            <p>Una plataforma para administrar:</p>

            <div className="landing-hero__module-list">
              <span>Tienda en línea</span>
              <span>Punto de venta</span>
              <span>Inventario</span>
              <span>Facturación</span>
              <span>Clientes</span>
            </div>
          </div>
        </div>

        <div className="landing-hero__visual" aria-hidden="true">
          <div className="hero-scene">
            <div className="hero-scene__shadow" />

            <div className="hero-dashboard">
              <div className="hero-dashboard__browser">
                <div className="hero-dashboard__browser-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="hero-dashboard__browser-url">
                  mitiendaenlineamx.com.mx
                </div>
              </div>

              <div className="hero-dashboard__layout">
                <aside className="hero-dashboard__sidebar">
                  <div className="hero-dashboard__brand">
                    <span>m</span>
                  </div>

                  <div className="hero-dashboard__sidebar-menu">
                    <span className="is-active" />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </aside>

                <div className="hero-dashboard__main">
                  <div className="hero-dashboard__heading">
                    <div>
                      <small>Resumen del negocio</small>
                      <strong>¡Buenos días!</strong>
                    </div>

                    <div className="hero-dashboard__avatar">
                      MT
                    </div>
                  </div>

                  <div className="hero-dashboard__metrics">
                    <article>
                      <div className="hero-dashboard__metric-icon">
                        $
                      </div>

                      <div>
                        <small>Ventas del mes</small>
                        <strong>$48,750</strong>
                        <span>+18.4%</span>
                      </div>
                    </article>

                    <article>
                      <div className="hero-dashboard__metric-icon">
                        #
                      </div>

                      <div>
                        <small>Pedidos</small>
                        <strong>128</strong>
                        <span>+12.6%</span>
                      </div>
                    </article>

                    <article>
                      <div className="hero-dashboard__metric-icon">
                        +
                      </div>

                      <div>
                        <small>Clientes nuevos</small>
                        <strong>46</strong>
                        <span>+8.2%</span>
                      </div>
                    </article>
                  </div>

                  <div className="hero-dashboard__lower">
                    <article className="hero-dashboard__chart-card">
                      <div className="hero-dashboard__card-title">
                        <div>
                          <small>Ingresos</small>
                          <strong>Ventas semanales</strong>
                        </div>

                        <span>Últimos 7 días</span>
                      </div>

                      <div className="hero-dashboard__chart">
                        <div className="hero-dashboard__chart-lines">
                          <span />
                          <span />
                          <span />
                          <span />
                        </div>

                        <div className="hero-dashboard__bars">
                          <i style={{ "--bar-height": "38%" }} />
                          <i style={{ "--bar-height": "55%" }} />
                          <i style={{ "--bar-height": "46%" }} />
                          <i style={{ "--bar-height": "72%" }} />
                          <i style={{ "--bar-height": "64%" }} />
                          <i style={{ "--bar-height": "89%" }} />
                          <i style={{ "--bar-height": "78%" }} />
                        </div>
                      </div>
                    </article>

                    <article className="hero-dashboard__orders">
                      <div className="hero-dashboard__card-title">
                        <div>
                          <small>Actividad</small>
                          <strong>Pedidos recientes</strong>
                        </div>
                      </div>

                      <div className="hero-dashboard__order-list">
                        <div>
                          <span className="hero-dashboard__product" />
                          <p>
                            <strong>Venta #1048</strong>
                            <small>Hace 2 minutos</small>
                          </p>
                          <b>$849</b>
                        </div>

                        <div>
                          <span className="hero-dashboard__product" />
                          <p>
                            <strong>Venta #1047</strong>
                            <small>Hace 8 minutos</small>
                          </p>
                          <b>$1,290</b>
                        </div>

                        <div>
                          <span className="hero-dashboard__product" />
                          <p>
                            <strong>Venta #1046</strong>
                            <small>Hace 16 minutos</small>
                          </p>
                          <b>$560</b>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-phone">
              <div className="hero-phone__speaker" />

              <div className="hero-phone__screen">
                <div className="hero-phone__store-header">
                  <span className="hero-phone__store-logo">m</span>
                  <span className="hero-phone__menu-icon" />
                </div>

                <div className="hero-phone__banner">
                  <small>Nueva colección</small>
                  <strong>Compra desde cualquier lugar</strong>
                  <span>Ver productos</span>
                </div>

                <p className="hero-phone__section-title">
                  Productos destacados
                </p>

                <div className="hero-phone__products">
                  <article>
                    <div />
                    <small>Producto</small>
                    <strong>$399</strong>
                  </article>

                  <article>
                    <div />
                    <small>Producto</small>
                    <strong>$649</strong>
                  </article>
                </div>
              </div>
            </div>

            <article className="hero-floating-card hero-floating-card--payment">
              <span className="hero-floating-card__icon">
                ✓
              </span>

              <div>
                <small>Pago recibido</small>
                <strong>$1,249.00</strong>
              </div>
            </article>

            <article className="hero-floating-card hero-floating-card--order">
              <span className="hero-floating-card__icon">
                +
              </span>

              <div>
                <small>Nuevo pedido</small>
                <strong>Venta #1048</strong>
              </div>
            </article>

            <article className="hero-floating-card hero-floating-card--invoice">
              <span className="hero-floating-card__icon">
                CFDI
              </span>

              <div>
                <small>Facturación</small>
                <strong>Factura timbrada</strong>
              </div>
            </article>
          </div>
        </div>
      </div>

      <div className="landing-hero__bottom" aria-hidden="true">
        <span />
      </div>
    </section>
  );
};

export default Hero;