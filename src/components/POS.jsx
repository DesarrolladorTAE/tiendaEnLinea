import { documentPhone } from "../utils/saleDocument";
// src/components/POS.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import axiosClient from "../config/axiosClientPOS";
import {
  Box,
  Typography,
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
import ProductSearchBar from "./products-list/ProductSearchBar";
import { FiPackage } from "react-icons/fi";

import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { showError, showSuccess } from "../utils/alerts";

export default function POS({ cash, cart, setCart, posName, branchId, branchName }) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const [ticketData, setTicketData] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketBlobUrl, setTicketBlobUrl] = useState("");

  const inputRef = useRef(null);
  const [barcode, setBarcode] = useState("");
  const [modalDescuentoActivo, setModalDescuentoActivo] = useState(false);

  // ✅ Drawer carrito
  const [cartOpen, setCartOpen] = useState(false);

  // ✅ Categorías
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [refreshingStock, setRefreshingStock] = useState(false);
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
    searchField,
    setSearchField,
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
    verifyCheckout: cash.verifyCheckout,
    refreshCash: cash.refresh,
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
          `/sales/${ticketData.id}/documents/default/pdf`,
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
    const timer = setTimeout(() => refetchProducts({ nextPage: next, categoryId: selectedCategoryId }), search ? 250 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, searchField, selectedCategoryId]);

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
    await axiosClient.post(`/sales/${ticketData.id}/documents/default/send-whatsapp`, { phone: documentPhone(phone) });
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
    return sale;
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
  const refreshStock = async () => {
    setRefreshingStock(true);
    try {
      const updated = await refetchProducts({ nextPage: page, categoryId: selectedCategoryId, refreshCart: true });
      if (updated === true) showSuccess("Stock actualizado");
      if (updated === false) showError("No se pudo actualizar el stock. Intenta de nuevo.");
    } finally {
      setRefreshingStock(false);
    }
  };

  return (
    <Box
      sx={{
        pb: { xs: 12, md: 4 },
      }}
    >
      <Box component="section" aria-labelledby="pos-product-list-title" className="bg-dark text-white shadow rounded" sx={{ p: { xs: 2, sm: 2.5 }, mb: 2, "& .mb-3": { mb: "0 !important" } }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1} mb={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Typography id="pos-product-list-title" component="h2" sx={{ color: "#fff !important", fontSize: { xs: 25, sm: 32 }, fontWeight: 500, lineHeight: 1.2, mb: 0.75 }}>
              <span aria-hidden="true">🛒 </span>Lista de Productos
            </Typography>
            {(branchName || branchId || posName) && (
              <span className="badge bg-warning text-dark">
                <span aria-hidden="true">📍 </span>
                {branchName ? `Sucursal: ${branchName}` : branchId ? `Sucursal #${branchId}` : posName}
              </span>
            )}
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{
            px: 1.75, py: 1.15, minWidth: { sm: 205 }, borderRadius: "18px",
            border: "1px solid rgba(255,255,255,.1)", background: "linear-gradient(120deg, #292c30, #202226)",
          }}>
            <Box sx={{ width: 40, height: 40, borderRadius: "12px", display: "grid", placeItems: "center", flexShrink: 0, color: "#f6ce73", bgcolor: "rgba(246,206,115,.1)", border: "1px solid rgba(246,206,115,.12)" }}>
              <FiPackage size={21} aria-hidden="true" />
            </Box>
            <Box role="status" sx={{ flex: 1 }}>
              <Typography sx={{ color: "#a8adb5 !important", fontSize: 11 }}>{search.trim() || selectedCategoryId != null ? "Resultados" : "En este punto de venta"}</Typography>
              <Stack direction="row" spacing={0.75} alignItems="baseline">
                <Typography sx={{ color: "#fff !important", fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{Number(meta?.total ?? products.length).toLocaleString("es-MX")}</Typography>
                <Typography sx={{ color: "#d0d3d8 !important", fontSize: 12 }}>productos</Typography>
              </Stack>
            </Box>
            <IconButton
              type="button"
              onClick={refreshStock}
              disabled={refreshingStock}
              aria-label={refreshingStock ? "Actualizando stock" : "Actualizar stock"}
              title="Actualizar stock"
              sx={{
                width: 44, height: 44, flexShrink: 0, borderRadius: 2,
                bgcolor: "#1d4ed8", color: "#fff",
                "&:hover": { bgcolor: "#2563eb" },
                "&.Mui-disabled": { bgcolor: "#1e3a8a", color: "#bfdbfe" },
              }}
            >
              {refreshingStock ? <CircularProgress size={19} color="inherit" /> : <RefreshRoundedIcon />}
            </IconButton>
          </Stack>
        </Stack>
        <ProductSearchBar
          searchTerm={search}
          setSearchTerm={setSearch}
          searchField={searchField}
          setSearchField={setSearchField}
          showOeNumber
          onFocus={() => setScannerEnabled(false)}
          onBlur={() => {
            if (!isTouchDevice) setScannerEnabled(true);
          }}
        />
      </Box>

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
          gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(175px, 220px) minmax(0, 1fr)" },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <CategoriesRail
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
          loading={loadingCategories}
        />

        <Box aria-busy={refreshingStock} sx={{
          position: "relative", minWidth: 0,
          minHeight: { xs: refreshingStock || !products.length ? 250 : 0, lg: 360 },
        }}>
          {!refreshingStock && !products.length && (
            <Stack
              component={Paper}
              variant="outlined"
              alignItems="center"
              justifyContent="center"
              spacing={1.25}
              sx={{ height: "100%", minHeight: "inherit", p: { xs: 2.5, sm: 4 }, borderRadius: 3, textAlign: "center", bgcolor: "#fff" }}
            >
              <Box sx={{ width: 76, height: 76, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "#fff8e0", border: "1px solid #ffe6a1" }}>
                <Box component="img" src="/assets/logo1.png" alt="" sx={{ width: "76%", height: "76%", objectFit: "contain" }} />
              </Box>
              <Typography component="h3" variant="h6" fontWeight={800}>
                {search.trim() || selectedCategoryId != null ? "No encontramos productos" : "Todavía no hay productos disponibles"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {search.trim() || selectedCategoryId != null
                  ? "Prueba con otra búsqueda o selecciona una categoría diferente."
                  : "Los productos disponibles para este punto de venta aparecerán aquí."}
              </Typography>
              {(search.trim() || selectedCategoryId != null) && (
                <Button variant="outlined" onClick={() => { setSearch(""); setSelectedCategoryId(null); }} sx={{ textTransform: "none" }}>
                  Ver todos los productos
                </Button>
              )}
            </Stack>
          )}
          <Box
            sx={{
              visibility: refreshingStock ? "hidden" : "visible",
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
          {refreshingStock && (
            <Stack role="status" alignItems="center" spacing={2} sx={{
              position: "absolute", inset: 0, pt: { xs: 3, sm: 4 }, px: 2,
              border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "#fff",
            }}>
              <Box sx={{ width: 124, height: 124, position: "relative" }}>
                <CircularProgress variant="determinate" value={100} size={124} thickness={2.5} aria-hidden="true" sx={{ position: "absolute", inset: 0, color: "#dbeafe" }} />
                <CircularProgress size={124} thickness={2.5} aria-hidden="true" sx={{
                  position: "absolute", inset: 0, color: "#2563eb",
                  "& .MuiCircularProgress-circle": { strokeLinecap: "round" },
                  "@media (prefers-reduced-motion: reduce)": { animation: "none", "& circle": { animation: "none" } },
                }} />
                <Box sx={{ position: "absolute", inset: 12, borderRadius: "50%", display: "grid", placeItems: "center", boxShadow: "0 8px 30px #17203312" }}>
                  <Box component="img" src="/assets/logo1.png" alt="" sx={{ width: "80%", height: "80%", objectFit: "contain" }} />
                </Box>
              </Box>
              <Typography sx={{ color: "#1d4ed8", fontWeight: 800, textAlign: "center" }}>Actualizando existencias…</Typography>
            </Stack>
          )}
        </Box>

        {/* Paginación real (backend) */}
        {totalPages > 1 && <Paper
          sx={{
            gridColumn: { lg: 2 },
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
        </Paper>}

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
            checkoutBlocked={!cash.canSell}
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
