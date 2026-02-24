import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "../../axiosConfig";
import withAuth from "../../components/withAuth";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import SEO from "../../components/seo";
import { motion } from "framer-motion";
import { Container, Box, Typography } from "@mui/material";
import Swal from "sweetalert2";

// COMPONENTES
import RecargaDepositInfo from "../../components/saldorecarga/RecargaDepositInfo";
import RecargaForm from "../../components/saldorecarga/RecargaForm";
import RecargaHistory from "../../components/saldorecarga/RecargaHistory";



const SolicitarRecarga = () => {
  const { pathname } = useLocation();
  const user = useSelector((state) => state.user.user);
  const referencia = `TLR${user?.id}`;

  const [receiptFile, setReceiptFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const bancos = [
    {
      bank: "Santander",
      logo: "/assets/img/santander.png",
      accountNumber: "6551128849",
      clabe: "014261655112884941",
      oxxo: "5579-0890-0687-2124",
      beneficiary: "Tecnologías Administrativas ELAD S. de R.L. de C.V.",
    },
  ];

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/ver-recargastra");
      setHistory(data);
    } catch (error) {
      console.error("Error cargando historial", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async ({ amount }, reset) => {
    setSubmitting(true);
    const cleanAmount = amount.replace(/[$,]/g, "");
    const formData = new FormData();
    formData.append("monto", cleanAmount);
    if (receiptFile) formData.append("comprobante", receiptFile);

    try {
      await axios.post("/recargar-saldo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.fire({
        icon: "success",
        title: "🚀 Solicitud enviada",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        reset({ amount: "" });
        setReceiptFile(null);
        fetchHistory();
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "❌ Error al solicitar recarga",
      }).then(() => {
        reset({ amount: "" });
        setReceiptFile(null);
        fetchHistory();
      });
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const historyFiltrada = history.filter((item) => {
    if (filtroEstado === "todos") return true;
    return item.status === filtroEstado;
  });

  return (
    <LayoutOne headerTop="visible">
      <SEO titleTemplate="Solicitar Recarga" />
      <Breadcrumb
        pages={[
          { label: "Inicio", path: "/" },
          { label: "Recarga", path: pathname },
        ]}
      />

      {/* FONDO BLANCO premium */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          py: { xs: 3, md: 5 },
          background: "#fff",
        }}
      >
        {/* blobs sutiles */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(700px 340px at 10% 15%, rgba(25,118,210,0.10), transparent 60%)," +
              "radial-gradient(640px 320px at 90% 25%, rgba(156,39,176,0.08), transparent 60%)," +
              "radial-gradient(720px 360px at 50% 95%, rgba(0,229,255,0.07), transparent 65%)",
          }}
        />

        <Container sx={{ position: "relative", zIndex: 1, px: { xs: 2, md: 0 } }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                color: "#0b1220",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                fontSize: { xs: 22, sm: 28, md: 32 },
              }}
            >
              Recargar saldo
            </Typography>
            <Typography sx={{ color: "rgba(11,18,32,0.68)", mt: 0.5 }}>
              Deposita/Transfiere y manda tu solicitud con comprobante.
            </Typography>
          </Box>

          {/* Grid de Cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
              alignItems: "stretch",
              mb: 3,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              style={{ height: "100%" }}
            >
              <RecargaDepositInfo bancos={bancos} referencia={referencia} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.06 }}
              style={{ height: "100%" }}
            >
              <RecargaForm
                submitting={submitting}
                onSubmit={onSubmit}
                receiptFile={receiptFile}
                setReceiptFile={setReceiptFile}
              />
            </motion.div>
          </Box>

          {/* Historial dentro de card */}
          <Box
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              background: "#fff",
              border: "1px solid rgba(15,23,42,0.10)",
              boxShadow: "0 18px 45px rgba(2, 6, 23, 0.08)",
            }}
          >
            <RecargaHistory
              historyFiltrada={historyFiltrada}
              loading={loading}
              filtroEstado={filtroEstado}
              setFiltroEstado={setFiltroEstado}
              fetchHistory={fetchHistory}
            />
          </Box>
        </Container>
      </Box>
    </LayoutOne>
  );
};

export default withAuth(SolicitarRecarga);