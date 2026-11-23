import React from "react";

const ProductField = ({ label, type = "text", name, register, validation = {}, errors, readOnly = false, helperText }) => {
  const step = name === "price" ? "0.01" : undefined;
  const isRequired = !!validation.required;

  return (
    <div className="col-md-4 mb-3">
      <label className="form-label" htmlFor={name}>
        {label}
        {isRequired && <span style={{ color: "red" }}> *</span>}
      </label>
      <input
        type={type}
        id={name}
        readOnly={readOnly}
        aria-describedby={helperText ? `${name}-help` : undefined}
        style={readOnly ? { cursor: "not-allowed", opacity: 0.8 } : undefined}
        step={step}
        {...register(name, validation)}
        className={`form-control bg-secondary text-light ${readOnly ? "border-info" : "border-secondary"} ${
          errors?.[name] ? "is-invalid" : ""
        }`}
      />
      {helperText && <small id={`${name}-help`} className="d-block text-info mt-1">{helperText}</small>}
      {errors?.[name] && (
        <small className="text-danger">{errors[name].message}</small>
      )}
    </div>
  );
};

export default ProductField;
