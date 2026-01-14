// src/components/POS.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import axiosClient from "../config/axiosClientPOS";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
  useMediaQuery,
  Drawer,
  IconButton,
  Badge,
  Paper,
  alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import ProductCard from "./POS/ProductCard";
import Cart from "./POS/Cart";
import { usePOSLogic } from "../hooks/POS/usePOSLogic";
import TicketDialog from "./POS/TicketDialog";
import HistoryIcon from "@mui/icons-material/History";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { showError, showSuccess } from "../utils/alerts";

export default function POS({ posName, cambiarVista }) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md")); // desktop: >= md

  const [ticketData, setTicketData] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketBlobUrl, setTicketBlobUrl] = useState("");
  const inputRef = useRef(null);
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState([]);
  const [modalDescuentoActivo, setModalDescuentoActivo] = useState(false);
  const [searchEditable, setSearchEditable] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // ✅ Drawer carrito (móvil)
  const [cartOpen, setCartOpen] = useState(false);

  // ✅ Detectar touch device (móvil/tablet)
  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  // ✅ En móvil/tablet: NO activar auto-scanner
  const [scannerEnabled, setScannerEnabled] = useState(() => !isTouchDevice);

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
    refetchProducts,
    getAvailableStock,
    getQuantityInCart,
    getProductImage,
    isVariantProduct,
  } = usePOSLogic({
    setTicketData,
    setShowTicket,
    cart,
    setCart,
  });

  const cartCount = useMemo(
    () => cart.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0) || 0,
    [cart]
  );

  // Descargar PDF
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
          if (ticketBlobUrl) URL.revokeObjectURL(ticketBlobUrl);
          setTicketBlobUrl(URL.createObjectURL(blob));
        } catch (e) {
          console.error("Error cargando ticket:", e);
          showError("❌ No se pudo previsualizar el ticket.");
          setShowTicket(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTicket, ticketData]);

  // ✅ Mantener enfoque escáner SOLO desktop
  useEffect(() => {
    if (isTouchDevice) return;

    let focusTimeout;
    const tryFocus = () => {
      if (
        scannerEnabled &&
        !showTicket &&
        !modalDescuentoActivo &&
        inputRef.current &&
        document.activeElement !== inputRef.current &&
        document.activeElement?.tagName === "BODY"
      ) {
        inputRef.current.focus({ preventScroll: true });
      }
      focusTimeout = setTimeout(tryFocus, 1000);
    };

    tryFocus();
    return () => clearTimeout(focusTimeout);
  }, [scannerEnabled, showTicket, modalDescuentoActivo, isTouchDevice]);

  useEffect(() => setCurrentPage(1), [search]);

  const handlePrint = () => {
    if (ticketBlobUrl) window.open(ticketBlobUrl, "_blank");
  };

  const handleSendTicket = async (phone) => {
    try {
      await axiosClient.post(`/sales/${ticketData.id}/send-whatsapp`, {
        phone,
      });
      showSuccess("✅ Ticket enviado por WhatsApp");
    } catch (e) {
      console.error("Error enviando WhatsApp:", e);
      showError("❌ No se pudo enviar el ticket por WhatsApp.");
    }
  };

  const handleCloseTicket = () => {
    setShowTicket(false);
    setTicketData(null);
    if (ticketBlobUrl) {
      URL.revokeObjectURL(ticketBlobUrl);
      setTicketBlobUrl("");
    }
    if (!isTouchDevice) {
      requestAnimationFrame(() =>
        inputRef.current?.focus({ preventScroll: true })
      );
    }
  };

  const onCheckout = async (payload) => {
    const sale = await handleCheckout(payload);
    if (!sale) return;

    setSearch("");
    setSelectedVariation({});
    setSelectedSize({});
    setCurrentPage(1);
    setBarcode("");

    await refetchProducts();

    // ✅ cerrar drawer en móvil al cobrar
    if (!isMdUp) setCartOpen(false);

    if (!isTouchDevice) {
      requestAnimationFrame(() =>
        inputRef.current?.focus({ preventScroll: true })
      );
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

  const filteredProducts = Array.isArray(products)
    ? products.filter((p) => {
        const term = (search || "").toLowerCase();
        return (
          p.name?.toLowerCase().includes(term) ||
          p.sku?.toLowerCase().includes(term)
        );
      })
    : [];

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleScan = (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (e.key === "Enter") {
      const code = barcode.trim();
      const product = products.find((p) => p.sku === code);

      if (product) handleAdd(product);
      else alert(`Producto no encontrado para el código: ${code}`);

      setBarcode("");
    } else {
      if (e.key && e.key.length === 1) setBarcode((prev) => prev + e.key);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#fff",
        px: { xs: 1.25, md: 5 },
        py: 2,
      }}
    >
      {/* Header */}
<Paper
  sx={{
    mb: 2,
    p: { xs: 1.25, md: 2 },
    borderRadius: 3,
    background: "#fff",
    border: "1px solid",
    borderColor: "divider",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  }}
>
  <Stack
    direction="column"
    spacing={{ xs: 1, md: 0 }}
    alignItems="center"
    justifyContent="center"
  >
    {/* ✅ Botones */}
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1}
      sx={{
        width: { xs: "100%", md: "auto" },
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Button
        fullWidth={!isMdUp} // ✅ móvil: ocupa todo el ancho
        variant="contained"
        startIcon={<HistoryIcon />}
        onClick={() => cambiarVista("historial")}
        sx={{
          px: 2,
          borderRadius: 3,
          background: "#f59e0b",
          "&:hover": { background: "#fbbf24" },
          textTransform: "none",
          fontWeight: 800,
          minWidth: { md: 160 },
        }}
      >
        Historial
      </Button>

      <Button
        fullWidth={!isMdUp}
        variant="contained"
        startIcon={<ReceiptLongIcon />}
        onClick={() => cambiarVista("facturas")}
        sx={{
          px: 2,
          borderRadius: 3,
          background: "#ef4444",
          "&:hover": { background: "#ff3f36" },
          textTransform: "none",
          fontWeight: 800,
          minWidth: { md: 160 },
        }}
      >
        Facturas
      </Button>

      <Button
        fullWidth={!isMdUp}
        variant="outlined"
        startIcon={<DashboardIcon />}
        onClick={() => cambiarVista("menu")}
        sx={{
          px: 2,
          borderRadius: 3,
          textTransform: "none",
          fontWeight: 800,
          minWidth: { md: 160 },
        }}
      >
        Panel
      </Button>
    </Stack>
  </Stack>
</Paper>


      {/* Buscador */}
      <Paper
        sx={{
          p: 1.25,
          mb: 2,
          borderRadius: 3,
          background: "#fff",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
<TextField
  label="Buscar producto (nombre o SKU)"
  fullWidth
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  onFocus={() => setScannerEnabled(false)}
  onBlur={() => {
    if (!isTouchDevice) setScannerEnabled(true);
    if (!isMdUp) setSearchEditable(false); // ✅ móvil vuelve a bloquear
  }}
  InputProps={{
    readOnly: !isMdUp && !searchEditable, // ✅ móvil: readonly hasta tocar
  }}
  inputProps={{
    inputMode: "search",
  }}
  onClick={(e) => {
    if (isMdUp) return;
    if (!searchEditable) {
      setSearchEditable(true);
      requestAnimationFrame(() => {
        // enfoca el input real
        const input = e.currentTarget.querySelector("input");
        input?.focus();
      });
    }
  }}
/>

      </Paper>

      {/* Input oculto escáner */}
      <input
        ref={inputRef}
        type="text"
        value={barcode}
        onKeyDown={handleScan}
        onChange={() => {}}
        style={{
          position: "fixed",
          top: "-1000px",
          left: "-1000px",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* Layout */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "3fr 1fr" },
          gap: 2,
          alignItems: "start",
        }}
      >
        {/* Productos */}
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={1.25}
          >
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Productos
            </Typography>
            {isMdUp && (
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                {filteredProducts.length} encontrados
              </Typography>
            )}
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: { xs: 1.25, md: 2 },
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))", // ✅ móvil: 2 columnas
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(auto-fit, minmax(200px, 1fr))", // ✅ desktop igual
              },
            }}
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
  isMdUp={isMdUp} // ✅ NUEVO
/>

            ))}
          </Box>

          {/* Paginación */}
          <Paper
            sx={{
              mt: 2,
              p: 1.25,
              borderRadius: 3,
              background: "#fff",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              display="flex"
              justifyContent="center"
              gap={2}
              alignItems="center"
            >
              <Button
                variant="outlined"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Typography fontWeight={900}>
                Página {currentPage} de {totalPages}
              </Typography>
              <Button
                variant="outlined"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* ✅ Carrito desktop */}
        {isMdUp ? (
          <Cart
            cart={cart}
            setCart={setCart}
            onRemove={handleRemove}
            onCheckout={onCheckout}
            setScannerEnabled={setScannerEnabled}
            setModalDescuentoActivo={setModalDescuentoActivo}
            variant="desktop"
          />
        ) : (
          <Box />
        )}

        {/* Ticket */}
        <TicketDialog
          open={showTicket}
          onClose={handleCloseTicket}
          sale={ticketData}
          ticketUrl={ticketBlobUrl}
          onPrint={handlePrint}
          onSend={handleSendTicket}
        />
      </Box>

      {/* ✅ Burbuja flotante SOLO móvil/tablet */}
      {!isMdUp && (
        <>
          <Box sx={{ position: "fixed", right: 16, bottom: 106, zIndex: 1400 }}>
            <Badge badgeContent={cartCount} color="error">
              <IconButton
                onClick={() => setCartOpen(true)}
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                  color: "#111827",
                  boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
                  border: `1px solid ${alpha("#f59e0b", 0.35)}`,
                  "&:active": { transform: "scale(0.98)" },
                }}
              >
                <ShoppingCartRoundedIcon />
              </IconButton>
            </Badge>
          </Box>

          <Drawer
            anchor="bottom"
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            PaperProps={{
              sx: {
                height: "86vh",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                background: "#ffffff",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 -18px 50px rgba(0,0,0,0.12)",
              },
            }}
          >
            <Box
              sx={{
                p: 1.25,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Tu orden
              </Typography>
              <IconButton onClick={() => setCartOpen(false)}>
                <CloseRoundedIcon />
              </IconButton>
            </Box>

            <Box sx={{ px: 1.25, pb: 2, overflow: "auto" }}>
              <Cart
                cart={cart}
                setCart={setCart}
                onRemove={handleRemove}
                onCheckout={onCheckout}
                setScannerEnabled={setScannerEnabled}
                setModalDescuentoActivo={setModalDescuentoActivo}
                variant="mobile"
              />
            </Box>
          </Drawer>
        </>
      )}
    </Box>
  );
}
