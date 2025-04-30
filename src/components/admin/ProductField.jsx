import React from "react";

const ProductField = ({ label, type = "text", name, register, validation = {}, errors }) => {
  const step = name === "price" ? "0.01" : undefined;
  const isRequired = !!validation.required;

  return (
    <div className="col-md-4 mb-3">
      <label className="form-label">
        {label}
        {isRequired && <span style={{ color: "red" }}> *</span>}
      </label>
      <input
        type={type}
        step={step}
        {...register(name, validation)}
        className={`form-control bg-secondary text-light border-secondary ${
          errors?.[name] ? "is-invalid" : ""
        }`}
      />
      {errors?.[name] && (
        <small className="text-danger">{errors[name].message}</small>
      )}
    </div>
  );
};

export default ProductField;
