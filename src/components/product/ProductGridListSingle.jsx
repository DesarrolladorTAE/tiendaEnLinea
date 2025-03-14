import PropTypes from "prop-types";
import React, { Fragment, useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import clsx from "clsx";
import Rating from "./sub-components/ProductRating";
import ProductModal from "./ProductModal";
import { addToCart } from "../../store/slices/cart-slice";
import { addToWishlist } from "../../store/slices/wishlist-slice";
import { addToCompare } from "../../store/slices/compare-slice";

const ProductGridListSingle = ({
  product,
  currency,
  cartItem,
  wishlistItem,
  compareItem,
  spaceBottomClass
}) => {
  const [modalShow, setModalShow] = useState(false);
  const dispatch = useDispatch();

  const productImage = product.imagen ? product.imagen : "/assets/img/product/default.jpg";
  const finalProductPrice = parseFloat(product.Monto || 0).toFixed(2);

  return (
    <Fragment>
      <div className={clsx("product-wrap", spaceBottomClass)}>
        <div className="product-img">
          <Link to={"/product/" + product.id}>
            <img className="default-img" src={productImage} alt="" />
            <img className="hover-img" src={productImage} alt="" />
          </Link>

          <div className="product-action">
            <div className="pro-same-action pro-wishlist">
              <button
                className={wishlistItem ? "active" : ""}
                disabled={wishlistItem}
                title={wishlistItem ? "Agregado a favoritos" : "Agregar a favoritos"}
                onClick={() => dispatch(addToWishlist(product))}
              >
                <i className="pe-7s-like" />
              </button>
            </div>

            <div className="pro-same-action pro-cart">
              <button
                onClick={() => dispatch(addToCart(product))}
                className={cartItem ? "active" : ""}
                disabled={cartItem}
                title={cartItem ? "Agregado al carrito" : "Agregar al carrito"}
              >
                <i className="pe-7s-cart" /> {cartItem ? "Agregado" : "Add To Cart"}
              </button>
            </div>

            <div className="pro-same-action pro-quickview">
              <button onClick={() => setModalShow(true)} title="Ver detalle">
                <i className="pe-7s-look" />
              </button>
            </div>
          </div>
        </div>
        <div className="product-content text-center">
          <h3>
            <Link to={"/product/" + product.id}>{product.Nombre || product.Codigo}</Link>
          </h3>
          <div className="product-price">
            <span>${finalProductPrice}</span>
          </div>
        </div>
      </div>

      <ProductModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        product={product}
        currency={currency}
        discountedPrice={null}
        finalProductPrice={finalProductPrice}
        finalDiscountedPrice={finalProductPrice}
        wishlistItem={wishlistItem}
        compareItem={compareItem}
      />
    </Fragment>
  );
};

ProductGridListSingle.propTypes = {
  cartItem: PropTypes.shape({}),
  compareItem: PropTypes.shape({}),
  currency: PropTypes.shape({}),
  product: PropTypes.shape({}),
  spaceBottomClass: PropTypes.string,
  wishlistItem: PropTypes.shape({})
};

export default ProductGridListSingle;
