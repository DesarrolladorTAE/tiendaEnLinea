import React, { useState } from "react";
import {
  buscarClavesProducto,
  buscarClavesUnidad,
  buscarUnidadesMedida,
} from "../../../services/taecontaApi";

export default function SatFields({ register, setValue, watch }) {
  const [opcionesClaveProducto, setOpcionesClaveProducto] = useState([]);
  const [opcionesClaveUnidad, setOpcionesClaveUnidad] = useState([]);
  const [opcionesUnidadMedida, setOpcionesUnidadMedida] = useState([]);

  const [claveProdInput, setClaveProdInput] = useState(
    watch("clave_producto_servicio") || ""
  );
  const [claveUnidadInput, setClaveUnidadInput] = useState(
    watch("clave_unidad") || ""
  );
  const [unidadMedidaInput, setUnidadMedidaInput] = useState("");

  return (
    <>
      {/* Unidad de Medida (catálogo) */}
      <div className="position-relative col-md-6 mb-3">
        <label className="form-label text-white">Unidad de Medida</label>

        <input
          type="text"
          className="form-control"
          placeholder="Buscar unidad (ej. cajas, piezas, kg...)"
          value={unidadMedidaInput}
          onChange={async (e) => {
            const value = e.target.value;
            setUnidadMedidaInput(value);
            if (value.length >= 2) {
              const resultados = await buscarUnidadesMedida(value);
              setOpcionesUnidadMedida(resultados);
            } else {
              setOpcionesUnidadMedida([]);
            }
          }}
        />

        <input type="hidden" {...register("unidad_medida_id")} />

        {opcionesUnidadMedida.length > 0 && (
          <div
            className="position-absolute bg-white border rounded shadow"
            style={{
              zIndex: 10,
              top: "100%",
              left: 0,
              right: 0,
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {opcionesUnidadMedida.map((item) => (
              <div
                key={item.id}
                className="px-2 py-1 text-dark hover-bg-light"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  const valor = `${item.simbolo} - ${item.texto}`;
                  setUnidadMedidaInput(valor);
                  setValue("unidad_medida_id", item.id);
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
          onChange={async (e) => {
            const value = e.target.value;
            setClaveProdInput(value);
            setValue("clave_producto_servicio", value);

            if (value.length >= 2) {
              const resultados = await buscarClavesProducto(value);
              setOpcionesClaveProducto(resultados);
            } else {
              setOpcionesClaveProducto([]);
            }
          }}
        />

        <input type="hidden" {...register("clave_producto_servicio")} />

        {opcionesClaveProducto.length > 0 && (
          <div
            className="position-absolute bg-white border rounded shadow"
            style={{
              zIndex: 10,
              top: "100%",
              left: 0,
              right: 0,
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
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
          onChange={async (e) => {
            const value = e.target.value;
            setClaveUnidadInput(value);
            setValue("clave_unidad", value);

            if (value.length >= 2) {
              const resultados = await buscarClavesUnidad(value);
              setOpcionesClaveUnidad(resultados);
            } else {
              setOpcionesClaveUnidad([]);
            }
          }}
        />

        <input type="hidden" {...register("clave_unidad")} />

        {opcionesClaveUnidad.length > 0 && (
          <div
            className="position-absolute bg-white border rounded shadow"
            style={{
              zIndex: 10,
              top: "100%",
              left: 0,
              right: 0,
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
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
