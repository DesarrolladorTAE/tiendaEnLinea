import React, { useState } from "react";
import {
  Accordion, AccordionSummary, AccordionDetails,
  TextField, Typography, Grid, Button, Avatar, Select,
  MenuItem, InputLabel, FormControl, FormHelperText
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import axios from "../../axiosConfig";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/slices/userSlice";
import { REGIMENES_SAT } from "../../utils/regimenesSat";

const FiscalDataPanel = ({ expanded, handleChange, user }) => {
  const [fiscalData, setFiscalData] = useState({
    rfc: user?.rfc || "",
    razon_social: user?.razon_social || "",
    codigo_regimen: user?.codigo_regimen || "",
    domicilio_fac: user?.domicilio_fac || ""
  });

  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();

  const handleChangeField = (field) => (e) => {
    setFiscalData({ ...fiscalData, [field]: e.target.value });
  };

  const handleFiscalSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put("/users/fiscal-data", {
        rfc: fiscalData.rfc.trim().toUpperCase(),
        razon_social: fiscalData.razon_social.trim(),
        codigo_regimen: fiscalData.codigo_regimen.trim(),
        domicilio_fac: fiscalData.domicilio_fac.trim()
      });

      toast.success("Datos fiscales actualizados correctamente");
      dispatch(setUser({
        user: { ...user, ...res.data },
        token: localStorage.getItem("token")
      }));
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "No se pudieron actualizar los datos fiscales. Intenta de nuevo."
      );
    }
    setSaving(false);
  };

  return (
    <Accordion
      expanded={expanded === "panelFiscal"}
      onChange={handleChange("panelFiscal")}
      sx={{ borderRadius: 3, mb: 2, background: "#f3f6fb" }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Avatar sx={{ bgcolor: "#111c4e", mr: 2, width: 44, height: 44 }}>
          <ReceiptLongIcon />
        </Avatar>
        <Typography fontWeight={700} fontSize={{ xs: 17, md: 19 }} color="#111c4e">
          Datos Fiscales para Facturación
        </Typography>
      </AccordionSummary>

      <AccordionDetails>
        <Typography variant="body2" sx={{ color: "#5e6c87", mb: 3 }}>
          Estos datos se usarán para emitir tus facturas.
          <br />
          <b>Verifica que coincidan exactamente con tu constancia fiscal del SAT.</b>
        </Typography>

        <form onSubmit={handleFiscalSubmit}>
          <Grid container spacing={2}>
            {/* RFC */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="RFC"
                name="rfc"
                value={fiscalData.rfc}
                onChange={handleChangeField("rfc")}
                inputProps={{ maxLength: 13, style: { letterSpacing: 1.2 } }}
                autoComplete="off"
                sx={{ bgcolor: "#f8fafc", borderRadius: 2 }}
              />
            </Grid>

            {/* Razón Social */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Razón Social (Nombre fiscal SAT)"
                name="razon_social"
                value={fiscalData.razon_social}
                onChange={handleChangeField("razon_social")}
                autoComplete="off"
                sx={{ bgcolor: "#f8fafc", borderRadius: 2 }}
              />
            </Grid>

            {/* Régimen Fiscal */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ bgcolor: "#f8fafc", borderRadius: 2 }}>
                <InputLabel id="regimen-label">Régimen Fiscal</InputLabel>
                <Select
                  labelId="regimen-label"
                  value={fiscalData.codigo_regimen}
                  onChange={handleChangeField("codigo_regimen")}
                  label="Régimen Fiscal"
                >
                  {REGIMENES_SAT.map((reg) => (
                    <MenuItem key={reg.codigo} value={reg.codigo}>
                      {reg.codigo} - {reg.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {!fiscalData.codigo_regimen && (
                  <FormHelperText>Debes seleccionar un régimen para poder facturar</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Código Postal */}
            <Grid item xs={12} md={fiscalData.codigo_regimen ? 6 : 12}>
              <TextField
                fullWidth
                label="Código Postal del Domicilio Fiscal"
                name="domicilio_fac"
                value={fiscalData.domicilio_fac}
                onChange={handleChangeField("domicilio_fac")}
                autoComplete="off"
                sx={{ bgcolor: "#f8fafc", borderRadius: 2 }}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            sx={{ mt: 2, px: 2, fontWeight: 700, fontSize: 13 }}
            size="medium"
            variant="contained"
            color="secondary"
            endIcon={<SaveAltIcon />}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar Datos Fiscales"}
          </Button>
        </form>
      </AccordionDetails>
    </Accordion>
  );
};

export default FiscalDataPanel;
