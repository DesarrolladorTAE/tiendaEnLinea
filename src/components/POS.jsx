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
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import ProductCard from "./POS/ProductCard";
import Cart from "./POS/Cart";
import { usePOSLogic } from "../hooks/POS/usePOSLogic";
import TicketDialog from "./POS/TicketDialog";
import CategoriesRail from "./POS/CategoriesRail";

import HistoryIcon from "@mui/icons-material/History";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { showError, showSuccess } from "../utils/alerts";

export default function POS({ posName, cambiarVista }) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

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

  // ✅ Drawer carrito (móvil + desktop)
  const [cartOpen, setCartOpen] = useState(false);

  // ✅ Categorías
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // ✅ Detectar touch device (móvil/tablet)
  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  // ✅ En móvil/tablet: NO activar auto-scanner
  const [scannerEnabled, setScannerEnabled] = useState(() => !isTouchDevice);

  // ✅ POS LOCATION ID como STATE (para que el useEffect se ejecute cuando cambie)
  const [posLocationId, setPosLocationId] = useState(
    Number(localStorage.getItem("POS_LOCATION_ID")) || null,
  );

  // ✅ Sincronizar cambios de POS_LOCATION_ID
  useEffect(() => {
    const sync = () => {
      const next = Number(localStorage.getItem("POS_LOCATION_ID")) || null;
      setPosLocationId(next);
    };

    // Cambios desde otra pestaña
    window.addEventListener("storage", sync);

    // Cambios desde esta misma pestaña (cuando tú lo dispares)
    window.addEventListener("pos:changed", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("pos:changed", sync);
    };
  }, []);

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
    [cart],
  );

  // ✅ Descargar PDF del ticket
  useEffect(() => {
    if (showTicket && ticketData) {
      (async () => {
        try {
          const resp = await axiosClient.get(
            `/v2/sales/${ticketData.id}/ticket.pdf`,
            { responseType: "arraybuffer" },
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
        !cartOpen && // ✅ si el carrito está abierto, no robar focus
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
  }, [
    scannerEnabled,
    showTicket,
    modalDescuentoActivo,
    isTouchDevice,
    cartOpen,
  ]);

  useEffect(() => setCurrentPage(1), [search, selectedCategoryId]);

  // ✅ Traer categorías por POS (deduce branch en backend)
  useEffect(() => {
    let alive = true;

    const fetchCategories = async () => {
      try {
        console.log("🔄 fetchCategories posLocationId:", posLocationId);

        if (!posLocationId) {
          if (alive) setCategories([]);
          return;
        }

        setLoadingCategories(true);

        // ✅ IMPORTANTE: sin "/" inicial para respetar baseURL
        const resp = await axiosClient.get("categories/by-pos", {
          params: { mode: "flat", pos_location_id: posLocationId },
        });

        const cats = Array.isArray(resp?.data?.categories)
          ? resp.data.categories
          : [];

        if (alive) setCategories(cats);
      } catch (e) {
        console.error("Error cargando categorías:", e);
        if (alive) setCategories([]);
        showError("❌ No se pudieron cargar las categorías de la sucursal.");
      } finally {
        if (alive) setLoadingCategories(false);
      }
    };

    fetchCategories();

    return () => {
      alive = false;
    };
  }, [posLocationId]);

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
        inputRef.current?.focus({ preventScroll: true }),
      );
    }
  };

  const onCheckout = async (payload) => {
    const sale = await handleCheckout(payload);
    if (!sale) return;

    setSearch("");
    setSelectedCategoryId(null);
    setSelectedVariation({});
    setSelectedSize({});
    setCurrentPage(1);
    setBarcode("");

    await refetchProducts();

    // ✅ cerrar drawer al cobrar (en ambos)
    setCartOpen(false);

    if (!isTouchDevice) {
      requestAnimationFrame(() =>
        inputRef.current?.focus({ preventScroll: true }),
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

  // ✅ helper robusto para leer category_id
  const productCategoryId = (p) => {
    if (!p) return null;
    if (p.category_id) return Number(p.category_id);
    if (p.category?.id) return Number(p.category.id);
    if (Array.isArray(p.categories) && p.categories[0]?.id)
      return Number(p.categories[0].id);
    return null;
  };

  const filteredProducts = Array.isArray(products)
    ? products.filter((p) => {
        const term = (search || "").toLowerCase();

        const bySearch =
          p.name?.toLowerCase().includes(term) ||
          p.sku?.toLowerCase().includes(term);

        const byCategory =
          !selectedCategoryId ||
          productCategoryId(p) === Number(selectedCategoryId);

        return bySearch && byCategory;
      })
    : [];

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleScan = (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (e.key === "Enter") {
      const code = barcode.trim();
      const product = products.find((p) => p.sku === code);

      if (product) handleAdd(product);
      else showError(`❌ Producto no encontrado: ${code}`);

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
        pb: { xs: 12, md: 4 }, // espacio para burbuja
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
              fullWidth={!isMdUp}
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
            if (!isMdUp) setSearchEditable(false);
          }}
          InputProps={{
            readOnly: !isMdUp && !searchEditable,
          }}
          inputProps={{ inputMode: "search" }}
          onClick={(e) => {
            if (isMdUp) return;
            if (!searchEditable) {
              setSearchEditable(true);
              requestAnimationFrame(() => {
                const input = e.currentTarget.querySelector("input");
                input?.focus();
              });
            }
          }}
        />
      </Paper>

      {/* ✅ Categorías (móvil: chips; desktop: rail) */}
      {!isMdUp && (
        <CategoriesRail
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={(id) => setSelectedCategoryId(id)}
          onClear={() => setSelectedCategoryId(null)}
        />
      )}

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

      {/* Layout principal */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "260px 1fr" },
          gap: 2,
          alignItems: "start",
        }}
      >
        {/* Categorías desktop */}
        {isMdUp ? (
          <Box>
            <CategoriesRail
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelect={(id) => setSelectedCategoryId(id)}
              onClear={() => setSelectedCategoryId(null)}
            />
          </Box>
        ) : null}

        {/* Productos */}
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={1.25}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Productos
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                {loadingCategories
                  ? "Cargando categorías..."
                  : `${filteredProducts.length} encontrados`}
              </Typography>
            </Box>

            {isMdUp && (
              <Paper
                sx={{
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  background: alpha("#111827", 0.02),
                }}
              >
                <Typography sx={{ fontSize: 12, fontWeight: 900 }}>
                  {selectedCategoryId
                    ? `Categoría: ${
                        categories.find((c) => c.id === selectedCategoryId)
                          ?.name || "Seleccionada"
                      }`
                    : "Todas las categorías"}
                </Typography>
              </Paper>
            )}
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: { xs: 1.25, md: 2 },
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))", // ✅ 4 columnas fijas en desktop
                // lg: "repeat(5, minmax(0, 1fr))", // ✅ opcional
                // xl: "repeat(6, minmax(0, 1fr))", // ✅ opcional
              },
              alignItems: "stretch",
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
                isMdUp={isMdUp}
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

      {/* ✅ Burbuja flotante carrito (MÓVIL + DESKTOP) */}
      <Box sx={{ position: "fixed", right: 20, bottom: 96, zIndex: 1500 }}>
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

      {/* ✅ Drawer carrito (mobile bottom / desktop right) */}
      <Drawer
        anchor={isMdUp ? "right" : "bottom"}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        PaperProps={{
          sx: isMdUp
            ? {
                width: 420,
                height: "100vh",
                background: "#fff",
                borderLeft: "1px solid",
                borderColor: "divider",
              }
            : {
                height: "86vh",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                background: "#fff",
                border: "1px solid",
                borderColor: "divider",
              },
        }}
      >
        <Box
          sx={{
            p: 1.25,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Tu orden
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
              {cartCount} producto(s)
            </Typography>
          </Box>

          <IconButton onClick={() => setCartOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 1.25, overflow: "auto", height: "100%" }}>
          <Cart
            cart={cart}
            setCart={setCart}
            onRemove={handleRemove}
            onCheckout={onCheckout}
            setScannerEnabled={setScannerEnabled}
            setModalDescuentoActivo={setModalDescuentoActivo}
            variant={isMdUp ? "desktop" : "mobile"}
          />
        </Box>
      </Drawer>
    </Box>
  );
}
