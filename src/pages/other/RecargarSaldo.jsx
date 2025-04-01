import React, { Fragment } from "react";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import RecargaForm from "../../components/conekta/RecargaForm";
import { useLocation } from "react-router-dom";

const RecargarSaldo = () => {
  const { pathname } = useLocation();

  return (
    <Fragment>
      {/* SEO dinámico para motores de búsqueda */}
      <SEO
        titleTemplate="Recargar"
        description="Recarga saldo a tu monedero de forma segura usando tu tarjeta bancaria con Conekta."
      />

      {/* Layout principal con encabezado visible */}
      <LayoutOne headerTop="visible">
        {/* Breadcrumb de navegación (opcional si quieres mostrar ruta) */}
        <Breadcrumb
          pages={[
            { label: "Inicio", path: "/" },
            { label: "Recargar Saldo", path: pathname },
          ]}
        />

        {/* Contenido principal de la recarga */}
        <div className="pagina-conekta-completa">
          <RecargaForm />
        </div>
      </LayoutOne>
    </Fragment>
  );
};

export default RecargarSaldo;
