// src/components/admin/productForm/sections/DescriptionsSection.jsx
import React from "react";
import TextAreaField from "../../../admin/TextAreaField";

/**
 * Sección: 📑 Descripciones
 *
 * Props:
 *  - register, errors (react-hook-form)
 */
export default function DescriptionsSection({ register, errors }) {
  return (
    <div className="row">
      <TextAreaField
        label="Descripción Corta"
        name="shortDescription"
        register={register}
        validation={{ required: "La descripción corta es obligatoria" }}
        errors={errors}
      />

      <TextAreaField
        label="Descripción Larga"
        name="fullDescription"
        register={register}
        validation={{ required: "La descripción larga es obligatoria" }}
        errors={errors}
      />
    </div>
  );
}
