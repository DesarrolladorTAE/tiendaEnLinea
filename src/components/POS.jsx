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
  const isMobile = !isMdUp;

  const [ticketData, setTicketData] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketBlobUrl, setTicketBlobUrl] = useState("");

  const inputRef = useRef(null);
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState([]);
  const [modalDescuentoActivo, setModalDescuentoActivo] = useState(false);
  const [searchEditable, setSearchEditable] = useState(false);

  // ✅ Drawer carrito
  const [cartOpen, setCartOpen] = useState(false);

  // ✅ Categorías
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // ✅ Detectar touch device
  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  // ✅ En móvil/tablet: NO activar auto-scanner
  const [scannerEnabled, setScannerEnabled] = useState(() => !isTouchDevice);

  // ✅ POS LOCATION ID como STATE
  const [posLocationId, setPosLocationId] = useState(
    Number(localStorage.getItem("POS_LOCATION_ID")) || null,
  );

  useEffect(() => {
    const sync = () => {
      const next = Number(localStorage.getItem("POS_LOCATION_ID")) || null;
      setPosLocationId(next);
    };

    window.addEventListener("storage", sync);
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
    meta,
    page,
    setPage,

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
    if (!showTicket || !ticketData?.id) return;

    let alive = true;

    const loadTicket = async () => {
      try {
        setTicketBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return "";
        });

        const resp = await axiosClient.get(
          `/v2/sales/${ticketData.id}/ticket.pdf`,
          { responseType: "arraybuffer" },
        );

        if (!alive) return;

        const blob = new Blob([resp.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        setTicketBlobUrl(url);
      } catch (e) {
        console.error("Error cargando ticket:", e);

        if (alive) {
          showError("❌ No se pudo previsualizar el ticket.");
          setShowTicket(false);
        }
      }
    };

    loadTicket();

    return () => {
      alive = false;
    };
  }, [showTicket, ticketData?.id]);

  // ✅ Mantener enfoque escáner SOLO desktop
  useEffect(() => {
    if (isTouchDevice) return;

    let focusTimeout;
    const tryFocus = () => {
      if (
        scannerEnabled &&
        !showTicket &&
        !modalDescuentoActivo &&
        !cartOpen &&
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

  // ✅ cuando cambia search o categoría: reset a page 1 y pedir al backend
  useEffect(() => {
    const next = 1;
    setPage(next);
    refetchProducts({ nextPage: next, categoryId: selectedCategoryId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategoryId]);

  // ✅ Traer categorías por POS
  useEffect(() => {
    let alive = true;

    const fetchCategories = async () => {
      try {
        if (!posLocationId) {
          if (alive) setCategories([]);
          return;
        }

        setLoadingCategories(true);

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

    setTicketBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });

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
    setBarcode("");

    setPage(1);
    await refetchProducts({ nextPage: 1, categoryId: null });

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

  const totalPages = meta?.last_page || 1;

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

  const toggleCart = () => setCartOpen((v) => !v);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#fff",
        px: { xs: 1.25, md: 5 },
        py: 2,
        pb: { xs: 12, md: 4 },
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
          InputProps={{ readOnly: !isMdUp && !searchEditable }}
          inputProps={{ inputMode: "search" }}
          onClick={(e) => {
            if (isMdUp) return;
            if (!searchEditable) {
              setSearchEditable(true);
              requestAnimationFrame(() =>
                e.currentTarget.querySelector("input")?.focus(),
              );
            }
          }}
        />
      </Paper>

      {!isMdUp && (
        <CategoriesRail
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={(id) => setSelectedCategoryId(id)}
          onClear={() => setSelectedCategoryId(null)}
        />
      )}

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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "260px 1fr" },
          gap: 2,
          alignItems: "start",
        }}
      >
        {isMdUp ? (
          <Box>
            <CategoriesRail
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelect={(id) =>
                setSelectedCategoryId(id == null ? null : Number(id))
              }
              onClear={() => setSelectedCategoryId(null)}
            />
          </Box>
        ) : null}

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
                  : `${meta?.total ?? products.length} encontrados`}
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
                        categories.find(
                          (c) => String(c.id) === String(selectedCategoryId),
                        )?.name || "Seleccionada"
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
                md: "repeat(3, minmax(0, 1fr))",
              },
              alignItems: "stretch",
            }}
          >
            {products.map((product) => (
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

          {/* Paginación real (backend) */}
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
                disabled={page === 1}
                onClick={() => {
                  const np = Math.max(1, page - 1);
                  setPage(np);
                  refetchProducts({
                    nextPage: np,
                    categoryId: selectedCategoryId,
                  });
                }}
              >
                Anterior
              </Button>

              <Typography fontWeight={900}>
                Página {page} de {totalPages}
              </Typography>

              <Button
                variant="outlined"
                disabled={page >= totalPages}
                onClick={() => {
                  const np = Math.min(totalPages, page + 1);
                  setPage(np);
                  refetchProducts({
                    nextPage: np,
                    categoryId: selectedCategoryId,
                  });
                }}
              >
                Siguiente
              </Button>
            </Box>
          </Paper>
        </Box>

        <TicketDialog
          open={showTicket}
          onClose={handleCloseTicket}
          sale={ticketData}
          ticketUrl={ticketBlobUrl}
          onPrint={handlePrint}
          onSend={handleSendTicket}
          posLocationId={posLocationId}
        />
      </Box>

      {/* Burbuja carrito */}
      <Box sx={{ position: "fixed", right: 20, bottom: 96, zIndex: 1500 }}>
        <Badge badgeContent={cartCount} color="error">
          <IconButton
            onClick={toggleCart}
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: cartOpen
                ? "linear-gradient(135deg, #111827, #374151)"
                : "linear-gradient(135deg, #f59e0b, #fbbf24)",
              color: cartOpen ? "#fff" : "#111827",
              boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
              border: `1px solid ${alpha("#000", 0.12)}`,
              "&:active": { transform: "scale(0.98)" },
            }}
          >
            {cartOpen ? <CloseRoundedIcon /> : <ShoppingCartRoundedIcon />}
          </IconButton>
        </Badge>
      </Box>

      {/* Drawer carrito */}
      <Drawer
        anchor={isMdUp ? "right" : "bottom"}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        disableScrollLock
        ModalProps={{
          keepMounted: true,
          disableEnforceFocus: true,
        }}
        PaperProps={{
          sx: isMdUp
            ? {
                width: 420,
                height: "100vh",
                background: "#fff",
                borderLeft: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexDirection: "column",
              }
            : {
                height: "100svh",
                maxHeight: "100svh",
                width: "100%",
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                touchAction: "pan-y",
              },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 1.25,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "#fff",
            flexShrink: 0,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Tu orden
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              {cartCount} producto(s)
            </Typography>
          </Box>

          <IconButton onClick={() => setCartOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        {/* Contenido scrollable */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorY: "contain",
            touchAction: "pan-y",
            p: 1.25,
            pb: "calc(32px + env(safe-area-inset-bottom))",
          }}
        >
          <Cart
            cart={cart}
            setCart={setCart}
            onRemove={handleRemove}
            onCheckout={onCheckout}
            setScannerEnabled={setScannerEnabled}
            setModalDescuentoActivo={setModalDescuentoActivo}
            variant={isMdUp ? "desktop" : "mobile"}
            posLocationId={posLocationId}
          />
        </Box>
      </Drawer>
    </Box>
  );
}
