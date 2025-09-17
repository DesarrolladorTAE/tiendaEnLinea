import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";

const API_URL = "https://mitiendaenlineamx.com.mx/api";

const getExt = (u = "") => {
  try {
    const clean = u.split("?")[0].split("#")[0];
    return clean.substring(clean.lastIndexOf(".") + 1).toLowerCase();
  } catch {
    return "";
  }
};
const isImageUrl = (u) =>
  ["png", "jpg", "jpeg", "gif", "webp", "avif"].includes(getExt(u));
const isVideoUrl = (u) => ["mp4", "webm", "ogg"].includes(getExt(u));

export default function HeroBox({
  autoPlay = true,
  videoDurationMs = 15000, // <-- solo videos configurable
}) {
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);

  // Duración dinámica del slide actual (ms)
  const [currentDurMs, setCurrentDurMs] = useState(5000);

  // refs
  const advanceTimeout = useRef(null);
  const activeVideoRef = useRef(null);

  // Traer banners
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/publicidad`);
        const arr = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const activos = arr.filter((b) => b?.tipo === "Principal" && b?.is_active);
        const conLado = activos.map((s) => ({
          ...s,
          side: Math.random() > 0.5 ? "left" : "right",
        }));
        setSlides(conLado);
      } catch (e) {
        console.error("Error cargando banners", e);
      }
    })();
  }, []);

  const programNext = useCallback(
    (dur) => {
      if (!autoPlay || slides.length < 2) return;
      clearTimeout(advanceTimeout.current);
      advanceTimeout.current = setTimeout(() => {
        setActive((prev) => (prev + 1) % slides.length);
      }, Math.max(800, dur));
    },
    [autoPlay, slides.length]
  );

  // limpiar timer al desmontar
  useEffect(() => {
    return () => clearTimeout(advanceTimeout.current);
  }, []);

  // Resolver duración por tipo
  useEffect(() => {
    const s = slides[active];
    if (!s) return;

    if (isImageUrl(s.url)) {
      setCurrentDurMs(5000);
      programNext(5000);
      return;
    }

    if (isVideoUrl(s.url)) {
      setCurrentDurMs(videoDurationMs);
      programNext(videoDurationMs);
      return;
    }

    // Desconocido => 5s
    setCurrentDurMs(5000);
    programNext(5000);
  }, [active, slides, programNext, videoDurationMs]);

  const attachActiveVideoRef = (el) => {
    activeVideoRef.current = el;
  };

  if (!slides.length) {
    return (
      <section className="hero-neo">
        <style>{css}</style>
        <div className="fx fx-blob b1" aria-hidden />
        <div className="fx fx-blob b2" aria-hidden />
        <div className="fx fx-ring r1" aria-hidden />
        <div className="wrap from-left">
          <div className="copy card">
            <h1>Optimiza tu negocio</h1>
            <p>Gestión de ventas, inventario y facturación en un solo lugar.</p>
          </div>
          <div className="media frame">
            <div className="ph">Tu imagen/video aquí</div>
          </div>
        </div>
      </section>
    );
  }

  const s = slides[active];
  const textFirst = s.side === "left";
  const isImg = isImageUrl(s.url);
  const isVid = isVideoUrl(s.url);

  return (
    <section className="hero-neo">
      <style>{css}</style>

      {/* figuras */}
      <div className="fx fx-blob b1" aria-hidden />
      <div className="fx fx-blob b2" aria-hidden />
      <div className="fx fx-ring r1" aria-hidden />
      <div className="fx fx-tri t1" aria-hidden />

      <div
        key={active}
        className={`wrap ${isVid ? "video-large" : ""} ${
          textFirst ? "from-left" : "from-right"
        }`}
      >
        {textFirst && (
          <div className="copy card">
            <h1>{s.titulo || "Optimiza tu negocio"}</h1>
            <p>
              {s.descripcion ||
                "Gestión de ventas, inventario y facturación en un solo lugar."}
            </p>
          </div>
        )}

        <div className={`media frame ${isVid ? "is-video" : "is-image"}`}>
          {s.url ? (
            isImg ? (
              <img src={s.url} alt={s.titulo || "banner"} />
            ) : isVid ? (
              <div className="video-wrap">
                <video
                  key={s.url}
                  ref={attachActiveVideoRef}
                  src={s.url}
                  className="hero-video"
                  autoPlay
                  loop={false}
                  playsInline
                  preload="metadata"
                  muted={false}         
                  controls={false}
                />
                <div className="duration-pill">{formatMs(currentDurMs)}</div>
              </div>
            ) : (
              <div className="ph">Formato no soportado</div>
            )
          ) : (
            <div className="ph">Sin media</div>
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

      {/* dots */}
      {slides.length > 1 && (
        <div className="dots">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                clearTimeout(advanceTimeout.current);
                setActive(i);
              }}
              className={`dot ${i === active ? "active" : ""}`}
              aria-label={`Ir al slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* barra de progreso */}
      {autoPlay && slides.length > 1 && (
        <div
          key={`prog-${active}`}
          className="progress"
          style={{ ["--dur"]: `${currentDurMs}ms` }}
        >
          <span className="bar" />
        </div>
      )}
    </section>
  );
}

function formatMs(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ================= CSS ================= */
const css = `
:root{
  --ink:#0f172a;
  --muted:#475569;
  --paper:#ffffff;
  --line:rgba(2,6,23,.08);
  --amber:#f59e0b;
  --orange:#f97316;
  --gold:#fbbf24;
  --ring: rgba(249,115,22,.22);
}

.hero-neo{
  position:relative; width:100%; height:100dvh; min-height:560px;
  color:var(--ink); overflow:hidden; display:flex; align-items:center; justify-content:center;
  background: linear-gradient(120deg, #fff 0%, rgba(255,255,255,.96) 40%, rgba(255,255,255,.98) 100%);
}
.hero-neo::before{
  content:""; position:absolute; inset:-20% -10%;
  background: repeating-linear-gradient(120deg, rgba(2,6,23,.045) 0 1px, transparent 1px 22px);
  animation: bgShift 22s linear infinite; pointer-events:none; transform: rotate(2deg); opacity:.6;
}

/* figuras */
.fx{ position:absolute; pointer-events:none; z-index:0; }
.fx-blob{
  width:42vmin; height:42vmin; filter: blur(18px);
  background: radial-gradient(circle at 30% 30%, rgba(251,191,36,.35), transparent 60%),
              radial-gradient(circle at 70% 70%, rgba(249,115,22,.30), transparent 55%),
              radial-gradient(circle at 55% 40%, rgba(239,68,68,.18), transparent 60%);
  border-radius: 30% 70% 60% 40% / 40% 35% 65% 60%;
  mix-blend-mode: multiply; animation: blobMove 24s ease-in-out infinite, blobMorph 18s ease-in-out infinite;
}
.b1{ top:-10vmin; left:-6vmin; }
.b2{ bottom:-12vmin; right:-8vmin; transform: scale(.85); animation-delay: -6s, -4s; }
.fx-ring{
  width:48vmin; height:48vmin; border-radius:50%;
  top:10%; right:8%;
  background: radial-gradient(circle 18vmin at center, rgba(255,255,255,.7) 0 2px, transparent 3px),
              conic-gradient(from 0deg, rgba(245,158,11,.6), rgba(249,115,22,.6), rgba(251,191,36,.6), rgba(245,158,11,.6));
  -webkit-mask: radial-gradient(closest-side, transparent 78%, #000 80%); mask: radial-gradient(closest-side, transparent 78%, #000 80%);
  opacity:.35; animation: spinSlow 28s linear infinite;
}
.fx-tri{
  width: 22vmin; height: 22vmin; left: 8%; bottom: 10%;
  background: linear-gradient(135deg, rgba(249,115,22,.25), rgba(251,191,36,.25));
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%); filter: blur(1px); animation: floatY 10s ease-in-out infinite; opacity:.5;
}

/* layout */
.wrap{
  position:relative; z-index:1; width:100%; max-width:1200px;
  padding: clamp(16px, 2.6vw, 28px);
  display:grid; grid-template-columns:1.05fr 1fr;
  gap: clamp(18px, 3vw, 44px); align-items:center;
}
.wrap.video-large{
  grid-template-columns: 0.8fr 1.2fr;
}

/* copy */
.copy{
  background: var(--paper); border:1px solid var(--line);
  border-radius: 18px; padding: clamp(22px, 3.2vw, 40px);
  box-shadow: 0 26px 70px rgba(2,6,23,.08), 0 1px 0 rgba(255,255,255,.8) inset;
  position:relative;
}
.copy::after{
  content:""; position:absolute; inset:-1px; border-radius:18px;
  background: linear-gradient(120deg, var(--gold), var(--orange), var(--amber), var(--gold));
  opacity:.45; -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; padding:1px; animation: borderShine 6s linear infinite;
}
.copy h1{ margin:0 0 10px; font-size: clamp(28px, 5vw, 48px); line-height:1.06; font-weight:900; letter-spacing:.2px; text-wrap: balance; }
.copy p{ margin:0; color:var(--muted); font-size: clamp(14px, 1.6vw, 18px); max-width: 60ch; }

/* media */
.media{
  background:#fff; border:1px solid var(--line); border-radius:18px;
  padding:10px; overflow:hidden; perspective:1000px;
  box-shadow: 0 26px 70px rgba(2,6,23,.08); transition: transform .25s ease;
}
.media:hover{ transform: rotateX(.5deg) rotateY(.5deg) translateY(-1px); }

/* IMÁGENES: respeta su tamaño por defecto.
   - max-width: 100% para no desbordar el contenedor
   - height: auto para mantener proporción
   - SIN object-fit ni max-height extra */
.media.is-image img{
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: 12px;
}

/* VIDEOS: mismos estilos para todos (grandes y completos) */
.media.is-video .hero-video{
  width: 100%;
  height: clamp(360px, 70vh, 780px);
  object-fit: contain;
  background: #000;
  border-radius: 12px;
}


/* UI video */
.video-wrap{ position:relative; }
.duration-pill{
  position:absolute; left:12px; bottom:12px; z-index:2;
  background: rgba(15,23,42,.85); color:#fff; border-radius:8px; font-size:12px; padding:4px 8px;
}

.ph{ height:320px; display:grid; place-items:center; color:#94a3b8; }

/* dots + progreso */
.dots{ position:absolute; left:0; right:0; bottom:20px; z-index:2; display:flex; gap:10px; justify-content:center; }
.dot{ width:10px; height:10px; border-radius:50%; border:none; cursor:pointer; background:#e2e8f0; transition:.15s; }
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

/* entradas */
.from-left .copy{ animation: slideInLeft 520ms cubic-bezier(.22,.9,.24,1) both; }
.from-left .media{ animation: slideInRight 520ms cubic-bezier(.22,.9,.24,1) both; }
.from-right .copy{ animation: slideInRight 520ms cubic-bezier(.22,.9,.24,1) both; }
.from-right .media{ animation: slideInLeft 520ms cubic-bezier(.22,.9,.24,1) both; }

/* keyframes */
@keyframes slideInLeft{ from{opacity:0; transform:translateX(-24px)} to{opacity:1; transform:none} }
@keyframes slideInRight{ from{opacity:0; transform:translateX(24px)} to{opacity:1; transform:none} }
@keyframes progress{ from{width:0%} to{width:100%} }
@keyframes bgShift{ from{background-position:0 0;} to{background-position:200% 0;} }
@keyframes blobMove{ 0%,100%{ transform: translate(0,0) } 25%{ transform: translate(6vmin, -2vmin) } 50%{ transform: translate(2vmin, 4vmin) } 75%{ transform: translate(-4vmin, 0) } }
@keyframes blobMorph{ 0%,100%{ border-radius:30% 70% 60% 40% / 40% 35% 65% 60%;} 50%{ border-radius:70% 30% 45% 55% / 55% 60% 40% 45%;} }

/* reduce motion */
@media (prefers-reduced-motion: reduce){
  .hero-neo::before, .fx-blob, .fx-ring, .fx-tri, .copy, .media, .media img, .progress .bar{
    animation: none !important; transform: none !important;
  }
}

/* responsive */
@media (max-width: 980px){
  .wrap{ grid-template-columns:1fr; gap: clamp(16px, 4vw, 28px); }
  .copy{ text-align:center; }
  .copy p{ margin-inline:auto; }
  .media.is-video .hero-video{ height: clamp(300px, 52vh, 700px); }
}
`;
