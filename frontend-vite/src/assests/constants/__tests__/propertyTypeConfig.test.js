// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PROPERTY_TYPE_CONFIG } from "../propertyTypeConfig";

// The backend validates leads and listings against backend/models/propertyType.js.
// The apps share no package, so this reads that file and fails if the lists drift.
// <repo>/frontend-vite/src/assests/constants/__tests__ -> <repo>/backend/models
const backendSource = readFileSync(
  fileURLToPath(new URL("../../../../../backend/models/propertyType.js", import.meta.url)),
  "utf8"
);
const backendTypes = [...backendSource.matchAll(/^\s*"([^"]+)"/gm)].map((m) => m[1]);

describe("property type list", () => {
  it("matches the backend's canonical types", () => {
    const frontend = PROPERTY_TYPE_CONFIG.filter((g) => g.target === "propertyType")
      .flatMap((g) => g.items.map((i) => i.value));

    expect(backendTypes.length).toBeGreaterThan(0);
    expect([...frontend].sort()).toEqual([...backendTypes].sort());
  });
});
