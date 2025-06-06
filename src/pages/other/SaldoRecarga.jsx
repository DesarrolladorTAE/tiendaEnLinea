import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "../../axiosConfig";
import withAuth from "../../components/withAuth";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import SEO from "../../components/seo";
import { motion } from "framer-motion";
import { Container, Box } from "@mui/material";
import Swal from "sweetalert2";

// IMPORTA LOS COMPONENTES CREADOS
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
      bank: "BBVA",
      logo: "/assets/img/bbva.png",
      accountNumber: "0116325122",
      clabe: "012261001163251221",
      beneficiary: "Tecnologías Administrativas Elad S de RL de CV®",
    },
    {
      bank: "Scotiabank",
      logo: "/assets/img/scotiabank.png",
      accountNumber: "25600737834",
      clabe: "044261256007378342",
      oxxo: "5579-2091-3760-4226",
      beneficiary: "Tecnologías Administrativas Elad S de RL de CV®",
    },
  ];

  useEffect(() => {
    fetchHistory();
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
      <Breadcrumb pages={[{ label: "Inicio", path: "/" }, { label: "Recarga", path: pathname }]} />
      <Container sx={{ mt: 4, mb: 4, px: { xs: 2, md: 0 } }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4, alignItems: "stretch", mb: 4 }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} style={{ flex: 1 }}>
            <RecargaDepositInfo bancos={bancos} referencia={referencia} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} style={{ flex: 1 }}>
            <RecargaForm
              submitting={submitting}
              onSubmit={onSubmit}
              receiptFile={receiptFile}
              setReceiptFile={setReceiptFile}
            />
          </motion.div>
        </Box>
        <RecargaHistory
          historyFiltrada={historyFiltrada}
          loading={loading}
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
        />
      </Container>
    </LayoutOne>
  );
};

export default withAuth(SolicitarRecarga);
