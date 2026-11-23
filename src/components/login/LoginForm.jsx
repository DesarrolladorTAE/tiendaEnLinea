import React from "react";

const LoginForm = ({
  loginData,
  setLoginData,
  onSubmit,
  showPassword,
  togglePassword,
  loading,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();     // 🚫 evita refresh
    e.stopPropagation();    // 🚫 evita bubbling raro
    if (loading) return;    // 🚫 evita doble submit
    onSubmit(e);            // 🔗 delega al handler del padre
  };

  return (
    <form onSubmit={handleSubmit} noValidate autoComplete="off">
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Correo electrónico o número de teléfono"
        style={{ height: "45px" }}
        value={loginData.login}
        onChange={(e) => setLoginData({ ...loginData, login: e.target.value })}
        required
      />

      <div className="form-group mb-4 d-flex gap-3">
        <input
          type={showPassword ? "text" : "password"}
          className="form-control"
          placeholder="Contraseña"
          value={loginData.password}
          onChange={(e) =>
            setLoginData({ ...loginData, password: e.target.value })
          }
          required
        />
        <button
          type="button" // 👈 importante: no submit
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
          className="btn btn-primary btn-lg w-100"
          disabled={loading}
          style={{ height: "45px", fontWeight: "bold", fontSize: "16px" }}
        >
          {loading ? "Cargando..." : "INICIAR SESIÓN"}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
