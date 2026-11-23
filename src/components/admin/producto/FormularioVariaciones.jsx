import React from "react";
import VariationItem from "../VariationItem";

const FormularioVariaciones = ({
  control,
  register,
  variationFields,
  appendVariation,
  removeVariation,
  activeVariationIndex,
  setActiveVariationIndex,
}) => (
  <>
    <h4 className="mt-4 text-white">Variaciones (opcional)</h4>
    {variationFields.map((variation, vIndex) => (
      <VariationItem
        key={variation.id}
        control={control}
        register={register}
        variation={variation}
        vIndex={vIndex}
        removeVariation={removeVariation}
        isActive={activeVariationIndex === vIndex}
        setActiveVariationIndex={setActiveVariationIndex}
      />
    ))}
    <button
      type="button"
      className="btn btn-primary w-100 mt-3"
      onClick={() =>
        appendVariation({
          color: "",
          image: null,
          sizes: [{ name: "", stock: "" }],
        })
      }
    >
      ➕ Agregar Variación
    </button>
  </>
);

export default FormularioVariaciones;
