import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.node,
      sourceType: "module",
    },
    // App code logs through utils/logger.js: structured, dated, debug hidden in
    // production, and never raw request bodies or contact details.
    rules: { "no-console": "error" },
  },
  {
    // Run by hand in a terminal, where console output is the point.
    files: [
      "scripts/**",
      "fakeTests/**",
      "utils/syncFirebaseUser.js",
      "utils/createAdmin.js",
      "utils/verifyAdmin.js",
    ],
    rules: { "no-console": "off" },
  },
  {
    files: ["**/*.cjs"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.node,
      sourceType: "commonjs",
    },
  },
]);
