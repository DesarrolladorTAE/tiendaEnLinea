import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import TiendaNoDisponible from "./TiendaNoDisponible";

// Vistas
import Catalogo from "../shop/Catalogo";
import VistaPlan2 from "../home/HomeFashionSix";
import VistaPlan3 from "../home/HomeFurniture";
import VistaPlan4 from "../home/HomeFurniture";

export default function PersonalizacionSitio() {
  const { storeSlug } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    axios
      .get(`https://mitiendaenlineamx.com.mx/api/public/tienda/${storeSlug}/vista`)
      .then(({ data }) => { if (alive) setData(data); })
      .catch(() => { if (alive) setData({ ok: false, expired: true }); });
    return () => { alive = false; };
  }, [storeSlug]);

  if (!data) return <div>Cargando…</div>;
  if (!data.ok || data.expired) return <TiendaNoDisponible />;

  // Render según plan
  if (data.plan_id === 1) return <Catalogo />; // demo (sin necesidad de id)
  if (data.plan_id === 2) return <VistaPlan2 storeId={data.id_store} storeSlug={storeSlug} />;
  if (data.plan_id === 3) return <VistaPlan3 storeId={data.id_store} storeSlug={storeSlug} />;
  if (data.plan_id === 4) return <VistaPlan4 storeId={data.id_store} storeSlug={storeSlug} />;
  return <VistaPlan4 storeId={data.id_store} storeSlug={storeSlug} />;
}
