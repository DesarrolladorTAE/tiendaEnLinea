import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Zoom,
  useMediaQuery,
  useTheme
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import { deleteFromWishlist, deleteAllFromWishlist } from "../../store/slices/wishlist-slice";
import withAuth from "../../components/withAuth";
import RecargaModal from "../../wrappers/product/RecargaModal";

const categoryEmojis = {
  paquetes: "📦",
  datos: "📶",
  "tiempo aire": "📱",
  default: "🛍️"
};

const Wishlist = () => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const currency = useSelector((state) => state.currency);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { cartItems } = useSelector((state) => state.cart);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recargaModalOpen, setRecargaModalOpen] = useState(false);

  const handleOpenModal = (item) => {
    setSelectedProduct(item);
    setRecargaModalOpen(true);
  };

  const getCategoryChip = (cat) => {
    const key = cat?.toLowerCase() || "default";
    const emoji = categoryEmojis[key] || categoryEmojis.default;
    return <Chip label={`${emoji} ${cat}`} size="small" variant="outlined" color="info" sx={{ mt: 1 }} />;
  };

  return (
    <Box>
      <SEO titleTemplate="Favoritos" description="Página de favoritos" />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[{ label: "Inicio", path: "/" }, { label: "Favoritos", path: pathname }]}
        />

        <Box sx={{ p: 3 }}>
          {wishlistItems && wishlistItems.length >= 1 ? (
            <Zoom in>
              <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
                <Table size={isMobile ? "small" : "medium"}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="center">Nombre</TableCell>
                      <TableCell align="center">Precio</TableCell>
                      <TableCell align="center">Categoría</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                      <TableCell align="center">Eliminar</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {wishlistItems.map((item, idx) => {
                      const finalPrice = (item.price * currency.currencyRate).toFixed(2);
                      return (
                        <TableRow key={idx} hover>
                          <TableCell>
                            <Box
                              component="img"
                              src={item.image?.[0] || "/imagenes/default.png"}
                              alt={item.name}
                              sx={{ width: 80, height: 80, objectFit: "contain" }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography fontWeight="bold">{item.name}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography fontWeight="bold">
                              {currency.currencySymbol + finalPrice}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {getCategoryChip(item.category || "" )}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              startIcon={<ShoppingCartIcon />}
                              variant="contained"
                              color="success"
                              onClick={() => handleOpenModal(item)}
                              sx={{ borderRadius: 2 }}
                            >
                              ¡Compra ya!
                            </Button>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton onClick={() => dispatch(deleteFromWishlist(item.id))}>
                              <DeleteIcon color="error" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Zoom>
          ) : (
            <Box textAlign="center" mt={4}>
              <Typography variant="h2" component="div" fontSize={80}>📲</Typography>
              <Typography variant="h6" gutterBottom mt={2}>
                No tienes productos en favoritos.
              </Typography>
              <Button variant="outlined" component={Link} to="/shop-grid-right-sidebar">
                Agregar productos
              </Button>
            </Box>
          )}
        </Box>

        {wishlistItems.length > 0 && (
          <Box display="flex" flexDirection={isMobile ? "column" : "row"} justifyContent="space-between" mt={3} px={3} gap={2}>
            <Button component={Link} to="/shop-grid-right-sidebar" variant="outlined">
              Seguir comprando
            </Button>
            <Button color="error" variant="contained" onClick={() => dispatch(deleteAllFromWishlist())}>
              Vaciar lista
            </Button>
          </Box>
        )}

        {/* Modal de Recarga */}
        {selectedProduct && (
          <RecargaModal
            open={recargaModalOpen}
            onClose={() => setRecargaModalOpen(false)}
            producto={selectedProduct}
            carrier={{
              Nombre: selectedProduct.name,
              Logotipo: selectedProduct.image?.[0] || "/imagenes/default.png",
              Categoria: selectedProduct.category || "Paquete"
            }}
          />
        )}
      </LayoutOne>
    </Box>
  );
};

export default withAuth(Wishlist);
