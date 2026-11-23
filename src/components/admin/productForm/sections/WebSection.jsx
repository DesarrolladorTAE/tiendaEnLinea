// src/components/admin/productForm/sections/WebSection.jsx
import React from "react";
import { Switch } from "@mui/material";
import ProductField from "../../../admin/ProductField";

/**
 * Sección: 🌐 Sitio Web
 *
 * Props:
 *  - register, errors, watch, setValue (react-hook-form)
 */
export default function WebSection({ register, errors, watch, setValue }) {
  return (
    <div className="row">
      <ProductField
        label="Calificación (0-5)"
        name="rating"
        type="number"
        register={register}
        errors={errors}
      />

      {/* ¿Es nuevo? */}
      <div className="col-md-4 mb-3">
        <label className="form-label" htmlFor="new-switch">
          ¿Es nuevo?
        </label>
        <div>
          <Switch
            id="new-switch"
            checked={watch("new")}
            onChange={() => setValue("new", !watch("new"))}
            {...register("new")}
            color="primary"
            sx={{ transform: "scale(1.5)" }}
          />
        </div>
      </div>

      {/* Visible en sitio */}
      <div className="col-md-4 mb-3">
        <label className="form-label" htmlFor="visible-switch">
          ¿Visible en tu página?
        </label>
        <div>
          <Switch
            id="visible-switch"
            checked={watch("visible")}
            onChange={() => setValue("visible", !watch("visible"))}
            {...register("visible")}
            color="success"
            sx={{ transform: "scale(1.5)" }}
          />
        </div>
      </div>
    </div>
  );
}
