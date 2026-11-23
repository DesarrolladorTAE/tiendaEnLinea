// src/components/admin/ProductPagination.jsx
import React from "react";
import { Box, Pagination } from "@mui/material";

const ProductPagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <Box display="flex" justifyContent="center" mt={3}>
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={(e, value) => onPageChange(value)}
        color="primary"
        sx={{
          "& .MuiPaginationItem-root": {
            color: "#fff", // texto en blanco
            borderColor: "#fff", // borde blanco
          },
          "& .Mui-selected": {
            backgroundColor: "#2196f3", // fondo azul al seleccionar
            color: "#fff !important", // texto blanco al seleccionar
          },
        }}
      />
    </Box>
  );
};

export default ProductPagination;
