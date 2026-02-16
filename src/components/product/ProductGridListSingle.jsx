// ProductGridListSingle.jsx
import PropTypes from "prop-types";
import React, { Fragment, useRef, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import clsx from "clsx";
import { getDiscountPrice } from "../../helpers/product";
import Rating from "./sub-components/ProductRating";
import ProductModal from "./ProductModal";
import { addToWhatsappCart } from "../../store/slices/whatsappCartSlice";

const DEFAULT_IMG = "/assets/img/defaultproduct.png";

function pickImages(imgField) {
  if (Array.isArray(imgField)) return imgField.filter(Boolean);
  if (typeof imgField === "string" && imgField.trim() !== "") return [imgField.trim()];
  return [];
}

function onImgError(e) {
  if (e.currentTarget.dataset.fallback !== "1") {
    e.currentTarget.src = DEFAULT_IMG;
    e.currentTarget.dataset.fallback = "1";
  }
}

function money2(n) {
  const x = Number(n) || 0;
  return +x.toFixed(2);
}

const ProductGridListSingle = ({
  product,
  currency,
  spaceBottomClass,
  wishlistItem,
  compareItem,
}) => {
  const dispatch = useDispatch();
  const cardRef = useRef(null);
  const [modalShow, setModalShow] = useState(false);

  // ✅ flags del nuevo payload
  const hasVariants = Boolean(product?.has_variants) || (Array.isArray(product?.variants) && product.variants.length > 0);
  const useWh = Boolean(product?.use_warehouse_inventory);

  // Moneda segura
  const symbol = currency?.currencySymbol ?? "$";
  const rate = Number(currency?.currencyRate ?? 1);

  // Precios
  const discounted = getDiscountPrice(product.price, product.discount);
  const final = money2((Number(product.price) || 0) * rate);
  const finalDiscount = discounted !== null ? money2((Number(discounted) || 0) * rate) : null;

  // Imágenes
  const images = pickImages(product.image);
  const mainImg = images[0] || DEFAULT_IMG;
  const hoverImg = images[1] || null;

  // ✅ agregar simple directo solo si NO variantes y NO multi almacén
  const canQuickAdd = !hasVariants && !useWh;

  const handleQuickAdd = () => {
    if (!canQuickAdd) {
      setModalShow(true);
      return;
    }

    const priceToUse = product.discount ? (discounted ?? product.price) : product.price;

    dispatch(
      addToWhatsappCart({
        cart_key: `p${product.id}`,
        product_id: product.id,
        variant_id: null,
        warehouse_id: null,
        warehouse_name: null,
        name: product.name,
        display_name: product.name,
        price: Number(priceToUse) || 0,
        qty: 1,
      })
    );
  };

  // ✅ esto lo llama el modal (ya con variante/almacén elegidos)
  const handleWhatsappFromModal = (payload) => {
    dispatch(addToWhatsappCart(payload));
    setModalShow(false);
  };

  // Tilt 3D suave
  const onMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const rx = -((y - r.height / 2) / (r.height / 2)) * 8;
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
        className={clsx("neo-card is-compact", spaceBottomClass)}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <span className="neo-glow" aria-hidden />

        {/* Media */}
        <div className="neo-media" role="button" onClick={() => setModalShow(true)}>
          <img className="neo-img default" src={mainImg} alt={product.name} loading="lazy" onError={onImgError} />
          {hoverImg && (
            <img className="neo-img hover" src={hoverImg} alt={product.name} loading="lazy" onError={onImgError} />
          )}

          {(product.discount || product.new) && (
            <div className="neo-badges">
              {product.discount ? <span className="badge-off">-{product.discount}%</span> : null}
              {product.new ? <span className="badge-new">Nuevo</span> : null}
            </div>
          )}

          <div className="neo-actions">
            <button className="btn-glow" onClick={(e) => (e.stopPropagation(), setModalShow(true))}>
              <i className="pe-7s-look" /> Ver
            </button>

            <button
              className="btn-glow"
              onClick={(e) => {
                e.stopPropagation();
                handleQuickAdd();
              }}
            >
              <i className="pe-7s-cart" /> {canQuickAdd ? "Añadir" : "Seleccionar"}
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
            {hasVariants ? (
              <span className="price-current">
                {symbol} Según variante
              </span>
            ) : finalDiscount !== null ? (
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

      <ProductModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        images={images}
        product={product}
        currency={currency}
        discountedPrice={discounted}
        finalProductPrice={final}
        finalDiscountedPrice={finalDiscount}
        onWhatsapp={handleWhatsappFromModal}
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
  wishlistItem: PropTypes.object,
  compareItem: PropTypes.object,
  spaceBottomClass: PropTypes.string,
};

export default ProductGridListSingle;
