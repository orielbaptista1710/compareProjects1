// frontend-vite/src/test/setup.js

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Clean up React components after every test.
//
// This prevents one test from leaving rendered DOM elements behind
// and accidentally affecting another test.
afterEach(() => {
  cleanup();
});