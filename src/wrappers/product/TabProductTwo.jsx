// src/wrappers/product/TabProductTwo.jsx
import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { Link } from "react-router-dom";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import SectionTitle from "../../components/section-title/SectionTitle";
import ProductGridTwo from "./ProductGridTwo";

const NEUTRAL_BADGES = [
  "Calidad", "Diseño", "Confianza", "Selección",
  "Versatilidad", "Detalles", "Durabilidad",
  "Estilo", "Confort", "Innovación", "Tendencia",
  "Funcionalidad", "Esencia", "Armonía"
];

// simple helper para tomar N aleatorios (sin sesgo fuerte)
function pickRandomBadges(arr, n = 3) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

const TabProductTwo = ({
  spaceBottomClass,
  category,
  title = "Explora nuestras colecciones",
  description = "Encuentra piezas pensadas para inspirarte todos los días.",
  badgesCount = 3
}) => {
  const pills = pickRandomBadges(NEUTRAL_BADGES, badgesCount);

  return (
    <div className={clsx("product-area", spaceBottomClass)}>
      <div className="container">
        {/* Título con el mismo estilo existente */}
        <SectionTitle titleText={title} positionClass="text-center" />

        {/* Descripción y badges neutrales */}
        <div className="text-center" style={{ maxWidth: 820, margin: "8px auto 0" }}>
          <p style={{ marginBottom: 12, opacity: 0.9 }}>{description}</p>
          <div style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {pills.map((label) => (
              <span
                key={label}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,.06)",
                  border: "1px solid rgba(0,0,0,.06)",
                  fontWeight: 600,
                  fontSize: 13
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

TabProductTwo.propTypes = {
  category: PropTypes.string,
  spaceBottomClass: PropTypes.string,
  title: PropTypes.string,          // nuevo
  description: PropTypes.string,    // nuevo
  badgesCount: PropTypes.number     // opcional (por defecto 3)
};

export default TabProductTwo;
