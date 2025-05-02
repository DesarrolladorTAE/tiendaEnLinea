import React from "react";
import { Grid, Typography, Container } from "@mui/material";
import ProductCard from "./ProductCard"; // ajusta si tu ruta es distinta

export default function ProductsGrid({ products, ...cardProps }) {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Productos
      </Typography>

      <Grid container spacing={2} alignItems="stretch">
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <ProductCard product={product} {...cardProps} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
