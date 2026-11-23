import React from "react";
import termsConditionsData from "../../data/termsConditionsData";
import "../../pages/home/landing.css";

const TermsConditions = () => {
  const { meta, hero, sections, contact, footer, ctaButtons } = termsConditionsData;

  return (
    <div className="landing-root">
      <section className="hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <div className="hero-content">
                <span className="badge bg-light text-dark rounded-pill px-3 py-2 mb-3">
                  {hero.badge}
                </span>

                <h1>
                  {hero.title} <span className="highlight">{hero.highlight}</span>
                </h1>

                <p>{hero.description}</p>

                <div className="d-flex flex-wrap gap-3 mb-3">
                  <a href="#terminos" className="btn btn-primary-custom">
                    Leer términos
                  </a>
                </div>

                <div className="d-flex flex-wrap gap-3">
                  {ctaButtons.map((button, index) => (
                    <a
                      key={index}
                      href={button.href}
                      className={index === 0 ? "btn btn-light rounded-pill px-4 py-2 fw-semibold" : "btn btn-primary-custom"}
                    >
                      <i className={`${button.icon} me-2`}></i>
                      {button.text}
                    </a>
                  ))}
                </div>

                <div className="mt-4 text-light">
                  Última actualización: <strong>{meta.lastUpdate}</strong>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="hero-image">
                <div className="colored-card card-primary text-center">
                  <i className="bi bi-shield-check fs-1 mb-3 d-block"></i>
                  <h3 className="fw-bold mb-3">Uso seguro y transparente</h3>
                  <p className="mb-0">
                    {meta.intro}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="platform-section" id="terminos">
        <div className="container">
          <div className="text-center mb-5">
            <div className="platform-icon">
              <i className="bi bi-file-earmark-text"></i>
            </div>
            <h2 className="fw-bold mb-3">
              {meta.title} de <span className="text-gradient">{meta.brand}</span>
            </h2>
            <p className="text-muted mx-auto" style={{ maxWidth: "850px" }}>
              {meta.acceptance}
            </p>
          </div>

          <div className="row g-4">
            {sections.map((section) => (
              <div className="col-md-6 col-lg-4" key={section.id}>
                <div className="feature-card">
                  <div className="icon">
                    <i className={section.icon}></i>
                  </div>
                  <h4 className="fw-bold">
                    {section.id}. {section.title}
                  </h4>
                  <p className="text-muted">{section.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5 bg-white">
        <div className="container">
          <div className="row g-4">
            {sections.map((section) => (
              <div className="col-lg-6" key={section.id}>
                <div className="feature-card h-100">
                  <h3 className="fw-bold mb-4">
                    <i className={`bi bi-${section.id}-circle-fill text-warning me-2`}></i>
                    {section.id}. {section.title}
                  </h3>

                  {section.content.map((block, idx) => (
                    <div key={idx}>
                      {block.subtitle && <p><strong>{block.subtitle}:</strong></p>}
                      {block.paragraphs.map((paragraph, pIndex) => (
                        <p className="text-muted" key={pIndex}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="contact-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="contact-form">
                <div className="text-center mb-5">
                  <h2 className="fw-bold mb-3">9. {contact.title}</h2>
                  <p className="mb-0 text-light">{contact.description}</p>
                </div>

                <div className="row g-4">
                  {contact.items.map((item, index) => (
                    <div className="col-md-4" key={index}>
                      <div className="d-flex align-items-start gap-3">
                        <div className="contact-icon">
                          <i className={`${item.icon} text-white`}></i>
                        </div>
                        <div>
                          <h5 className="fw-bold mb-1">{item.label}</h5>
                          <a
                            href={item.href}
                            target={item.href.startsWith("http") ? "_blank" : undefined}
                            rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                            className="text-white text-decoration-none"
                          >
                            {item.value}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <hr className="border-light opacity-25 my-5" />

                <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
                  {ctaButtons.map((button, index) => (
                    <a
                      key={index}
                      href={button.href}
                      className={index === 0 ? "btn btn-light rounded-pill px-4 py-2 fw-semibold" : "btn btn-primary-custom"}
                    >
                      <i className={`${button.icon} me-2`}></i>
                      {button.text}
                    </a>
                  ))}
                </div>

                <p className="text-center mb-0 text-light">
                  Al utilizar nuestros servicios, confirmas que has leído,
                  entendido y aceptado estos términos y condiciones.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-md-8">
              <h5 className="fw-bold mb-2">{footer.brand}</h5>
              <p className="mb-0 text-light">{footer.text}</p>
            </div>

            <div className="col-md-4 text-md-end">
              <span className="footer-link">
                Última actualización: {meta.lastUpdate}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsConditions;