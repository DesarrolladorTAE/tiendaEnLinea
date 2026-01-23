// src/components/admin/productForm/sections/InventoryDiscountSection.jsx
import React from "react";
import ProductField from "../../../admin/ProductField";
import SatFields from "../SatFields";

/**
 * Sección: 📦 Inventario y Descuento
 * - Muestra Stock SOLO si NO hay variantes
 * - Incluye SatFields
 * - Muestra offerEnd SOLO si discount > 0
 *
 * Props:
 *  - register, errors, watch, setValue (react-hook-form)
 *  - hasVariants (boolean)
 */
export default function InventoryDiscountSection({
  register,
  errors,
  watch,
  setValue,
  hasVariants,
}) {
  const discount = watch("discount");

  return (
    <div className="row">
      {/* stock solo si NO hay variantes */}
      {!hasVariants && (
        <ProductField
          label="Stock"
          name="stock"
          type="number"
          register={register}
          errors={errors}
          validation={{
            required: "El stock es obligatorio (si no usas variantes)",
          }}
        />
      )}

      {/* SAT */}
      <SatFields register={register} setValue={setValue} watch={watch} />

      {/* Descuento */}
      <ProductField
        label="Descuento (%)"
        name="discount"
        type="number"
        register={register}
        errors={errors}
      />

      {/* Fin de oferta si discount > 0 */}
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
