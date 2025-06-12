import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    message: "",
    phone: "",
  });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [visibleElements, setVisibleElements] = useState(new Set());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("mensual");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);

      // Update navbar background
      const navbar = document.querySelector(".navbar");
      if (navbar) {
        if (window.scrollY > 50) {
          navbar.style.background = "rgba(255, 255, 255, 0.98)";
        } else {
          navbar.style.background = "rgba(255, 255, 255, 0.95)";
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleElements(
            (prev) => new Set([...prev, entry.target.id || entry.target.className])
          );
          entry.target.classList.add("visible");
        }
      });
    }, observerOptions);

    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Smooth scroll function
  const scrollToSection = (sectionId) => {
    const target = document.getElementById(sectionId);
    if (target) {
      const offsetTop = target.offsetTop - 61;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const styles = {
    root: {
      "--primary-color": "#f9b233",
      "--secondary-color": "#e94e1b",
      "--dark-bg": "#1a1a1a",
      "--gradient-primary": "linear-gradient(135deg, #f9b233 0%, #e94e1b 100%)",
      "--gradient-dark": "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
      fontFamily: "Inter, sans-serif",
      margin: 0,
      padding: 0,
      boxSizing: "border-box",
      overflowX: "hidden",
    },
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const enviarCorreo = () => {
    const payload = {
      nombre: formData.firstName,
      correo: formData.email,
      mensaje: formData.message,
      nombreProp: "Raul Alvarez",
      correoProp: "contacto@tecnologiasadministrativas.com",
      pagina: "MITIENDAENLINEAMX",
      telefono: formData.phone || null,
    };

    axios
      .post("https://taeconta.com/api/public/api/correos/publicos", payload)
      .then((res) => {
        // console.log("Correo enviado correctamente:", res.data);
        setFormData({ firstName: "", email: "", message: "", phone: "" });
      })
      .catch((err) => {
        console.error("Error al enviar el mensaje:", err);
        alert("Hubo un error al enviar el mensaje.");
      });
  };

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css');

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .animate-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s ease;
        }

        .animate-on-scroll.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Navigation */
        .navbar {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          box-shadow: 0 2px 20px rgba(0,0,0,0.1);
        }

        .navbar-brand img {
          max-height: 45px;
          transition: transform 0.3s ease;
        }

        .navbar-brand:hover img {
          transform: scale(1.05);
        }

        .navbar-nav .nav-link {
          font-weight: 500;
          color: #2c3e50 !important;
          margin: 0 10px;
          position: relative;
          transition: all 0.3s ease;
          text-decoration: none;
        }

        .navbar-nav .nav-link::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 50%;
          width: 0;
          height: 2px;
          background: var(--gradient-primary);
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }

        .navbar-nav .nav-link:hover::after {
          width: 100%;
        }

        .btn-primary-custom {
          background: var(--gradient-primary);
          border: none;
          padding: 12px 25px;
          border-radius: 25px;
          font-weight: 600;
          color: white;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(249, 178, 51, 0.3);
        }

        .btn-primary-custom:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(249, 178, 51, 0.4);
          color: white;
        }

        /* Hero Section */
        .hero {
          background: var(--gradient-dark);
          min-height: 100vh;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.05"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grain)"/></svg>');
          pointer-events: none;
        }

        .hero-content {
          position: relative;
          z-index: 2;
        }

        .hero h1 {
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }

        .hero .highlight {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero p {
          font-size: 1.2rem;
          color: rgba(255,255,255,0.8);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .hero-image {
          position: relative;
          animation: float 6s ease-in-out infinite;
        }

        .hero-image img {
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          width: 100%;
          height: auto;
        }

        /* Platform Section */
        .platform-section {
          padding: 100px 0;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .platform-icon {
          width: 80px;
          height: 80px;
          background: var(--gradient-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          animation: pulse 2s infinite;
        }

        .platform-icon i {
          font-size: 2rem;
          color: white;
        }

        /* Features Cards */
        .feature-card {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          height: 100%;
          border: none;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--gradient-primary);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .feature-card:hover::before {
          transform: scaleX(1);
        }

        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }

        .feature-card .icon {
          width: 60px;
          height: 60px;
          background: var(--gradient-primary);
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .feature-card .icon i {
          font-size: 1.5rem;
          color: white;
        }

        /* Colored Feature Cards */
        .colored-card {
          color: white;
          border-radius: 20px;
          padding: 2.5rem;
          height: 100%;
          position: relative;
          overflow: hidden;
          transition: transform 0.3s ease;
        }

        .colored-card:hover {
          transform: scale(1.02);
        }

        .colored-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .colored-card:hover::before {
          top: -30%;
          right: -30%;
        }

        .card-primary { background: var(--gradient-primary); }
        .card-success { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); }
        .card-info { background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%); }

        /* Services Section */
        .service-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s ease;
          height: 100%;
          border: none;
        }

        .service-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }

        .service-card img {
          height: 200px;
          object-fit: cover;
          width: 100%;
          transition: transform 0.3s ease;
        }

        .service-card:hover img {
          transform: scale(1.05);
        }

        .service-price {
          background: var(--gradient-primary);
          color: white;
          padding: 5px 15px;
          border-radius: 15px;
          font-weight: 600;
          position: absolute;
          top: 15px;
          right: 15px;
        }

        /* Contact Section */
        .contact-section {
          background: var(--gradient-dark);
          color: white;
          padding: 100px 0;
          position: relative;
        }

        .contact-form {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 2.5rem;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .form-control {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 10px;
          color: white;
          padding: 12px 15px;
        }

        .form-control:focus {
          background: rgba(255,255,255,0.15);
          border-color: var(--primary-color);
          box-shadow: 0 0 0 0.2rem rgba(249, 178, 51, 0.25);
          color: white;
        }

        .form-control::placeholder {
          color: rgba(255,255,255,0.7);
        }

        .form-label {
          color: var(--primary-color);
          font-weight: 500;
        }

        /* Footer */
        .footer {
          background: #111827;
          color: white;
          padding: 60px 0 20px;
        }

        .footer-link {
          color: #9ca3af;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .footer-link:hover {
          color: var(--primary-color);
        }

        /* Scroll to top button */
        .scroll-top {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 50px;
          height: 50px;
          background: var(--gradient-primary);
          border: none;
          border-radius: 50%;
          color: white;
          font-size: 1.2rem;
          cursor: pointer;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          z-index: 1000;
        }

        .scroll-top.visible {
          opacity: 1;
          visibility: visible;
        }

        .scroll-top:hover {
          transform: translateY(-3px);
        }

        /* Utility Classes */
        .bg-gradient-primary {
          background: var(--gradient-primary);
        }

        .text-gradient {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .hero h1 {
            font-size: 2.5rem;
          }
          
          .hero p {
            font-size: 1rem;
          }
          
          .platform-section {
            padding: 60px 0;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav className="navbar navbar-expand-lg fixed-top">
        <div className="container">
          <button
            className="navbar-brand btn p-0"
            onClick={() => scrollToSection("home")}
            style={{ background: "none", border: "none" }}
          >
            <img src="/assets/logoc.png" alt="Logo" className="img-fluid" />
          </button>{" "}
          <button
            className="navbar-toggler"
            type="button"
            aria-controls="navbarNav"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
            onClick={toggleMenu}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse ${isMenuOpen ? "show" : ""}`} id="navbarNav">
            <ul className="navbar-nav ms-auto me-4">
              <li className="nav-item">
                <button
                  className="nav-link btn"
                  onClick={() => scrollToSection("home")}
                  style={{ background: "none", border: "none" }}
                >
                  Inicio
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link btn"
                  onClick={() => scrollToSection("platform")}
                  style={{ background: "none", border: "none" }}
                >
                  Plataforma
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link btn"
                  onClick={() => scrollToSection("features")}
                  style={{ background: "none", border: "none" }}
                >
                  Características
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link btn"
                  onClick={() => scrollToSection("services")}
                  style={{ background: "none", border: "none" }}
                >
                  Servicios
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link btn"
                  onClick={() => scrollToSection("contact")}
                  style={{ background: "none", border: "none" }}
                >
                  Contacto
                </button>
              </li>
            </ul>
            <button className="btn btn-primary-custom" onClick={() => navigate("/login-register")}>
              INICIAR SESIÓN
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 hero-content">
              <h1 className="animate-on-scroll">
                Impulsa tu negocio con
                <br />
                <span className="highlight">MITIENDAENLINEAMX</span>
              </h1>
              <p className="animate-on-scroll">
                Una plataforma pensada para llevar la gestión de tu negocio o comercio al siguiente
                nivel. Centraliza ventas, inventarios y facturación en un solo lugar.
              </p>
              <div className="d-flex gap-3 animate-on-scroll">
                <button
                  className="btn btn-primary-custom btn-lg"
                  onClick={() => navigate("/login-register")}
                >
                  <i className="bi bi-rocket-takeoff me-2"></i>
                  Empezar Ahora
                </button>
                {/* <button className="btn btn-outline-light btn-lg">
                  <i className="bi bi-play-circle me-2"></i>
                  Ver Demo
                </button> */}
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero-image animate-on-scroll">
                <img
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Dashboard Preview"
                  className="img-fluid"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section id="platform" className="platform-section">
        <div className="container">
          <div className="text-center mb-5 animate-on-scroll">
            <div className="platform-icon">
              <i className="bi bi-shop"></i>
            </div>
            <h2 className="display-5 fw-bold text-gradient mb-4">¿Qué es MITIENDAENLINEAMX?</h2>
            <p className="lead text-muted mx-auto" style={{ maxWidth: "600px" }}>
              <strong>MITIENDAENLINEAMX</strong> es tu aliado estratégico. Una plataforma poderosa
              que centraliza la gestión de tus ventas, inventarios y facturación, todo desde un solo
              lugar.
              <strong className="text-gradient"> Fácil, rápido y seguro.</strong>
            </p>
          </div>

          <div className="row g-4">
            <div className="col-lg-4 animate-on-scroll">
              <div className="colored-card card-primary">
                <div className="d-flex align-items-center mb-3">
                  <div className="icon me-3">
                    <i className="bi bi-graph-up-arrow"></i>
                  </div>
                  <h5 className="mb-0 fw-bold">Optimiza tus Puntos de Venta</h5>
                </div>
                <ul className="list-unstyled">
                  <li className="d-flex align-items-start mb-2">
                    <i className="bi bi-check-circle-fill me-2 mt-1"></i>
                    <span>Accede a reportes inteligentes para maximizar tus ventas</span>
                  </li>
                  <li className="d-flex align-items-start mb-2">
                    <i className="bi bi-check-circle-fill me-2 mt-1"></i>
                    <span>Supervisa tus operaciones en tiempo real</span>
                  </li>
                  <li className="d-flex align-items-start">
                    <i className="bi bi-check-circle-fill me-2 mt-1"></i>
                    <span>Administra múltiples sucursales de manera centralizada</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-lg-4 animate-on-scroll">
              <div className="colored-card card-success">
                <div className="d-flex align-items-center mb-3">
                  <div className="icon me-3">
                    <i className="bi bi-box-seam"></i>
                  </div>
                  <h5 className="mb-0 fw-bold">Control Inteligente de Inventarios</h5>
                </div>
                <ul className="list-unstyled">
                  <li className="d-flex align-items-start mb-2">
                    <i className="bi bi-check-circle-fill me-2 mt-1"></i>
                    <span>Gestiona entradas, salidas y movimientos automáticamente</span>
                  </li>
                  <li className="d-flex align-items-start mb-2">
                    <i className="bi bi-check-circle-fill me-2 mt-1"></i>
                    <span>Alertas para reabastecer antes de que se agote el stock</span>
                  </li>
                  <li className="d-flex align-items-start mb-2">
                    <i className="bi bi-check-circle-fill me-2 mt-1"></i>
                    <span>Optimiza la rotación de productos</span>
                  </li>
                  <li className="d-flex align-items-start">
                    <i className="bi bi-check-circle-fill me-2 mt-1"></i>
                    <span>Reportes detallados para decisiones estratégicas</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-lg-4 animate-on-scroll">
              <div className="colored-card card-info">
                <div className="d-flex align-items-center mb-3">
                  <div className="icon me-3">
                    <i className="bi bi-globe"></i>
                  </div>
                  <h5 className="mb-0 fw-bold">Expande tus Ventas en Línea</h5>
                </div>
                <ul className="list-unstyled">
                  <li className="d-flex align-items-start mb-2">
                    <i className="bi bi-check-circle-fill me-2 mt-1"></i>
                    <span>Publica y actualiza productos de forma sencilla</span>
                  </li>
                  <li className="d-flex align-items-start mb-2">
                    <i className="bi bi-check-circle-fill me-2 mt-1"></i>
                    <span>Llega a clientes nuevos en todo el mundo</span>
                  </li>
                  <li className="d-flex align-items-start">
                    <i className="bi bi-check-circle-fill me-2 mt-1"></i>
                    <span>Multiplica tus ingresos a través de canales digitales</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center mt-5 animate-on-scroll">
            <div
              className="card bg-gradient-primary text-white border-0 p-4 mx-auto"
              style={{ maxWidth: "600px", borderRadius: "20px" }}
            >
              <h3 className="fw-bold mb-3">Transforma tu negocio hoy</h3>
              <p className="mb-3">
                Únete a miles de empresarios que ya confían en nuestra plataforma
              </p>
              {/* <button className="btn btn-light btn-lg fw-bold px-5">
                <i className="bi bi-arrow-right me-2"></i>
                Comenzar Ahora
              </button> */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5">
        <div className="container">
          <div className="text-center mb-5 animate-on-scroll">
            <h2 className="display-6 fw-bold mb-3">¿Por qué elegirnos?</h2>
            <p className="lead text-muted">
              Descubre las ventajas que nos hacen únicos en el mercado
            </p>
          </div>

          <div className="row g-4">
            {[
              {
                icon: "bi-rocket-takeoff",
                title: "Innovación Constante",
                text: "Tecnología de punta para destacar en el mercado.",
              },
              {
                icon: "bi-shield-check",
                title: "Seguridad Garantizada",
                text: "Protegemos tus datos con los mejores estándares.",
              },
              {
                icon: "bi-lightning",
                title: "Resultados Rápidos",
                text: "Soluciones eficientes en tiempo récord.",
              },
              {
                icon: "bi-headset",
                title: "Soporte 24/7",
                text: "Siempre disponibles para ayudarte.",
              },
            ].map((feature, index) => (
              <div key={index} className="col-lg-3 col-md-6 animate-on-scroll">
                <div className="feature-card text-center">
                  <div className="icon">
                    <i className={feature.icon}></i>
                  </div>
                  <h5 className="fw-bold mb-3">{feature.title}</h5>
                  <p className="text-muted">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5 animate-on-scroll">
            <h2 className="display-6 fw-bold mb-3">Nuestros Planes</h2>
            <p className="lead text-muted">
              Ofrecemos planes flexibles que se adaptan al tamaño y necesidades de tu negocio.
            </p>
          </div>

          {/* Tabs de duración */}
          <ul className="nav nav-tabs justify-content-center mb-4" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === "mensual" ? "active" : ""}`}
                id="mensual-tab"
                type="button"
                role="tab"
                onClick={() => setActiveTab("mensual")}
              >
                Mensual
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === "semestral" ? "active" : ""}`}
                id="semestral-tab"
                type="button"
                role="tab"
                onClick={() => setActiveTab("semestral")}
              >
                Semestral
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === "anual" ? "active" : ""}`}
                id="anual-tab"
                type="button"
                role="tab"
                onClick={() => setActiveTab("anual")}
              >
                Anual
              </button>
            </li>
          </ul>

          {/* Contenido de cada duración */}
          <div className="tab-content">
            {[
              { id: "mensual", label: "Plan Mensual", multiplier: 1 },
              { id: "semestral", label: "¡Pagas 6 y obtienes 7 meses!", multiplier: 6 },
              { id: "anual", label: "¡Pagas 10 y obtienes 12 meses!", multiplier: 10 },
            ].map((duration, dIndex) => (
              <div
                key={duration.id}
                className={`tab-pane fade ${activeTab === duration.id ? "show active" : ""}`}
                id={duration.id}
                role="tabpanel"
                style={{ display: activeTab === duration.id ? "block" : "none" }}
              >
                <div className="row g-4 mt-3">
                  {[
                    {
                      name: "Plan Negocio",
                      basePrice: 19900,
                      features: [
                        "2 puntos de venta",
                        "100 productos",
                        "Envio de Tickets por WhatsApp",
                        "Reportes de Ventas",
                        "Soporte por WhatsApp y correo",
                      ],
                      exclude: ["Facturación electrónica"],
                    },
                    {
                      name: "Plan Profesional",
                      basePrice: 44900,
                      features: [
                        "5 puntos de venta",
                        "Productos ilimitados",
                        "Reportes detallados",
                        "Soporte técnico WhatsApp",
                      ],
                      extras: ["Facturación disponible (complemento)"],
                    },
                    {
                      name: "Plan Avanzado",
                      basePrice: 89900,
                      features: [
                        "10 puntos de venta",
                        "Dominio personalizado",
                        "Reportes por tienda y agente",
                        "Branding profesional",
                        "Capacitación mensual",
                        "Soporte prioritario",
                      ],
                      extras: ["Incluye módulo CFDI (folios aparte)"],
                    },
                  ].map((plan, index) => {
                    const total = plan.basePrice * duration.multiplier;
                    const formattedPrice = new Intl.NumberFormat("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    }).format(total / 100);

                    return (
                      <div key={index} className="col-lg-4 animate-on-scroll">
                        <div className="service-card p-4 h-100">
                          <h5 className="fw-bold mb-2">{plan.name}</h5>
                          <h6 className="text-primary mb-2">{formattedPrice}</h6>
                          <p className="small text-muted">{duration.label}</p>
                          <ul className="list-unstyled small mb-3">
                            {plan.features.map((f, i) => (
                              <li key={i} className="d-flex align-items-center mb-1">
                                <i className="bi bi-check-circle text-success me-2"></i> {f}
                              </li>
                            ))}
                            {plan.exclude?.map((e, i) => (
                              <li key={`e-${i}`} className="d-flex align-items-center mb-1">
                                <i className="bi bi-x-circle text-danger me-2"></i> {e}
                              </li>
                            ))}
                            {plan.extras?.map((x, i) => (
                              <li key={`x-${i}`} className="d-flex align-items-center mb-1">
                                <i className="bi bi-plus-circle text-info me-2"></i> {x}
                              </li>
                            ))}
                          </ul>
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

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="container">
          <div className="text-center mb-5 animate-on-scroll">
            <h2 className="display-6 fw-bold text-white mb-3">¿Listo para comenzar?</h2>
            <p className="lead text-white-50">
              Contáctanos hoy y descubre cómo podemos transformar tu negocio
            </p>
          </div>

          <div className="row g-5">
            <div className="col-lg-6 animate-on-scroll">
              <h4 className="fw-bold mb-4 text-warning">Información de contacto</h4>

              {[
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
                  value:
                    "Carretera Cayaco Puerto Marques Oficina 106 A, El Coloso, 39810 Acapulco de Juárez, Gro.",
                },
              ].map((contact, index) => (
                <div key={index} className="d-flex align-items-center mb-4">
                  <div
                    className="icon me-3"
                    style={{
                      width: "50px",
                      height: "50px",
                      background: "var(--gradient-primary)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i className={`${contact.icon} text-white`}></i>
                  </div>
                  <div>
                    <h6 className="text-warning mb-1">{contact.title}</h6>
                    <p className="text-white-50 mb-0">{contact.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="col-lg-6 animate-on-scroll">
              <div className="contact-form">
                <h4 className="fw-bold mb-4 text-warning">Envíanos un mensaje</h4>
                <div>
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
                      <label className="form-label">Telefono</label>
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
                      >
                        <i className="bi bi-send me-2"></i>
                        Enviar Mensaje
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-3">
              <img src="/assets/logo3.png" alt="Logo" className="img-fluid mb-3" />
              <p className="text-white">
                Transformamos negocios con soluciones innovadoras y tecnología de vanguardia.
              </p>
            </div>

            {/* {[
              {
                title: "Servicios",
                links: ["Desarrollo Web", "Marketing Digital", "Consultoría", "Soporte Técnico"],
              },
              {
                title: "Empresa",
                links: ["Sobre Nosotros", "Equipo", "Carreras", "Blog"],
              },
              {
                title: "Legal",
                links: ["Privacidad", "Términos", "Cookies", "Contacto"],
              },
            ].map((section, index) => (
              <div key={index} className="col-lg-3">
                <h6 className="fw-bold mb-3 text-warning">{section.title}</h6>
                <ul className="list-unstyled">
                  {section.links.map((link, i) => (
                    <li key={i}>
                      <button
                        className="footer-link btn p-0"
                        style={{ background: "none", border: "none" }}
                      >
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))} */}
          </div>
          <hr className="my-4" style={{ borderColor: "#1f2937" }} />
          <div className="text-center">
            <p className="text-white mb-0">© 2025 TAE. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button className={`scroll-top ${showScrollTop ? "visible" : ""}`} onClick={scrollToTop}>
        <i className="bi bi-arrow-up"></i>
      </button>
    </div>
  );
};

export default LandingPage;
