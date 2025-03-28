// src/components/AuthCard.jsx
import React, { useState } from "react";
import LoginForm from "../login/LoginForm";
import RegisterForm from "../login/RegisterForm";
// import "../styles/AuthCard.scss";

const AuthCard = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="info-section">
          <img
            src="https://telorecargo.com/api/images/tlrlogo.jpg"
            alt="Logo"
            className="logo"
          />
          <h2>
            FIND ANYTHING
            <br />
            GET EVERYTHING
          </h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <button onClick={() => setIsLogin(!isLogin)} className="toggle-button">
            {isLogin ? "REGISTER NOW" : "LOGIN"}
          </button>
        </div>

        <div className="form-section">
          <h2>{isLogin ? "Sign in to continue" : "Create your account"}</h2>
          <p>{isLogin ? "Welcome back! Please login to your account." : "It’s free and only takes a minute."}</p>
          {isLogin ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </div>
  );
};

export default AuthCard;
