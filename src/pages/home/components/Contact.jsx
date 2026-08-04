import React, { useState } from "react";
import axios from "axios";
import useScrollReveal from "../hooks/useScrollReveal";
import "../styles/Contact.css";

const initialFormData = {
  firstName: "",
  email: "",
  phone: "",
  message: "",
};

const contacts = [
  {
    icon: "bi-envelope-fill",
    title: "Correo electrónico",
    value: "contacto@tecnologiasadministrativas.com",
    href: "mailto:contacto@tecnologiasadministrativas.com",
  },
  {
    icon: "bi-telephone-fill",
    title: "Teléfono",
    value: "+52 (744) 218 8925",
    href: "tel:+527442188925",
  },
  {
    icon: "bi-geo-alt-fill",
    title: "Ubicación",
    value: "C. 24 202, Las Cruces, 39770 Acapulco de Juárez, Gro.",
    href: "https://www.google.com/maps/search/?api=1&query=C.+24+202,+Las+Cruces,+39770+Acapulco+de+Juárez,+Gro.",
  },
];

const Contact = () => {
  useScrollReveal();

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    type: "",
    message: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (feedback.message) {
      setFeedback({
        type: "",
        message: "",
      });
    }
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      return "Escribe tu nombre.";
    }

    if (!formData.email.trim()) {
      return "Escribe tu correo electrónico.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(formData.email.trim())) {
      return "Escribe un correo electrónico válido.";
    }

    if (!formData.message.trim()) {
      return "Escribe el mensaje que deseas enviarnos.";
    }

    if (formData.message.trim().length < 10) {
      return "El mensaje debe contener al menos 10 caracteres.";
    }

    return "";
  };

  const enviarCorreo = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFeedback({
        type: "error",
        message: validationError,
      });

      return;
    }

    try {
      setLoading(true);
      setFeedback({
        type: "",
        message: "",
      });

      const payload = {
        nombre: formData.firstName.trim(),
        correo: formData.email.trim(),
        mensaje: formData.message.trim(),
        nombreProp: "Raul Alvarez",
        correoProp: "contacto@tecnologiasadministrativas.com",
        pagina: "MITIENDAENLINEAMX",
        telefono: formData.phone.trim() || null,
      };

      await axios.post(
        "https://taeconta.com/api/public/api/correos/publicos",
        payload,
      );

      setFormData(initialFormData);

      setFeedback({
        type: "success",
        message:
          "¡Mensaje enviado correctamente! Nuestro equipo se pondrá en contacto contigo.",
      });
    } catch (error) {
      console.error("Error al enviar el formulario:", error);

      setFeedback({
        type: "error",
        message:
          "No fue posible enviar el mensaje. Inténtalo nuevamente en unos minutos.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="contacto"
      className="contact-section"
      aria-labelledby="contact-title"
    >
      <div className="contact-section__background" aria-hidden="true">
        <span className="contact-section__glow contact-section__glow--one" />
        <span className="contact-section__glow contact-section__glow--two" />
        <span className="contact-section__grid" />
      </div>

      <div className="contact-section__container">
        <header className="contact-section__header animate-on-scroll">
          <span className="contact-section__eyebrow">
            <i className="bi bi-chat-dots" aria-hidden="true" />
            Hablemos de tu negocio
          </span>

          <h2 id="contact-title" className="contact-section__title">
            ¿Listo para llevar tu negocio al siguiente nivel?
          </h2>

          <p className="contact-section__description">
            Cuéntanos sobre tu proyecto y descubre cómo Mi Tienda en Línea MX
            puede ayudarte a vender, administrar y hacer crecer tu negocio.
          </p>
        </header>

        <div className="contact-section__content">
          <div className="contact-info animate-on-scroll">
            <div className="contact-info__heading">
              <span>Atención personalizada</span>

              <h3>Estamos para ayudarte</h3>

              <p>
                Comunícate con nuestro equipo para recibir asesoría sobre
                implementación, planes, tienda en línea, inventarios,
                facturación y medios de pago.
              </p>
            </div>

            <div className="contact-info__list">
              {contacts.map((contact) => (
                <a
                  key={contact.title}
                  className="contact-info__item"
                  href={contact.href}
                  target={contact.title === "Ubicación" ? "_blank" : undefined}
                  rel={
                    contact.title === "Ubicación"
                      ? "noopener noreferrer"
                      : undefined
                  }
                >
                  <span className="contact-info__icon" aria-hidden="true">
                    <i className={`bi ${contact.icon}`} />
                  </span>

                  <span className="contact-info__data">
                    <small>{contact.title}</small>
                    <strong>{contact.value}</strong>
                  </span>

                  <i
                    className="bi bi-arrow-up-right contact-info__arrow"
                    aria-hidden="true"
                  />
                </a>
              ))}
            </div>

            <div className="contact-map">
              <iframe
                title="Ubicación de Tecnologías Administrativas Elad en Acapulco"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3818.5723024095105!2d-99.8141532248472!3d16.847560883950475!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85ca59e1bb794c7b%3A0xdf944a853b7b8e17!2sTecnolog%C3%ADas%20Administrativas%20Elad%20%7C%20Dise%C3%B1o%20Web%20%7C%20Marketing%20%7C%20E-Commerce%20%7C%20CRM%20%7C!5e0!3m2!1ses-419!2smx!4v1749235367451!5m2!1ses-419!2smx"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div className="contact-form-card animate-on-scroll">
            <div className="contact-form-card__header">
              <span className="contact-form-card__icon" aria-hidden="true">
                <i className="bi bi-chat-dots-fill" />
              </span>

              <div>
                <small>Solicita información</small>
                <h3>Envíanos un mensaje</h3>
              </div>
            </div>

            <form
              className="contact-form-card__form"
              onSubmit={enviarCorreo}
              noValidate
            >
              <div className="contact-form__grid">
                <div className="contact-form__group">
                  <label htmlFor="contact-name">Nombre completo</label>

                  <div className="contact-form__control">
                    <i className="bi bi-person" aria-hidden="true" />

                    <input
                      id="contact-name"
                      type="text"
                      name="firstName"
                      placeholder="Escribe tu nombre"
                      value={formData.firstName}
                      onChange={handleChange}
                      autoComplete="name"
                      maxLength={100}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="contact-form__group">
                  <label htmlFor="contact-email">Correo electrónico</label>

                  <div className="contact-form__control">
                    <i className="bi bi-envelope" aria-hidden="true" />

                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      placeholder="nombre@empresa.com"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      maxLength={150}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="contact-form__group contact-form__group--full">
                  <label htmlFor="contact-phone">
                    Teléfono
                    <span>Opcional</span>
                  </label>

                  <div className="contact-form__control">
                    <i className="bi bi-telephone" aria-hidden="true" />

                    <input
                      id="contact-phone"
                      type="tel"
                      name="phone"
                      placeholder="Ej. 744 123 4567"
                      value={formData.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      inputMode="tel"
                      maxLength={20}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="contact-form__group contact-form__group--full">
                  <label htmlFor="contact-message">
                    ¿Cómo podemos ayudarte?
                  </label>

                  <div className="contact-form__control contact-form__control--textarea">
                    <i className="bi bi-chat-left-text" aria-hidden="true" />

                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      placeholder="Cuéntanos sobre tu negocio y lo que necesitas..."
                      value={formData.message}
                      onChange={handleChange}
                      maxLength={1000}
                      disabled={loading}
                      required
                    />
                  </div>

                  <span className="contact-form__counter">
                    {formData.message.length}/1000
                  </span>
                </div>
              </div>

              {feedback.message && (
                <div
                  className={`contact-form__feedback contact-form__feedback--${feedback.type}`}
                  role={feedback.type === "error" ? "alert" : "status"}
                  aria-live="polite"
                >
                  <i
                    className={
                      feedback.type === "success"
                        ? "bi bi-check-circle-fill"
                        : "bi bi-exclamation-circle-fill"
                    }
                    aria-hidden="true"
                  />

                  <span>{feedback.message}</span>
                </div>
              )}

              <button
                type="submit"
                className="contact-form__submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="contact-form__spinner"
                      aria-hidden="true"
                    />
                    Enviando mensaje...
                  </>
                ) : (
                  <>
                    Enviar mensaje
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                  </>
                )}
              </button>

              <p className="contact-form__privacy">
                <i className="bi bi-shield-check" aria-hidden="true" />
                Tus datos serán utilizados únicamente para responder tu
                solicitud.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
