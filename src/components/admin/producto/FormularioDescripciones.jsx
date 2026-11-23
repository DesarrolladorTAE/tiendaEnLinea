import React from "react";
import TextAreaField from "../TextAreaField";

const FormularioDescripciones = ({ register, errors }) => (
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

export default FormularioDescripciones;
