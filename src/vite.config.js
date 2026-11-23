import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: false
    }
  },
  build: {
    outDir: 'dist', // Ajusta esto según tus necesidades
  },
  base: '/', // Ajusta esto si tu proyecto está en un subdirectorio
  esbuild: {
    loader: {
      '.js': 'jsx'  // Especifica que los archivos .js deben ser tratados como JSX
    }
  }
});
