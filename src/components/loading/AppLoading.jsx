import React from 'react';
import { loadingMarkup } from './loadingMarkup.mjs';

export default function AppLoading({ fullScreen = true, label = 'Cargando vista' }) {
  return <div className={`tlr-loading${fullScreen ? ' tlr-loading--fullscreen' : ''}`} data-view-loading role="status" aria-live="polite" aria-label={label} aria-busy="true" dangerouslySetInnerHTML={{ __html: loadingMarkup }} />;
}
