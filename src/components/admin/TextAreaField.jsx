import React from "react";

const TextAreaField = ({ label, name, register, validation = {}, errors }) => {
  const isRequired = !!validation.required;

  return (
    <div className="col-md-6 mb-3">
      <label className="form-label">
        {label}
        {isRequired && <span style={{ color: "red" }}> *</span>}
      </label>
      <textarea
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

export default TextAreaField;
