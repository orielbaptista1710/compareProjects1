import { describe, it, expect, beforeEach } from "vitest";
import {
  MAX_MAP_LOADS,
  MAX_PLACE_PICKS,
  placePicksLeft,
  resetMapsBudget,
  spendPlacePick,
  takeMapLoad,
} from "../mapsBudget";

describe("mapsBudget", () => {
  beforeEach(resetMapsBudget);

  it("allows the map MAX_MAP_LOADS times, then refuses", () => {
    for (let i = 0; i < MAX_MAP_LOADS; i += 1) expect(takeMapLoad()).toBe(true);
    expect(takeMapLoad()).toBe(false);
    expect(takeMapLoad()).toBe(false);
  });

  it("counts address searches down to zero and never below", () => {
    expect(placePicksLeft()).toBe(MAX_PLACE_PICKS);
    for (let i = 0; i < MAX_PLACE_PICKS; i += 1) spendPlacePick();
    expect(placePicksLeft()).toBe(0);
    expect(spendPlacePick()).toBe(0);
    expect(placePicksLeft()).toBe(0);
  });

  it("starts fresh after a reset (a page reload)", () => {
    for (let i = 0; i < MAX_MAP_LOADS; i += 1) takeMapLoad();
    spendPlacePick();
    resetMapsBudget();
    expect(takeMapLoad()).toBe(true);
    expect(placePicksLeft()).toBe(MAX_PLACE_PICKS);
  });
});
