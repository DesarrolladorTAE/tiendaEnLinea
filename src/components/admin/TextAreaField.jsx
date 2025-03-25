import React from "react";

const TextAreaField = ({ label, name, register, errors }) => {
    return (
      <div className="col-md-6 mb-3">
        <label className="form-label">{label}</label>
        <textarea
          {...register(name)}
          className="form-control bg-secondary text-light border-secondary"
        ></textarea>
        {errors?.[name] && <small className="text-danger">{errors[name].message}</small>}
      </div>
    );
  };
  
  export default TextAreaField;
  