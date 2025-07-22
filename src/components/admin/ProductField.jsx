import React from "react";

const ProductField = ({
  label,
  name,
  type = "text",
  register,
  errors,
  validation = {},
  inputProps = {},
}) => {
  return (
    <div className="col-md-4 mb-3">
      <label className="form-label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className={`form-control ${errors?.[name] ? "is-invalid" : ""}`}
        {...register(name, validation)}
        {...inputProps} // <-- aquí se pasan correctamente los eventos como onChange, list, etc.
      />
      {errors?.[name] && (
        <small className="text-danger">{errors[name].message}</small>
      )}
    </div>
  );
};

export default ProductField;
