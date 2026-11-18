// What posters type for a floor, and how a saved floor is shown again (FORM-18).
// Text the form doesn't understand must come back as NaN (an error the poster
// sees), never as "no floor".
import { describe, it, expect } from "vitest";
import { parseFloor, floorText } from "../floor";

describe("parseFloor", () => {
  it.each([
    ["12", 12],
    ["12th", 12],
    ["1st floor", 1],
    ["  3rd  ", 3],
    ["Ground", 0],
    ["G", 0],
    ["ground floor", 0],
    ["Upper ground", 0],
    ["UG", 0],
    ["Lower ground", -1],
    ["LG", -1],
    ["B1", -1],
    ["b 2", -2],
    ["Basement", -1],
    ["Basement 3", -3],
    ["-1", -1], // as the API stores it
    ["200", 200],
  ])("reads %j as %s", (text, floor) => {
    expect(parseFloor(text)).toBe(floor);
  });

  it.each(["", "   ", undefined, null])("treats %j as no floor", (text) => {
    expect(parseFloor(text)).toBeUndefined();
  });

  it.each(["abc", "Top", "12A", "B6", "201", "-6", "1.5"])("can't read %j", (text) => {
    expect(parseFloor(text)).toBeNaN();
  });

  it("accepts a stored whole number", () => {
    expect(parseFloor(7)).toBe(7);
    expect(parseFloor(2.5)).toBeNaN();
  });
});

describe("floorText", () => {
  it.each([
    [0, "Ground"],
    [-1, "B1"],
    [-3, "B3"],
    [7, "7"],
    ["Ground", "Ground"],
    [undefined, ""],
  ])("shows %j as %j", (floor, text) => {
    expect(floorText(floor)).toBe(text);
  });

  it("round-trips every floor in range", () => {
    for (let floor = -5; floor <= 200; floor++) {
      expect(parseFloor(floorText(floor))).toBe(floor);
    }
  });
});
