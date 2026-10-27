import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import { generatePublicSeo } from './scripts/generate-public-seo.mjs';

// También se ejecuta si el despliegue llama a `vite build` directamente.
let resolved;
let failed = false;
export default defineConfig({
  plugins: [{
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
