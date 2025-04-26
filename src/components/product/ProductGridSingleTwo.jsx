import React, { Fragment, useState } from "react";
import PropTypes from "prop-types";
// import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import ProductModal from "./ProductModal";
import RecargaModal from "../../wrappers/product/RecargaModal"; // ⬅️ Importación del modal nuevo
// import { addToCart } from "../../store/slices/cart-slice";
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

const ProductGridSingleTwo = ({
  product,
  currency,
  cartItem,
  wishlistItem,
  compareItem
}) => {
  const [modalShow, setModalShow] = useState(false); // modal de vista rápida
  const [recargaModalOpen, setRecargaModalOpen] = useState(false); // modal de recarga
  const finalProductPrice = +(product.price * currency.currencyRate).toFixed(2);
  const dispatch = useDispatch();

  const carrier = {
    Nombre: product.name,
    Logotipo: product.image[0],
    Categoria: product.category
  };

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
            p: 2,
            cursor: "pointer"
          }}
          onClick={() => setRecargaModalOpen(true)} // ⬅️ click en logo abre modal de recarga
        >
          <img
            src={product.image[0]}
            alt={product.name}
            style={{
              width: "120px",
              height: "120px",
              objectFit: "contain"
            }}
          />
        </Box>

        {product.category && (
          <Typography
            variant="body2"
            fontWeight="bold"
            sx={{
              color:
                product.category.toLowerCase() === "paquetes"
                  ? "red"
                  : "blue",
              mb: 1
            }}
          >
            {product.category}
          </Typography>
        )}

        <Typography variant="subtitle1" fontWeight="bold" noWrap>
          {product.name}
        </Typography>

        <Typography variant="body1" sx={{ mt: 1 }}>
          <strong>{currency.currencySymbol + finalProductPrice}</strong>
        </Typography>

        <Stack direction="row" justifyContent="center" spacing={2} mt={2}>
          <Tooltip title="Recargar">
            <IconButton onClick={() => setRecargaModalOpen(true)}>
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
              onClick={() => {
                const productoFormateado = {
                  ...product,
                  descripcion: product.descripcion || "",
                  vigencia: product.vigencia || "N/A",
                  comision: Number(product.comision || 0)
                };
                dispatch(addToCompare(productoFormateado));
              }}
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

      {/* Modal de vista rápida */}
      <ProductModal
        open={modalShow}
        onClose={() => setModalShow(false)}
        product={product}
      />

      {/* Modal de recarga */}
      <RecargaModal
        open={recargaModalOpen}
        onClose={() => setRecargaModalOpen(false)}
        producto={product}
        carrier={carrier}
      />
    </Fragment>
  );
};

ProductGridSingleTwo.propTypes = {
  cartItem: PropTypes.shape({}),
  compareItem: PropTypes.shape({}),
  wishlistItem: PropTypes.shape({}),
  currency: PropTypes.shape({}),
  product: PropTypes.shape({
    id: PropTypes.any,
    name: PropTypes.string,
    price: PropTypes.number,
    image: PropTypes.array,
    category: PropTypes.string
  }).isRequired
};

export default ProductGridSingleTwo;
