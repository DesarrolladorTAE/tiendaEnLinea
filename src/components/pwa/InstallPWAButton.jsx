import React, { useEffect, useState } from "react";
import { Button, Snackbar, Alert } from "@mui/material";

let deferredPrompt = null;

export default function InstallPWAButton({ variant = "contained", fullWidth = false }) {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  // escucha el evento que dispara el navegador cuando la PWA es instalable
useEffect(() => {
  const handler = (e) => {
    console.log('[PWA] beforeinstallprompt disparado');
    e.preventDefault();
    deferredPrompt = e;
    setCanInstall(true);
  };
  window.addEventListener('beforeinstallprompt', handler);

  const onInstalled = () => {
    console.log('[PWA] app instalada');
    setInstalled(true);
  };
  window.addEventListener('appinstalled', onInstalled);

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  if (isStandalone) setCanInstall(false);

  return () => {
    window.removeEventListener('beforeinstallprompt', handler);
    window.removeEventListener('appinstalled', onInstalled);
  };
}, []);


  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // 'accepted' o 'dismissed'
    if (outcome === "accepted") setCanInstall(false);
    deferredPrompt = null;
  };

  if (!canInstall) return null;

  return (
    <>
      <Button
        onClick={handleInstall}
        variant={variant}
        color="secondary"
        sx={{ textTransform: "none", fontWeight: 700 }}
        fullWidth={fullWidth}
      >
        📲 Instalar aplicación
      </Button>

      <Snackbar open={installed} autoHideDuration={3000} onClose={() => setInstalled(false)}>
        <Alert severity="success" variant="filled" sx={{ width: "100%" }}>
          ¡Aplicación instalada!
        </Alert>
      </Snackbar>
    </>
  );
}
