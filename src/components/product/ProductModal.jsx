import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  Button,
  Divider
} from "@mui/material";
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import BadgeIcon from '@mui/icons-material/Badge';

const ProductModal = ({ open, onClose, product }) => {
  if (!product) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
        {product.Nombre || "🔥 Populares 🔥"}
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>

          {/* Carrier Name */}
          {product.name && (
            <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
              {product.name}
            </Typography>
          )}


          {/* Logo Image */}
          <Box
            component="img"
            src={product.Logotipo || product.image?.[0] || ""}
            alt={product.Nombre || product.Carrier || "Logo"}
            sx={{
              width: 120,
              height: 120,
              objectFit: "contain",
              mb: 1
            }}
          />

          {/* Monto */}
          <Box width="100%" display="flex" alignItems="center" gap={1}>
            <MonetizationOnIcon color="primary" />
            <Typography fontWeight="bold">Monto:</Typography>
            <Typography ml="auto">${parseFloat(product.Monto || product.price || 0).toFixed(2)}</Typography>
          </Box>

          {/* Comisión */}
          <Box width="100%" display="flex" alignItems="center" gap={1}>
            <InfoIcon color="action" />
            <Typography fontWeight="bold">Comisión por Servicio:</Typography>
            <Typography ml="auto">${parseFloat(product.Comision || 0).toFixed(2)} MXN</Typography>
          </Box>

          {/* Vigencia */}
          <Box width="100%" display="flex" alignItems="center" gap={1}>
            <AccessTimeIcon color="secondary" />
            <Typography fontWeight="bold">Vigencia:</Typography>
            <Typography ml="auto" color={product.vigencia ? "green" : "red"}>
              {product.vigencia || "N/A"}
            </Typography>
          </Box>

          {/* Descripción */}
          <Box width="100%" mt={2}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <DescriptionIcon color="disabled" />
              <Typography variant="subtitle1" fontWeight="bold">Descripción:</Typography>
            </Box>
            <Typography textAlign="justify" sx={{ fontSize: "0.95rem" }}>
              {product.Descripcion || product.descripcion || "Sin descripción disponible."}
            </Typography>
          </Box>

        </Box>
      </DialogContent>
    </Dialog>

  );
};

ProductModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.shape({
    Nombre: PropTypes.string,
    Carrier: PropTypes.string,
    Monto: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Comision: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Vigencia: PropTypes.string,
    Descripcion: PropTypes.string,
    Logotipo: PropTypes.string,
    image: PropTypes.array,
    price: PropTypes.number,
    descripcion: PropTypes.string,
    vigencia: PropTypes.string
  })
};

export default ProductModal;
