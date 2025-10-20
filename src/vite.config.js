import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "generateSW",                 // 👈 igual que el otro proyecto
      includeAssets: ["favicon.ico","robots.txt","icons/apple-touch-icon.png"],
      manifest: {
        name: "Te Lo Recargo",
        short_name: "TeLoRecargo",
        description: "Recarga tiempo aire, gana comisión y factura tus compras.",
        theme_color: "#38b6ff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // opcional
        navigateFallback: "index.html",
        // evita cachear/Interceptar ciertas rutas (ajústalo a tus APIs si aplica)
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        enabled: true,      // 👈 habilita SW en desarrollo
        type: "module",     // igual que tu ejemplo
      },
    }),
  ],
  server: { hmr: { overlay: false } },
  build: { outDir: "dist" },
  base: "/",
  esbuild: { loader: { ".js": "jsx" } },
});
