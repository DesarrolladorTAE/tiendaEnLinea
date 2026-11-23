import React, { useMemo } from "react";
import {
  Autocomplete,
  TextField,
  Stack,
  Avatar,
  Typography,
  CircularProgress,
  Button,
  Box,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

import { useEntitySearch } from "../../useEntitySearch";
import { imageUrlMaybe, fmtMoney } from "../../helpers";

export default function ProductPicker({
  apiBase,
  value,          // objeto producto seleccionado (o null)
  onChange,       // (product|null) => void
  label = "Producto",
  disabled = false,
  onOpenProduct,  // opcional: abrir pantalla productos
}) {
  const theme = useTheme();

  const search = useEntitySearch({
    apiBase,
    resource: "products",
    perPage: 20,
    enabled: !disabled,
  });

  const options = useMemo(() => search.items || [], [search.items]);

  return (
    <Stack spacing={1}>
      <Autocomplete
        disabled={disabled}
        options={options}
        value={value}
        loading={search.loading}
        onChange={(_, v) => onChange(v)}
        isOptionEqualToValue={(a, b) => Number(a?.id) === Number(b?.id)}
        getOptionLabel={(opt) => opt?.name ? String(opt.name) : opt?.title ? String(opt.title) : `#${opt?.id || ""}`}
        filterOptions={(x) => x} // importante: no filtrar local, ya filtramos en backend con q
        onInputChange={(_, inputValue, reason) => {
          if (reason === "input") search.setQ(inputValue);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder="Busca por nombre, SKU o código…"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {search.loading ? <CircularProgress size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, opt) => {
          const img = imageUrlMaybe(opt?.image || opt?.main_image || opt?.cover);
          const sku = opt?.sku || opt?.code || opt?.barcode || "";
          const price = opt?.price ?? opt?.sale_price ?? null;

          return (
            <Box
              component="li"
              {...props}
              key={opt.id}
              sx={{
                py: 1,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: "100%" }}>
                <Avatar
                  variant="rounded"
                  src={img || undefined}
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={800} noWrap>
                    {opt.name || opt.title || `Producto #${opt.id}`}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.75 }} noWrap>
                    {sku ? `SKU: ${sku} • ` : ""}ID: {opt.id}
                    {price != null ? ` • ${fmtMoney(price)}` : ""}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          );
        }}
        ListboxProps={{
          onScroll: (e) => {
            const list = e.currentTarget;
            const nearBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 40;
            if (nearBottom) search.loadMore();
          },
          style: { maxHeight: 360, overflow: "auto" },
        }}
      />

      {!!value?.id && (
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Seleccionado: <b>{value.name || value.title}</b> (ID: {value.id})
          </Typography>

          {!!onOpenProduct && (
            <Button
              size="small"
              variant="outlined"
              endIcon={<OpenInNewRoundedIcon />}
              onClick={() => onOpenProduct(value)}
            >
              Abrir
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}