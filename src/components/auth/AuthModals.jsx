import React from "react";
import AuthModal from "../../wrappers/AuthVerification/AuthModals";
import ResetPasswordModal from "../../wrappers/AuthVerification/ResetPasswordModal";
import AnimatedModal from "../AnimatedModal";

const AuthModals = ({
  isVerificationModalOpen,
  currentPhoneToVerify,
  verificationCode,
  setVerificationCode,
  verificationError,
  handleVerifyCodeSubmit,
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
  showWelcome,
  onCloseWelcome,
}) => (
  <>
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

    <AnimatedModal
      isOpen={showWelcome}
      onRequestClose={onCloseWelcome}
      message="¡Bienvenido de nuevo! 😄"
      tipo="welcome"
    />
  </>
);

export default AuthModals;