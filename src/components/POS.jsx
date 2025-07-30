import React, { useState, useEffect, useRef } from "react";
import axiosClient from "../config/axiosClientPOS";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
} from "@mui/material";
import ProductCard from "./POS/ProductCard";
import Cart from "./POS/Cart";
import { usePOSLogic } from "../hooks/POS/usePOSLogic";
import TicketDialog from "./POS/TicketDialog";
import { useLocation } from "react-router-dom";
import HistoryIcon from "@mui/icons-material/History";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DashboardIcon from "@mui/icons-material/Dashboard";

export default function POS({ posName, cambiarVista }) {
  const [ticketData, setTicketData] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketBlobUrl, setTicketBlobUrl] = useState("");
  const inputRef = useRef(null);
  const [barcode, setBarcode] = useState("");
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [cart, setCart] = useState([]);
  const [modalDescuentoActivo, setModalDescuentoActivo] = useState(false);
  const location = useLocation();
  // const posDesdeAdmin = location.state?.pos || null;
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const {
    search,
    setSearch,
    products,
    selectedVariation,
    selectedSize,
    setSelectedVariation,
    setSelectedSize,
    handleAdd,
    handleRemove,
    handleDecrease,
    handleCheckout,
    getAvailableStock,
    getQuantityInCart,
    getProductImage,
    isVariantProduct,
  } = usePOSLogic({
    setTicketData,
    setShowTicket,
    cart,
    setCart, // 👈 NECESARIO
  });

  //  Descargar el PDF como blob cuando abrimos el modal
  useEffect(() => {
    if (showTicket && ticketData) {
      (async () => {
        try {
          const resp = await axiosClient.get(
            `/sales/${ticketData.id}/ticket.pdf`,
            {
              responseType: "arraybuffer",
            }
          );
          const blob = new Blob([resp.data], { type: "application/pdf" });
          setTicketBlobUrl(URL.createObjectURL(blob));
        } catch (e) {
          console.error("Error cargando ticket:", e);
          alert("❌ No se pudo previsualizar el ticket.");
          setShowTicket(false);
        }
      })();
    }
  }, [showTicket, ticketData]);

  useEffect(() => {
    let focusTimeout;

    const tryFocus = () => {
      if (
        scannerEnabled &&
        !showTicket &&
        !modalDescuentoActivo &&
        inputRef.current &&
        document.activeElement !== inputRef.current &&
        document.activeElement.tagName === "BODY"
      ) {
        inputRef.current.focus({ preventScroll: true });
      }
      focusTimeout = setTimeout(tryFocus, 1000);
    };

    tryFocus();

    return () => clearTimeout(focusTimeout);
  }, [scannerEnabled, showTicket, modalDescuentoActivo]); // ✅ agrega la nueva dependencia

  // Imprimir abriendo el blob URL
  const handlePrint = () => {
    if (ticketBlobUrl) window.open(ticketBlobUrl, "_blank");
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);
  // Enviar WhatsApp llamando a tu endpoint send-whatsapp
  const handleSendTicket = async (phone) => {
    try {
      await axiosClient.post(`/sales/${ticketData.id}/send-whatsapp`, {
        phone,
      });
      alert("✅ Ticket enviado por WhatsApp");
    } catch (e) {
      console.error("Error enviando WhatsApp:", e);
      alert("❌ No se pudo enviar el ticket por WhatsApp.");
    }
  };

  const loading = !Array.isArray(products);

  if (loading) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  // Filtro de productos
  const filteredProducts = Array.isArray(products)
    ? products.filter((p) => {
        const term = search.toLowerCase();
        return (
          p.name?.toLowerCase().includes(term) ||
          p.sku?.toLowerCase().includes(term)
        );
      })
    : [];

  // Lógica de paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reinicia página cuando cambia el buscador

  const handleScan = (e) => {
    if (e.key === "Enter") {
      const code = barcode.trim();
      const product = products.find((p) => p.sku === code);

      if (product) {
        handleAdd(product);
      } else {
        alert(`Producto no encontrado para el código: ${code}`);
      }

      setBarcode("");
    } else {
      setBarcode((prev) => prev + e.key);
    }
  };

  return (
    <Box mt={3} px={5}>
      {/* Header */}
      <Box display="flex" justifyContent="center" mb={4}>
        <Stack direction="row" spacing={3}>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            startIcon={<HistoryIcon />}
            sx={{
              borderRadius: 3,
              paddingX: 3,
              paddingY: 1.5,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "1rem",
              boxShadow: 3,
            }}
            onClick={() => cambiarVista("historial")}
          >
            Historial
          </Button>

          <Button
            variant="contained"
            color="warning"
            size="large"
            startIcon={<ReceiptLongIcon />}
            sx={{
              borderRadius: 3,
              paddingX: 3,
              paddingY: 1.5,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "1rem",
              boxShadow: 3,
            }}
            onClick={() => cambiarVista("facturas")}
          >
            Facturas
          </Button>

          <Button
            variant="outlined"
            color="success"
            size="large"
            startIcon={<DashboardIcon />}
            sx={{
              borderRadius: 3,
              paddingX: 3,
              paddingY: 1.5,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "1rem",
              borderWidth: 2,
              boxShadow: 2,
              "&:hover": {
                borderWidth: 2,
              },
            }}
            onClick={() => cambiarVista("menu")}
          >
            Regresar al Panel
          </Button>
        </Stack>
      </Box>

      {/* Buscador */}
      <TextField
        label="Buscar producto"
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setScannerEnabled(false)}
        onBlur={() => setScannerEnabled(true)}
      />
      <input
        ref={inputRef}
        type="text"
        value={barcode}
        onKeyDown={handleScan}
        onChange={() => {}} // prevenir warning
        style={{
          position: "fixed", // evitar que afecte layout y scroll
          top: "-1000px",
          left: "-1000px",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* Contenido */}
      <Box
        mt={3}
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "3fr 1fr" }}
        gap={2}
      >
        {/* Lista de productos */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Productos
          </Typography>
          <Box
            display="grid"
            gap={2}
            gridTemplateColumns="repeat(auto-fit, minmax(200px,1fr))"
          >
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                selectedVariation={selectedVariation}
                selectedSize={selectedSize}
                setSelectedVariation={setSelectedVariation}
                setSelectedSize={setSelectedSize}
                cart={cart}
                onAdd={handleAdd}
                onRemove={handleRemove}
                handleDecrease={handleDecrease}
                getQuantityInCart={getQuantityInCart}
                getAvailableStock={getAvailableStock}
                getProductImage={getProductImage}
                isVariantProduct={isVariantProduct}
              />
            ))}
          </Box>
          <Box
            mt={2}
            display="flex"
            justifyContent="center"
            gap={2}
            alignItems="center"
          >
            <Button
              variant="outlined"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Anterior
            </Button>

            <Typography fontWeight="bold">
              Página {currentPage} de {totalPages || 1}
            </Typography>

            <Button
              variant="outlined"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Siguiente
            </Button>
          </Box>
        </Box>

        {/* Carrito */}
        <Cart
          cart={cart}
          setCart={setCart}
          onRemove={handleRemove}
          onCheckout={handleCheckout}
          setScannerEnabled={setScannerEnabled}
          setModalDescuentoActivo={setModalDescuentoActivo}
        />

        {/* Modal de ticket */}
        <TicketDialog
          open={showTicket}
          onClose={() => setShowTicket(false)}
          sale={ticketData}
          ticketUrl={ticketBlobUrl}
          onPrint={handlePrint}
          onSend={handleSendTicket}
        />
      </Box>
    </Box>
  );
}
