import React, { useState } from "react";
import axiosClient from "../../config/axiosClient";

const Renovar = () => {
  const [loading, setLoading] = useState(false);

  const handlePago = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.post("/checkout", {
        nombre_plan: "Plan Profesional",
        precio: 500,
        nombre: "Usuario Prueba",
        email: "usuario@email.com",
        telefono: "5512345678",
      });

      const { url } = res.data;
      if (url) {
        window.location.href = url; // Redirección a la página de pago de Conekta
      } else {
        console.error("No se recibió una URL de pago");
      }
    } catch (err) {
      console.error("Error al crear Checkout:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Tu acceso ha expirado</h1>
      <p style={styles.text}>
        Tu periodo de prueba o suscripción ha finalizado. Para continuar usando la plataforma, por
        favor renueva tu acceso.
      </p>

      <div style={styles.options}>
        <button onClick={handlePago} style={styles.button} disabled={loading}>
          {loading ? "Cargando..." : "💳 Pagar ahora"}
        </button>
        <a
          href="https://wa.me/5217442188925"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.buttonAlt}
        >
          💬 Contactar soporte vía WhatsApp
        </a>
      </div>

      <p style={styles.note}>Si ya realizaste el pago, por favor vuelve a iniciar sesión.</p>
      <button onClick={() => (window.location.href = "/login-register")} style={styles.loginButton}>
        Iniciar sesión
      </button>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "600px",
    margin: "auto",
    padding: "2rem",
    textAlign: "center",
  },
  heading: {
    fontSize: "2rem",
    marginBottom: "1rem",
  },
  text: {
    fontSize: "1.1rem",
    marginBottom: "2rem",
  },
  options: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginBottom: "2rem",
  },
  button: {
    backgroundColor: "#0d6efd",
    color: "#fff",
    padding: "0.75rem 1.5rem",
    borderRadius: "5px",
    textDecoration: "none",
    fontWeight: "bold",
    border: "none",
    cursor: "pointer",
  },
  buttonAlt: {
    backgroundColor: "#25d366",
    color: "#fff",
    padding: "0.75rem 1.5rem",
    borderRadius: "5px",
    textDecoration: "none",
    fontWeight: "bold",
  },
  note: {
    fontSize: "0.9rem",
    marginBottom: "1rem",
  },
  loginButton: {
    backgroundColor: "#6c757d",
    color: "#fff",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default Renovar;
