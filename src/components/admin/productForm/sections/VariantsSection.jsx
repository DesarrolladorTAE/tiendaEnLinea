// src/components/admin/productForm/sections/VariantsSection.jsx
import React from "react";
import VariantsEditor from "../VariantsEditor";

/**
 * Sección: 🧩 Variantes
 *
 * Props:
 *  - control, register, watch, setValue (react-hook-form)
 *  - warehouses: array de almacenes [{id, name, ...}]
 */
export default function VariantsSection({
  control,
  register,
  watch,
  setValue,
  warehouses = [],
}) {
  return (
    <div className="row">
      <div className="col-12">
        <VariantsEditor
          control={control}
          register={register}
          watch={watch}
          setValue={setValue}
          warehouses={warehouses} // ✅ IMPORTANTe
        />
      </div>
    </div>
  );
}
