import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Modal } from "react-bootstrap";
import Swiper, { SwiperSlide } from "../../components/swiper";
import { EffectFade, Thumbs, Keyboard, Lazy } from "swiper";
import Rating from "./sub-components/ProductRating";

const DEFAULT_IMG = "/assets/img/defaultproduct.png";

function formatFechaMX(v) {
  const d = new Date(v);
  if (isNaN(d)) return "";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function ProductModal({
  product,
  images: imagesProp,
  currency,
  discountedPrice,
  finalProductPrice,
  finalDiscountedPrice,
  show,
  onHide,
}) {
  const symbol = currency?.currencySymbol ?? "MX$";
  const hasDiscount =
    discountedPrice !== null && discountedPrice !== undefined;

  // normaliza imágenes
  const norm = (v) => {
    if (Array.isArray(v)) return v.filter(Boolean);
    if (typeof v === "string" && v.trim() !== "") return [v.trim()];
    return [];
  };
  const images = useMemo(() => {
    const fromProp = norm(imagesProp);
    return fromProp.length ? fromProp : norm(product?.image);
  }, [imagesProp, product]);

  const categoryNames = useMemo(() => {
    const c = product?.category;
    if (!Array.isArray(c)) return [];
    return c.map((x) => (typeof x === "string" ? x : x?.name)).filter(Boolean);
  }, [product]);

  // thumbs
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  // ⇩ OJO: nada de autoHeight; usamos altura fija por CSS
  const galleryOpts = {
    loop: images.length > 1,
    effect: "fade",
    fadeEffect: { crossFade: true },
    grabCursor: true,
    keyboard: { enabled: true },
    preloadImages: false,
    lazy: { loadPrevNext: true, loadOnTransitionStart: true },
    thumbs:
      images.length > 1 && thumbsSwiper && !thumbsSwiper.destroyed
        ? { swiper: thumbsSwiper }
        : undefined,
    modules: [EffectFade, Thumbs, Keyboard, Lazy],
  };

  const thumbsOpts = {
    onSwiper: setThumbsSwiper,
    spaceBetween: 8,
    slidesPerView: "auto",
    freeMode: true,
    watchSlidesProgress: true,
  };

  const onImgError = (e) => {
    if (e.currentTarget.dataset.fallback !== "1") {
      e.currentTarget.src = DEFAULT_IMG;
      e.currentTarget.dataset.fallback = "1";
    }
  };

  // imagen grande: ocupa 100% del alto del carrusel
  const fitImg = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  };

  const handleClose = () => {
    setThumbsSwiper(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered dialogClassName="product-modal-dialog">
      <button type="button" onClick={handleClose} aria-label="Cerrar" className="product-modal-close">
        ×
      </button>

      <div className="modal-body product-modal-body">
        <div className="row g-3">
          {/* IZQUIERDA: Galería */}
          <div className="col-md-6 col-12">
            <div className="product-gallery-plain">
              <Swiper options={galleryOpts}>
                {(images.length ? images : [DEFAULT_IMG]).map((src, i) => (
                  <SwiperSlide
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={src}
                      alt={`${product?.name || "Imagen"} ${i + 1}`}
                      onError={onImgError}
                      loading="lazy"
                      className="img-fluid"
                      style={fitImg}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>

              {images.length > 1 && (
                <div className="product-thumbs-plain">
                  <Swiper options={thumbsOpts}>
                    {images.map((src, i) => (
                      <SwiperSlide key={`t-${i}`} style={{ width: 64 }}>
                        <img
                          src={src}
                          alt={`Miniatura ${i + 1}`}
                          onError={onImgError}
                          loading="lazy"
                          className="img-fluid"
                          style={{
                            width: "100%",
                            height: 64,
                            objectFit: "cover",
                            borderRadius: 6,
                          }}
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              )}
            </div>

            <hr className="d-md-none" style={{ margin: "10px 0 0" }} />
          </div>

          {/* DERECHA: Datos */}
          <div className="col-md-6 col-12">
            {product?.name && <h3 className="mb-2">{product.name}</h3>}

            {categoryNames.length > 0 && (
              <div className="mb-2">
                <strong style={{ fontSize: 14 }}>Categoría:</strong>{" "}
                <span style={{ fontWeight: 600 }}>{categoryNames.join(" / ")}</span>
              </div>
            )}

            {product?.rating > 0 && (
              <div className="mb-2">
                <Rating ratingValue={product.rating} />
              </div>
            )}

            {(finalProductPrice || finalDiscountedPrice) && (
              <div className="mb-3">
                {hasDiscount ? (
                  <>
                    <span style={{ fontWeight: 800, fontSize: 18 }}>
                      {symbol}
                      {finalDiscountedPrice}
                    </span>
                    <span
                      style={{
                        marginLeft: 12,
                        textDecoration: "line-through",
                        opacity: 0.6,
                      }}
                    >
                      {symbol}
                      {finalProductPrice}
                    </span>
                  </>
                ) : (
                  <span style={{ fontWeight: 800, fontSize: 18 }}>
                    {symbol}
                    {finalProductPrice}
                  </span>
                )}
              </div>
            )}

            {product?.sku && (
              <div>
                <strong>SKU:</strong> <span>{product.sku}</span>
              </div>
            )}

            {"stock" in (product || {}) && product.stock !== undefined && (
              <div>
                <strong>En existencia:</strong>{" "}
                <span
                  style={{
                    color: product.stock > 0 ? "#0a8f20" : "#d11a2a",
                    fontWeight: 700,
                  }}
                >
                  {product.stock}
                </span>
              </div>
            )}

            {product?.shortDescription && (
              <div className="mt-2">
                <strong>Descripción:</strong>{" "}
                <span>{product.shortDescription}</span>
              </div>
            )}

            {product?.fullDescription && (
              <div className="mt-2">
                <strong>Más Detalles:</strong>{" "}
                <span>{product.fullDescription}</span>
              </div>
            )}

            {typeof product?.discount === "number" && product.discount > 0 && (
              <div className="mt-2">
                <strong>Descuento:</strong> <span>-{product.discount}%</span>
              </div>
            )}

            {product?.offerEnd && (
              <div className="mt-2">
                <strong>La oferta termina el:</strong>{" "}
                <span>{formatFechaMX(product.offerEnd)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

ProductModal.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string),
  currency: PropTypes.shape({ currencySymbol: PropTypes.string }),
  discountedPrice: PropTypes.number,
  finalDiscountedPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  finalProductPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onHide: PropTypes.func.isRequired,
  product: PropTypes.shape({
    name: PropTypes.string,
    sku: PropTypes.string,
    image: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    rating: PropTypes.number,
    discount: PropTypes.number,
    offerEnd: PropTypes.string,
    stock: PropTypes.number,
    shortDescription: PropTypes.string,
    fullDescription: PropTypes.string,
    category: PropTypes.array,
  }).isRequired,
  show: PropTypes.bool.isRequired,
};

export default ProductModal;
