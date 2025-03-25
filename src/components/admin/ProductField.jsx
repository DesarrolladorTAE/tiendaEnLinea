import React from "react";

const ProductField = ({ label, type = "text", name, register, validation, errors }) => {
  // ✅ Solo el campo "price" tendrá step="0.001"
  const step = name === "price" ? "0.01" : undefined;

  return (
    <div className="col-md-4 mb-3">
      <label className="form-label">{label}</label>
      <input
        type={type}
        step={step}
        {...register(name, validation)}
        className="form-control bg-secondary text-light border-secondary"
      />
      {errors?.[name] && <small className="text-danger">{errors[name].message}</small>}
    </div>
  );
};

export default ProductField;
