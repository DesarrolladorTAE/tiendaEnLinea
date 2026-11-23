import React from "react";
import CustomSelect from "../CustomSelect";

const FormularioCategoriaEtiquetas = ({ control, options }) => (
  <div className="row">
    <div className="col-md-6 mb-3">
      <label className="form-label">Categoría</label>
      <CustomSelect name="category" control={control} options={options} />
    </div>
    {/* Si deseas volver a mostrar etiquetas, descomenta lo siguiente:
    <div className="col-md-6 mb-3">
      <label className="form-label">Tags</label>
      <CustomSelect name="tags" control={control} options={tagsOptions} />
    </div>
    */}
  </div>
);

export default FormularioCategoriaEtiquetas;
