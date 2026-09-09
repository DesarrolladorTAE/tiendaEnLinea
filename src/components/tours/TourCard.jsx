import React from "react";
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import ImageNotSupportedRoundedIcon from "@mui/icons-material/ImageNotSupportedRounded";

const money = (value) => value == null ? "Sin precio" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value));

export default function TourCard({ tour, onViewDepartures }) {
  const image = tour.primary_image?.image_url || tour.primaryImage?.image_url
    || tour.images?.find((item) => item.is_primary)?.image_url || tour.images?.[0]?.image_url;
  const active = tour.is_active === true || tour.is_active === 1 || tour.is_active === "1";
  const [imageFailed, setImageFailed] = React.useState(false);
  React.useEffect(() => setImageFailed(false), [image]);
  return <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 3, bgcolor: "#fff", color: "#171b20" }}>
    {image && !imageFailed ? <Box component="img" src={image} alt={tour.name} loading="lazy" onError={() => setImageFailed(true)} sx={{ width: "100%", height: 190, objectFit: "cover" }} />
      : <Box sx={{ height: 190, bgcolor: "#f1f3f5", display: "grid", placeItems: "center" }}><ImageNotSupportedRoundedIcon aria-label="Sin imagen" sx={{ fontSize: 48, color: "#757575" }} /></Box>}
    <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Typography variant="h6" fontWeight={800} sx={{ overflowWrap: "anywhere" }}>{tour.name}</Typography>
        <Chip size="small" label={active ? "Activo" : "Inactivo"} color={active ? "success" : "default"} />
      </Stack>
      <Typography variant="h5" fontWeight={900}>{money(tour.base_price)}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ flex: 1, overflowWrap: "anywhere" }}>{tour.short_description || "Sin descripción corta."}</Typography>
      <Button variant="contained" size="large" fullWidth onClick={() => onViewDepartures(tour)}>Ver salidas</Button>
    </CardContent>
  </Card>;
}
