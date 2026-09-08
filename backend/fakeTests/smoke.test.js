// backend/tests/smoke.test.js
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("sanity check", () => {
    expect(1 + 1).toBe(2);
  });
});