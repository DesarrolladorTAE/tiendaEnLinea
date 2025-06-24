import React, { useState } from "react";
import { TableRow, TableCell, Chip, Button, Tooltip } from "@mui/material";
import { formatoFecha, puedeFacturar } from "../../utils/helpers";
import ModalAutofactura from "./ModalAutofactura";
import ModalPDF from "./ModalPDF";
import ModalXML from "./ModalXML";
import complementos from "../../utils/complementos";
import axiosClient from "../../config/axiosClient";
import { showSuccess, showError } from "../../utils/alerts";

const FilaSuscripcion = ({ item, planes, onFacturado }) => {
  const [openAuto, setOpenAuto] = useState(false);
  const [openPDF, setOpenPDF] = useState(false);
  const [openXML, setOpenXML] = useState(false);
  const puede = puedeFacturar(item.created_at);

  const nombrePlan = item.plan_id
    ? planes.find((p) => p.plan_id === Number(item.plan_id))?.nombre
    : complementos.find(
        (c) =>
          c.complemento_id === Number(item.store_complemento?.complemento_id)
      )?.nombre || "Complemento";

  const descripcionPlan = item.plan_id
    ? planes.find((p) => p.plan_id === Number(item.plan_id))?.descripcion
    : "";

  const handleTimbrado = async ({ usoCFDI }) => {
    try {
      await axiosClient.post("/autofactura/timbrar", {
        subscription_id: item.id,
        uso_cfdi: usoCFDI,
      });

      showSuccess("Factura generada correctamente");
      setOpenAuto(false);
      onFacturado(); // 🔄 refrescar la tabla o fila
    } catch (error) {
      if (error?.response) {
        console.error("Error respuesta:", error.response);
      } else {
        console.error("Error sin respuesta:", error);
      }

      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Ocurrió un error al timbrar.";

      showError(msg);
    }
  };

  const facturaContent = () => {
    if (item.pdf_url && item.xml_url) {
      return (
        <>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={() => setOpenPDF(true)}
            style={{ marginRight: 4 }}
          >
            PDF
          </Button>
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={() => setOpenXML(true)}
          >
            XML
          </Button>
        </>
      );
    }

    if (!puede) {
      return <Chip label="No facturada" size="small" color="default" />;
    }

    return (
      <Button
        size="small"
        color="warning"
        variant="contained"
        onClick={() => setOpenAuto(true)}
      >
        Sin facturar
      </Button>
    );
  };

  return (
    <>
      <TableRow>
        <TableCell>{formatoFecha(item.created_at)}</TableCell>
        <TableCell>{item.fin ? formatoFecha(item.fin) : ""}</TableCell>
        <TableCell>
          <Tooltip title={descripcionPlan}>
            <span>{nombrePlan || "N/A"}</span>
          </Tooltip>
        </TableCell>
        <TableCell>${parseFloat(item.monto).toFixed(2)}</TableCell>
        <TableCell>
          <Chip
            label={item.status}
            size="small"
            color={
              item.status === "active"
                ? "success"
                : item.status === "trial"
                ? "info"
                : item.status === "expired"
                ? "warning"
                : "default"
            }
          />
        </TableCell>
        <TableCell>{facturaContent()}</TableCell>
      </TableRow>

      <ModalAutofactura
        open={openAuto}
        onClose={() => setOpenAuto(false)}
        onSubmit={handleTimbrado}
        monto={item.monto}
        referencia={`TLR${item.id}`}
        fecha={formatoFecha(item.created_at, true)}
        concepto={nombrePlan}
      />

      <ModalPDF
        open={openPDF}
        onClose={() => setOpenPDF(false)}
        pdfUrl={item.pdf_url}
        fileName={item.pdf_url?.split("/").pop() || `factura_${item.id}.pdf`}
      />

      <ModalXML
        open={openXML}
        onClose={() => setOpenXML(false)}
        downloadUrl={item.xml_url}
        fileName={item.xml_url?.split("/").pop() || `factura_${item.id}.xml`}
      />
    </>
  );
};

export default FilaSuscripcion;
