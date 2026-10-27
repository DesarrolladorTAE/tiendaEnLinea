import React, { useState } from "react";
import { Button, Stack } from "@mui/material";
import { FiExternalLink, FiShare2 } from "react-icons/fi";
import Swal from "sweetalert2";
import { DEFAULT_ORIGIN, packagePath } from "../../utils/publicSeo.mjs";

export default function PackageShare({ product }) {
  const [busy, setBusy] = useState(false);
  const path = packagePath(product);
  const share = async () => {
    if (busy) return;
    setBusy(true);
    const url = new URL(path, import.meta.env.VITE_SITE_URL || DEFAULT_ORIGIN).href;
    try {
      if (navigator.share) await navigator.share({ title: product.Nombre || product.name, url });
      else {
        await navigator.clipboard.writeText(url);
        await Swal.fire({ icon: "success", title: "Enlace copiado", text: "Comparte la ficha pública con los beneficios del paquete.", didOpen: popup => { popup.parentElement.style.zIndex = "2000"; } });
      }
    } catch (error) {
      if (error.name !== "AbortError") await Swal.fire({ icon: "info", title: "Comparte este enlace", text: url, didOpen: popup => { popup.parentElement.style.zIndex = "2000"; } });
    } finally { setBusy(false); }
  };
  return <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
    <Button variant="contained" startIcon={<FiShare2 />} disabled={busy} onClick={share}>Compartir paquete</Button>
    <Button component="a" href={path} target="_blank" rel="noopener noreferrer" variant="outlined" startIcon={<FiExternalLink />}>Ver ficha pública</Button>
  </Stack>;
}
