// frontend-vite/vite.config.js
import { defineConfig } from "vite";
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
    conditions: ["browser"],
  },

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    css: true,
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