import React from 'react';
export default function InstallPWAButton({ floating=false }) {
  return <button type="button" hidden data-pwa-install className={floating ? 'tlr-pwa-install' : 'tlr-pwa-install-inline'}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5" /></svg><span>Instalar aplicación</span></button>;
}
