import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import { addToCart } from "../../store/slices/cart-slice";
import { deleteFromCompare } from "../../store/slices/compare-slice";
import withAuth from "../../components/withAuth";
import RecargaModal from "../../wrappers/product/RecargaModal";

const Compare = () => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  const currency = useSelector((state) => state.currency);
  const { compareItems } = useSelector((state) => state.compare);
  const { cartItems } = useSelector((state) => state.cart);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recargaModalOpen, setRecargaModalOpen] = useState(false);

  const handleOpenModal = (item) => {
    setSelectedProduct(item);
    setRecargaModalOpen(true);
  };

  return (
    <Box>
      <SEO titleTemplate="Comparar" description="Página de comparación de productos" />
      <LayoutOne headerTop="visible">
        <Breadcrumb
          pages={[
            { label: "Inicio", path: "/" },
            { label: "Comparar", path: pathname },
          ]}
        />

        <Box sx={{ p: 3 }}>
          {compareItems && compareItems.length >= 1 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Info del Producto</TableCell>
                    {compareItems.map((item, idx) => (
                      <TableCell key={idx} align="center">
                        <IconButton
                          onClick={() => dispatch(deleteFromCompare(item.id))}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                        <Box
                          onClick={() => handleOpenModal(item)}
                          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                        >
                          <Box
                            component="img"
                            src={item.image?.[0] || "/imagenes/default.png"}
                            alt={item.name}
                            sx={{ width: 100, height: 100, objectFit: "contain", mb: 1 }}
                          />
                          <Typography>{item.name}</Typography>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Precio</TableCell>
                    {compareItems.map((item, idx) => {
                      const finalPrice = (item.price * currency.currencyRate).toFixed(2);
                      return (
                        <TableCell key={idx} align="center">
                          <Typography>
                            {currency.currencySymbol + finalPrice}
                          </Typography>
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  <TableRow>
                    <TableCell>Comisión por Servicio</TableCell>
                    {compareItems.map((item, idx) => (
                      <TableCell key={idx} align="center">
                        <Typography>
                          {item.comision != null ? `$${Number(item.comision).toFixed(2)} MXN` : "N/A"}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell>Vigencia</TableCell>
                    {compareItems.map((item, idx) => (
                      <TableCell key={idx} align="center">
                        <Typography>
                          {item.vigencia || "N/A"}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell>Descripción</TableCell>
                    {compareItems.map((item, idx) => (
                      <TableCell key={idx} align="center">
                        <Typography>
                          {item.descripcion || "N/A"}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell>Acciones</TableCell>
                    {compareItems.map((item, idx) => {
                      const cartItem = cartItems.find(ci => ci.id === item.id);
                      const isInCart = cartItem && cartItem.quantity > 0;
                      return (
                        <TableCell key={idx} align="center">
                          <Button
                            startIcon={<ShoppingCartIcon />}
                            variant="contained"
                            color="primary"
                            onClick={() => handleOpenModal(item)}
                          >
                            ¡Compra ya!
                          </Button>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box textAlign="center" mt={4}>
              <Typography variant="h6" gutterBottom>
                No hay productos para comparar.
              </Typography>
              <Button variant="outlined" component={Link} to="/shop-grid-standard">
                Agregar productos
              </Button>
            </Box>
          )}
        </Box>
      </LayoutOne>

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
    </Box>
  );
};

export default withAuth(Compare);
