// frontend-vite/vite.config.js
import { defineConfig, defaultClientConditions } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: "./dist/stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: "treemap",
    }),
  ],

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  resolve: {
    // Keeps the "browser" condition so the Firebase SDK loads its browser
    // build. Vite 6 no longer adds its defaults to a custom list, so spread
    // them in (module, browser, development|production) instead of ["browser"].
    conditions: [...defaultClientConditions],
  },

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    css: true,
    // Tests describe the form with uploads switched off unless a test turns
    // them on itself, whatever a developer's local .env says.
    env: { VITE_ENABLE_MEDIA_UPLOAD: "false" },
  },

  build: {
    chunkSizeWarningLimit: 700,
    // manualChunks removed — Rollup's automatic chunking correctly
    // resolves the dependency graph and load order. Manual splitting
    // caused repeated "cannot access before initialization" /
    // "cannot read properties of undefined" errors from circular
    // chunk dependencies (MUI icons, then React itself).
  },
});