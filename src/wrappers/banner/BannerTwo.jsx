import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

import { Swiper, SwiperSlide } from "swiper/react";
// ⬇️ Import legacy: toma módulos desde 'swiper' y regístralos con SwiperCore.use(...)
import SwiperCore, {
  Navigation,
  Pagination,
  Autoplay,
  Keyboard,
  A11y,
} from "swiper";
SwiperCore.use([Navigation, Pagination, Autoplay, Keyboard, A11y]);

// NOTA: ya importas "swiper/swiper-bundle.min.css" en main.
// Si tu build lo requiere, puedes importar los CSS de módulos puntuales aquí:
// import "swiper/css";
// import "swiper/css/navigation";
// import "swiper/css/pagination";

const BannerTwo = ({
  spaceTopClass,
  spaceBottomClass,
  images = [],
  storeName = "",
}) => {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const hasImages = images && images.length > 0;
  const modalImgRef = useRef(null);

  const title = useMemo(() => {
    const s = (storeName || "").trim();
    return s ? `Conoce más sobre ${s}` : "Conoce más";
  }, [storeName]);

  // Modal helpers
  const openAt = useCallback((i) => {
    setIdx(i);
    setOpen(true);
    document.body.style.overflow = "hidden";
  }, []);
  const close = useCallback(() => {
    setOpen(false);
    document.body.style.overflow = "";
  }, []);
  const next = useCallback(
    () => setIdx((v) => (v + 1) % images.length),
    [images.length]
  );
  const prev = useCallback(
    () => setIdx((v) => (v - 1 + images.length) % images.length),
    [images.length]
  );

  // Teclado dentro del modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, next, prev]);

  if (!hasImages) return null;

  return (
    <div className={clsx("banner-area", spaceTopClass, spaceBottomClass)}>
      <style>{styles}</style>

      <div className="container">
        {/* Encabezado */}
        <div className="b2-header">
          <h3 className="b2-title">{title}</h3>
          <div className="b2-legend">Galería</div>
        </div>

        {/* Carrusel con Swiper */}
        <div className="b2-swiper-wrap">
          <Swiper
            navigation
            pagination={{ clickable: true }}
            keyboard={{ enabled: true }}
            autoplay={{
              delay: 0, // sin pausa entre slides
              disableOnInteraction: false,
            }}
            speed={4000} // velocidad de transición (ms)
            loop={images.length > 1}
            spaceBetween={16}
            slidesPerView={3}
            breakpoints={{
              0: { slidesPerView: 1 },
              576: { slidesPerView: 1.2 },
              768: { slidesPerView: 2 },
              992: { slidesPerView: 3 },
              1200: { slidesPerView: 4 },
            }}
            className="b2-swiper"
          >
            {images.map((img, i) => (
              <SwiperSlide key={i}>
                <button
                  className="b2-card-btn"
                  onClick={() => openAt(i)}
                  title="Ver grande"
                >
                  <div className="b2-card">
                    <img
                      src={img.src}
                      alt={img.alt || `Imagen ${i + 1}`}
                      loading="lazy"
                    />
                  </div>
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* MODAL / LIGHTBOX */}
      {open && (
        <div
          className="b2-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Galería"
        >
          <div className="b2-modal-backdrop" onClick={close} />
          <div className="b2-modal-content">
            <button className="b2-close" onClick={close} aria-label="Cerrar">
              ×
            </button>
            <button
              className="b2-arrow b2-prev"
              onClick={prev}
              aria-label="Anterior"
            >
              ‹
            </button>
            <div className="b2-modal-img-wrap">
              <img
                ref={modalImgRef}
                key={images[idx]?.src}
                src={images[idx]?.src}
                alt={images[idx]?.alt || `Imagen ${idx + 1}`}
                className="b2-modal-img"
              />
            </div>
            <button
              className="b2-arrow b2-next"
              onClick={next}
              aria-label="Siguiente"
            >
              ›
            </button>
            <div className="b2-counter">
              {idx + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = `
/* Header */
.b2-header{
  display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px;
}
.b2-title{ margin:0; font-weight:800; letter-spacing:.2px; }
.b2-legend{ font-size:.9rem; opacity:.7 }

/* Tarjetas del carrusel */
.b2-card-btn{
  width:100%; border:none; background:transparent; padding:0; cursor:pointer;
}
.b2-card{
  border-radius:16px; overflow:hidden; background:#fff;
  box-shadow: 0 10px 25px rgba(0,0,0,.06);
  transition: transform .25s ease, box-shadow .25s ease;
  aspect-ratio: 16 / 10;
  display:flex; align-items:center; justify-content:center;
}
.b2-card:hover{ transform: translateY(-3px); box-shadow: 0 14px 30px rgba(0,0,0,.10); }
.b2-card img{ width:100%; height:100%; object-fit:cover; }

/* Ajustes Swiper */
.b2-swiper-wrap { position:relative; }
.b2-swiper :where(.swiper-button-prev, .swiper-button-next){
  color:#333; width:40px; height:40px; border-radius:10px; background:#f2f2f2;
}
.b2-swiper :where(.swiper-button-prev:hover, .swiper-button-next:hover){
  background:#e9e9e9;
}
.b2-swiper .swiper-pagination-bullet{ opacity:.5 }
.b2-swiper .swiper-pagination-bullet-active{ opacity:1 }

/* Modal / Lightbox */
.b2-modal{ position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center; }
.b2-modal-backdrop{
  position:absolute; inset:0; background:rgba(0,0,0,.55); backdrop-filter: blur(2px);
  animation: b2-fade .18s ease-out both;
}
@keyframes b2-fade{ from{opacity:0} to{opacity:1} }

.b2-modal-content{
  position:relative; width:min(96vw, 1100px); height:min(92vh, 800px);
  background:rgba(15,15,15,.92); border-radius:18px; overflow:hidden;
  display:flex; align-items:center; justify-content:center;
  box-shadow: 0 30px 80px rgba(0,0,0,.35);
  animation: b2-pop .18s ease-out both;
}
@keyframes b2-pop{ from{ transform: translateY(6px) scale(.98); opacity:.7 } to{ transform:none; opacity:1 } }

.b2-close{
  position:absolute; top:10px; right:12px; z-index:2;
  width:40px; height:40px; border:none; border-radius:12px; background:#ffffff12; color:#fff;
  font-size:24px; line-height:1; cursor:pointer; transition: background .2s ease, transform .2s ease;
}
.b2-close:hover{ background:#ffffff1f; transform:scale(1.03); }

.b2-arrow{
  position:absolute; top:50%; transform:translateY(-50%);
  width:44px; height:44px; border:none; border-radius:50%; background:#ffffff12; color:#fff;
  font-size:28px; line-height:1; cursor:pointer; transition: background .2s ease, transform .2s ease;
  z-index:2;
}
.b2-prev{ left:12px; } .b2-next{ right:12px; }
.b2-arrow:hover{ background:#ffffff1f; transform:translateY(-50%) scale(1.04); }

.b2-modal-img-wrap{
  position:absolute; inset:54px 10px 36px; display:flex; align-items:center; justify-content:center;
}
.b2-modal-img{
  max-width:100%; max-height:100%; object-fit:contain; border-radius:10px;
  box-shadow: 0 20px 60px rgba(0,0,0,.35);
}
.b2-counter{
  position:absolute; bottom:8px; left:50%; transform:translateX(-50%);
  color:#fff; font-size:12px; opacity:.85; background:#00000033; padding:4px 10px; border-radius:999px;
}
`;

BannerTwo.propTypes = {
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string,
  images: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      alt: PropTypes.string,
    })
  ),
  storeName: PropTypes.string,
};

export default BannerTwo;
