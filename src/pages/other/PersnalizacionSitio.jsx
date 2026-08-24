import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import TiendaNoDisponible from "./TiendaNoDisponible";

import Catalogo from "../shop/Catalogo";
import VistaNegocio from "../home/HomeFashionSix";
import VistaProfesional from "../home/HomeFurniture";
import VistaAvanzado from "../home/HomeFurniture";

export default function PersonalizacionSitio({
  customStoreSlug = null,
}) {
  const { storeSlug: routeStoreSlug } = useParams();

  const storeSlug = customStoreSlug || routeStoreSlug;

  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;

    if (!storeSlug) {
      setData({
        ok: false,
        expired: true,
      });

      return () => {
        alive = false;
      };
    }

    setData(null);

    axios
      .get(
        `https://mitiendaenlineamx.com.mx/api/public/storefront/${encodeURIComponent(
          storeSlug,
        )}`,
      )
      .then(({ data }) => {
        if (!alive) return;

        const normalized = {
          ...data,

          storeId:
            data?.store?.id ??
            data?.id_store ??
            data?.store_id ??
            data?.id_store_fk ??
            null,

          branchId:
            data?.branch?.id ??
            data?.branch_id ??
            null,

          planId:
            Number(
              data?.plan?.id ??
              data?.plan_id ??
              1,
            ),

          template:
            data?.sitio?.template ??
            data?.template ??
            null,
        };

        setData(normalized);
      })
      .catch(() => {
        if (!alive) return;

        setData({
          ok: false,
          expired: true,
        });
      });

    return () => {
      alive = false;
    };
  }, [storeSlug]);

  if (!data) {
    return <div>Cargando…</div>;
  }

  if (!data.ok || data.expired) {
    return <TiendaNoDisponible />;
  }

  const storeId = data.storeId;
  const branchId = data.branchId;
  const planId = data.planId;
  const template = data.template;

  const commonProps = {
    storeId,
    branchId,
    storeSlug,
    storefrontData: data,
    sitio: data?.sitio ?? null,
    store: data?.store ?? null,
    branch: data?.branch ?? null,
    plan: data?.plan ?? null,
  };

  const renderTemplate = () => {
    if (planId === 1) {
      switch (template) {
        case "negocio":
          return <VistaNegocio {...commonProps} />;

        case "profesional":
          return <VistaProfesional {...commonProps} />;

        case "avanzado":
          return <VistaAvanzado {...commonProps} />;

        case "catalogo":
        default:
          return <Catalogo {...commonProps} />;
      }
    }

    if (planId === 2) {
      return <VistaNegocio {...commonProps} />;
    }

    if (planId === 3) {
      return <VistaProfesional {...commonProps} />;
    }

    if (planId === 4) {
      return <VistaAvanzado {...commonProps} />;
    }

    return <Catalogo {...commonProps} />;
  };

  return renderTemplate();
}