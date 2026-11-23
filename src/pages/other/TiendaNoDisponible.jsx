import React from "react";

export default function TiendaNoDisponible() {
  return (
    <div className="tienda-offline">
      <div className="contenido" role="alert" aria-live="polite">
        <img
          src="/assets/img/close.png"
          alt="Tienda cerrada temporalmente"
          className="icono"
          loading="eager"
        />
        <h1>🚫 Tienda no disponible</h1>
        <p>
          Por el momento esta tienda no está activa. <br />
          Comunícate con la tienda para soporte.
        </p>

        <a
          href="https://mitiendaenlineamx.com.mx/"
          className="btn-regresar"
          aria-label="Volver a MiTiendaEnLineaMX"
        >
          Volver a MiTiendaEnLineaMX
        </a>
      </div>

      <style>{`
        /* anidamos las clases para minimizar colisiones globales */
        .tienda-offline {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
                   max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
          background: radial-gradient(1200px 600px at 50% -100px, #f5f2ef 0%, #ffffff 55%, #fafafa 100%);
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", Arial, "Noto Sans",
            "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif;
          text-align: center;
        }

        .tienda-offline .contenido {
          width: 100%;
          max-width: 680px;
          background: #fff;
          border-radius: 20px;
          padding: clamp(24px, 4vw, 60px) clamp(20px, 4vw, 50px);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.14);
          animation: fadeIn 0.6s ease-out both;
        }

        .tienda-offline .icono {
          width: clamp(160px, 28vw, 620px);
          max-width: 100%;
          height: auto;
          margin: 0 auto clamp(18px, 2.5vw, 30px);
          display: block;
        }

        .tienda-offline h1 {
          font-size: clamp(22px, 2.8vw, 36px);
          margin: 0 0 clamp(12px, 1.8vw, 18px);
          color: #b71c1c;
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        .tienda-offline p {
          font-size: clamp(15px, 1.6vw, 18px);
          color: #444;
          line-height: 1.65;
          margin: 0 0 clamp(18px, 2.5vw, 28px);
        }

        .tienda-offline .btn-regresar {
          display: inline-block;
          background: #b71c1c;
          color: #fff;
          text-decoration: none;
          font-weight: 700;
          font-size: clamp(15px, 1.6vw, 18px);
          padding: clamp(12px, 2.5vw, 16px) clamp(18px, 3.5vw, 28px);
          border-radius: 12px;
          transition: transform 0.15s ease, box-shadow 0.25s ease, background 0.2s ease;
          box-shadow: 0 6px 16px rgba(183, 28, 28, 0.28);
          outline: none;
        }
        .tienda-offline .btn-regresar:hover {
          background: #d32f2f;
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(211, 47, 47, 0.32);
        }
        .tienda-offline .btn-regresar:active {
          transform: translateY(0);
          box-shadow: 0 6px 16px rgba(183, 28, 28, 0.28);
        }

        @media (max-width: 768px) {
          .tienda-offline .contenido { border-radius: 16px; }
          .tienda-offline .btn-regresar { display: block; width: 100%; }
        }
        @media (max-width: 420px) {
          .tienda-offline .contenido { border-radius: 14px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .tienda-offline .contenido { animation: none; }
          .tienda-offline .btn-regresar { transition: none; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
