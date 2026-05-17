import React, { useState } from "react";
import axios from "axios";
import useScrollReveal from "../hooks/useScrollReveal";

const Contact = () => {
  useScrollReveal();

  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    message: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const enviarCorreo = async () => {
    try {
      setLoading(true);

      const payload = {
        nombre: formData.firstName,
        correo: formData.email,
        mensaje: formData.message,
        nombreProp: "Raul Alvarez",
        correoProp: "contacto@tecnologiasadministrativas.com",
        pagina: "MITIENDAENLINEAMX",
        telefono: formData.phone || null,
      };

      await axios.post(
        "https://taeconta.com/api/public/api/correos/publicos",
        payload
      );

      setFormData({
        firstName: "",
        email: "",
        message: "",
        phone: "",
      });

      alert("¡Mensaje enviado correctamente!");
    } catch (e) {
      console.error(e);
      alert("Hubo un error al enviar el mensaje.");
    } finally {
      setLoading(false);
    }
  };

  const contacts = [
    {
      icon: "bi-envelope",
      title: "Email",
      value: "contacto@tecnologiasadministrativas.com",
    },
    {
      icon: "bi-telephone",
      title: "Teléfono",
      value: "+52 (744) 218 8925",
    },
    {
      icon: "bi-geo-alt",
      title: "Ubicación",
      value: "C. 24 202, Las Cruces, 39770 Acapulco de Juárez, Gro.",
    },
  ];

  return (
    <section className="contact-section">
      <div className="container">
        <div className="text-center mb-5 animate-on-scroll">
          <h2 className="display-6 fw-bold text-white mb-3">
            ¿Listo para comenzar?
          </h2>
          <p className="lead text-white-50">
            Contáctanos hoy y descubre cómo podemos transformar tu negocio
          </p>
        </div>

        <div className="row g-5 align-items-start">
          <div className="col-lg-6 animate-on-scroll">
            <h4 className="fw-bold mb-4 text-warning">
              Información de contacto
            </h4>

            {contacts.map((c, i) => (
              <div key={i} className="d-flex align-items-center mb-4">
                <div className="icon me-3 contact-icon">
                  <i className={`${c.icon} text-white`}></i>
                </div>

                <div>
                  <h6 className="text-warning mb-1">{c.title}</h6>
                  <p className="text-white-50 mb-0">{c.value}</p>
                </div>
              </div>
            ))}

            <div
              className="mt-4 shadow-lg"
              style={{
                width: "100%",
                height: "260px",
                overflow: "hidden",
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <iframe
                title="Ubicación MiTiendaEnLineaMX"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3818.5723024095105!2d-99.8141532248472!3d16.847560883950475!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85ca59e1bb794c7b%3A0xdf944a853b7b8e17!2sTecnolog%C3%ADas%20Administrativas%20Elad%20%7C%20Dise%C3%B1o%20Web%20%7C%20Marketing%20%7C%20E-Commerce%20%7C%20CRM%20%7C!5e0!3m2!1ses-419!2smx!4v1749235367451!5m2!1ses-419!2smx"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          <div className="col-lg-6 animate-on-scroll">
            <div className="contact-form">
              <h4 className="fw-bold mb-4 text-warning">
                Envíanos un mensaje
              </h4>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    name="firstName"
                    className="form-control"
                    placeholder="Tu nombre"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-control"
                    placeholder="Tu teléfono"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Mensaje</label>
                  <textarea
                    name="message"
                    className="form-control"
                    rows="4"
                    placeholder="Escribe tu mensaje aquí..."
                    value={formData.message}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12">
                  <button
                    className="btn btn-primary-custom w-100 btn-lg"
                    onClick={enviarCorreo}
                    disabled={loading}
                  >
                    <i className="bi bi-send me-2"></i>
                    {loading ? "Enviando..." : "Enviar Mensaje"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;