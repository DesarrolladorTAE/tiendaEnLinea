import React, { useState } from "react";
import axios from "axios";
import useScrollReveal from "../hooks/useScrollReveal";

const Contact = () => {
  useScrollReveal();
  const [formData, setFormData] = useState({ firstName: "", email: "", message: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

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
      await axios.post("https://taeconta.com/api/public/api/correos/publicos", payload);
      setFormData({ firstName: "", email: "", message: "", phone: "" });
      alert("¡Mensaje enviado correctamente!");
    } catch (e) {
      console.error(e);
      alert("Hubo un error al enviar el mensaje.");
    } finally {
      setLoading(false);
    }
  };

  const contacts = [
    { icon: "bi-envelope", title: "Email",     value: "contacto@tecnologiasadministrativas.com" },
    { icon: "bi-telephone", title: "Teléfono", value: "+52 (744) 218 8925" },
    {
      icon: "bi-geo-alt",
      title: "Ubicación",
      value: "Carretera Cayaco Puerto Marques Oficina 106 A, El Coloso, 39810 Acapulco de Juárez, Gro.",
    },
  ];

  return (
    <section className="contact-section">
      <div className="container">
        <div className="text-center mb-5 animate-on-scroll">
          <h2 className="display-6 fw-bold text-white mb-3">¿Listo para comenzar?</h2>
          <p className="lead text-white-50">Contáctanos hoy y descubre cómo podemos transformar tu negocio</p>
        </div>

        <div className="row g-5">
          <div className="col-lg-6 animate-on-scroll">
            <h4 className="fw-bold mb-4 text-warning">Información de contacto</h4>
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
          </div>

          <div className="col-lg-6 animate-on-scroll">
            <div className="contact-form">
              <h4 className="fw-bold mb-4 text-warning">Envíanos un mensaje</h4>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nombre</label>
                  <input type="text" name="firstName" className="form-control" placeholder="Tu nombre"
                         value={formData.firstName} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-control" placeholder="tu@email.com"
                         value={formData.email} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Telefono</label>
                  <input type="text" name="phone" className="form-control" placeholder="Tu teléfono"
                         value={formData.phone} onChange={handleChange} />
                </div>
                <div className="col-12">
                  <label className="form-label">Mensaje</label>
                  <textarea name="message" className="form-control" rows="4" placeholder="Escribe tu mensaje aquí..."
                            value={formData.message} onChange={handleChange} />
                </div>
                <div className="col-12">
                  <button className="btn btn-primary-custom w-100 btn-lg" onClick={enviarCorreo} disabled={loading}>
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
