// src/components/admin/productForm/sections/VariantsSection.jsx
import React from "react";
import VariantsEditor from "../VariantsEditor";

/**
 * Sección: 🧩 Variantes
 *
 * Props:
 *  - control, register, watch, setValue (react-hook-form)
 *  - locations: array de sucursales [{id, name, ...}]
 */
export default function VariantsSection({
  control,
  register,
  watch,
  setValue,
  locations = [],
}) {
  return (
    <div className="row">
      <div className="col-12">
        <VariantsEditor
          control={control}
          register={register}
          watch={watch}
          setValue={setValue}
          locations={locations}   // ✅ IMPORTANTe
        />
      </div>
    </div>
  );
}
