import React from "react";
import LoginForm from "../../components/login/LoginForm";
import RegisterForm from "../../components/login/RegisterForm";
import OverlayPanel from "../../components/login/OverlayPanel";
import AuthModal from "../AuthVerification/AuthModals";
import ResetPasswordModal from "../AuthVerification/ResetPasswordModal";

const LoginWrapper = ({
  rightPanelActive,
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
  registerError,
  registerSuccess,
  password,
  handleRegister,
  isVerificationModalOpen,
  handleVerifyCodeSubmit,
  currentPhoneToVerify,
  verificationCode,
  setVerificationCode,
  verificationError,
  isResetModalOpen,
  resetPhone,
  resetCode,
  setResetCode,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  handleResetPasswordSubmit,
  resetError,
  handleSendResetCode,
  setRightPanelActive,
}) => {
  return (
    <div className={`container ${rightPanelActive ? "right-panel-active" : ""}`}>
      <RegisterForm
        handleRegister={handleRegister}
        handleSubmit={handleSubmit}
        register={register}
        errors={errors}
        backendFieldErrors={backendFieldErrors}
        registerError={registerError}
        registerSuccess={registerSuccess}
        password={password}
      />

      <LoginForm
        handleLogin={handleLogin}
        loginPhone={loginPhone}
        setLoginPhone={setLoginPhone}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={loginError}
        handleSendResetCode={handleSendResetCode}
      />

      <OverlayPanel setRightPanelActive={setRightPanelActive} />

      <AuthModal
        isOpen={isVerificationModalOpen}
        type="verify"
        onSubmit={handleVerifyCodeSubmit}
        phone={currentPhoneToVerify}
        code={verificationCode}
        setCode={setVerificationCode}
        error={verificationError}
      />

      <ResetPasswordModal
        isOpen={isResetModalOpen}
        phone={resetPhone}
        code={resetCode}
        setCode={setResetCode}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        onSubmit={handleResetPasswordSubmit}
        error={resetError}
      />
    </div>
  );
};

export default LoginWrapper;
