// src/pages/Complementos.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import axiosClient from "../../config/axiosClient";
import complementosLocal from "../../utils/complementos";
import PaypalModal from "../../components/gateways/PaypalForm"; // 👈 modal nuevo
import OfflineAccountsModal from "../../components/gateways/OfflineAccountsModal";


// Helper moneda
const moneyMX = (n) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(Number(n)) ? Number(n) : 0);

// Normalizador seguro (para comparar nombres/slugs)
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

export default function ComplementosPage() {
  const [catalogo, setCatalogo] = useState([]);
  const [mis, setMis] = useState({ ids: new Set(), slugs: new Set(), names: new Set() });
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paypalOpen, setPaypalOpen] = useState(false);
  const [offlineOpen, setOfflineOpen] = useState(false);


  const gatewayRef = useRef(null);

  // Saber si el usuario tiene el complemento de pasarela (slugs o nombres comunes)
  const TIENE_PASARELA =
    mis.slugs.has("pasarela_pagos") ||
    mis.names.has("pasarela pagos") ||
    mis.names.has("implementacion de pasarela de pago") ||
    mis.names.has("implementacion pasarela de pago");

  useEffect(() => {
    setLoading(true);
    Promise.all([axiosClient.get("/complementos"), axiosClient.get("/mis-complementos")])
      .then(([allRes, misRes]) => {
        const all = Array.isArray(allRes.data) ? allRes.data : [];
        const raw = misRes?.data?.data ?? misRes?.data ?? [];
        const list = Array.isArray(raw) ? raw : [];

        const ids = new Set();
        const slugs = new Set();
        const names = new Set();

        list.forEach((item) => {
          if (item && typeof item === "object") {
            if (item.id != null) ids.add(String(item.id));
            if (item.complemento_id != null) ids.add(String(item.complemento_id));
            if (item.slug) slugs.add(norm(item.slug));
            if (item.nombre) names.add(norm(item.nombre));
          } else {
            slugs.add(norm(String(item)));
          }
        });

        setMis({ ids, slugs, names });

        const merged = all.map((srv) => {
          const local = complementosLocal.find(
            (l) =>
              (l.slug && srv.slug && norm(l.slug) === norm(srv.slug)) ||
              norm(l.nombre) === norm(srv.nombre) ||
              String(l.complemento_id) === String(srv.id ?? srv.complemento_id)
          );
          return {
            ...srv,
            tipo: local?.tipo || srv.tipo || "",
            nota: local?.nota || srv.nota || "",
          };
        });

        setCatalogo(merged);
      })
      .catch(() => setError("No se pudieron cargar los complementos."))
      .finally(() => setLoading(false));
  }, []);

  // Determina si un ítem está adquirido (por id, slug o nombre)
  const estaAdquirido = (item) => {
    const idA = String(item.id ?? item.complemento_id ?? "");
    const slugA = norm(item.slug);
    const nameA = norm(item.nombre);
    return (
      (!!idA && mis.ids.has(idA)) ||
      (!!slugA && mis.slugs.has(slugA)) ||
      (!!nameA && mis.names.has(nameA))
    );
  };

  const filtrados = useMemo(() => {
    if (!q.trim()) return catalogo;
    const term = q.trim().toLowerCase();
    return catalogo.filter((c) =>
      [c.nombre, c.slug, c.descripcion].some((v) =>
        String(v || "").toLowerCase().includes(term)
      )
    );
  }, [q, catalogo]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, pb: 6 }}>
      {/* Cabecera */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          background: "linear-gradient(135deg, rgba(10,18,36,1) 0%, rgba(26,33,54,1) 100%)",
          color: "#fff",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <ExtensionIcon />
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff" }}>
            Complementos
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9, color: "#fff" }}>
          Activa funciones extra para tu tienda. Los adquiridos se muestran con una insignia verde.
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
              const adquirido = estaAdquirido(c);
              const esPasarela =
                norm(c.slug) === "pasarela_pagos" || norm(c.nombre).includes("pasarela");
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
                      adquirido && esPasarela ? (
                        <Stack direction="row" spacing={1}>
                          <Button onClick={() => setPaypalOpen(true)} variant="contained" size="small">
                            Configurar PayPal
                          </Button>

                          <Button onClick={() => setOfflineOpen(true)} variant="contained" size="small">
                            Configurar cuentas
                          </Button>
                        </Stack>
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
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
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
                        </Stack>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
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

      {/* Modal PayPal */}
      <PaypalModal open={paypalOpen} onClose={() => setPaypalOpen(false)} />
      <OfflineAccountsModal open={offlineOpen} onClose={() => setOfflineOpen(false)} />

    </Box>
  );
}
