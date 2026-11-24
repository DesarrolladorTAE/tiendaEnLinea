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
  Chip,
  Paper,
  TextField,
  alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import ProductsGrid from "./POS/ProductsGrid";
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

export default function POS({ cash, cart, setCart, posName, branchId, branchName, classic = false }) {
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
  const mobileCartOpen = (classic || !isMdUp) && cartOpen;

  useEffect(() => {
    if (isMdUp && !classic) setCartOpen(false);
  }, [isMdUp, classic]);

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

    setSelectedVariation,
    setSelectedSize,

    handleAdd,
    handleRemove,
    handleCheckout,
    refetchProducts,

    getAvailableStock,
    getQuantityInCart,
    getProductImage,
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
    if (isTouchDevice) return;

    let focusTimeout;
    const tryFocus = () => {
      if (
        scannerEnabled &&
        !showTicket &&
        !modalDescuentoActivo &&
        !mobileCartOpen &&
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
    mobileCartOpen,
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

  const onCheckout = async (payload, receiptContext) => {
    const receiptItems = cart.map(item => ({ ...item }));
    const sale = await handleCheckout(payload);
    if (!sale) return;

    setTicketData(previous => ({ ...previous, receiptItems, receiptPayload: payload, receiptContext, receiptPosName: posName }));
    setSearch("");
    setSelectedCategoryId(null);
    setSelectedVariation({});
    setSelectedSize({});
    setBarcode("");

    setPage(1);
    await refetchProducts({ nextPage: 1, categoryId: null });

    if (!isMdUp || classic) setCartOpen(true);

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

  const cartContent = showTicket ? (
    <TicketDialog open onClose={handleCloseTicket} sale={ticketData} posLocationId={posLocationId} branchId={branchId} onSend={handleSendTicket} />
  ) : (
    <Cart
      cart={cart}
      setCart={setCart}
      onRemove={handleRemove}
      onCheckout={onCheckout}
      checkoutBlocked={!cash.canSell}
      setScannerEnabled={setScannerEnabled}
      setModalDescuentoActivo={setModalDescuentoActivo}
      classic={classic}
      variant={isMdUp && !classic ? "desktop" : "mobile"}
      posLocationId={posLocationId}
    />
  );

  return (
    <Box
      sx={{
        pb: { xs: 12, md: 4 },
        bgcolor: classic ? "#fff" : undefined,
      }}
    >
      {classic ? <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2 }}><TextField fullWidth placeholder="Buscar producto (nombre o SKU)" inputProps={{ "aria-label": "Buscar producto" }} value={search} onChange={event => setSearch(event.target.value)} onFocus={() => setScannerEnabled(false)} onBlur={() => { if (!isTouchDevice) setScannerEnabled(true); }} /></Paper> : <Box component="section" aria-labelledby="pos-product-list-title" className="bg-dark text-white shadow rounded" sx={{ p: { xs: 1.5, sm: 1.75 }, mb: 1.5, "& .mb-3": { mb: "0 !important" }, "& .MuiOutlinedInput-root": { borderRadius: "6px" }, "& .MuiInputBase-input": { py: 1 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} mb={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography id="pos-product-list-title" component="h2" sx={{ color: "#fff !important", fontSize: { xs: 20, sm: 24 }, fontWeight: 800, lineHeight: 1.2, mb: 0.4 }}>
              <span aria-hidden="true">🛒 </span>Productos
            </Typography>
            {(branchName || branchId || posName) && (
              <span className="badge bg-warning text-dark">
                <span aria-hidden="true">📍 </span>
                {branchName ? `Sucursal: ${branchName}` : branchId ? `Sucursal #${branchId}` : posName}
              </span>
            )}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{
            px: 1, py: 0.75, minWidth: 0, borderRadius: "8px",
            border: "1px solid rgba(255,255,255,.1)", background: "linear-gradient(120deg, #292c30, #202226)",
          }}>
            <Box sx={{ width: 32, height: 32, borderRadius: "6px", display: "grid", placeItems: "center", flexShrink: 0, color: "#f6ce73", bgcolor: "rgba(246,206,115,.1)", border: "1px solid rgba(246,206,115,.12)" }}>
              <FiPackage size={18} aria-hidden="true" />
            </Box>
            <Box role="status" sx={{ flex: 1 }}>
              <Typography sx={{ color: "#a8adb5 !important", fontSize: 11 }}>{search.trim() || selectedCategoryId != null ? "Resultados" : "En este punto de venta"}</Typography>
              <Stack direction="row" spacing={0.75} alignItems="baseline">
                <Typography sx={{ color: "#fff !important", fontSize: 19, fontWeight: 700, lineHeight: 1.2 }}>{Number(meta?.total ?? products.length).toLocaleString("es-MX")}</Typography>
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
                width: 36, height: 36, flexShrink: 0, borderRadius: 1,
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
      </Box>}

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
          gridTemplateColumns: classic ? { xs: "minmax(0, 1fr)", md: "minmax(200px, 260px) minmax(0, 1fr)" } : {
            xs: "minmax(0, 1fr)",
            md: "minmax(0, 1fr) minmax(290px, 0.95fr)",
            lg: "minmax(145px, 175px) minmax(0, 1fr) minmax(320px, 1fr)",
          },
          gridTemplateAreas: classic ? { xs: '"categories" "products" "pagination"', md: '"categories products" "categories pagination"' } : {
            xs: '"categories" "products" "pagination"',
            md: '"categories categories" "products cart" "pagination cart"',
            lg: '"categories products cart" "categories pagination cart"',
          },
          gridTemplateRows: "auto auto min-content",
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <Box sx={{ gridArea: "categories", minWidth: 0, display: "grid" }}>
          <CategoriesRail
            classic={classic}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
            loading={loadingCategories}
          />
        </Box>

        <Box aria-busy={refreshingStock} sx={{
          gridArea: "products", position: "relative", minWidth: 0,
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
          {!refreshingStock && products.length > 0 && (classic ? (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ mb: 1.25 }}>
                <Box>
                  <Typography component="h2" sx={{ fontWeight: 900, fontSize: 22 }}>Productos</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Number(meta?.total ?? products.length).toLocaleString("es-MX")} encontrados
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5} minWidth={0}>
                  <Chip size="small" variant="outlined" sx={{ fontWeight: 800, minWidth: 0 }}
                    label={selectedCategoryId == null ? "Todas las categorías" : categories.find(item => String(item.id) === String(selectedCategoryId))?.name ?? "Categoría seleccionada"} />
                  <IconButton onClick={refreshStock} aria-label="Actualizar stock" size="small"><RefreshRoundedIcon /></IconButton>
                </Stack>
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
                {products.map(product => (
                  <ProductCard key={product.id} classic product={product} cart={cart} onAdd={handleAdd}
                    getQuantityInCart={getQuantityInCart} getAvailableStock={getAvailableStock} getProductImage={getProductImage} />
                ))}
              </Box>
            </>
          ) : <ProductsGrid
              products={products}
              cart={cart}
              onAdd={handleAdd}
              getQuantityInCart={getQuantityInCart}
              getAvailableStock={getAvailableStock}
              getProductImage={getProductImage}
            />) }
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
            gridArea: "pagination",
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

        {isMdUp && !classic && (
          <Box component="section" aria-labelledby="pos-order-title" sx={{ gridArea: "cart", minWidth: 0 }}>
            <Typography id="pos-order-title" component="h2" variant="h6" sx={{ mb: 0, px: 2, py: 1.25, fontWeight: 900, bgcolor: "#1c1f24", color: "#fff", borderTop: "3px solid #ffba08", borderRadius: "12px 12px 0 0" }}>
              {showTicket ? "Ticket de venta" : "Tu orden"}
            </Typography>
            {cartContent}
          </Box>
        )}


      </Box>

      {(!isMdUp || classic) && (
        <>
          <Box sx={{ position: "fixed", right: 20, bottom: 96, zIndex: 1500 }}>
            <Badge badgeContent={cartCount} color="error">
              <IconButton
                aria-label={cartOpen ? "Cerrar carrito" : "Abrir carrito"}
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
            anchor={classic && isMdUp ? "right" : "bottom"}
            open={mobileCartOpen}
            onClose={() => setCartOpen(false)}
            disableScrollLock
            ModalProps={{
              keepMounted: true,
              disableEnforceFocus: true,
            }}
            PaperProps={{
              sx: {
                height: "100svh",
                maxHeight: "100svh",
                width: classic && isMdUp ? 416 : "100%",
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
                background: classic ? "#fff" : "#1c1f24",
                color: classic ? "#111" : "#fff",
                flexShrink: 0,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  {showTicket ? "Ticket de venta" : "Tu orden"}
                </Typography>

                <Typography
                  sx={{
                    fontSize: 12,
                    color: classic ? "text.secondary" : "#d1d5db",
                  }}
                >
                  {cartCount} producto(s)
                </Typography>
              </Box>

              <IconButton aria-label="Cerrar carrito" onClick={() => setCartOpen(false)} sx={{ color: classic ? "text.secondary" : "#fff" }}>
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
              {cartContent}
            </Box>
          </Drawer>
        </>
      )}
    </Box>
  );
}
