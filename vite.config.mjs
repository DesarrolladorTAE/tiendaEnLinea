import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const allowProductionApi = command === 'serve' && mode === 'development' &&
    env.VITE_ALLOW_PRODUCTION_API === 'true';
  const staging = command === 'build' && mode === 'staging';
  if (staging) {
    const isolated = new URL(env.VITE_API_URL || 'invalid');
    if (!['http:', 'https:'].includes(isolated.protocol) || isolated.username || isolated.password ||
        isolated.search || isolated.hash || /(^|\.)mitiendaenlineamx\.com\.mx\.?$/i.test(isolated.hostname)) {
      throw new Error('Staging requiere VITE_API_URL de una API aislada.');
    }
  }
  const controlledPOS = !allowProductionApi && Boolean(env.VITE_API_URL) &&
    (staging || (command === 'serve' && mode !== 'production'));
  return {
    define: {
      __MTELMX_PRODUCTION__: JSON.stringify(command === 'build' && mode === 'production'),
      __MTELMX_SERVICE_TIMEZONE__: JSON.stringify(env.VITE_SERVICE_TIMEZONE || 'America/Mexico_City'),
      __MTELMX_ALLOW_PRODUCTION_API__: JSON.stringify(allowProductionApi),
      __MTELMX_POS_CONTROLLED__: JSON.stringify(controlledPOS),
      __MTELMX_POS_SERVICES__: JSON.stringify(controlledPOS && env.VITE_POS_SERVICES === 'true'),
      __MTELMX_POS_VEHICLE__: JSON.stringify(controlledPOS && env.VITE_POS_VEHICLE === 'true'),
      __MTELMX_API_URL__: JSON.stringify(env.VITE_API_URL || ''),
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
        },
      },
    },
  };
});
