import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearWhatsappCart } from "../store/slices/whatsappCartSlice";

const WhatsAppFloatingButton = ({ storePhone }) => {
  const items = useSelector((state) => state.whatsappCart.items);
  const dispatch = useDispatch();

  if (!storePhone || items.length === 0) return null;

  const message = items
    .map((item, index) => `${index + 1}. ${item.name} - MX$${item.price.toFixed(2)}`)
    .join("\n");

  const total = items.reduce((sum, item) => sum + item.price, 0);

  const whatsappMessage = `Hola, me interesa comprar:\n\n${message}\n\nTotal: MX$${total.toFixed(2)}`;
  // const whatsappUrl = `https://api.whatsapp.com/send?phone=${storePhone}&text=${encodeURIComponent(whatsappMessage)}`;

  const handleClick = () => {
    window.open(whatsappUrl, "_blank");
    dispatch(clearWhatsappCart());
  };
  const normalizePhone = (phone) => {
  // Quitar espacios, guiones, etc.
  let clean = phone.toString().replace(/\D/g, "");
  // Si ya empieza con 52 lo dejamos
  if (clean.startsWith("52")) return clean;
  // Si es un número de 10 dígitos (nacional), agregamos 52
  if (clean.length === 10) return `52${clean}`;
  return clean;
};

const whatsappUrl = `https://api.whatsapp.com/send?phone=${normalizePhone(storePhone)}&text=${encodeURIComponent(whatsappMessage)}`;


  return (
    <button
      onClick={handleClick}
      className="btn btn-success shadow-lg"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
        padding: "12px 20px",
        borderRadius: "30px",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}
    >
      <i className="pe-7s-paper-plane" />
      Enviar pedido ({items.length})
    </button>
  );
};

export default WhatsAppFloatingButton;
