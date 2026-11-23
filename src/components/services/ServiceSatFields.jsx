import React, { useEffect, useState } from "react";
import { Autocomplete, CircularProgress, Grid, TextField } from "@mui/material";
import { buscarClavesProducto, buscarClavesUnidad } from "../../services/taecontaApi";
import { useDebounce } from "../../hooks/useDebounce";

function SatAutocomplete({ label, placeholder, value, onChange, search }) {
  const [input, setInput] = useState(value || "");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(input, 350);

  useEffect(() => {
    if (value && !input) setInput(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    let alive = true;
    const query = String(debounced || "").trim();
    if (query.length < 2) { setOptions([]); setLoading(false); return undefined; }
    setLoading(true);
    search(query).then((items) => { if (alive) setOptions(Array.isArray(items) ? items : []); }).catch(() => { if (alive) setOptions([]); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [debounced, search]);

  return <Autocomplete
    freeSolo
    options={options}
    inputValue={input}
    filterOptions={(items) => items}
    getOptionLabel={(option) => typeof option === "string" ? option : `${option.clave} - ${option.descripcion}`}
    isOptionEqualToValue={(option, selected) => option.clave === selected?.clave}
    onInputChange={(_, next, reason) => { setInput(next); if (reason === "input" || reason === "clear") onChange(next); }}
    onChange={(_, option) => { if (!option) { onChange(""); return; } setInput(`${option.clave} - ${option.descripcion}`); onChange(option.clave); setOptions([]); }}
    loading={loading}
    noOptionsText="Sin resultados"
    loadingText="Buscando…"
    renderInput={(params) => <TextField {...params} label={label} placeholder={placeholder} fullWidth InputProps={{ ...params.InputProps, endAdornment: <>{loading && <CircularProgress color="inherit" size={18} />}{params.InputProps.endAdornment}</> }} />}
  />;
}

export default function ServiceSatFields({ form, setValue }) {
  return <Grid container spacing={2}>
    <Grid size={{ xs: 12, md: 6 }}><SatAutocomplete label="Clave Producto/Servicio SAT" placeholder="Buscar clave o descripción" value={form.sat_product_code} onChange={(value) => setValue("sat_product_code", value)} search={buscarClavesProducto} /></Grid>
    <Grid size={{ xs: 12, md: 6 }}><SatAutocomplete label="Clave Unidad SAT" placeholder="Ej. servicio, E48" value={form.sat_unit_code} onChange={(value) => setValue("sat_unit_code", value)} search={buscarClavesUnidad} /></Grid>
  </Grid>;
}
