import React, { useEffect, useState } from "react";
import {
  buscarClavesProducto,
  buscarClavesUnidad,
  buscarUnidadesMedida,
} from "../../../services/taecontaApi";
import { useDebounce } from "../../../hooks/useDebounce";

export default function SatFields({ register, setValue, watch }) {
  const [opcionesClaveProducto, setOpcionesClaveProducto] = useState([]);
  const [opcionesClaveUnidad, setOpcionesClaveUnidad] = useState([]);
  const [opcionesUnidadMedida, setOpcionesUnidadMedida] = useState([]);

  const claveProductoRHF = watch("clave_producto_servicio") || "";
  const claveUnidadRHF = watch("clave_unidad") || "";
  const unidadMedidaTextoRHF = watch("unidad_medida_texto") || "";
  const unidadMedidaIdRHF = watch("unidad_medida_id") || "";

  const [claveProdInput, setClaveProdInput] = useState("");
  const [claveUnidadInput, setClaveUnidadInput] = useState("");
  const [unidadMedidaInput, setUnidadMedidaInput] = useState("");

  // ✅ valores con debounce
  const debClaveProd = useDebounce(claveProdInput, 350);
  const debClaveUnidad = useDebounce(claveUnidadInput, 350);
  const debUnidadMedida = useDebounce(unidadMedidaInput, 350);

  // ✅ Sync al cargar/editar
  useEffect(() => {
    if (claveProductoRHF && claveProdInput === "") setClaveProdInput(String(claveProductoRHF));
    if (claveUnidadRHF && claveUnidadInput === "") setClaveUnidadInput(String(claveUnidadRHF));
    if (unidadMedidaTextoRHF && unidadMedidaInput === "") setUnidadMedidaInput(String(unidadMedidaTextoRHF));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveProductoRHF, claveUnidadRHF, unidadMedidaTextoRHF, unidadMedidaIdRHF]);

  // ✅ Buscar Unidad de Medida (debounced)
  useEffect(() => {
    let alive = true;

    (async () => {
      const q = (debUnidadMedida || "").trim();
      if (q.length < 2) {
        setOpcionesUnidadMedida([]);
        return;
      }
      try {
        const res = await buscarUnidadesMedida(q);
        if (alive) setOpcionesUnidadMedida(res || []);
      } catch (e) {
        if (alive) setOpcionesUnidadMedida([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [debUnidadMedida]);

  // ✅ Buscar Clave Producto SAT (debounced)
  useEffect(() => {
    let alive = true;

    (async () => {
      const q = (debClaveProd || "").trim();
      if (q.length < 2) {
        setOpcionesClaveProducto([]);
        return;
      }
      try {
        const res = await buscarClavesProducto(q);
        if (alive) setOpcionesClaveProducto(res || []);
      } catch (e) {
        if (alive) setOpcionesClaveProducto([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [debClaveProd]);

  // ✅ Buscar Clave Unidad SAT (debounced)
  useEffect(() => {
    let alive = true;

    (async () => {
      const q = (debClaveUnidad || "").trim();
      if (q.length < 2) {
        setOpcionesClaveUnidad([]);
        return;
      }
      try {
        const res = await buscarClavesUnidad(q);
        if (alive) setOpcionesClaveUnidad(res || []);
      } catch (e) {
        if (alive) setOpcionesClaveUnidad([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [debClaveUnidad]);

  return (
    <>
      {/* Unidad de Medida */}
      <div className="position-relative col-md-6 mb-3">
        <label className="form-label text-white">Unidad de Medida</label>
        <input
          type="text"
          className="form-control"
          placeholder="Buscar unidad (ej. cajas, piezas, kg...)"
          value={unidadMedidaInput}
          onChange={(e) => {
            const value = e.target.value;
            setUnidadMedidaInput(value);

            setValue("unidad_medida_texto", value);
            if (!value) setValue("unidad_medida_id", "");
          }}
        />

        <input type="hidden" {...register("unidad_medida_id")} />
        <input type="hidden" {...register("unidad_medida_texto")} />

        {opcionesUnidadMedida.length > 0 && (
          <div className="position-absolute bg-white border rounded shadow"
            style={{ zIndex: 10, top: "100%", left: 0, right: 0, maxHeight: "200px", overflowY: "auto" }}>
            {opcionesUnidadMedida.map((item) => (
              <div
                key={item.id}
                className="px-2 py-1 text-dark hover-bg-light"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  const valor = `${item.simbolo} - ${item.texto}`;
                  setUnidadMedidaInput(valor);
                  setValue("unidad_medida_id", item.id);
                  setValue("unidad_medida_texto", valor);
                  setOpcionesUnidadMedida([]);
                }}
              >
                {item.simbolo} - {item.texto}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clave Producto SAT */}
      <div className="position-relative col-md-6 mb-3">
        <label className="form-label text-white">Clave Producto/Servicio</label>
        <input
          type="text"
          className="form-control"
          placeholder="Buscar clave SAT (ej. 10101502, perros...)"
          value={claveProdInput}
          onChange={(e) => {
            const value = e.target.value;
            setClaveProdInput(value);
            setValue("clave_producto_servicio", value);
          }}
        />
        <input type="hidden" {...register("clave_producto_servicio")} />

        {opcionesClaveProducto.length > 0 && (
          <div className="position-absolute bg-white border rounded shadow"
            style={{ zIndex: 10, top: "100%", left: 0, right: 0, maxHeight: "200px", overflowY: "auto" }}>
            {opcionesClaveProducto.map((item) => (
              <div
                key={item.clave}
                className="px-2 py-1 text-dark hover-bg-light"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  const valor = `${item.clave} - ${item.descripcion}`;
                  setClaveProdInput(valor);
                  setValue("clave_producto_servicio", item.clave);
                  setOpcionesClaveProducto([]);
                }}
              >
                {item.clave} - {item.descripcion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clave Unidad SAT */}
      <div className="position-relative col-md-6 mb-3">
        <label className="form-label text-white">Clave Unidad</label>
        <input
          type="text"
          className="form-control"
          placeholder="Buscar unidad (ej. kilogramo, A41...)"
          value={claveUnidadInput}
          onChange={(e) => {
            const value = e.target.value;
            setClaveUnidadInput(value);
            setValue("clave_unidad", value);
          }}
        />
        <input type="hidden" {...register("clave_unidad")} />

        {opcionesClaveUnidad.length > 0 && (
          <div className="position-absolute bg-white border rounded shadow"
            style={{ zIndex: 10, top: "100%", left: 0, right: 0, maxHeight: "200px", overflowY: "auto" }}>
            {opcionesClaveUnidad.map((item) => (
              <div
                key={item.clave}
                className="px-2 py-1 text-dark hover-bg-light"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  const valor = `${item.clave} - ${item.descripcion}`;
                  setClaveUnidadInput(valor);
                  setValue("clave_unidad", item.clave);
                  setOpcionesClaveUnidad([]);
                }}
              >
                {item.clave} - {item.descripcion}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
