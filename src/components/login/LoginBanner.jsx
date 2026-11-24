import React, { useEffect, useState } from "react";
import { getLoginBanners } from "../../utils/loginBannerCache";

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

const IMAGE_MS = 5000;
const VIDEO_MS = 15000;

export function useLoginBanner(mode = "login") {
  const [slides, setSlides] = useState([]);
  const [positions, setPositions] = useState({});
  const active = positions[mode] ?? 0;
  const current = slides[active];

  useEffect(() => {
    let mounted = true;

    const urlOf = (b) =>
      b?.url || b?.imagen || b?.image_url || b?.path || b?.src || b?.img;

    const isActive = (b) => (b?.is_active ?? b?.activo ?? true) === true;

    const textTags = (b) =>
      `${b?.tipo || ""} ${b?.etiqueta || ""} ${b?.tag || ""} ${
        b?.badge || ""
      } ${b?.posicion || ""} ${b?.ubicacion || ""}`.toLowerCase();

    const listTags = (b) =>
      [...(b?.etiquetas || []), ...(b?.tags || [])].map((x) =>
        String(x || "").toLowerCase(),
      );

    const hasAny = (b, words) =>
      words.some(
        (w) =>
          textTags(b).includes(w) || listTags(b).some((t) => t.includes(w)),
      );

    (async () => {
      try {
        const arr = await getLoginBanners();

        const candidates = arr.filter((b) => isActive(b) && urlOf(b));

        const loginOnly = candidates.filter((b) =>
          hasAny(b, ["login", "signin", "acceso"]),
        );
        const principal = candidates.filter(
          (b) => String(b?.tipo || "").toLowerCase() === "principal",
        );

        const pool =
          loginOnly.length > 0
            ? loginOnly
            : principal.length > 0
              ? principal
              : candidates;

        const slides = pool.map((b) => ({
          url: urlOf(b),
          titulo: b?.titulo || b?.title || "",
        }));

        if (mounted) {
          setSlides(slides);
        }
      } catch (e) {
        console.error("Error cargando banners (login):", e);
        if (mounted) setSlides([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!current || slides.length < 2) return;
    const nextIndex = (active + 1) % slides.length;
    const next = slides[nextIndex];
    if (isImageUrl(next.url)) {
      const image = new Image();
      image.decoding = "async";
      image.src = next.url;
    }
    const timer = setTimeout(() => {
      setPositions(previous => ({ ...previous, [mode]: nextIndex }));
    }, isVideoUrl(current.url) ? VIDEO_MS : IMAGE_MS);
    return () => clearTimeout(timer);
  }, [active, current, mode, slides]);

  return { current, slides, active, setActive: index => setPositions(previous => ({ ...previous, [mode]: index })) };
}

export default function LoginBanner({ current, slides, active, setActive }) {
  if (!current) return null;
  const isVid = isVideoUrl(current.url);
  const isImg = isImageUrl(current.url);
  return (
    <aside className="col-media" aria-label="Anuncios">
      <div className="auth-banner">
        <div key={current.url} className="frame">
          {isImg && (
            <img
              src={current.url}
              alt={current.titulo || "banner"}
              className="auth-img"
              decoding="async"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: 12,
              }}
            />
          )}

          {isVid && (
            <video
              key={current.url}
              className="auth-video"
              src={current.url}
              preload="metadata"
              autoPlay
              muted
              playsInline
              loop={false}
              controls={false}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: 12,
                background: "#000",
                objectFit: "contain",
              }}
            />
          )}
        </div>

        {slides.length > 1 && (
          <div className="auth-banner-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-current={i === active ? "true" : undefined}
                className={`dot ${i === active ? "active" : ""}`}
                aria-label={`Ir al banner ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
