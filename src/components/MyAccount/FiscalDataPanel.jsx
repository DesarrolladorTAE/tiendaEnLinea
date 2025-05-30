import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Typography,
  Grid,
  Button,
  Avatar,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
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
    regimen_fiscal: user?.regimen_fiscal || "",
  });
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();

  const handleFiscalChange = (e) => {
    setFiscalData({
      ...fiscalData,
      [e.target.name]: e.target.value.toUpperCase(),
    });
  };

  // Cuando cambia el régimen fiscal, pon el código también como razón social
  const handleRegimenChange = (e) => {
    const selectedRegimen = REGIMENES_SAT.find(
      (reg) => reg.codigo === e.target.value
    );
    setFiscalData({
      ...fiscalData,
      regimen_fiscal: selectedRegimen.codigo,
      razon_social: selectedRegimen.codigo, // <-- Aquí pones el código automáticamente
    });
  };

  const handleFiscalSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put("/users/fiscal-data", {
        rfc: fiscalData.rfc.trim(),
        razon_social: fiscalData.razon_social.trim(), // <-- será el código del régimen
        regimen_fiscal: fiscalData.regimen_fiscal,
      });
      toast.success("Datos fiscales actualizados correctamente");
      dispatch(
        setUser({
          user: { ...user, ...res.data },
          token: localStorage.getItem("token"),
        })
      );
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
      sx={{
        borderRadius: 3,
        mb: 2,
        background: "#f3f6fb",
        ".MuiAccordionSummary-root": { minHeight: 64 },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Avatar
          sx={{
            bgcolor: "#111c4e",
            mr: 2,
            width: 44,
            height: 44,
            boxShadow: "0 2px 10px 0 rgba(30,60,150,.11)",
          }}
        >
          <ReceiptLongIcon />
        </Avatar>
        <Typography
          fontWeight={700}
          fontSize={{ xs: 17, md: 19 }}
          color="#111c4e"
        >
          Datos Fiscales para Facturación
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" sx={{ color: "#5e6c87", mb: 3 }}>
          Estos datos se usarán para la emisión de tus facturas.
          <br />
          <b>
            Verifica que coincidan exactamente con tu constancia de situación
            fiscal del SAT.
          </b>
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="RFC"
              name="rfc"
              value={fiscalData.rfc}
              onChange={handleFiscalChange}
              inputProps={{ maxLength: 13, style: { letterSpacing: 1.2 } }}
              autoComplete="off"
              sx={{
                bgcolor: "#f8fafc",
                borderRadius: 2,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Razón Social (código de régimen)"
              name="razon_social"
              value={fiscalData.razon_social}
              onChange={handleFiscalChange}
              autoComplete="off"
              sx={{
                bgcolor: "#f8fafc",
                borderRadius: 2,
              }}
              disabled // deshabilitado para que solo lo cambie el select
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="regimen-fiscal-label">Régimen Fiscal</InputLabel>
              <Select
                labelId="regimen-fiscal-label"
                name="regimen_fiscal"
                value={fiscalData.regimen_fiscal}
                label="Régimen Fiscal"
                onChange={handleRegimenChange}
                sx={{
                  bgcolor: "#f8fafc",
                  borderRadius: 2,
                  minWidth: 180,
                }}
              >
                {REGIMENES_SAT.map((regimen) => (
                  <MenuItem key={regimen.codigo} value={regimen.codigo}>
                    {regimen.codigo} - {regimen.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Button
          sx={{
            mt: 2,
            px: 2, // ancho horizontal (antes 4)
            fontWeight: 700,
            letterSpacing: 1,
            boxShadow: "0 2px 8px 0 rgba(60,90,140,.14)",
            transition: "all .2s",
            fontSize: { xs: 6, md: 12 },
          }}
          size="medium"
          variant="contained"
          color="secondary"
          endIcon={<SaveAltIcon />}
          disabled={saving}
          onClick={handleFiscalSave}
        >
          {saving ? "Guardando..." : "Guardar Datos Fiscales"}
        </Button>
      </AccordionDetails>
    </Accordion>
  );
};

export default FiscalDataPanel;
