// src/components/admin/productForm/sections/InventoryDiscountSection.jsx
import React from "react";
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
  const detailInventory = hasVariants || watch("use_warehouse_inventory");

  return (
    <div className="row">
      {!detailInventory && (
        <div className="col-md-4 mb-3">
          <label className="form-label">Stock</label>

          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            className="form-control bg-secondary border-secondary text-light"
            placeholder="Stock"
            {...register("stock", {
              shouldUnregister: true,
              required: !detailInventory ? "El stock es obligatorio" : false,
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

        </div>
      )}
      {detailInventory && <div className="col-12 mb-3"><div className="alert alert-info mb-0">Las existencias se administran en {watch("use_warehouse_inventory") ? "el detalle por almacén" : "cada variante"}. El stock global no se utiliza.</div></div>}

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
