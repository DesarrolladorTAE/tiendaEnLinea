import React, { Fragment, useState } from "react";
import PropTypes from "prop-types";
import { Modal } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Rating from "./sub-components/ProductRating";
import { addToCart } from "../../store/slices/cart-slice";
import { addToWishlist } from "../../store/slices/wishlist-slice";
import { addToCompare } from "../../store/slices/compare-slice";

const ProductModal = ({ product, currency, show, onHide, wishlistItem, compareItem }) => {
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.cart);
  
  // Asegurar que `Monto` sea numérico para evitar el error de `.toFixed()`
  const finalProductPrice = parseFloat(product.Monto || 0).toFixed(2);

  return (
    <Modal show={show} onHide={onHide} className="product-quickview-modal-wrapper">
      <Modal.Header closeButton></Modal.Header>

      <div className="modal-body">
        <div className="row">
          <div className="col-md-5 col-sm-12 col-xs-12">
            <div className="product-large-image-wrapper">
              <img 
                src={product.imagen || "/assets/img/product/default.jpg"} 
                className="img-fluid" 
                alt={product.Nombre || "Producto"} 
              />
            </div>
          </div>

          <div className="col-md-7 col-sm-12 col-xs-12">
            <div className="product-details-content quickview-content">
              <h2>{product.Nombre || product.Codigo}</h2>
              <div className="product-details-price">
                <span>{currency.currencySymbol}{finalProductPrice}</span>
              </div>
              {product.rating && product.rating > 0 && (
                <div className="pro-details-rating-wrap">
                  <div className="pro-details-rating">
                    <Rating ratingValue={product.rating} />
                  </div>
                </div>
              )}
              <p>{product.Descripcion}</p>
              <div className="pro-details-quality">
                <div className="pro-details-cart btn-hover">
                  <button onClick={() => dispatch(addToCart(product))}>
                    Agregar al carrito
                  </button>
                </div>
                <div className="pro-details-wishlist">
                  <button
                    className={wishlistItem ? "active" : ""}
                    disabled={wishlistItem}
                    title="Añadir a favoritos"
                    onClick={() => dispatch(addToWishlist(product))}
                  >
                    <i className="pe-7s-like" />
                  </button>
                </div>
                <div className="pro-details-compare">
                  <button
                    className={compareItem ? "active" : ""}
                    disabled={compareItem}
                    title="Comparar"
                    onClick={() => dispatch(addToCompare(product))}
                  >
                    <i className="pe-7s-shuffle" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

ProductModal.propTypes = {
  currency: PropTypes.shape({}),
  product: PropTypes.shape({}),
  show: PropTypes.bool,
  onHide: PropTypes.func,
  wishlistItem: PropTypes.shape({}),
  compareItem: PropTypes.shape({})
};

export default ProductModal;
