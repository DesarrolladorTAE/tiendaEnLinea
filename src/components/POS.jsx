import React, { useState, useEffect, useRef } from "react";
import axiosClient from "../config/axiosClientPOS";
import { Box, Typography, TextField, Button, CircularProgress } from "@mui/material";
import ProductCard from "./POS/ProductCard";
import Cart from "./POS/Cart";
import { usePOSLogic } from "../hooks/POS/usePOSLogic";
import TicketDialog from "./POS/TicketDialog";

export default function POS({ posName }) {
  const [ticketData, setTicketData] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketBlobUrl, setTicketBlobUrl] = useState("");
  const inputRef = useRef(null);
  const [barcode, setBarcode] = useState("");
  const [scannerEnabled, setScannerEnabled] = useState(true);

  const {
    search,
    setSearch,
    products,
    cart,
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
  } = usePOSLogic({ setTicketData, setShowTicket });

  //  Descargar el PDF como blob cuando abrimos el modal
  useEffect(() => {
    if (showTicket && ticketData) {
      (async () => {
        try {
          const resp = await axiosClient.get(`/sales/${ticketData.id}/ticket.pdf`, {
            responseType: "arraybuffer",
          });
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
        !showTicket && // evitar enfocar mientras hay modal abierto
        inputRef.current &&
        document.activeElement !== inputRef.current
      ) {
        inputRef.current.focus({ preventScroll: true });
      }
      focusTimeout = setTimeout(tryFocus, 1000);
    };

    tryFocus();

    return () => clearTimeout(focusTimeout);
  }, [scannerEnabled, showTicket]);

  // Imprimir abriendo el blob URL
  const handlePrint = () => {
    if (ticketBlobUrl) window.open(ticketBlobUrl, "_blank");
  };

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

  if (!products) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

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
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Punto de Venta</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h5" fontWeight="bold" color="secondary">
            {posName}
          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              localStorage.removeItem("POS_TOKEN");
              window.location.href = "/prueba/pos";
            }}
          >
            Cerrar sesión
          </Button>
        </Box>
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
      <Box mt={3} display="grid" gridTemplateColumns={{ xs: "1fr", md: "3fr 1fr" }} gap={2}>
        {/* Lista de productos */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Productos
          </Typography>
          <Box display="grid" gap={2} gridTemplateColumns="repeat(auto-fit, minmax(200px,1fr))">
            {filtered.map((product) => (
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
        </Box>

        {/* Carrito */}
        <Cart
          cart={cart}
          onRemove={handleRemove}
          onCheckout={handleCheckout}
          setScannerEnabled={setScannerEnabled}
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
