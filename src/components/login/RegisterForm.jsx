// src/components/login/RegisterForm.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const RegisterForm = ({
  registerData,
  setRegisterData,
  errors,
  onSubmit,
  showPassword,
  togglePassword,
  loading,
  registerBlocked,
  promoFromLink = false,   // ya no autoabre el popover, solo controla precarga
  referralCode = "",
}) => {
  const [showPromo, setShowPromo] = useState(false);
  const [checking, setChecking] = useState(false);
  const [codeValid, setCodeValid] = useState(null); // null=sin verificar | true/false
  const [codeMessage, setCodeMessage] = useState("");
  const debounceRef = useRef(null);

  const PromoCard = () => (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        marginTop: 8,
        width: 360,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 10px 20px rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.08)",
        border: "1px solid rgba(0,0,0,0.06)",
        padding: "14px 16px",
        zIndex: 5,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Beneficios por referir</div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <span style={{ color: "#198754", fontWeight: 700 }}>✔</span>
        <span><b>5%</b> de descuento en tu primera suscripción antes de que termine tu DEMO.</span>
      </div>

    </div>
  );

  const preventBlurClose = (e) => { e.preventDefault(); e.stopPropagation(); };

  // --- Valida el código con la API ---
  const validateReferral = async (code) => {
    const c = String(code || "").trim();
    if (!c) {
      setCodeValid(null);
      setCodeMessage("");
      return;
    }
    setChecking(true);
    try {
      const { data } = await axios.post(
        "https://api.tecnologiasadministrativas.com/api/check-codigo",
        { codigo_ref: c },
        { headers: { Accept: "application/json" } }
      );

      // backend recomendado: { ok:true, exists:bool } —o tu formato actual { success:true }
      const exists =
        data?.exists === true ||
        data?.success === true ||
        data?.ok === true && data?.exists === true;

      if (exists) {
        setCodeValid(true);
        setCodeMessage("Código existente ✅");
      } else {
        setCodeValid(false);
        setCodeMessage("Código no encontrado ❌");
      }
    } catch (error) {
      const st = error?.response?.status;
      if (st === 404) {
        setCodeValid(false);
        setCodeMessage("Código no encontrado ❌");
      } else if (st === 422) {
        setCodeValid(false);
        setCodeMessage("Completa el código ❌");
      } else {
        setCodeValid(false);
        setCodeMessage("No se pudo validar el código ❌");
      }
    } finally {
      setChecking(false);
    }
  };

  // --- Debounce: valida automáticamente cuando haya 4+ dígitos ---
  useEffect(() => {
    const raw = registerData.referral ?? referralCode ?? "";
    const digits = (raw || "").replace(/\D/g, ""); // cuenta dígitos
    clearTimeout(debounceRef.current);

    if (digits.length >= 4) {
      // espera 400ms desde la última tecla
      debounceRef.current = setTimeout(() => validateReferral(raw), 400);
    } else {
      setCodeValid(null);
      setCodeMessage("");
    }

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerData.referral]);

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
      <small className="text-muted d-block  ms-3 mb-3">
        Se usará para confirmar tu cuenta por WhatsApp
      </small>

{/* Código de referido + regalo (solo abre con click) */}
<div style={{ position: "relative" }} className="mb-1">
  <input
    type="text"
    inputMode="numeric"
    pattern="\d{4}"
    maxLength={4}
    className="form-control"
    placeholder="Código de referido (4 dígitos)"
    value={registerData.referral ?? referralCode ?? ""}
    onChange={(e) => {
      // Solo números y máximo 4 caracteres
      const value = e.target.value.replace(/\D/g, "").slice(0, 4);
      setRegisterData({ ...registerData, referral: value });
    }}
    style={{ paddingRight: 46, textAlign: "center", fontWeight: 600 }}
  />

  {/* Botón regalo: toggle del popover */}
  <button
    type="button"
    title="Ver beneficios"
    aria-label="Ver beneficios"
    onClick={() => setShowPromo((v) => !v)}
    style={{
      position: "absolute",
      right: 8,
      top: "50%",
      transform: "translateY(-50%)",
      width: 34,
      height: 34,
      borderRadius: 8,
      border: "1px solid #e5e7eb",
      background: "#ffffff",
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    }}
  >
    <span role="img" aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>
      🎁
    </span>
  </button>

  {showPromo && <PromoCard />}
</div>

{/* Estado del código */}
<div className="mb-3">
  {checking && (
    <small className="ms-1 d-block" style={{ color: "#0d6efd" }}>
      Verificando código...
    </small>
  )}
  {!checking && codeMessage && (
    <small
      className="ms-1 d-block"
      style={{
        color: codeValid ? "#198754" : "#dc3545",
        fontWeight: codeValid ? "bold" : "normal",
      }}
    >
      {codeMessage}
    </small>
  )}
</div>


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
