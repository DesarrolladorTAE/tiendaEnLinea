// src/wrappers/hero-slider/HeroSliderTwo.jsx
import React from "react";
import { EffectFade } from "swiper";
import Swiper, { SwiperSlide } from "../../components/swiper";

const params = {
  effect: "fade",
  fadeEffect: { crossFade: true },
  modules: [EffectFade],
  loop: true,
  speed: 1000,
  navigation: f,
  autoHeight: false
};

function GlassSlide({ coverImage, logoImage, storeName }) {
  const brand = storeName || "Tu Marca";
  return (
    <div
      className="slider-variant-glass"
      style={{
        position: "relative",
        minHeight: "58vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background: "#0e1726"
      }}
    >
      {/* Fondo full-bleed */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(105%) contrast(102%) brightness(98%)",
          transform: "scale(1.02)"
        }}
        aria-hidden="true"
      />
      {/* Overlay para legibilidad */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(0,0,0,.45), rgba(0,0,0,.18) 45%, rgba(0,0,0,0) 70%)"
        }}
        aria-hidden="true"
      />

      {/* Contenido */}
      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <div className="row">
          <div className="col-12 col-lg-7 d-flex align-items-center">
            <div
              className="hero-card-glass"
              style={{
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                background: "rgba(217, 217, 217, 0.93)",
                border: "1px solid rgba(255, 255, 255, 0.32)",
                borderRadius: 20,
                padding: "26px 26px 22px",
                boxShadow: "0 12px 30px rgba(255, 255, 255, 0.18)",
                color: "#0e1726",
                maxWidth: 760
              }}
            >
              {/* Logo opcional */}
              {logoImage && (
                <img
                  src={logoImage}
                  alt={brand}
                  className="img-fluid"
                  style={{
                    maxHeight: 64,
                    objectFit: "contain",
                    marginBottom: 10,
                    filter: "drop-shadow(0 2px 6px rgba(0,0,0,.15))"
                  }}
                />
              )}

              {/* Nombre de la marca bien notorio */}
              <h1
                className="animated"
                style={{
                  margin: 0,
                  lineHeight: 1.05,
                  fontSize: "clamp(28px, 5.2vw, 56px)",
                  fontWeight: 800,
                  letterSpacing: "0.2px",
                  color: "#1298f1ff"
                }}
              >
                {brand}
              </h1>

              {/* Headline genérico, aplicable a cualquier giro */}
              <p
                className="animated"
                style={{
                  margin: "8px 0 14px",
                  fontSize: "clamp(14px, 2vw, 17px)",
                  color: "#0b1220",
                  opacity: 0.95
                }}
              >
                Experiencias pensadas para ti. Productos seleccionados con atención
                al detalle. Inspiración para cada día.
              </p>

              {/* Badges neutrales y reutilizables */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.65)",
                    border: "1px solid rgba(0,0,0,.06)",
                    fontWeight: 600,
                    fontSize: 13
                  }}
                >
                  Calidad
                </span>
                <span
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.65)",
                    border: "1px solid rgba(0,0,0,.06)",
                    fontWeight: 600,
                    fontSize: 13
                  }}
                >
                  Diseño
                </span>
                <span
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.65)",
                    border: "1px solid rgba(0,0,0,.06)",
                    fontWeight: 600,
                    fontSize: 13
                  }}
                >
                  Confianza
                </span>
              </div>
            </div>
          </div>

          {/* Lado derecho: espacio de respiración visual */}
          <div className="col-12 col-lg-5" />
        </div>
      </div>
    </div>
  );
}

const HeroSliderTwo = ({ coverImage, logoImage, storeName }) => {
  const bg = coverImage || "/assets/img/post/1.png";

  return (
    <div className="slider-area">
      <div className="slider-active nav-style-1">
        <Swiper options={params}>
          <SwiperSlide>
            <GlassSlide
              coverImage={bg}
              logoImage={logoImage}
              storeName={storeName}
            />
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );
};

export default HeroSliderTwo;
