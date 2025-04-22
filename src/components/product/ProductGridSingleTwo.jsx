import React, { Fragment, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getDiscountPrice } from "../../helpers/product";
import ProductModal from "./ProductModal";
import { addToCart } from "../../store/slices/cart-slice";
import { addToWishlist } from "../../store/slices/wishlist-slice";
import { addToCompare } from "../../store/slices/compare-slice";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Stack
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Grid from '@mui/material/Grid';


const ProductGridSingleTwo = ({
  product,
  currency,
  cartItem,
  wishlistItem,
  compareItem
}) => {
  const [modalShow, setModalShow] = useState(false);
  const discountedPrice = getDiscountPrice(product.price, product.discount);
  const finalProductPrice = +(product.price * currency.currencyRate).toFixed(2);
  const finalDiscountedPrice = +(
    discountedPrice * currency.currencyRate
  ).toFixed(2);
  const dispatch = useDispatch();

  return (
    <Fragment>
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          boxShadow: 3,
          bgcolor: "#fff",
          textAlign: "center",
          transition: "transform 0.3s",
          "&:hover": {
            transform: "scale(1.01)"
          },
        }}
      >
        <Link to={`/product/${product.id}`}>
          <Box
            sx={{
              width: "100%",
              height: 220,
              mx: "auto",
              mb: 2,
              overflow: "hidden",
              borderRadius: 3,
              backgroundColor: "#fff",
              border: "1px solid #eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: 1,
              p: 2 // Espacio interno para evitar que el logo se pegue a los bordes
            }}
          >
            <img
              src={product.image[0]}
              alt={product.name}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain"
              }}
            />
          </Box>

        </Link>

        {product.discount || product.new ? (
          <Stack direction="row" spacing={1} justifyContent="center" mb={1}>
            {product.discount ? (
              <Typography variant="caption" color="primary">
                -{product.discount}%
              </Typography>
            ) : null}
            {product.new ? (
              <Typography variant="caption" color="secondary">
                New
              </Typography>
            ) : null}
          </Stack>
        ) : null}

        <Typography variant="subtitle1" fontWeight="bold" noWrap>
          {product.name}
        </Typography>

        <Typography variant="body1" sx={{ mt: 1 }}>
          {discountedPrice !== null ? (
            <>
              <strong>{currency.currencySymbol + finalDiscountedPrice}</strong>{" "}
              <Typography
                component="span"
                variant="body2"
                sx={{ textDecoration: "line-through", color: "text.secondary", ml: 1 }}
              >
                {currency.currencySymbol + finalProductPrice}
              </Typography>
            </>
          ) : (
            <strong>{currency.currencySymbol + finalProductPrice}</strong>
          )}
        </Typography>

        <Stack direction="row" justifyContent="center" spacing={2} mt={2}>
          <Tooltip title="Agregar al carrito">
            <IconButton
              onClick={() => dispatch(addToCart(product))}
              disabled={cartItem !== undefined}
              color={cartItem ? "primary" : "default"}
            >
              <ShoppingCartIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Vista rápida">
            <IconButton onClick={() => setModalShow(true)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Agregar a comparar">
            <IconButton
              onClick={() => dispatch(addToCompare(product))}
              disabled={compareItem !== undefined}
              color={compareItem ? "primary" : "default"}
            >
              <CompareArrowsIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Favoritos">
            <IconButton
              onClick={() => dispatch(addToWishlist(product))}
              disabled={wishlistItem !== undefined}
              color={wishlistItem ? "secondary" : "default"}
            >
              <FavoriteBorderIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <ProductModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        product={product}
        currency={currency}
        discountedPrice={discountedPrice}
        finalProductPrice={finalProductPrice}
        finalDiscountedPrice={finalDiscountedPrice}
        wishlistItem={wishlistItem}
        compareItem={compareItem}
      />
    </Fragment>
  );
};

ProductGridSingleTwo.propTypes = {
  cartItem: PropTypes.shape({}),
  compareItem: PropTypes.shape({}),
  wishlistItem: PropTypes.shape({}),
  currency: PropTypes.shape({}),
  product: PropTypes.shape({}).isRequired
};

export default ProductGridSingleTwo;
