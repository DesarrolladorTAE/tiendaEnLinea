import PropTypes from "prop-types";
import React, { Fragment, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import clsx from "clsx";
import { Link } from "react-router-dom";
import { getDiscountPrice } from "../../helpers/product";
import Rating from "./sub-components/ProductRating";
import ProductModal from "./ProductModal";
import { addToWhatsappCart } from "../../store/slices/whatsappCartSlice";

const DEFAULT_IMG = "/assets/img/defaultproduct.png";

function pickImages(imgField) {
  // Acepta array, string o null
  if (Array.isArray(imgField)) return imgField.filter(Boolean);
  if (typeof imgField === "string" && imgField.trim() !== "")
    return [imgField.trim()];
  return [];
}

function onImgError(e) {
  // Evita loops si también falla el default
  if (e.currentTarget.dataset.fallback !== "1") {
    e.currentTarget.src = DEFAULT_IMG;
    e.currentTarget.dataset.fallback = "1";
  }
}

const ProductGridListSingle = ({
  product,
  currency,
  cartItem,
  wishlistItem,
  compareItem,
  spaceBottomClass,
}) => {
  const dispatch = useDispatch();
  const cardRef = useRef(null);
  const [modalShow, setModalShow] = useState(false);
  const DEFAULT_IMG = "/assets/img/defaultproduct.png";

  // Moneda segura
  const symbol = currency?.currencySymbol ?? "$";
  const rate = Number(currency?.currencyRate ?? 1);

  // Precios y descuento
  const discounted = getDiscountPrice(product.price, product.discount);
  const final = +(product.price * rate).toFixed(2);
  const finalDiscount =
    discounted !== null ? +(discounted * rate).toFixed(2) : null;
  const images = pickImages(product.image);
  const mainImg = images[0] || DEFAULT_IMG;
  const hoverImg = images[1] || null;

  const handleAddToWhatsapp = () => {
    const p = {
      id: product.id,
      name: product.name,
      price: product.discount ? discounted : product.price,
    };
    dispatch(addToWhatsappCart(p));
  };

  // Tilt 3D suave
  const onMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const rx = -((y - r.height / 2) / (r.height / 2)) * 8; // -8deg..8deg
    const ry = ((x - r.width / 2) / (r.width / 2)) * 8;
    el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
  };
  const onMouseLeave = () => {
    const el = cardRef.current;
    if (el) el.style.transform = "";
  };

  return (
    <Fragment>
      <article
        ref={cardRef}
        className={clsx("neo-card", spaceBottomClass)}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        {/* Glow border */}
        <span className="neo-glow" aria-hidden />

        {/* Media */}
        <div
          className="neo-media"
          role="button"
          onClick={() => setModalShow(true)}
        >
          <img
            className="neo-img default"
            src={mainImg}
            alt={product.name}
            loading="lazy"
            onError={onImgError}
          />

          {hoverImg && (
            <img
              className="neo-img hover"
              src={hoverImg}
              alt={product.name}
              loading="lazy"
              onError={onImgError}
            />
          )}

          {(product.discount || product.new) && (
            <div className="neo-badges">
              {product.discount ? (
                <span className="badge-off">-{product.discount}%</span>
              ) : null}
              {product.new ? <span className="badge-new">Nuevo</span> : null}
            </div>
          )}

          {/* Acciones flotantes */}
          <div className="neo-actions">
            <button
              className="btn-glow"
              onClick={(e) => (e.stopPropagation(), setModalShow(true))}
            >
              <i className="pe-7s-look" /> Ver
            </button>
            <button
              className="btn-glow"
              onClick={(e) => (e.stopPropagation(), handleAddToWhatsapp())}
            >
              <i className="pe-7s-chat" /> WhatsApp
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="neo-content">
          <h3 className="neo-title" title={product.name}>
            <span role="button" onClick={() => setModalShow(true)}>
              {product.name}
            </span>
          </h3>

          {product.rating && product.rating > 0 ? (
            <div className="neo-rating">
              <Rating ratingValue={product.rating} />
            </div>
          ) : (
            <div className="neo-rating placeholder" />
          )}

          <div className="neo-price">
            {finalDiscount !== null ? (
              <>
                <span className="price-current">
                  {symbol}
                  {finalDiscount}
                </span>
                <span className="price-old">
                  {symbol}
                  {final}
                </span>
              </>
            ) : (
              <span className="price-current">
                {symbol}
                {final}
              </span>
            )}
          </div>
        </div>
      </article>

      {/* (Opcional) — si sigues usando la vista en lista, mantenla; de lo contrario, puedes eliminarla */}
      {/* product modal */}
      <ProductModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        product={product}
        currency={currency}
        discountedPrice={discounted}
        finalProductPrice={final}
        finalDiscountedPrice={finalDiscount}
        wishlistItem={wishlistItem}
        compareItem={compareItem}
      />
    </Fragment>
  );
};

ProductGridListSingle.propTypes = {
  product: PropTypes.object.isRequired,
  currency: PropTypes.shape({
    currencySymbol: PropTypes.string,
    currencyRate: PropTypes.number,
  }),
  cartItem: PropTypes.object,
  wishlistItem: PropTypes.object,
  compareItem: PropTypes.object,
  spaceBottomClass: PropTypes.string,
};

export default ProductGridListSingle;
