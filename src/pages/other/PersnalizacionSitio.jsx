import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import TiendaNoDisponible from "./TiendaNoDisponible";

// Vistas
import Catalogo from "../shop/Catalogo";
import VistaPlan2 from "../home/HomeFashionSix";
import VistaPlan3 from "../home/HomeFurniture";
import VistaPlan4 from "../home/HomeFurniture";

export default function PersonalizacionSitio({
  customStoreSlug = null,
}) {
  const { storeSlug: routeStoreSlug } = useParams();

  // ✅ Si viene de dominio personalizado usa ese slug.
  // ✅ Si viene de /tienda/:storeSlug usa el parámetro de la URL.
  const storeSlug = customStoreSlug || routeStoreSlug;

  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;

    // Evita hacer la petición si por alguna razón no existe slug
    if (!storeSlug) {
      setData({
        ok: false,
        expired: true,
      });

      return () => {
        alive = false;
      };
    }

    // Limpia la información anterior si cambia de tienda
    setData(null);

    axios
      .get(
        `https://mitiendaenlineamx.com.mx/api/public/tienda/${encodeURIComponent(
          storeSlug,
        )}/vista`,
      )
      .then(({ data }) => {
        if (!alive) return;

        // ✅ Normaliza storeId aunque venga con distinto nombre
        const normalized = {
          ...data,
          storeId:
            data?.id_store ??
            data?.store_id ??
            data?.id_store_fk ??
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

  // Render según plan
  if (data.plan_id === 1) {
    return (
      <Catalogo
        storeId={storeId}
        storeSlug={storeSlug}
      />
    );
  }

  if (data.plan_id === 2) {
    return (
      <VistaPlan2
        storeId={storeId}
        storeSlug={storeSlug}
      />
    );
  }

  if (data.plan_id === 3) {
    return (
      <VistaPlan3
        storeId={storeId}
        storeSlug={storeSlug}
      />
    );
  }

  if (data.plan_id === 4) {
    return (
      <VistaPlan4
        storeId={storeId}
        storeSlug={storeSlug}
      />
    );
  }

  return (
    <VistaPlan4
      storeId={storeId}
      storeSlug={storeSlug}
    />
  );
}