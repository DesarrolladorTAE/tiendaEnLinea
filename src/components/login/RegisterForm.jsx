import React from "react";

const RegisterForm = ({
  registerData,
  setRegisterData,
  errors,
  onSubmit,
  showPassword,
  togglePassword,
  loading,
  registerBlocked,
}) => {
  return (
    <form onSubmit={onSubmit}>
      {errors.name && (
        <small style={{ color: "#dc3545", fontSize: "13px" }}>{errors.name[0]}</small>
      )}
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Nombre de la Tienda"
        value={registerData.nombre}
        onChange={(e) => setRegisterData({ ...registerData, nombre: e.target.value })}
        required
      />

      {errors.email && (
        <small style={{ color: "#dc3545", fontSize: "13px" }}>{errors.email[0]}</small>
      )}
      <input
        type="email"
        className="form-control mb-3"
        placeholder="Correo electrónico"
        value={registerData.email}
        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
        required
      />

      {errors.phone_number && (
        <small style={{ color: "#dc3545", fontSize: "13px" }}>{errors.phone_number[0]}</small>
      )}
      <input
        type="tel"
        inputMode="numeric"
        pattern="\d{10}"
        maxLength={10}
        autoComplete="off"
        className="form-control mb-0"
        placeholder="Número de teléfono (10 dígitos)"
        value={registerData.telefono}
        onChange={(e) =>
          setRegisterData({
            ...registerData,
            telefono: e.target.value.replace(/\D/g, "").slice(0, 10),
          })
        }
        required
      />
      <small className="text-muted d-block  ms-3 mb-3">Se usará para confirmar tu cuenta por WhatsApp</small>
      

      {errors.password && (
        <small style={{ color: "#dc3545", fontSize: "13px" }}>{errors.password[0]}</small>
      )}
      <div className="form-group mb-3 d-flex gap-2">
        <input
          type={showPassword ? "text" : "password"}
          className="form-control mb-0"
          placeholder="Contraseña"
          value={registerData.password}
          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
          required
          style={{ flex: 1, height: "45px" }}
        />

        <input
          type={showPassword ? "text" : "password"}
          className="form-control mb-0"
          placeholder="Confirmar contraseña"
          value={registerData.password_confirmation}
          onChange={(e) =>
            setRegisterData({
              ...registerData,
              password_confirmation: e.target.value,
            })
          }
          required
          style={{ flex: 1, height: "45px" }}
        />

        <button
          type="button"
          onClick={togglePassword}
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          style={{
            fontSize: "22px",
            cursor: "pointer",
            userSelect: "none",
            border: "1px solid #ccc",
            borderRadius: "12%",
          }}
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>

      <div className="button-box">
        <button
          type="submit"
          className="btn btn-success btn-lg w-100 mt-2"
          disabled={loading || registerBlocked}
          style={{ height: "45px", fontWeight: "bold", fontSize: "16px" }}
        >
          {loading ? "Cargando..." : "REGISTRARME"}
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;
