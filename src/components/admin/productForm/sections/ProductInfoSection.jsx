// src/components/admin/productForm/sections/ProductInfoSection.jsx
import React from "react";
import ProductField from "../../../admin/ProductField";

/**
 * Sección: 🛒 Información del Producto
 * Requiere:
 *  - register, errors, watch, setValue (react-hook-form)
 *  - basePriceStr (string/number) para mostrar precio base
 *  - onRecalculateBase() (fn) para recalcular base_price
 */
export default function ProductInfoSection({
  register,
  errors,
  watch,
  setValue,
  basePriceStr,
  onRecalculateBase,
}) {
  return (
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
        validation={{ required: "El nombre es obligatorio" }}
        errors={errors}
      />

      <ProductField
        label="Precio Final (incluye IVA)"
        name="price"
        type="text"
        register={register}
        validation={{ required: "El precio es obligatorio" }}
        errors={errors}
      />

      {/* IVA + base_price */}
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

        {errors?.iva && (
          <small className="text-danger">{errors.iva.message}</small>
        )}

        {/* base_price oculto */}
        <input type="hidden" {...register("base_price")} />

        <div className="d-flex align-items-center justify-content-between mt-2">
          <p className="text-info mb-0">
            Precio Base (SIN IVA):{" "}
            <strong>${Number(basePriceStr || 0).toFixed(2)} MXN</strong>
          </p>

          <button
            type="button"
            className="btn btn-sm btn-outline-light ms-2"
            onClick={onRecalculateBase}
          >
            Recalcular base
          </button>
        </div>
      </div>

      <ProductField
        label="Costo de Compra"
        name="costo_compra"
        type="text"
        register={register}
        errors={errors}
      />
    </div>
  );
}
