import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode, command }) => ({
  define: {
    __MTELMX_PRODUCTION__: JSON.stringify(command === 'build' && mode === 'production'),
    __MTELMX_API_URL__: JSON.stringify(loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL || ''),
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
  },
}));
