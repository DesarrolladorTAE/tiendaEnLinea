// LoginOverlayResponsive.jsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginOverlayResponsive = ({
  isRegistering,
  toggleForm,
  loginFormRef,
  registerFormRef,
  handleLogin,
  loginPhone,
  setLoginPhone,
  loginPassword,
  setLoginPassword,
  loginError,
  handleSubmit,
  register,
  errors,
  backendFieldErrors,
  password,
  registerError,
  registerSuccess,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const refToScroll = isRegistering ? registerFormRef : loginFormRef;
    if (refToScroll?.current) {
      setTimeout(() => {
        refToScroll.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 400); // Espera a que la animación termine
    }
  }, [isRegistering]);
  

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="responsive-auth-wrapper">
      {/* OVERLAY */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isRegistering ? 'register-overlay' : 'login-overlay'}
          className="mobile-overlay"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.3 }}
        >
          <div className="overlay-content">
            <h1>{isRegistering ? '¿Ya tienes cuenta?' : '¡Hola!'}</h1>
            <p>{isRegistering ? 'Inicia sesión con tu cuenta' : 'Crea tu cuenta para comenzar'}</p>
            <button className="ghost" onClick={toggleForm}>
              {isRegistering ? 'Iniciar sesión' : 'Registrarme'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* FORMULARIO */}
      <div className="form-section">
        <AnimatePresence mode="wait">
          <motion.div
            key={isRegistering ? 'register-form' : 'login-form'}
            className="mobile-form-wrapper"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
          >
            {isRegistering ? (
              <form onSubmit={handleSubmit(register)} ref={registerFormRef}>
                <h1>Crea tu Cuenta</h1>
                <div className="form-grid">
                  <input type="text" placeholder="Nombre" {...register("name", { required: "Nombre requerido" })} />
                  {errors.name && <p className="error-message">{errors.name.message}</p>}
                  <input type="text" placeholder="Apellidos" {...register("apellidos", { required: "Apellidos requeridos" })} />
                  {errors.apellidos && <p className="error-message">{errors.apellidos.message}</p>}
                  <input type="email" placeholder="Correo electrónico" {...register("email", {
                    required: "Email requerido",
                    pattern: { value: /^\S+@\S+$/i, message: "Email no válido" },
                  })} />
                  {errors.email && <p className="error-message">{errors.email.message}</p>}
                  {backendFieldErrors.email && <p className="error-message">{backendFieldErrors.email}</p>}
                  <input type="tel" placeholder="Teléfono" {...register("phone", {
                    required: "Teléfono requerido",
                    pattern: { value: /^[0-9]{10}$/, message: "Debe contener 10 dígitos" },
                  })} />
                  {errors.phone && <p className="error-message">{errors.phone.message}</p>}
                  {backendFieldErrors.phone && <p className="error-message">{backendFieldErrors.phone}</p>}
                  <input type="password" placeholder="Contraseña" {...register("password", {
                    required: "Contraseña requerida",
                    minLength: { value: 8, message: "Mínimo 8 caracteres" },
                  })} />
                  {errors.password && <p className="error-message">{errors.password.message}</p>}
                  {backendFieldErrors.password && <p className="error-message">{backendFieldErrors.password}</p>}
                  <input type="password" placeholder="Confirmar Contraseña" {...register("password_confirmation", {
                    required: "Confirmación requerida",
                    validate: (value) => value === password || "Las contraseñas no coinciden",
                  })} />
                  {errors.password_confirmation && <p className="error-message">{errors.password_confirmation.message}</p>}
                </div>
                <button className="btn-lila">Registrarme</button>
                {registerError && <p className="error-message">{registerError}</p>}
                {registerSuccess && <p className="success-message">{registerSuccess}</p>}
              </form>
            ) : (
              <form onSubmit={handleLogin} ref={loginFormRef}>
                <h1>Iniciar Sesión</h1>
                <input type="tel" name="phone" placeholder="Teléfono" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} required />
                <input type="password" name="password" placeholder="Contraseña" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                <button type="submit" className="btn-turquesa">Iniciar Sesión</button>
                {loginError && <p className="error-message">{loginError}</p>}
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LoginOverlayResponsive;
