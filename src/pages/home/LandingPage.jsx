import React from "react";

const LandingPage = () => {
  return (
    <div style={baseStyle}>
      <div style={topBannerStyle}>¡Demo Gratis por 14 Días! Regístrate y comienza hoy mismo 🚀</div>

      <header style={headerStyle}>
        <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)", marginBottom: "1rem" }}>
          Impulsa tu Negocio con MITIENDAENLINEAMX
        </h1>
        <p style={{ fontSize: "clamp(1rem, 3vw, 1.2rem)" }}>
          Una plataforma pensada para llevar tu gestión comercial al siguiente nivel.
        </p>
        <p>
          <strong>Próximamente en mitiendaenlineamx.com.mx</strong>
        </p>
      </header>

      <main>
        <SectionBlock
          title="¿Qué es MITIENDAENLINEAMX?"
          items={[
            "MITIENDAENLINEAMX es tu aliado estratégico. Una plataforma poderosa que centraliza la gestión de tus ventas, inventarios y facturación, todo desde un solo lugar. Fácil, rápido y seguro.",
          ]}
        />

        <SectionBlock
          title="Optimiza tus Puntos de Venta"
          items={[
            "Accede a reportes inteligentes para maximizar tus ventas.",
            "Supervisa tus operaciones en tiempo real.",
            "Administra múltiples sucursales de manera centralizada.",
          ]}
        />

        <SectionBlock
          title="Control Inteligente de Inventarios"
          items={[
            "Gestiona entradas, salidas y movimientos de productos automáticamente.",
            "Recibe alertas para reabastecer tu stock antes de que se agote.",
            "Optimiza la rotación de productos para aumentar tus ganancias.",
            "Accede a reportes detallados para tomar decisiones estratégicas.",
          ]}
        />

        <SectionBlock
          title="Expande tus Ventas en Línea"
          items={[
            "Publica y actualiza tus productos de forma sencilla.",
            "Llega a clientes nuevos en todo el mundo.",
            "Multiplica tus ingresos a través de canales digitales.",
          ]}
        />

        <SectionBlock
          title="¿Por Qué Elegirnos?"
          items={[
            <>
              <strong>Facilidad de Uso:</strong> Plataforma intuitiva para cualquier nivel de
              experiencia.
            </>,
            <>
              <strong>Seguridad y Respaldo:</strong> Tus datos siempre estarán protegidos.
            </>,
            <>
              <strong>Escalabilidad:</strong> Crece con funciones adaptables a tus necesidades.
            </>,
            <>
              <strong>Soporte Especializado:</strong> Acompañamiento técnico de calidad en cada
              etapa.
            </>,
          ]}
          isRichText
        />

        <section style={ctaStyle}>
          <h2
            style={{ color: "#fff", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", marginBottom: "1rem" }}
          >
            ¡Disfruta 14 Días de Demo Gratis!
          </h2>
          <p style={{ color: "#fff", marginBottom: "2rem", fontSize: "clamp(1rem, 3vw, 1.2rem)" }}>
            Regístrate ahora, prueba todas nuestras funcionalidades y transforma tu negocio. Obtén
            soporte prioritario y capacitación gratuita.
          </p>
          <a href="#" style={ctaButtonStyle}>
            PRUÉBALO GRATIS
          </a>
        </section>
      </main>

      <footer style={footerStyle}>
        <p style={{ color: "#fff" }}>
          MITIENDAENLINEAMX | Carretera Cayaco Puerto Marques Oficina 106 A, El Coloso, 39810
          Acapulco de Juárez, Gro.
        </p>
        <p style={{ color: "#fff" }}>
          Tel: +52 744 218 8925 | Email: contacto@tecnologiasadministrativas.com
        </p>
      </footer>
    </div>
  );
};

// 🎨 Estilos responsive-friendly
const baseStyle = {
  fontFamily: "'Poppins', sans-serif",
  margin: 0,
  padding: 0,
  color: "#333",
  background: "#fff",
};

const topBannerStyle = {
  background: "#ff7b00",
  color: "#fff",
  padding: "0.75rem",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "clamp(0.9rem, 3vw, 1rem)",
};

const headerStyle = {
  background: "linear-gradient(135deg, #ffd700, #ff9900)",
  color: "#333",
  padding: "clamp(2rem, 6vw, 3rem) 2rem",
  textAlign: "center",
};

const sectionStyle = {
  padding: "clamp(2rem, 6vw, 3rem) 1rem",
  maxWidth: "1200px",
  margin: "0 auto",
};

const h2Style = {
  color: "#ff7b00",
  marginBottom: "1.5rem",
  fontSize: "clamp(1.5rem, 5vw, 2rem)",
};

const ctaStyle = {
  background: "linear-gradient(135deg, #ff7b00, #ffcc00)",
  padding: "clamp(2rem, 6vw, 3rem) 2rem",
  textAlign: "center",
  borderRadius: "12px",
  margin: "3rem 0",
};

const ctaButtonStyle = {
  display: "inline-block",
  background: "#fff",
  color: "#ff7b00",
  padding: "1rem 2rem",
  borderRadius: "50px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "clamp(1rem, 3vw, 1.2rem)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  transition: "background 0.3s, color 0.3s",
};

const footerStyle = {
  backgroundColor: "#222",
  color: "#fff",
  textAlign: "center",
  padding: "clamp(2rem, 6vw, 3rem) 1rem",
  fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
};

// 🧩 Componente de sección reutilizable
const SectionBlock = ({ title, items }) => (
  <section
    style={{
      ...sectionStyle,
      background: "#fdfdfd",
      border: "1px solid #eee",
      borderRadius: "12px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
    }}
  >
    <h2 style={h2Style}>{title}</h2>
    <ul style={{ paddingLeft: "1.5rem" }}>
      {items.map((item, index) => (
        <li
          key={index}
          style={{ fontSize: "clamp(1rem, 3vw, 1.1rem)", lineHeight: "1.7", marginBottom: "1rem" }}
        >
          {item}
        </li>
      ))}
    </ul>
  </section>
);

export default LandingPage;
