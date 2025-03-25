import React from "react";
import { Controller } from "react-hook-form";
import Select from "react-select";

const CustomSelect = ({ name, control, options }) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          {...field}
          options={options}
          isMulti
          onChange={(selected) => field.onChange(selected)}
          value={field.value}
          className="basic-multi-select"
          classNamePrefix="select"
          styles={{
            control: (provided, state) => ({
              ...provided,
              backgroundColor: "#222",
              color: "#fff",
              borderColor: state.isFocused ? "#666" : "#444", // Borde gris en lugar de azul
              boxShadow: "none", // Eliminar resaltado azul
            }),
            menu: (provided) => ({
              ...provided,
              backgroundColor: "#333", // Fondo del menú desplegable
            }),
            option: (provided, { isFocused, isSelected }) => ({
              ...provided,
              backgroundColor: isSelected ? "#444" : isFocused ? "#555" : "#333", // Evitar azul
              color: isSelected ? "#fff" : "#ddd", // Asegurar que el texto sea visible
              cursor: "pointer",
              ":active": {
                backgroundColor: "#555", // Evitar azul al hacer click
              },
            }),
            multiValue: (provided) => ({
              ...provided,
              backgroundColor: "#555",
              color: "#fff",
            }),
            multiValueLabel: (provided) => ({
              ...provided,
              color: "#fff",
            }),
            multiValueRemove: (provided) => ({
              ...provided,
              color: "#fff",
              ":hover": {
                backgroundColor: "#ff0000",
                color: "white",
              },
            }),
          }}
        />
      )}
    />
  );
};

export default CustomSelect;
