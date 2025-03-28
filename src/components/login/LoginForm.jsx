// src/login/LoginForm.jsx
import React from "react";
import { useForm } from "react-hook-form";

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    console.log("Login Data:", data);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
      <input
        type="text"
        placeholder="Username"
        {...register("username", { required: "Username is required" })}
      />
      {errors.username && <span className="error-msg">{errors.username.message}</span>}

      <input
        type="password"
        placeholder="Password"
        {...register("password", {
          required: "Password is required",
          minLength: { value: 6, message: "Minimum 8 characters" },
        })}
      />
      {errors.password && <span className="error-msg">{errors.password.message}</span>}

      <div className="form-options">
        <label>
          <input type="checkbox" /> Remember Me
        </label>
        <a href="#">Forgot password?</a>
      </div>

      <button type="submit" className="btn-primary">
        LOGIN
      </button>

      <div className="login-social">
        <span>or login with</span>
        <div className="social-buttons">
          <button className="btn-social yellow" title="Login with Google">G</button>
          <button className="btn-social blue" title="Login with Facebook">f</button>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;
