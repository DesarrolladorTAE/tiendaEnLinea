import React, { useState, useEffect } from "react";
import ProductField from "../ProductField";
import { Switch } from "@mui/material";
import {
  buscarClavesProducto,
  buscarClavesUnidad,
} from "../../../services/taecontaApi"; // Asegúrate de tener estas funciones

const FormularioBasico = ({ register, errors, watch, setValue }) => {
  const discount = watch("discount");
  const hasVariations = watch("variations")?.length > 0;
  const price = parseFloat(watch("price")) || 0;
  const iva = watch("iva") !== "null" ? parseFloat(watch("iva")) || 0 : 0;
  const basePrice = (price / (1 + iva)).toFixed(2);

  const [clavesProducto, setClavesProducto] = useState([]);
  const [clavesUnidad, setClavesUnidad] = useState([]);
  const [filtroProducto, setFiltroProducto] = useState("");
  const [filtroUnidad, setFiltroUnidad] = useState("");

  useEffect(() => {
    if (filtroProducto.length >= 2) {
      buscarClavesProducto(filtroProducto).then(setClavesProducto);
    }
  }, [filtroProducto]);

  useEffect(() => {
    if (filtroUnidad.length >= 2) {
      buscarClavesUnidad(filtroUnidad).then(setClavesUnidad);
    }
  }, [filtroUnidad]);

  return (
    <>
      <div className="row">
        <ProductField
          label="Código"
          name="sku"
          register={register}
          errors={errors}
          validation={{ required: "El codigo es obligatorio" }}
        />
        <ProductField
          label="Nombre"
          name="name"
          register={register}
          errors={errors}
          validation={{ required: "El nombre es obligatorio" }}
        />
        <ProductField
          label="Precio Final (incluye IVA)"
          name="price"
          type="number"
          register={register}
          errors={errors}
          validation={{ required: "El precio es obligatorio" }}
        />

        <div className="col-md-4 mb-3">
          <label className="form-label" htmlFor="iva">
            Tasa de IVA <span className="text-danger">*</span>
          </label>
          <select
            id="iva"
            className={`form-control bg-secondary border-secondary ${
              errors?.iva ? "is-invalid" : ""
            }`}
            {...register("iva", {
              required: "La tasa de IVA es obligatoria",
            })}
          >
            <option value="">Selecciona una tasa</option>
            <option value="0.16">TASA 16%</option>
            <option value="0.08">TASA 8%</option>
            <option value="0">TASA 0%</option>
            <option value="null">EXENTO</option>
          </select>

          {errors.iva && (
            <small className="text-danger">{errors.iva.message}</small>
          )}
          <p className="text-info mt-2">
            Precio Base Calculado (SIN IVA): <strong>${basePrice} MXN</strong>
          </p>
        </div>
      </div>

      {/* Campos con búsqueda dinámica */}
      <div className="row">
        <ProductField
          label="Clave de Producto/Servicio (SAT)"
          name="claveProducto"
          register={register}
          errors={errors}
          inputProps={{
            list: "listaProductosSAT",
            onChange: (e) => setFiltroProducto(e.target.value),
          }}
        />
        <datalist id="listaProductosSAT">
          {clavesProducto.map((op, idx) => (
            <option key={idx} value={op.id_productos_servicios}>
              {op.texto}
            </option>
          ))}
        </datalist>

        <ProductField
          label="Clave de Unidad (SAT)"
          name="claveUnidad"
          register={register}
          errors={errors}
          inputProps={{
            list: "listaUnidadesSAT",
            onChange: (e) => setFiltroUnidad(e.target.value),
          }}
        />
        <datalist id="listaUnidadesSAT">
          {clavesUnidad.map((op, idx) => (
            <option key={idx} value={op.id_claves_unidades}>
              {op.texto}
            </option>
          ))}
        </datalist>
      </div>

      <div className="row">
        {!hasVariations && (
          <ProductField
            label="Stock"
            name="stock"
            type="number"
            register={register}
            errors={errors}
          />
        )}
        <ProductField
          label="Descuento (%)"
          name="discount"
          type="number"
          register={register}
          errors={errors}
        />
        {Number(discount) > 0 && (
          <ProductField
            label="Fin de la Oferta"
            name="offerEnd"
            type="datetime-local"
            register={register}
            errors={errors}
          />
        )}
      </div>

      <div className="row">
        <ProductField
          label="Calificación (0-5)"
          name="rating"
          type="number"
          register={register}
          errors={errors}
        />
        <div className="col-md-4 mb-3">
          <label className="form-label" htmlFor="new-switch">
            ¿Es nuevo?
          </label>
          <Switch
            id="new-switch"
            checked={watch("new")}
            onChange={() => setValue("new", !watch("new"))}
            color="primary"
            sx={{ transform: "scale(1.5)" }}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label" htmlFor="visible-switch">
            ¿Visible en tu página?
          </label>
          <Switch
            id="visible-switch"
            checked={watch("visible")}
            onChange={() => setValue("visible", !watch("visible"))}
            color="success"
            sx={{ transform: "scale(1.5)" }}
          />
        </div>
      </div>
    </>
  );
};

export default FormularioBasico;
