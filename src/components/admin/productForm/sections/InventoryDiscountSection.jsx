// src/components/admin/productForm/sections/InventoryDiscountSection.jsx
import React from "react";
import { Link } from "react-router-dom";
import ProductField from "../../../admin/ProductField";
import SatFields from "../SatFields";

export default function InventoryDiscountSection({
  register,
  errors,
  watch,
  setValue,
  hasVariants,
  control,
  isEdit = false,
}) {
  const discount = watch("discount");

  return (
    <div className="row">
      {!hasVariants && (
        <div className="col-md-4 mb-3">
          <label className="form-label">Stock</label>

          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            className="form-control bg-secondary border-secondary text-light"
            readOnly={isEdit}
            placeholder={isEdit ? "Se actualiza desde entradas" : "Stock"}
            {...register("stock", {
              required: !isEdit
                ? "El stock es obligatorio (si no usas variantes)"
                : false,
              valueAsNumber: true,
              min: {
                value: 0,
                message: "El stock no puede ser negativo",
              },
            })}
          />

          {errors?.stock && (
            <small className="text-danger">{errors.stock.message}</small>
          )}

          {isEdit && (
            <small className="text-warning d-block mt-1">
              ⚠️ El stock solo se puede cambiar al registrar entradas de
              producto.
              <br />
              Dirígete al apartado{" "}
              <Link to="/admin/compra" className="text-info fw-bold">
                Entradas Producto
              </Link>
              .
            </small>
          )}
        </div>
      )}

      <SatFields
        register={register}
        setValue={setValue}
        watch={watch}
        control={control}
        errors={errors}
      />

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
  );
}
