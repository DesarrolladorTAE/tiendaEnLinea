import React, { useEffect, useState } from "react";
import { Alert, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAdminUi } from "../../context/AdminUiContext";
import { useTienda } from "../../context/TiendaContext";
import axiosClient from "../../config/axiosClient";
import OfflinePaymentsPage from "../../components/offline/OfflinePaymentsPage";

export default function OfflinePayments() {
  const navigate = useNavigate();
  const { setHideLayout } = useAdminUi();
  const { tienda, tiendaLoading } = useTienda();
  const storeId = tienda?.id;
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => { setHideLayout(false); }, [setHideLayout]);
  useEffect(() => {
    if (tiendaLoading || !storeId) return;
    const controller = new AbortController();
    setError("");
    axiosClient.get("/branches", { params: { store_id: storeId }, signal: controller.signal }).then(({ data }) => {
      const rows = Array.isArray(data) ? data : data?.data;
      if (!Array.isArray(rows)) throw new Error("No se pudo leer el listado de sucursales.");
      if (!controller.signal.aborted) setBranches(rows);
    }).catch(() => { if (!controller.signal.aborted) setError("No se pudieron cargar las sucursales para filtrar los pedidos."); });
    return () => controller.abort();
  }, [revision, storeId, tiendaLoading]);
  return <Box sx={{ px: { xs: 1, md: 3 }, py: { xs: 2, md: 3 } }}>
    {error && <Alert severity="warning" sx={{ mb: 2 }} action={<Button onClick={() => setRevision(value => value + 1)}>Reintentar</Button>}>{error}</Alert>}
    <OfflinePaymentsPage branches={branches} onBack={() => navigate("/admin/sucursales")} />
  </Box>;
}
