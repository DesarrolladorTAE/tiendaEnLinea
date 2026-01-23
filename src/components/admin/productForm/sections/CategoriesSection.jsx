// src/components/admin/productForm/sections/CategoriesSection.jsx
import React from "react";
import CustomSelect from "../../../admin/CustomSelect";

/**
 * Sección: ✅ Categorías
 *
 * Props:
 *  - control (react-hook-form)
 *  - categoriesOptions (array)
 */
export default function CategoriesSection({ control, categoriesOptions }) {
  return (
    <div className="row">
      <div className="col-md-6 mb-3">
        <label className="form-label">Categoría</label>
        <CustomSelect
          name="category"
          control={control}
          options={categoriesOptions}
        />
      </div>
    </div>
  );
}
