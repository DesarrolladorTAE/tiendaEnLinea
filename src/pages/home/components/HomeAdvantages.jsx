import React from "react";
import { Link } from "react-router-dom";

import useScrollReveal from "../hooks/useScrollReveal";

import "../styles/HomeAdvantages.css";

const advantages = [
  {
    icon: "bi-chat-heart-fill",
    number: "01",
    title: "Soporte cercano",
    text: "Recibe atención directa de nuestro equipo para resolver dudas y acompañarte durante el uso de la plataforma.",
    highlight: "Atención personalizada",
  },
  {
    icon: "bi-sliders2",
    number: "02",
    title: "Se adapta a tu operación",
    text: "Configura herramientas, usuarios, sucursales y opciones de acuerdo con la forma en que trabaja tu negocio.",
    highlight: "Configuración flexible",
  },
  {
    icon: "bi-arrow-repeat",
    number: "03",
    title: "Mejora constantemente",
    text: "Incorporamos mejoras, correcciones y nuevas funciones para mantener una plataforma cada vez más completa.",
    highlight: "Evolución continua",
  },
  {
    icon: "bi-graph-up-arrow",
    number: "04",
    title: "Crece junto a tu negocio",
    text: "Comienza con lo que necesitas y amplía tus herramientas conforme aumenten tus operaciones y sucursales.",
    highlight: "Preparada para crecer",
  },
];

const HomeAdvantages = () => {
  useScrollReveal();

  return (
    <section
      className="home-advantages"
      aria-labelledby="home-advantages-title"
    >
      <div className="home-advantages__background" aria-hidden="true">
        <span className="home-advantages__grid" />
        <span className="home-advantages__glow home-advantages__glow--one" />
        <span className="home-advantages__glow home-advantages__glow--two" />
      </div>

      <div className="home-advantages__container">
        <header className="home-advantages__header animate-on-scroll">
          <span className="home-advantages__eyebrow">
            <i className="bi bi-stars" aria-hidden="true" />
            Una experiencia diferente
          </span>

          <h2 id="home-advantages-title">
            Tecnología para tu negocio,
            <span> acompañada por personas</span>
          </h2>

          <p>
            No solo obtienes acceso a una plataforma. Buscamos acompañarte,
            entender tu operación y ofrecerte herramientas que puedan
            adaptarse a las necesidades de tu negocio.
          </p>
        </header>

        <div className="home-advantages__content">
          <div className="home-advantages__featured animate-on-scroll">
            <div className="home-advantages__featured-top">
              <span className="home-advantages__featured-label">
                Nuestro enfoque
              </span>

              <span className="home-advantages__featured-icon">
                <i className="bi bi-people-fill" />
              </span>
            </div>

            <div className="home-advantages__featured-copy">
              <h3>
                Una plataforma no debería dejarte solo después de contratarla
              </h3>

              <p>
                Queremos que puedas utilizar las herramientas con claridad.
                Por eso combinamos tecnología, configuración y atención
                personalizada para acompañarte durante tu operación.
              </p>
            </div>

            <div className="home-advantages__conversation">
              <div className="home-advantages__conversation-header">
                <span>
                  <i className="bi bi-headset" />
                </span>

                <div>
                  <strong>Equipo de soporte</strong>

                  <small>
                    <i />
                    Disponible para ayudarte
                  </small>
                </div>
              </div>

              <div className="home-advantages__messages">
                <div className="home-advantages__message home-advantages__message--user">
                  Necesito configurar una nueva sucursal.
                </div>

                <div className="home-advantages__message home-advantages__message--support">
                  Claro. Podemos orientarte con la configuración y los accesos
                  que necesitas.
                </div>
              </div>

              <div className="home-advantages__conversation-status">
                <i className="bi bi-check-circle-fill" />
                <span>Atención directa y personalizada</span>
              </div>
            </div>

            <div className="home-advantages__featured-footer">
              <div>
                <i className="bi bi-chat-dots-fill" />
                <span>
                  <strong>Comunicación clara</strong>
                  Atención en español
                </span>
              </div>

              <div>
                <i className="bi bi-person-check-fill" />
                <span>
                  <strong>Seguimiento</strong>
                  Conocemos tu caso
                </span>
              </div>
            </div>
          </div>

          <div className="home-advantages__grid">
            {advantages.map((advantage) => (
              <article
                key={advantage.number}
                className="home-advantage-card animate-on-scroll"
              >
                <span className="home-advantage-card__number">
                  {advantage.number}
                </span>

                <div className="home-advantage-card__icon" aria-hidden="true">
                  <i className={`bi ${advantage.icon}`} />
                </div>

                <span className="home-advantage-card__highlight">
                  {advantage.highlight}
                </span>

                <h3>{advantage.title}</h3>

                <p>{advantage.text}</p>

                <span
                  className="home-advantage-card__decoration"
                  aria-hidden="true"
                />
              </article>
            ))}
          </div>
        </div>

        <div className="home-advantages__bottom animate-on-scroll">
          <div className="home-advantages__bottom-icon" aria-hidden="true">
            <i className="bi bi-lightbulb-fill" />
          </div>

          <div className="home-advantages__bottom-content">
            <span>Conoce nuestra forma de trabajar</span>

            <h3>
              Descubre todo lo que hacemos para acompañar a tu negocio
            </h3>

            <p>
              Conoce nuestro soporte, proceso de implementación,
              personalización y las ventajas adicionales de la plataforma.
            </p>
          </div>

          <Link
            to="/caracteristicas"
            className="home-advantages__button"
          >
            Conocer más
            <i className="bi bi-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeAdvantages;