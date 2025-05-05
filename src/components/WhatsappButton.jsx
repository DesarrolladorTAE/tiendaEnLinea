import React from "react";
import { FaWhatsapp } from "react-icons/fa";

const buttonStyle = {
  position: "fixed",
  bottom: "20px",
  right: "20px",
  zIndex: 9999,
  backgroundColor: "#25d366",
  color: "#fff",
  borderRadius: "50%",
  width: "60px",
  height: "60px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  textDecoration: "none",
};

const WhatsappButton = () => {
  const message = encodeURIComponent("Hola, quiero probar la demo gratis de MITIENDAENLINEAMX");
  const link = `https://wa.me/5217442188925?text=${message}`;

  return (
    <a href={link} target="_blank" rel="noopener noreferrer" style={buttonStyle}>
      <FaWhatsapp size={30} />
    </a>
  );
};


export default WhatsappButton;
