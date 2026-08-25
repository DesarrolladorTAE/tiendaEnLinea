import PropTypes from "prop-types";
import React, { Fragment, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import clsx from "clsx";
import { getDiscountPrice } from "../../helpers/product";
import Rating from "./sub-components/ProductRating";
import ProductModal from "./ProductModal";
import { addToWhatsappCart } from "../../store/slices/whatsappCartSlice";

const DEFAULT_IMG = "/assets/img/defaultproduct.png";

function pickImages(imgField) {
  if (Array.isArray(imgField)) return imgField.filter(Boolean);
  if (typeof imgField === "string" && imgField.trim()) return [imgField.trim()];
  return [];
}

function onImgError(e) {
  if (e.currentTarget.dataset.fallback !== "1") {
    e.currentTarget.src = DEFAULT_IMG;
    e.currentTarget.dataset.fallback = "1";
  }
}

function money2(n) {
  return Number((Number(n) || 0).toFixed(2));
}

function getVariantLabel(variant, fallback) {
  if (fallback) return String(fallback).toUpperCase();
  const attrs = Array.isArray(variant?.variant_attributes) ? variant.variant_attributes : Array.isArray(variant?.attributes) ? variant.attributes : [];
  const sizeAttribute = attrs.find((attr) => {
    const name = String(attr?.name ?? "").toLowerCase();
    return name === "talla" || name === "size" || name.includes("talla") || name.includes("size");
  });
  const sizeValue = String(sizeAttribute?.value ?? "").trim();
  if (sizeValue) return sizeValue.toUpperCase();
  const name = String(variant?.name ?? "").trim();
  if (name) return name.toUpperCase();
  return `OPCIÓN ${variant?.id ?? ""}`;
}

function getVariantImage(variant) {
  const value = variant?.image_url ?? variant?.image ?? null;
  if (Array.isArray(value)) return value.find(Boolean) ?? null;
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

const ProductGridListSingle = ({
  product, currency, storeId, spaceBottomClass, wishlistItem, compareItem,
  variantCard = false, variantGroupCard = false, matchingVariants = [],
  selectedVariant = null, requestedQty = 1, availableStock = null, variantSize = null,
  enableEffects = false,
  storefrontTemplate = "negocio",
}) => {
  const dispatch = useDispatch();
  const cardRef = useRef(null);
  const [modalShow, setModalShow] = useState(false);

  const resolvedStoreId = Number(storeId ?? product?.store_id ?? product?.store?.id ?? product?.storeId);
  const isStore464 = resolvedStoreId === 464;
  const hasVariants = Boolean(product?.has_variants) || (Array.isArray(product?.variants) && product.variants.length > 0);
  const useWh = Boolean(product?.use_warehouse_inventory);
  const symbol = currency?.currencySymbol ?? "$";
  const rate = Number(currency?.currencyRate ?? 1);

  const normalDiscounted = getDiscountPrice(product.price, product.discount);
  const normalPrice = money2((Number(product.price) || 0) * rate);
  const normalDiscountPrice = normalDiscounted !== null ? money2((Number(normalDiscounted) || 0) * rate) : null;

  const variantBasePrice = Number(selectedVariant?.price ?? product?.price ?? 0);
  const variantDiscounted = variantCard ? getDiscountPrice(variantBasePrice, product?.discount) : null;
  const displayedVariantPrice = money2((variantDiscounted !== null ? variantDiscounted : variantBasePrice) * rate);
  const displayedVariantOldPrice = variantDiscounted !== null ? money2(variantBasePrice * rate) : null;

  const safeMatchingVariants = Array.isArray(matchingVariants) ? matchingVariants.filter((item) => item?.variant?.id) : [];
  const totalRequestedQty = safeMatchingVariants.reduce((total, item) => total + (Number(item?.requestedQty) || 0), 0);
  const hasGroupWholesalePrice = variantGroupCard && isStore464 && totalRequestedQty >= 7;

  const getGroupVariantUnitPrice = (variant) => {
    if (hasGroupWholesalePrice) return 320;
    const base = Number(variant?.price ?? product?.price ?? 0);
    const discounted = getDiscountPrice(base, product?.discount);
    return money2((discounted !== null ? discounted : base) * rate);
  };

  const groupTotal = safeMatchingVariants.reduce((total, item) => total + getGroupVariantUnitPrice(item.variant) * (Number(item?.requestedQty) || 0), 0);

  const productImages = pickImages(product.image);
  const groupVariantImage = safeMatchingVariants.map((x) => getVariantImage(x.variant)).find(Boolean);
  const variantImage = getVariantImage(selectedVariant) || groupVariantImage;
  const images = (variantCard || variantGroupCard) && variantImage ? [variantImage, ...productImages.filter((image) => image !== variantImage)] : productImages;
  const mainImg = images[0] || DEFAULT_IMG;
  const hoverImg = images[1] || null;

  const sizeLabel = getVariantLabel(selectedVariant, variantSize);
  const variantAttributes = Array.isArray(selectedVariant?.variant_attributes) ? selectedVariant.variant_attributes : Array.isArray(selectedVariant?.attributes) ? selectedVariant.attributes : [];
  const visibleVariantAttributes = variantAttributes.map((attribute) => ({ name: String(attribute?.name ?? "").trim(), value: String(attribute?.value ?? "").trim() })).filter((attribute) => {
    if (!attribute.name && !attribute.value) return false;
    const name = attribute.name.toLowerCase();
    return !(name === "talla" || name === "size" || name.includes("talla") || name.includes("size"));
  });

  const safeRequestedQty = Math.max(1, Number(requestedQty) || 1);
  const hasWholesalePrice = variantCard && isStore464 && safeRequestedQty >= 7;
  const variantCartPrice = hasWholesalePrice ? 320 : displayedVariantPrice;
  const canQuickAdd = variantCard || (!hasVariants && !useWh);

  const openModal = () => {
    if (variantCard || variantGroupCard) return;
    setModalShow(true);
  };

  const handleAddVariantGroup = () => {
    safeMatchingVariants.forEach((item) => {
      const variant = item.variant;
      const qty = Math.max(1, Number(item.requestedQty) || 1);
      const stock = Number(item.stock) || 0;
      const size = String(item.size ?? getVariantLabel(variant)).toUpperCase();
      const attrs = Array.isArray(variant?.variant_attributes) ? variant.variant_attributes : Array.isArray(variant?.attributes) ? variant.attributes : [];
      dispatch(addToWhatsappCart({
        cart_key: `p${product.id}-o${variant.id}`,
        product_id: Number(product.id),
        variant_id: Number(variant.id),
        warehouse_id: null,
        warehouse_name: null,
        name: product.name,
        display_name: `${product.name} — Talla ${size}`,
        price: getGroupVariantUnitPrice(variant),
        qty,
        meta: {
          discount: Number(product?.discount) || 0,
          option_label: size,
          option_attributes: attrs,
          requested_qty: qty,
          available_stock: stock,
          wholesale_price: hasGroupWholesalePrice,
          group_total_requested: totalRequestedQty,
        },
      }));
    });
  };

  const handleQuickAdd = () => {
    if (variantCard && selectedVariant) {
      dispatch(addToWhatsappCart({
        cart_key: `p${product.id}-o${selectedVariant.id}`,
        product_id: Number(product.id),
        variant_id: Number(selectedVariant.id),
        warehouse_id: null,
        warehouse_name: null,
        name: product.name,
        display_name: `${product.name} — Talla ${sizeLabel}`,
        price: variantCartPrice,
        qty: safeRequestedQty,
        meta: {
          discount: Number(product?.discount) || 0,
          option_label: sizeLabel,
          option_attributes: variantAttributes,
          requested_qty: safeRequestedQty,
          available_stock: Number(availableStock) || 0,
          wholesale_price: hasWholesalePrice,
        },
      }));
      return;
    }

    if (!canQuickAdd) {
      setModalShow(true);
      return;
    }

    const priceToUse = product.discount ? (normalDiscounted ?? product.price) : product.price;
    dispatch(addToWhatsappCart({
      cart_key: `p${product.id}`,
      product_id: product.id,
      variant_id: null,
      warehouse_id: null,
      warehouse_name: null,
      name: product.name,
      display_name: product.name,
      price: Number(priceToUse) || 0,
      qty: 1,
    }));
  };

  const handleWhatsappFromModal = (payload) => {
    dispatch(addToWhatsappCart(payload));
    setModalShow(false);
  };

  const onMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = -((y - rect.height / 2) / (rect.height / 2)) * 8;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 8;
    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
  };

  const onMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = "";
  };

  return (
    <Fragment>
      <article ref={cardRef} data-product-template={storefrontTemplate} className={clsx("neo-card sf-product-card is-compact", `sf-product-card--${storefrontTemplate}`, { "neo-variant-card sf-product-card--variant": variantCard || variantGroupCard }, spaceBottomClass)} onMouseMove={enableEffects ? onMouseMove : undefined} onMouseLeave={enableEffects ? onMouseLeave : undefined}>
        <span className="neo-glow" aria-hidden />
        <div className="neo-media" role={variantCard || variantGroupCard ? undefined : "button"} onClick={openModal} style={{ cursor: variantCard || variantGroupCard ? "default" : "pointer" }}>
          <img className="neo-img default" src={mainImg} alt={product.name} loading="lazy" onError={onImgError} />
          {hoverImg && <img className="neo-img hover" src={hoverImg} alt={product.name} loading="lazy" onError={onImgError} />}
          {(product.discount || product.new) && <div className="neo-badges">{product.discount ? <span className="badge-off">-{product.discount}%</span> : null}{product.new ? <span className="badge-new">Nuevo</span> : null}</div>}
          {variantGroupCard && <div style={{ position: "absolute", top: 12, right: 12, zIndex: 3, padding: "6px 12px", borderRadius: 999, color: "#0b0e12", background: "#76e0ff", fontSize: 12, fontWeight: 950 }}>{totalRequestedQty} piezas</div>}
          {variantCard && <div style={{ position: "absolute", top: 12, right: 12, zIndex: 3, padding: "6px 12px", borderRadius: 999, color: "#0b0e12", background: "#76e0ff", fontSize: 13, fontWeight: 950 }}>Talla {sizeLabel}</div>}
          {!variantCard && !variantGroupCard && <div className="neo-actions">
            <button type="button" className="btn-glow" onClick={(e) => { e.stopPropagation(); setModalShow(true); }}><i className="pe-7s-look" /> Ver</button>
            <button type="button" className="btn-glow" onClick={(e) => { e.stopPropagation(); handleQuickAdd(); }}><i className="pe-7s-cart" /> {canQuickAdd ? "Añadir" : "Seleccionar"}</button>
          </div>}
        </div>

        <div className="neo-content">
          <h3 className="neo-title" title={product.name}><span role={variantCard || variantGroupCard ? undefined : "button"} onClick={openModal}>{product.name}</span></h3>

          {variantGroupCard ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 7, margin: "9px 0" }}>
              {safeMatchingVariants.map((item) => {
                const variant = item.variant;
                const size = String(item.size ?? getVariantLabel(variant)).toUpperCase();
                const qty = Number(item.requestedQty) || 0;
                const stock = Number(item.stock) || 0;
                return (
                  <div key={`match-${variant.id}`} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 7, padding: "7px 8px", borderRadius: 9, background: "rgba(255,255,255,.055)", border: "1px solid rgba(255,255,255,.10)" }}>
                    <span style={{ minWidth: 38, padding: "4px 7px", borderRadius: 999, color: "#76e0ff", background: "rgba(118,224,255,.10)", border: "1px solid rgba(118,224,255,.28)", fontSize: 10, fontWeight: 950, textAlign: "center" }}>{size}</span>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,.85)" }}>Solicita: {qty} <span style={{ color: "#22c55e" }}>• Stock: {stock}</span></div>
                    <span style={{ color: "#76e0ff", fontSize: 10, fontWeight: 950 }}>{symbol}{money2(getGroupVariantUnitPrice(variant))}</span>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 9px", borderRadius: 9, background: "rgba(118,224,255,.08)", border: "1px solid rgba(118,224,255,.20)", fontSize: 11, fontWeight: 900 }}><span>Total solicitado</span><strong>{totalRequestedQty} piezas</strong></div>
            </div>
          ) : variantCard ? (
            <>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0" }}>
                <span style={{ padding: "5px 9px", borderRadius: 999, color: "#76e0ff", background: "rgba(118,224,255,.10)", border: "1px solid rgba(118,224,255,.28)", fontSize: 11, fontWeight: 900 }}>Talla: {sizeLabel}</span>
                <span style={{ padding: "5px 9px", borderRadius: 999, color: "#fff", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", fontSize: 11, fontWeight: 900 }}>Solicita: {safeRequestedQty}</span>
                <span style={{ padding: "5px 9px", borderRadius: 999, color: "#22c55e", background: "rgba(34,197,94,.10)", border: "1px solid rgba(34,197,94,.25)", fontSize: 11, fontWeight: 900 }}>Existencia: {Number(availableStock) || 0}</span>
              </div>
              {selectedVariant?.sku && <div style={{ marginBottom: 7, color: "rgba(255,255,255,.68)", fontSize: 11 }}><strong style={{ color: "#fff" }}>SKU:</strong> {selectedVariant.sku}</div>}
              {visibleVariantAttributes.length > 0 && <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>{visibleVariantAttributes.slice(0, 4).map((attribute, index) => <span key={`${attribute.name}-${index}`} style={{ padding: "4px 7px", borderRadius: 7, color: "rgba(255,255,255,.82)", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.10)", fontSize: 10, fontWeight: 800 }}>{attribute.name}{attribute.value ? `: ${attribute.value}` : ""}</span>)}</div>}
            </>
          ) : product.rating && product.rating > 0 ? <div className="neo-rating"><Rating ratingValue={product.rating} /></div> : <div className="neo-rating placeholder" />}

          <div className="neo-price">
            {variantGroupCard ? <><span className="price-current">{symbol}{money2(groupTotal)}</span><span style={{ marginLeft: 8, fontSize: 10, opacity: .65 }}>Total</span></>
              : variantCard ? <><span className="price-current">{symbol}{money2(variantCartPrice)}</span>{hasWholesalePrice ? <span className="price-old">{symbol}{displayedVariantPrice}</span> : displayedVariantOldPrice !== null ? <span className="price-old">{symbol}{displayedVariantOldPrice}</span> : null}</>
                : hasVariants ? <span className="price-current">{symbol} Según variante</span>
                  : normalDiscountPrice !== null ? <><span className="price-current">{symbol}{normalDiscountPrice}</span><span className="price-old">{symbol}{normalPrice}</span></>
                    : <span className="price-current">{symbol}{normalPrice}</span>}
          </div>

          {variantGroupCard && isStore464 && <>
            <div style={{ marginTop: 8, padding: "7px 8px", borderRadius: 9, color: "#76e0ff", background: "rgba(118,224,255,.08)", border: "1px solid rgba(118,224,255,.20)", fontSize: 10, fontWeight: 800 }}>1 pieza incluye playera + shorts</div>
            <div style={{ marginTop: 6, padding: "7px 8px", borderRadius: 9, color: hasGroupWholesalePrice ? "#22c55e" : "#76e0ff", background: hasGroupWholesalePrice ? "rgba(34,197,94,.10)" : "rgba(118,224,255,.08)", border: hasGroupWholesalePrice ? "1px solid rgba(34,197,94,.25)" : "1px solid rgba(118,224,255,.20)", fontSize: 10, lineHeight: 1.4, fontWeight: 800 }}>{hasGroupWholesalePrice ? `✓ Mayoreo aplicado: ${symbol}320.00 por pieza` : `Desde 7 piezas: ${symbol}320.00 por pieza`}<br />Playera, shorts, nombre, número y calcetas</div>
          </>}

          {variantCard && isStore464 && <>
            <div style={{ marginTop: 9, padding: "7px 8px", borderRadius: 9, color: "#76e0ff", background: "rgba(118,224,255,.08)", border: "1px solid rgba(118,224,255,.20)", fontSize: 10, fontWeight: 800 }}>1 pieza incluye playera + shorts</div>
            <div style={{ marginTop: 6, padding: "7px 8px", borderRadius: 9, color: hasWholesalePrice ? "#22c55e" : "#76e0ff", background: hasWholesalePrice ? "rgba(34,197,94,.10)" : "rgba(118,224,255,.08)", border: hasWholesalePrice ? "1px solid rgba(34,197,94,.25)" : "1px solid rgba(118,224,255,.20)", fontSize: 10, lineHeight: 1.35, fontWeight: 800 }}>Desde 7 piezas: {symbol}320.00<br />Playera, shorts, nombre, número y calcetas</div>
          </>}

          {variantGroupCard && <button type="button" onClick={handleAddVariantGroup} style={{ display: "flex", width: "100%", minHeight: 42, alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, padding: "9px 8px", border: 0, borderRadius: 10, color: "#0b0e12", background: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 950 }}><i className="pe-7s-cart" /> Agregar {totalRequestedQty} piezas</button>}

          {variantCard && <button type="button" onClick={handleQuickAdd} style={{ display: "flex", width: "100%", minHeight: 40, alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, padding: "9px 8px", border: 0, borderRadius: 10, color: "#0b0e12", background: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 950 }}><i className="pe-7s-cart" /> Agregar {safeRequestedQty}</button>}
        </div>
      </article>

      {!variantCard && !variantGroupCard && <ProductModal show={modalShow} onHide={() => setModalShow(false)} images={images} product={product} currency={currency} discountedPrice={normalDiscounted} finalProductPrice={normalPrice} finalDiscountedPrice={normalDiscountPrice} onWhatsapp={handleWhatsappFromModal} wishlistItem={wishlistItem} compareItem={compareItem} />}
    </Fragment>
  );
};

ProductGridListSingle.propTypes = {
  product: PropTypes.object.isRequired,
  currency: PropTypes.shape({ currencySymbol: PropTypes.string, currencyRate: PropTypes.number }),
  wishlistItem: PropTypes.object,
  compareItem: PropTypes.object,
  spaceBottomClass: PropTypes.string,
  variantCard: PropTypes.bool,
  variantGroupCard: PropTypes.bool,
  matchingVariants: PropTypes.array,
  selectedVariant: PropTypes.object,
  requestedQty: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  availableStock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  variantSize: PropTypes.string,
  storeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  enableEffects: PropTypes.bool,
  storefrontTemplate: PropTypes.string,
};

export default ProductGridListSingle;
