import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const API_URL = "https://mitiendaenlineamx.com.mx/api";

export default function HeroBox({ autoPlay = true, intervalMs = 5000 }) {
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);
  const timer = useRef(null);

  // Traer banners tipo Principal activos
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/publicidad`);
        const arr = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const activos = arr.filter((b) => b?.tipo === "Principal" && b?.is_active);
        const conLado = activos.map((s) => ({
          ...s,
          side: Math.random() > 0.5 ? "left" : "right", // lado aleatorio por slide
        }));
        setSlides(conLado);
      } catch (e) {
        console.error("Error cargando banners", e);
      }
    };
    fetchBanners();
  }, []);

  // Autoplay
  useEffect(() => {
    if (!autoPlay || slides.length < 2) return;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(timer.current);
  }, [slides, autoPlay, intervalMs]);

  if (!slides.length) {
    return (
      <section className="hero-neo">
        <style>{css}</style>
        {/* Figuras animadas */}
        <div className="fx fx-blob b1" aria-hidden />
        <div className="fx fx-blob b2" aria-hidden />
        <div className="fx fx-ring r1" aria-hidden />

        <div className="wrap from-left">
          <div className="copy card">
            <h1>Optimiza tu negocio</h1>
            <p>Gestión de ventas, inventario y facturación en un solo lugar.</p>
          </div>
          <div className="media frame">
            <div className="ph">Tu imagen aquí</div>
          </div>
        </div>
      </section>
    );
  }

  const s = slides[active];
  const textFirst = s.side === "left";

  return (
    <section className="hero-neo">
      <style>{css}</style>

      {/* Figuras animadas (decorativas) */}
      <div className="fx fx-blob b1" aria-hidden />
      <div className="fx fx-blob b2" aria-hidden />
      <div className="fx fx-ring r1" aria-hidden />
      <div className="fx fx-tri t1" aria-hidden />

      {/* key reinicia animaciones por slide */}
      <div key={active} className={`wrap ${textFirst ? "from-left" : "from-right"}`}>
        {textFirst && (
          <div className="copy card">
            <h1>{s.titulo || "Optimiza tu negocio"}</h1>
            <p>
              {s.descripcion ||
                "Gestión de ventas, inventario y facturación en un solo lugar."}
            </p>
          </div>
        )}

        <div className="media frame">
          {s.url ? (
            <img src={s.url} alt={s.titulo || "banner"} style={{ "--kb": `${intervalMs}ms` }} />
          ) : (
            <div className="ph">Sin imagen</div>
          )}
        </div>

        {!textFirst && (
          <div className="copy card">
            <h1>{s.titulo || "Optimiza tu negocio"}</h1>
            <p>
              {s.descripcion ||
                "Gestión de ventas, inventario y facturación en un solo lugar."}
            </p>
          </div>
        )}
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="dots">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`dot ${i === active ? "active" : ""}`}
              aria-label={`Ir al slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Barra de progreso (opcional; ligada al autoplay) */}
      {autoPlay && slides.length > 1 && (
        <div key={`prog-${active}`} className="progress" style={{ "--dur": `${intervalMs}ms` }}>
          <span className="bar" />
        </div>
      )}
    </section>
  );
}

/* ============== CSS “NeoMotion” (claro + motion + figuras) ============== */
const css = `
:root{
  --ink:#0f172a;
  --muted:#475569;
  --paper:#ffffff;
  --line:rgba(2,6,23,.08);

  /* Paleta del logo */
  --amber:#f59e0b;
  --orange:#f97316;
  --gold:#fbbf24;
  --red:#ef4444;

  --ring: rgba(249,115,22,.22);
}

.hero-neo{
  position:relative; width:100%; height:100dvh; min-height:560px;
  color:var(--ink); overflow:hidden; display:flex; align-items:center; justify-content:center;

  /* Fondo con gradiente animado MUY sutil */
  background:
    linear-gradient(120deg, rgba(255,255,255,1) 0%, rgba(255,255,255,.96) 40%, rgba(255,255,255,.98) 100%);
}
.hero-neo::before{
  /* rayas diagonales translúcidas que se mueven */
  content:""; position:absolute; inset:-20% -10%;
  background:
    repeating-linear-gradient(120deg, rgba(2,6,23,.045) 0 1px, transparent 1px 22px);
  animation: bgShift 22s linear infinite;
  pointer-events:none;
  transform: rotate(2deg);
  opacity:.6;
}

/* Figuras animadas */
.fx{ position:absolute; pointer-events:none; z-index:0; }
.fx-blob{
  width:42vmin; height:42vmin; filter: blur(18px);
  background: radial-gradient(circle at 30% 30%, rgba(251,191,36,.35), transparent 60%),
              radial-gradient(circle at 70% 70%, rgba(249,115,22,.30), transparent 55%),
              radial-gradient(circle at 55% 40%, rgba(239,68,68,.18), transparent 60%);
  border-radius: 30% 70% 60% 40% / 40% 35% 65% 60%;
  mix-blend-mode: multiply;
  animation: blobMove 24s ease-in-out infinite, blobMorph 18s ease-in-out infinite;
}
.b1{ top:-10vmin; left:-6vmin; }
.b2{ bottom:-12vmin; right:-8vmin; transform: scale(.85); animation-delay: -6s, -4s; }

.fx-ring{
  width:48vmin; height:48vmin; border-radius:50%;
  top:10%; right:8%;
  background:
    radial-gradient(circle 18vmin at center, rgba(255,255,255,.7) 0 2px, transparent 3px),
    conic-gradient(from 0deg, rgba(245,158,11,.6), rgba(249,115,22,.6), rgba(251,191,36,.6), rgba(245,158,11,.6));
  -webkit-mask: radial-gradient(closest-side, transparent 78%, #000 80%);
  mask: radial-gradient(closest-side, transparent 78%, #000 80%);
  opacity:.35;
  animation: spinSlow 28s linear infinite;
}

.fx-tri{
  width: 22vmin; height: 22vmin; left: 8%; bottom: 10%;
  background: linear-gradient(135deg, rgba(249,115,22,.25), rgba(251,191,36,.25));
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  filter: blur(1px);
  animation: floatY 10s ease-in-out infinite;
  opacity:.5;
}

/* Contenido */
.wrap{
  position:relative; z-index:1;
  width:100%; max-width:1200px;
  padding: clamp(16px, 2.6vw, 28px);
  display:grid; grid-template-columns:1.05fr 1fr;
  gap: clamp(18px, 3vw, 44px); align-items:center;
}

.copy{
  background: var(--paper);
  border:1px solid var(--line);
  border-radius: 18px;
  padding: clamp(22px, 3.2vw, 40px);
  box-shadow: 0 26px 70px rgba(2,6,23,.08), 0 1px 0 rgba(255,255,255,.8) inset;
  position:relative;
}
.copy::after{
  /* borde con brillo cálido que corre en loop */
  content:""; position:absolute; inset:-1px; border-radius:18px;
  background: linear-gradient(120deg, var(--gold), var(--orange), var(--amber), var(--gold));
  opacity:.45;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  padding:1px;
  animation: borderShine 6s linear infinite;
}
.copy h1{
  margin:0 0 10px;
  font-size: clamp(28px, 5vw, 48px);
  line-height:1.06; font-weight:900; letter-spacing:.2px;
  text-wrap: balance;
}
.copy p{ margin:0; color:var(--muted); font-size: clamp(14px, 1.6vw, 18px); max-width: 60ch; }

/* Imagen con marco y tilt */
.media{
  background:#fff; border:1px solid var(--line);
  border-radius:18px; padding:10px; overflow:hidden; perspective:1000px;
  box-shadow: 0 26px 70px rgba(2,6,23,.08);
  transition: transform .25s ease;
}
.media:hover{ transform: rotateX(.5deg) rotateY(.5deg) translateY(-1px); }
.media img{
  width:100%; height:auto; display:block; border-radius:12px; object-fit:cover;
  transform-origin:center; animation: kenburns var(--kb, 5200ms) ease-out both;
}
.ph{ height:320px; display:grid; place-items:center; color:#94a3b8; }

/* Dots + progreso */
.dots{
  position:absolute; left:0; right:0; bottom:20px; z-index:2;
  display:flex; gap:10px; justify-content:center;
}
.dot{
  width:10px; height:10px; border-radius:50%; border:none; cursor:pointer;
  background:#e2e8f0; transition: transform .15s ease, background .2s ease, box-shadow .2s ease;
}
.dot:hover{ transform: scale(1.1); }
.dot.active{ background:#111827; box-shadow: 0 0 0 6px var(--ring); }

.progress{
  position:absolute; bottom:8px; left:50%; transform:translateX(-50%);
  width:min(520px, 70vw); height:4px; border-radius:999px; background:rgba(15,23,42,.08);
  overflow:hidden; z-index:2;
}
.progress .bar{
  display:block; width:0%; height:100%;
  background: linear-gradient(90deg, var(--amber), var(--gold), var(--orange));
  animation: progress var(--dur, 5000ms) linear forwards;
}

/* Entradas */
.from-left .copy{ animation: slideInLeft 520ms cubic-bezier(.22,.9,.24,1) both; }
.from-left .media{ animation: slideInRight 520ms cubic-bezier(.22,.9,.24,1) both; }
.from-right .copy{ animation: slideInRight 520ms cubic-bezier(.22,.9,.24,1) both; }
.from-right .media{ animation: slideInLeft 520ms cubic-bezier(.22,.9,.24,1) both; }

/* Keyframes */
@keyframes slideInLeft{ from{opacity:0; transform:translateX(-24px)} to{opacity:1; transform:none} }
@keyframes slideInRight{ from{opacity:0; transform:translateX(24px)}  to{opacity:1; transform:none} }
@keyframes kenburns{ from{transform:scale(1.02)} to{transform:scale(1.06)} }
@keyframes progress{ from{width:0%} to{width:100%} }
@keyframes bgShift{ from{background-position:0 0;} to{background-position:200% 0;} }
@keyframes blobMove{
  0%,100%{ transform: translate(0,0) }
  25%{ transform: translate(6vmin, -2vmin) }
  50%{ transform: translate(2vmin, 4vmin) }
  75%{ transform: translate(-4vmin, 0) }
}
@keyframes blobMorph{
  0%,100%{ border-radius:30% 70% 60% 40% / 40% 35% 65% 60%;}
  50%{    border-radius:70% 30% 45% 55% / 55% 60% 40% 45%;}
}
@keyframes spinSlow{ from{ transform: rotate(0deg);} to{ transform: rotate(360deg);} }
@keyframes floatY{ 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-8px) } }
@keyframes borderShine{ from{ filter:hue-rotate(0deg) } to{ filter:hue-rotate(360deg) } }

/* Reduce motion */
@media (prefers-reduced-motion: reduce){
  .hero-neo::before, .fx-blob, .fx-ring, .fx-tri,
  .copy, .media, .media img, .progress .bar{
    animation: none !important; transform: none !important;
  }
}

/* Responsive */
@media (max-width: 980px){
  .wrap{ grid-template-columns:1fr; gap: clamp(16px, 4vw, 28px); }
  .copy{ text-align:center; }
  .copy p{ margin-inline:auto; }
}
`;
