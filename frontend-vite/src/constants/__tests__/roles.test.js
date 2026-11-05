// src/constants/__tests__/roles.test.js
import { describe, it, expect } from "vitest";
import { posterOf, POSTER_LABELS } from "../roles";

describe("posterOf", () => {
  it.each([
    [{ listedBy: "owner", developerName: "Ignored" }, "Owner"],
    [{ listedBy: "agent" }, "Agent"],
    [{ listedBy: "broker" }, "Agent"], // pre-migration name
    [{ listedBy: "developer" }, "Builder"],
    // Saved before listedBy existed: keep the old developerName rule.
    [{ developerName: "Kalpataru" }, "Builder"],
    [{ developerName: "" }, "Owner"],
    [{}, "Owner"],
    [undefined, "Owner"],
  ])("%j → %s", (property, label) => {
    expect(POSTER_LABELS[posterOf(property)]).toBe(label);
  });
});
