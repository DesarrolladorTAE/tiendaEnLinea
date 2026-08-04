import React from "react";
import useScrollReveal from "../hooks/useScrollReveal";
import "../styles/Features.css";

const serviceFeatures = [
  {
    icon: "bi-whatsapp",
    title: "Soporte personalizado por WhatsApp",
    text: "Comunícate directamente con nuestro equipo para resolver dudas, recibir orientación y dar seguimiento a cualquier incidencia.",
  },
  {
    icon: "bi-person-check-fill",
    title: "Atención humana y en español",
    text: "Recibe atención de personas que conocen la plataforma y pueden ayudarte sin depender únicamente de respuestas automáticas.",
  },
  {
    icon: "bi-sliders2",
    title: "Configuración adaptada a tu negocio",
    text: "Ajustamos sucursales, usuarios, productos, permisos y opciones de operación según las necesidades de tu empresa.",
  },
  {
    icon: "bi-rocket-takeoff-fill",
    title: "Acompañamiento en la implementación",
    text: "Te orientamos durante la configuración inicial para que puedas comenzar a utilizar las herramientas de forma clara y ordenada.",
  },
  {
    icon: "bi-palette-fill",
    title: "Imagen personalizada",
    text: "Personaliza logotipo, colores, portada, información comercial, redes sociales y elementos visuales de tu tienda.",
  },
  {
    icon: "bi-mortarboard-fill",
    title: "Orientación para utilizar la plataforma",
    text: "Te ayudamos a conocer las principales funciones para que puedas aprovechar mejor las herramientas incluidas en tu plan.",
  },
  {
    icon: "bi-arrow-repeat",
    title: "Actualizaciones y mejoras continuas",
    text: "La plataforma recibe mejoras, correcciones y nuevas funciones para ofrecer una experiencia más estable y completa.",
  },
  {
    icon: "bi-graph-up-arrow",
    title: "Una solución que crece contigo",
    text: "Comienza con las herramientas que necesitas y agrega nuevas opciones conforme aumenten tus operaciones y sucursales.",
  },
];

const differentiators = [
  {
    number: "01",
    icon: "bi-chat-heart-fill",
    title: "Atención cercana",
    text: "No te dejamos solo después de contratar. Nuestro equipo puede orientarte durante el uso de la plataforma.",
  },
  {
    number: "02",
    icon: "bi-gear-wide-connected",
    title: "Adaptación a tu operación",
    text: "Buscamos que la plataforma se ajuste a la forma en que trabajas y no que tu negocio se adapte a una solución rígida.",
  },
  {
    number: "03",
    icon: "bi-shop-window",
    title: "Identidad propia para tu tienda",
    text: "Tu tienda puede conservar la imagen, información y estilo de tu marca para ofrecer una experiencia más profesional.",
  },
  {
    number: "04",
    icon: "bi-tools",
    title: "Seguimiento y mejora",
    text: "Escuchamos necesidades reales para corregir, mejorar y ampliar las herramientas disponibles.",
  },
];

const supportSteps = [
  {
    icon: "bi-chat-dots-fill",
    title: "Cuéntanos qué necesitas",
    text: "Conocemos el tipo de negocio, número de sucursales y forma de operación.",
  },
  {
    icon: "bi-toggles",
    title: "Configuramos tu plataforma",
    text: "Preparamos las opciones, accesos y herramientas principales.",
  },
  {
    icon: "bi-person-video3",
    title: "Te orientamos",
    text: "Explicamos el funcionamiento de las áreas más importantes del sistema.",
  },
  {
    icon: "bi-headset",
    title: "Te acompañamos",
    text: "Puedes comunicarte con soporte cuando necesites ayuda.",
  },
];

const additionalAdvantages = [
  {
    icon: "bi-shield-lock-fill",
    title: "Usuarios y permisos",
    text: "Controla qué información y herramientas puede consultar cada colaborador.",
  },
  {
    icon: "bi-phone-fill",
    title: "Acceso desde distintos dispositivos",
    text: "Consulta la plataforma desde computadora, tablet o teléfono.",
  },
  {
    icon: "bi-cloud-check-fill",
    title: "Información centralizada",
    text: "Consulta los datos del negocio desde un mismo entorno.",
  },
  {
    icon: "bi-building-check",
    title: "Preparada para sucursales",
    text: "Administra diferentes ubicaciones conforme crezca tu negocio.",
  },
  {
    icon: "bi-window-stack",
    title: "Herramientas conectadas",
    text: "Evita trabajar con múltiples sistemas aislados para cada operación.",
  },
  {
    icon: "bi-bar-chart-line-fill",
    title: "Mejor control del negocio",
    text: "Obtén información organizada para dar seguimiento a tus operaciones.",
  },
];

const Features = () => {
  useScrollReveal();

  return (
    <section
      id="caracteristicas"
      className="features-section"
      aria-labelledby="features-title"
    >
      <div className="features-section__background" aria-hidden="true">
        <span className="features-section__grid" />
        <span className="features-section__glow features-section__glow--one" />
        <span className="features-section__glow features-section__glow--two" />
      </div>

      <div className="features-section__container">
        <header className="features-section__header animate-on-scroll">
          <span className="features-section__eyebrow">
            <i className="bi bi-stars" aria-hidden="true" />
            Una experiencia diferente
          </span>

          <h1 id="features-title" className="features-section__title">
            Más que una plataforma, un equipo que te acompaña
          </h1>

          <p className="features-section__description">
            A diferencia de soluciones genéricas, en Mi Tienda en Línea MX
            recibes atención personalizada, configuración adaptada a tu negocio
            y acompañamiento para aprovechar mejor cada herramienta.
          </p>
        </header>

        <div className="features-support animate-on-scroll">
          <div className="features-support__content">
            <span className="features-support__label">
              Soporte personalizado
            </span>

            <h2>
              Habla directamente con nuestro equipo cuando necesites ayuda
            </h2>

            <p>
              Sabemos que implementar una nueva plataforma puede generar
              dudas. Por eso ofrecemos un canal de atención directa para
              orientarte en la configuración, el funcionamiento de las
              herramientas y el seguimiento de incidencias.
            </p>

            <div className="features-support__benefits">
              <div>
                <i className="bi bi-check-circle-fill" aria-hidden="true" />

                <span>
                  <strong>Atención por WhatsApp</strong>
                  Recibe orientación mediante un canal rápido y conocido.
                </span>
              </div>

              <div>
                <i className="bi bi-check-circle-fill" aria-hidden="true" />

                <span>
                  <strong>Seguimiento personalizado</strong>
                  Revisamos tu caso para ofrecerte una respuesta más clara.
                </span>
              </div>

              <div>
                <i className="bi bi-check-circle-fill" aria-hidden="true" />

                <span>
                  <strong>Comunicación en español</strong>
                  Explicaciones sencillas, cercanas y enfocadas en tu negocio.
                </span>
              </div>
            </div>

            <a
              className="features-support__button"
              href="https://wa.me/527442188925"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="bi bi-whatsapp" aria-hidden="true" />
              Hablar por WhatsApp
            </a>
          </div>

          <div className="features-support__visual" aria-hidden="true">
            <div className="features-support__phone">
              <div className="features-support__phone-header">
                <span className="features-support__avatar">
                  <i className="bi bi-headset" />
                </span>

                <div>
                  <strong>Soporte Mi Tienda en Línea MX</strong>
                  <small>
                    <span />
                    Disponible
                  </small>
                </div>
              </div>

              <div className="features-support__conversation">
                <div className="features-support__message features-support__message--client">
                  Hola, necesito ayuda para configurar una sucursal.
                </div>

                <div className="features-support__message features-support__message--support">
                  Claro, te ayudamos a revisar la configuración paso a paso.
                </div>

                <div className="features-support__message features-support__message--client">
                  ¡Muchas gracias!
                </div>
              </div>

              <div className="features-support__input">
                <span>Escribe un mensaje...</span>
                <i className="bi bi-send-fill" />
              </div>
            </div>

            <span className="features-support__badge">
              <i className="bi bi-whatsapp" />
              Atención personalizada
            </span>
          </div>
        </div>

        <div className="features-section__heading animate-on-scroll">
          <span>Lo que nos hace diferentes</span>

          <h2>Un servicio más cercano, flexible y personalizado</h2>

          <p>
            No solo entregamos acceso a un sistema. Buscamos acompañarte para
            que la plataforma se adapte mejor a tu operación.
          </p>
        </div>

        <div className="features-grid">
          {serviceFeatures.map((feature) => (
            <article
              key={feature.title}
              className="feature-card animate-on-scroll"
            >
              <div className="feature-card__icon" aria-hidden="true">
                <i className={`bi ${feature.icon}`} />
              </div>

              <div className="feature-card__content">
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>

              <span className="feature-card__decoration" aria-hidden="true" />
            </article>
          ))}
        </div>

        <div className="features-section__heading features-section__heading--differences animate-on-scroll">
          <span>Frente a plataformas genéricas</span>

          <h2>Una solución que busca adaptarse a tu negocio</h2>

          <p>
            Cada negocio tiene procesos y necesidades diferentes. Nuestro
            enfoque combina tecnología con atención personalizada.
          </p>
        </div>

        <div className="features-differences">
          {differentiators.map((item) => (
            <article
              key={item.number}
              className="difference-card animate-on-scroll"
            >
              <span className="difference-card__number">
                {item.number}
              </span>

              <div className="difference-card__icon" aria-hidden="true">
                <i className={`bi ${item.icon}`} />
              </div>

              <div className="difference-card__content">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="features-process animate-on-scroll">
          <div className="features-process__header">
            <span>Cómo te acompañamos</span>

            <h2>Desde la configuración hasta la operación diaria</h2>

            <p>
              Nuestro proceso busca facilitar la implementación y ayudarte a
              comenzar con una estructura clara.
            </p>
          </div>

          <div className="features-process__steps">
            {supportSteps.map((step, index) => (
              <article key={step.title} className="features-process__step">
                <span className="features-process__number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="features-process__icon" aria-hidden="true">
                  <i className={`bi ${step.icon}`} />
                </div>

                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="features-additional animate-on-scroll">
          <div className="features-additional__header">
            <span>Ventajas adicionales</span>

            <h2>Diseñada para darte control y flexibilidad</h2>
          </div>

          <div className="features-additional__grid">
            {additionalAdvantages.map((advantage) => (
              <article
                key={advantage.title}
                className="features-additional__item"
              >
                <span
                  className="features-additional__icon"
                  aria-hidden="true"
                >
                  <i className={`bi ${advantage.icon}`} />
                </span>

                <div>
                  <h3>{advantage.title}</h3>
                  <p>{advantage.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="features-cta animate-on-scroll">
          <div className="features-cta__icon" aria-hidden="true">
            <i className="bi bi-whatsapp" />
          </div>

          <div className="features-cta__content">
            <span>Hablemos de tu negocio</span>

            <h2>Recibe orientación personalizada</h2>

            <p>
              Cuéntanos cómo trabajas y te ayudaremos a identificar las
              herramientas más adecuadas para tu operación.
            </p>
          </div>

          <a
            className="features-cta__button"
            href="https://wa.me/527442188925"
            target="_blank"
            rel="noopener noreferrer"
          >
            Hablar por WhatsApp
            <i className="bi bi-whatsapp" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Features;