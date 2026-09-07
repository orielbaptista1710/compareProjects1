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

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    css: true,
  },

  build: {
    chunkSizeWarningLimit: 700, //raise the warning if too large default is 500kb
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("@mui/x-data-grid")) return "vendor-datagrid";
          if (id.includes("@mui/material") || id.includes("@mui/system") || id.includes("@emotion")) return "vendor-mui";
          if (id.includes("@mui/icons-material")) return "vendor-mui-icons";
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("react-router")) return "vendor-react";
          if (id.includes("@tanstack/react-query")) return "vendor-query";
          if (id.includes("lodash")) return "vendor-lodash";

          if (id.includes("firebase")) return "vendor-firebase";
          // if (id.includes("/zod/")) return "vendor-zod";
          // if (id.includes("axios")) return "vendor-axios";
          // if (id.includes("slick-carousel") || id.includes("react-slick")) return "vendor-slick";

          return "vendor";

        },
      },
    },
  },

  
});  