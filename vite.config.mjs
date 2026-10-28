import path from 'node:path';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig, loadEnv } from 'vite';
import { generatePublicSeo } from './scripts/generate-public-seo.mjs';

// También se ejecuta si el despliegue llama a `vite build` directamente.
let resolved;
let failed = false;
export default defineConfig({
  plugins: [VitePWA({
    manifest: false,
    injectRegister: false,
    registerType: 'prompt',
    workbox: {
      navigateFallback: null,
      globPatterns: ['offline.html', 'app-loading.css', 'icons/tlr-*.png'],
      skipWaiting: false,
      clientsClaim: false,
      runtimeCaching: [{
        urlPattern: ({ request, url }) => request.mode === 'navigate' && !/^\/(api|storage|uploads)(?:\/|$)/.test(url.pathname),
        handler: 'NetworkOnly',
        options: { precacheFallback: { fallbackURL: '/offline.html' } },
      }],
    },
  }), {
    name: 'telorecargo-public-seo',
    apply: 'build',
    configResolved(config) { resolved = config; },
    buildEnd(error) { failed = Boolean(error); },
    async closeBundle() {
      if (failed) return;
      const config = resolved;
      await generatePublicSeo({
        outDir: path.resolve(config.root, config.build.outDir),
        env: { ...loadEnv(config.mode, config.envDir, ''), ...process.env },
      });
    },
  }],
});
