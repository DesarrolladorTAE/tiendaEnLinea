import React, { useEffect, useRef, useState } from "react";
import { Dialog } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import BrokenImageRoundedIcon from "@mui/icons-material/BrokenImageRounded";
import "./store-gallery.css";

function GalleryImage({ src, alt, eager = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed
    ? <span className="sg-image sg-image-error" role="img" aria-label={alt}><BrokenImageRoundedIcon /><span>Imagen no disponible</span></span>
    : <img className="sg-image" src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} onError={() => setFailed(true)} />;
}

export default function StoreGallery({ images = [], theme = {}, colors = {}, storeName = "nuestra tienda", fontFamily, onBack }) {
  const safeImages = images.filter((image) => typeof image === "string" && image.trim());
  const [viewerIndex, setViewerIndex] = useState(null);
  const touchStart = useRef(null);
  const thumbnailRefs = useRef([]);
  const current = viewerIndex === null ? 0 : Math.min(viewerIndex, Math.max(0, safeImages.length - 1));
  const move = (direction) => setViewerIndex((index) => ((index ?? 0) + direction + safeImages.length) % safeImages.length);
  useEffect(() => { thumbnailRefs.current[current]?.scrollIntoView?.({ block: "nearest", inline: "nearest" }); }, [current, viewerIndex]);

  const style = {
    "--sg-background": colors.background || "#ffffff", "--sg-text": colors.text || "#111827",
    "--sg-accent": colors.accent || "#2563eb", "--sg-secondary": colors.secondary || "#475569",
    "--sg-radius": `${theme.radiusValue ?? 16}px`, "--sg-shadow": theme.shadowValue || "none",
    "--sg-button-radius": theme.button_style === "pill" ? "999px" : theme.button_style === "square" ? "0px" : `${theme.radiusValue ?? 16}px`,
    "--sg-gap": theme.spacing === "compact" ? "10px" : theme.spacing === "spacious" ? "24px" : "16px",
    fontFamily: fontFamily || "Inter, Arial, sans-serif",
  };
  const onKeyDown = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || safeImages.length < 2) return;
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
    if (event.key === "Home") { event.preventDefault(); setViewerIndex(0); }
    if (event.key === "End") { event.preventDefault(); setViewerIndex(safeImages.length - 1); }
  };

  return <div className="store-gallery" style={style} data-animation={theme.animation || "subtle"}>
    <button className="sg-back" type="button" onClick={onBack}><ArrowBackRoundedIcon fontSize="small" />Volver a los productos</button>
    <div className="sg-heading"><div><p className="sg-eyebrow">NUESTRA GALERÍA</p><h2>Conoce más de {storeName}</h2><p className="sg-description">Explora los detalles que hacen especial a nuestra tienda. Toca una imagen para verla completa.</p></div><span className="sg-count">{safeImages.length} {safeImages.length === 1 ? "imagen" : "imágenes"}</span></div>
    {safeImages.length ? <div className="sg-grid" data-count={safeImages.length} data-layout={safeImages.length === 1 ? "single" : safeImages.length === 2 ? "pair" : "mosaic"}>
      {safeImages.map((image, index) => <button className="sg-tile" type="button" key={`${image}-${index}`} onClick={() => setViewerIndex(index)} aria-label={`Ver imagen ${index + 1} de ${storeName}`}>
        <GalleryImage src={image} alt={`${storeName} · Imagen ${index + 1}`} eager={index < 3} />
        <span className="sg-tile-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span className="sg-tile-open" aria-hidden="true"><ArrowOutwardRoundedIcon fontSize="small" />Ampliar</span>
      </button>)}
    </div> : <p className="sg-empty">Todavía no hay imágenes en esta galería.</p>}
    <Dialog open={viewerIndex !== null && safeImages.length > 0} onClose={() => setViewerIndex(null)} fullScreen transitionDuration={theme.animation === "none" ? 0 : undefined} TransitionProps={{ onEntered: () => thumbnailRefs.current[current]?.scrollIntoView?.({ block: "nearest", inline: "nearest" }) }} aria-labelledby="sg-viewer-title" PaperProps={{ className: "sg-viewer", style, onKeyDown }}>
      <div className="sg-toolbar"><div><p className="sg-eyebrow">GALERÍA</p><h2 id="sg-viewer-title">{storeName}</h2></div><span className="sg-position" aria-live="polite">{current + 1} / {safeImages.length}</span><button className="sg-control" type="button" onClick={() => setViewerIndex(null)} aria-label="Cerrar galería"><CloseRoundedIcon /></button></div>
      <div className="sg-stage" onTouchStart={(event) => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY }; }} onTouchCancel={() => { touchStart.current = null; }} onTouchEnd={(event) => {
        const start = touchStart.current; touchStart.current = null;
        if (!start || safeImages.length < 2) return;
        const touch = event.changedTouches[0]; const dx = touch.clientX - start.x; const dy = touch.clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
      }}>
        {safeImages[current] && <GalleryImage src={safeImages[current]} alt={`${storeName} · Imagen ${current + 1}`} eager />}
        {safeImages.length > 1 && <><button className="sg-control sg-prev" type="button" onClick={() => move(-1)} aria-label="Imagen anterior"><ChevronLeftRoundedIcon /></button><button className="sg-control sg-next" type="button" onClick={() => move(1)} aria-label="Imagen siguiente"><ChevronRightRoundedIcon /></button></>}
      </div>
      {safeImages.length > 1 && <div className="sg-thumbnails" aria-label="Seleccionar imagen">{safeImages.map((image, index) => <button ref={(element) => { thumbnailRefs.current[index] = element; }} type="button" key={`${image}-${index}`} aria-label={`Mostrar imagen ${index + 1}`} aria-pressed={current === index} onClick={() => setViewerIndex(index)}><GalleryImage src={image} alt={`Miniatura ${index + 1}`} /></button>)}</div>}
    </Dialog>
  </div>;
}
