// src/login/RegisterForm.jsx
import React from "react";
import { useForm } from "react-hook-form";

const RegisterForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    console.log("Register Data:", data);
  };

  const password = watch("password");

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
      <input
        type="text"
        placeholder="First Name"
        {...register("firstName", { required: "First name is required" })}
      />
      {errors.firstName && <span className="error-msg">{errors.firstName.message}</span>}

      <input
        type="text"
        placeholder="Last Name"
        {...register("lastName", { required: "Last name is required" })}
      />
      {errors.lastName && <span className="error-msg">{errors.lastName.message}</span>}

      <input
        type="email"
        placeholder="Email"
        {...register("email", {
          required: "Email is required",
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Invalid email format",
          },
        })}
      />
      {errors.email && <span className="error-msg">{errors.email.message}</span>}

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
          minLength: { value: 6, message: "Minimum 6 characters" },
        })}
      />
      {errors.password && <span className="error-msg">{errors.password.message}</span>}

      <input
        type="password"
        placeholder="Confirm Password"
        {...register("confirmPassword", {
          required: "Confirm your password",
          validate: (value) => value === password || "Passwords do not match",
        })}
      />
      {errors.confirmPassword && <span className="error-msg">{errors.confirmPassword.message}</span>}

      <button type="submit" className="btn-primary">
        SIGN UP
      </button>

      <div className="login-social">
        <span>or sign up with</span>
        <div className="social-buttons">
          <button className="btn-social yellow" title="Sign up with Google">G</button>
          <button className="btn-social blue" title="Sign up with Facebook">f</button>
        </div>
      </div>
    </form>
  );
};

export default RegisterForm;