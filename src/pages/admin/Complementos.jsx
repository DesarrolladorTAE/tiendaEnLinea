// src/pages/Complementos.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Stack,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  Skeleton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ExtensionIcon from "@mui/icons-material/Extension";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import PaymentIcon from "@mui/icons-material/Payment";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import VerifiedIcon from "@mui/icons-material/Verified";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import axiosClient from "../../config/axiosClient";
import PaypalForm from "../../components/gateways/PaypalForm";
import complementosLocal from "../../utils/complementos";

// Helper de moneda
const moneyMX = (n) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(Number(n)) ? Number(n) : 0);

export default function ComplementosPage() {
  const [catalogo, setCatalogo] = useState([]);
  const [mis, setMis] = useState([]); // slugs adquiridos
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Para hacer scroll a la sección de pasarela
  const gatewayRef = useRef(null);

  const TIENE_PASARELA = mis.includes("pasarela_pagos");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axiosClient.get("/complementos"),
      axiosClient.get("/mis-complementos"),
    ])
      .then(([allRes, misRes]) => {
        const all = Array.isArray(allRes.data) ? allRes.data : [];
        const slugs = Array.isArray(misRes.data)
          ? misRes.data.map((c) => c.slug ?? c)
          : [];
        setMis(slugs);

        // Enriquecer solo con tipo/nota si existiera en tu utils, pero sin tocar el precio de utils
        const merged = all.map((srv) => {
          const local = complementosLocal.find(
            (l) =>
              (l.slug && srv.slug && l.slug === srv.slug) ||
              l.nombre?.replace(/[^a-zA-Z]/g, "") ===
                srv.nombre?.replace(/[^a-zA-Z]/g, "")
          );
          return {
            ...srv,
            // respetar srv.precio del API; si no hay, quedará undefined
            tipo: local?.tipo || srv.tipo || "",
            nota: local?.nota || srv.nota || "",
          };
        });
        setCatalogo(merged);
      })
      .catch(() => setError("No se pudieron cargar los complementos."))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = useMemo(() => {
    if (!q.trim()) return catalogo;
    const term = q.trim().toLowerCase();
    return catalogo.filter((c) =>
      [c.nombre, c.slug, c.descripcion].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(term)
      )
    );
  }, [q, catalogo]);

  const goToGateway = () => {
    setTab(0); // PayPal por defecto
    setTimeout(() => {
      if (gatewayRef.current) {
        gatewayRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 50);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: 6 }}>
      {/* Cabecera */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          background:
            "linear-gradient(135deg, rgba(10,18,36,1) 0%, rgba(26,33,54,1) 100%)",
          color: "#fff",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <ExtensionIcon />
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff" }}>
            Complementos
          </Typography>
        </Stack>
        <Typography
          variant="body2"
          sx={{ mt: 0.5, opacity: 0.9, color: "#fff" }}
        >
          Activa funciones extra para tu tienda. Los adquiridos se muestran con
          una insignia verde.
        </Typography>
        <TextField
          size="small"
          placeholder="Buscar complemento…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "rgba(255,255,255,0.8)" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mt: 2,
            minWidth: { xs: "100%", sm: 360 },
            "& .MuiOutlinedInput-root": {
              color: "#fff",
              "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
            },
            "& input::placeholder": {
              color: "rgba(255,255,255,0.8)",
              opacity: 1,
            },
          }}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Lista de complementos */}
      <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            {[...Array(5)].map((_, i) => (
              <Stack
                key={i}
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ py: 1.5 }}
              >
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="text" width="60%" height={24} />
                <Box flex={1} />
                <Skeleton variant="rectangular" width={100} height={32} />
              </Stack>
            ))}
          </Box>
        ) : filtrados.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <InfoOutlinedIcon sx={{ fontSize: 36, opacity: 0.6, mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              No se encontraron complementos
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Prueba ajustando el término de búsqueda.
            </Typography>
          </Box>
        ) : (
          <List>
            {filtrados.map((c, idx) => {
              const adquirido = mis.includes(c.slug);
              const esPasarela = c.slug === "pasarela_pagos";
              const secondary = c.descripcion?.trim()
                ? c.descripcion
                : c.precio != null
                ? moneyMX(c.precio)
                : "Sin descripción.";

              return (
                <React.Fragment key={c.id || c.slug || idx}>
                  <ListItem
                    divider={idx !== filtrados.length - 1}
                    sx={{
                      py: 2,
                      px: 3,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    secondaryAction={
                      adquirido ? (
                        esPasarela ? (
                          <Button
                            onClick={goToGateway}
                            variant="contained"
                            size="small"
                          >
                            Configurar pasarela
                          </Button>
                        ) : (
                          <Button variant="contained" size="small">
                            Gestionar
                          </Button>
                        )
                      ) : null
                    }
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: adquirido ? "success.main" : "grey.200",
                          color: adquirido ? "#fff" : "text.secondary",
                        }}
                      >
                        <ExtensionIcon />
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700 }}
                          >
                            {c.nombre}
                          </Typography>
                          {adquirido ? (
                            <Chip
                              size="small"
                              color="success"
                              label="Adquirido"
                              icon={<CheckCircleIcon />}
                            />
                          ) : (
                            <Chip
                              size="small"
                              label="Disponible"
                              icon={<RadioButtonUncheckedIcon />}
                              variant="outlined"
                            />
                          )}
                          {c.tipo && (
                            <Chip
                              size="small"
                              label={String(c.tipo).toUpperCase()}
                              variant="outlined"
                              color="default"
                            />
                          )}
                          {c.slug && (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={c.slug}
                            />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary" }}
                        >
                          {secondary}
                        </Typography>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>

      {/* Sección Pasarela de Pagos */}
      {TIENE_PASARELA ? (
        <Paper
          ref={gatewayRef}
          variant="outlined"
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 3,
            background: "linear-gradient(135deg, #f7f9fc 0%, #ffffff 100%)",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <PaymentIcon />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Configuración de pasarela de pagos
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, mb: 2 }}>
            Elige el proveedor y configura tus credenciales. Cada tienda cobra
            con su propia cuenta.
          </Typography>

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              mb: 2,
              "& .MuiTabs-indicator": { height: 3, borderRadius: 3 },
            }}
          >
            <Tab
              icon={<VerifiedIcon />}
              iconPosition="start"
              label="PayPal"
              sx={{ textTransform: "none", fontWeight: 700 }}
            />
            <Tab
              icon={<CreditCardIcon />}
              iconPosition="start"
              label="Conekta"
              sx={{ textTransform: "none", fontWeight: 700 }}
            />
          </Tabs>

          {tab === 0 && (
            <>
              <PaypalForm />
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption">
                Recomendación: inicia en <strong>Sandbox</strong> para pruebas y
                luego cambia a <strong>Live</strong>.
              </Typography>
            </>
          )}

          {tab === 1 && (
            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover" }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <CreditCardIcon />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Conekta (próximamente)
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Aquí podrás capturar tus llaves públicas/privadas y activar
                pagos con tarjeta con Conekta.
              </Typography>
              <Button disabled variant="contained" sx={{ mt: 2 }}>
                Configurar Conekta
              </Button>
            </Paper>
          )}
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            No cuentas con el complemento <strong>Pasarela de Pagos</strong>.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="contained">
              Adquirir
            </Button>
            <Button size="small" variant="text">
              Ver planes
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
