// src/components/admin/productForm/sections/ProductInfoSection.jsx
import React from "react";
import { Link } from "react-router-dom";
import ProductField from "../../../admin/ProductField";

export default function ProductInfoSection({
  register,
  errors,
  basePriceStr,
  onRecalculateBase,
  isEdit = false,
  canEditPurchaseCost = false,
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

      <div className="col-md-4 mb-3">
        <label className="form-label">Costo de Compra</label>

        <input
          type="text"
          className="form-control bg-secondary border-secondary text-light"
          readOnly={isEdit && !canEditPurchaseCost}
          placeholder={
            isEdit && !canEditPurchaseCost
              ? "Se actualiza desde entradas"
              : "Costo de compra"
          }
          {...register("costo_compra")}
        />

        {isEdit &&
          (canEditPurchaseCost ? (
            <small className="text-success d-block mt-1">
              ✔️ Esta tienda tiene permiso para modificar el costo de compra
              directamente desde el producto.
            </small>
          ) : (
            <small className="text-warning d-block mt-1">
              ⚠️ El costo de compra solo se puede cambiar al registrar entradas
              de producto.
              <br />
              Dirígete al apartado{" "}
              <Link to="/admin/compra" className="text-info fw-bold">
                Entradas Producto
              </Link>
              .
            </small>
          ))}
      </div>
    </div>
  );
}
