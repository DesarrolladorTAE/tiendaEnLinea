// src/wrappers/hero-slider/HeroSliderFourteen.jsx
import React from "react";

export default function HeroSliderFourteen({
  visible = true, // 👈 nuevo
  coverImage = "/assets/img/post/1.png",
  logoImage  = "/assets/img/logo/logo.png",
  storeName  = "MiTiendaEnLineaMX",
  phone      = "+52 55 1234 5678",
  email      = "contacto@mitiendaenlineamx.com.mx"
}) {
  if (!visible) return null; // 👈 oculta el hero si no hay datos reales

  return (
    <section className="fb-cover-wrap">
      <div className="fb-cover-bg" style={{ backgroundImage: `url('${coverImage}')` }} aria-hidden="true" />
      <div className="fb-cover-overlay" aria-hidden="true" />

      <div className="fb-profile-row">
        <div className="fb-avatar-wrap">
          <img src={logoImage} alt={`Logo de ${storeName}`} className="fb-avatar" />
        </div>

        <div className="fb-info-card">
          <h1 className="fb-title">{storeName}</h1>
          <div className="fb-contact">
            {phone && <a className="fb-chip" href={`tel:${phone}`}>📞 {phone}</a>}
            {email && <a className="fb-chip" href={`mailto:${email}`}>✉️ {email}</a>}
          </div>
        </div>
      </div>

      {/* estilos embebidos (CSS estándar) */}
      <style>{`
        /* Contenedor general (portada) */
        .fb-cover-wrap {
          position: relative;
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          isolation: isolate;
          min-height: clamp(320px, 44vw, 640px); /* ↑ más alto */
          background: #111;
          margin-bottom: clamp(56px, 8vw, 84px);
        }
        .fb-cover-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          transform: scale(1.02);
        }
        .fb-cover-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg,
            rgba(0,0,0,.15) 0%,
            rgba(0,0,0,.35) 55%,
            rgba(0,0,0,.65) 100%);
        }

        /* Fila inferior estilo Facebook (avatar + info) */
        .fb-profile-row {
          position: absolute;
          left: clamp(12px, 4vw, 32px);
          right: clamp(12px, 4vw, 32px);
          bottom: clamp(14px, 2.8vw, 24px);
          display: grid;
          grid-template-columns: auto 1fr;
          gap: clamp(14px, 2.2vw, 22px);
          align-items: end;
        }

        /* Avatar circular MÁS GRANDE */
        .fb-avatar-wrap {
          width: clamp(110px, 18vw, 190px); /* ↑ tamaño */
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          background: #fff;
          padding: clamp(4px, .9vw, 6px);
          box-shadow: 0 10px 28px rgba(0,0,0,.35);
        }
        .fb-avatar {
          width: 100%; height: 100%;
          border-radius: 50%; object-fit: cover; display: block;
        }

        /* Tarjeta (recuadro) con blur para legibilidad */
        .fb-info-card {
          max-width: min(95%, 780px);
          color: #fff;
          background: rgba(0,0,0,.45);           /* recuadro visible */
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 16px;
          padding: clamp(12px, 2.4vw, 18px) clamp(14px, 2.6vw, 22px);
          box-shadow: 0 12px 28px rgba(0,0,0,.28);
        }

        .fb-title {
          margin: 0 0 8px 0;
          color: #fff;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: .2px;
          font-size: clamp(24px, 4.2vw, 48px); /* ↑ más grande */
        }

        .fb-contact {
          display: flex;
          gap: clamp(8px, 1.6vw, 14px);
          flex-wrap: wrap;
        }
        .fb-chip {
          display: inline-block;
          color: #fff; text-decoration: none;
          font-weight: 700;
          font-size: clamp(13px, 1.6vw, 16px);
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.35);
          background: rgba(0,0,0,.35);
          transition: transform .15s ease, background .2s ease, box-shadow .2s ease;
        }
        .fb-chip:hover {
          background: rgba(0,0,0,.5);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0,0,0,.3);
        }

        /* Responsive: en móvil centramos la tarjeta y el avatar arriba */
        @media (max-width: 768px) {
          .fb-profile-row {
            grid-template-columns: 1fr;
            align-items: center;
            justify-items: center;
            text-align: center;
            gap: clamp(12px, 3vw, 16px);
          }
          .fb-info-card {
            width: 100%;
          }
          .fb-cover-overlay {
            background: linear-gradient(180deg,
              rgba(0,0,0,.25) 0%,
              rgba(0,0,0,.6) 65%,
              rgba(0,0,0,.75) 100%);
          }
        }
      `}</style>
    </section>
  );
}
